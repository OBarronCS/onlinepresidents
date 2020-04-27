import threading

import time, random, deck

from application import destroy_game

get_current_time_in_ms = lambda: int(round(time.time() * 1000))

import player as playerclass
import hand, card


class Game():
    def __init__(self, socketio, room_num, max_players):
        self.timer_thread = None

        # if no one has interacted with this game for 60 seconds, flag it to be destroyed
        self.timeout_time = 60 # SECONDS

        # valid only when the game is not currently started.
        # time since someone joined, someone left, or the game ended
        self.last_interaction_time = time.time()

        self.socketio = socketio

        self.max_players = max_players
        self.min_players_before_force_exit = 1

        self.players_in_room = 0

        self.room_num = room_num

        self.free_player_id = 0

        # SID : player
        self.sid_to_player = {}

        # player id : player
        self.id_to_player = {}
        self.players = []

        self.deck = deck.Deck()

        self.player_order = []
        self.turn_number = 0
        
        # keeps a historical list of these hands put down
        self.last_turns = []
        self.table_hand = hand.Hand()

        # stores the number of passes that have occured
        self.passes = 0

        self.this_pile_player_amount = 0

        self.wonPlayers = []

        self.started = False

        self.destroySelf = False

    # ID order is the list, where first index is president, last is scum
    def startRound(self, id_order):
        self.deck = deck.Deck()

        self.started = True

        # make sure everyone starts with an empty hand
        for player in self.players:
            player.hand.clearHand()

        self.player_order = id_order
        self.turn_number = 0
        self.last_turns = []
        self.table_hand = hand.Hand()
        self.passes = 0
        self.wonPlayers = []
        self.this_pile_player_amount = len(self.player_order)
        

        self.serveCards()
        # sends everyone their cards and the player order.
        # first index is president and he goes first :)
        first_sid = -1
        for player in self.players:
            self.socketio.emit("begin",{"cards":player.getState(), "order":id_order}, room = player.sid)

            if player.player_id == id_order[0]:
                first_sid = player.sid

        # tell the first player needs to puts cards down in 15 seconds or it'll just skip


    def queueInput(self, sid, card_info):
        if(self.started == False):
            #print("Someone tried to input commands before the game starting!")
            return

        player = self.sid_to_player.get(sid, None)
        if player is None:
            # this is called right after someone joins as they have yet to be created in the world
            #print("Action linked to no client")
            return


        if player in self.wonPlayers:
            self.socketio.emit("attempt", {"status":0,"message":"You are already out of the match", "cards":[]}, room = player.sid)
            return

        #print(card_info)

        self.playTurn(player, card_info)
        self.checkGameOver()


            




    # sends the newest cards which were put down this turn
    def playTurn(self, player, card_info):
        
        #print("Turn number: " + str(self.turn_number))

        if self.isPlayerTurn(player):
            if len(card_info) == 0: # if passing
                if(len(self.last_turns) == 0):
                    self.socketio.emit("attempt", {"status":0,"message":"Sorry, you can't pass on an empty deck!", "cards":[]}, room = player.sid)
                    return

                self.passes += 1

                # if it has gone all around - wierd variable to deal with edge case of someone winning but not clearing
                # also > or = because of other wierd cases
                if self.passes >= self.this_pile_player_amount - 1:
                    self.incTurnNumber()
                    self.deckClearSuccess(player, hand.Hand(), self.turn_number)
                    return
                else:

                    self.socketio.emit("attempt", {"status":1,"message":"You have passed", "cards":[]}, room = player.sid)
                    self.incTurnNumber()

                    game_messages = {}
                    game_messages.update({"turn":{"id":player.player_id, "cards":[], "new_id":self.turn_number, "refresh":0,"win":[]}})
                    game_messages.update({"timestamp":int(time.time()*1000)})
                    
                    for p in self.players:
                        self.socketio.emit("turn", game_messages, room = p.sid)

            elif len(card_info) != 0: #if not passing
                win = False
                # starts off my creating Hand representation of the cards
                quick_hand = hand.Hand()

                for i in range(len(card_info)):
                    new_card = card.Card(card_info[i][0], card_info[i][1])
                    quick_hand.addCard(new_card)

                if not self.playerHasCards(player, quick_hand):    
                    self.socketio.emit("attempt", {"status":0,"message":"You don't have those cards! Stop cheating!", "cards":[]}, room = player.sid)
                    return

                if not quick_hand.allSame():
                    self.socketio.emit("attempt", {"status":0,"message":"All cards must be the same", "cards":[]}, room = player.sid)
                    return
    
                if len(quick_hand.cards) > 4:
                    self.socketio.emit("attempt", {"status":0,"message":"Cannot put more than 4 cards down!", "cards":[]}, room = player.sid)
                    return


                if self.checkForFourCardClear(quick_hand):
                    self.deckClearSuccess(player, quick_hand,self.turn_number)
                    return


                if len(self.last_turns) > 0: # if table pile NOT empty
                    
                    if not quick_hand.cards[0].value == 2:
                        last_hand = self.last_turns[-1]

                        # has high enough value
                        if(quick_hand.cards[0].value < last_hand.cards[0].value):
                            self.socketio.emit("attempt", {"status":0,"message":"Value of cards must be equal or higher to those just put down", "cards":[]}, room = player.sid)
                            return

                        # same amount of cards as last placed
                        if len(last_hand.cards) != len(quick_hand.cards):
                            self.socketio.emit("attempt", {"status":0,"message":"Wrong amount of cards put down", "cards":[]}, room = player.sid)
                            return
                

                # okay, we got this far. We are putting the card down! 
                
                # if its a bomb, clear to self
                if(quick_hand.cards[0].value == 2):
                    self.deckClearSuccess(player, quick_hand,self.turn_number)
                    return
                
                # after this, we know the deck is NOT getting cleared
                self.passes = 0
                player.hand.removeHand(quick_hand)
        
                # now we do some skips
                # if we got this far, we know that there already was one on the board if this is true
                if len(quick_hand.cards) == 1:

                    # single skip
                    if len(self.last_turns) > 0: # if table pile NOT empty
                        last_hand = self.last_turns[-1]
                        # has high same value
                        if(quick_hand.cards[0].value == last_hand.cards[0].value):
                            self.skipTurn()
                           
                    
                    # double skips
                    if len(self.last_turns) > 1: # if has at least two ones 
                        last_hand = self.last_turns[-2]
                        # has high same value
                        if(quick_hand.cards[0].value == last_hand.cards[0].value):
                            self.skipTurn()
                            

            
                # has to go below this
                for c in quick_hand.cards:
                    self.table_hand.addCard(c)
                self.last_turns.append(quick_hand)


                if len(player.hand.cards) == 0:
                    win = True
                    self.playerWin(player)

                self.socketio.emit("attempt", {"status":1,"message":"Success", "cards":quick_hand.getCards()}, room = player.sid)
                
                if not win:
                    self.incTurnNumber()
                    self.this_pile_player_amount = len(self.player_order)

                
                win_array = []

                if win:
                    win_array = [player.player_id,(self.max_players - len(self.player_order))]

                game_messages = {}
                game_messages.update({"turn":{"id":player.player_id, "cards":quick_hand.getCards(), "new_id":self.turn_number, "refresh":0, "win":win_array}})
                game_messages.update({"timestamp":int(time.time()*1000)})
                
                for p in self.players:
                    self.socketio.emit("turn", game_messages, room = p.sid)

        else:
            # so its not the players turn: check if its a 4 card attempt:
            # first all, check there are enough cards for it to even be possible
            if len(card_info) > 0 and len(card_info) + len(self.table_hand.cards) >= 4:
            
                quick_hand = hand.Hand()
                for i in range(len(card_info)):
                    new_card = card.Card(card_info[i][0], card_info[i][1])
                    quick_hand.addCard(new_card)

                if not quick_hand.allSame():
                    self.socketio.emit("attempt", {"status":0,"message":"All cards must be the same", "cards":[]}, room = player.sid)
                    return

                if not self.playerHasCards(player, quick_hand):
                    self.socketio.emit("attempt", {"status":0,"message":"You don't even have those cards! Stop cheating!", "cards":[]}, room = player.sid)
                    return

                if len(quick_hand.cards) > 4:
                    self.socketio.emit("attempt", {"status":0,"message":"Cannot put more than 4 cards down!", "cards":[]}, room = player.sid)
                    return

                if self.checkForFourCardClear(quick_hand):
                    i = 0
                    while(i < len(self.player_order)):
                        if self.player_order[i] == player.player_id:
                            break
                        i += 1
                    self.deckClearSuccess(player, quick_hand, i)
                    return
                
                self.socketio.emit("attempt", {"status":0,"message":"Oy! Stop clicking that!", "cards":[]}, room = player.sid)
            else:
                self.socketio.emit("attempt", {"status":0,"message":"Wait for your turn mate!", "cards":[]}, room = player.sid)

            
    def skipTurn(self):
        #print("TURN SKIPPED")
        self.passes += 1
        self.incTurnNumber()

    # called when something is bombed, cleared, or fully passed around the table
    def deckClearSuccess(self, player, quick_hand, new_turn_number):
        #CONFIRMED. FOUR CARDS PUT DOWN
        self.clearTablePile(new_turn_number)
                        
        player.hand.removeHand(quick_hand)
        
        win = False
        if len(player.hand.cards) == 0:
            win = True
            self.playerWin(player)

        self.socketio.emit("attempt", {"status":1,"message":"The deck was cleared!", "cards":quick_hand.getCards()}, room = player.sid)

        win_array = []

        if win:
            win_array = [player.player_id,(self.max_players - len(self.player_order))]
            

        game_messages = {}
        game_messages.update({"turn":{"id":player.player_id, "cards":quick_hand.getCards(), "new_id":self.turn_number, "refresh":1, "win":win_array}})
        game_messages.update({"timestamp":int(time.time()*1000)})
                        
        for p in self.players:
            self.socketio.emit("turn", game_messages, room = p.sid)

        

    # called when a player wins the game... also called for second place, and third place, ect
    def playerWin(self, player):
        # gets rid of the player
        self.wonPlayers.append(player)

        # find his id from the order list and remove the index
        i = 0
        while(i < len(self.player_order)):
            if self.player_order[i] == player.player_id:
               self.player_order.pop(i)
               break
            i += 1
        
        if (self.turn_number == len(self.player_order)):
            self.turn_number = 0

    # clears the pile and sets the turn to a specific person
    def clearTablePile(self, new_player_turn):
        self.table_hand.clearHand()
        self.last_turns = []
        self.passes = 0

        self.turn_number = new_player_turn
        self.this_pile_player_amount = len(self.player_order)

    def isFourCardClear(self, hand_to_check):
        if(len(hand_to_check.cards) >= 4):
            lastfourhand = hand_to_check.getLastNCardsAsHand(4)

            if lastfourhand.allSame():
                return True
        
        return False


    def checkForFourCardClear(self, quick_hand):
        copy_of_pile = self.table_hand.copyHand()

        for c in quick_hand.cards:
            copy_of_pile.addCard(c)

        return self.isFourCardClear(copy_of_pile)
            

    def playerHasCards(self, player, hand):
        return player.hand.containsHand(hand)


    def isPlayerTurn(self, player):
        id = player.player_id
    
        return self.player_order[self.turn_number] == id

    def incTurnNumber(self):
        self.turn_number += 1
        if(self.turn_number == len(self.player_order)):
            self.turn_number = 0


    # called once, at beginning of each round
    def serveCards(self):
        cards_per_player = int(52 / self.players_in_room)

        # at max give players 9 cards
        cards_per_player = min(cards_per_player, 9)

        for player in self.players:
            _str = ""
            for x in range(cards_per_player):
            
                if(self.deck.hasNext()):
                    card = self.deck.next()
                    _str += card.toString() + " "
                    player.hand.addCard(card)
                else:
                    print("Deck ran out of cards prematurely. This shouldn't happen...")
            #print(_str)


    def destroyThisGame(self):
        if self.destroySelf is True:
            #print("Trying to destroy a room that was already destroyed... This is bad")
            return

        #print("Destroying game " + str(self.room_num))
        
        # totally kills any connection to a any player at this point
        for p in self.players:
            self.socketio.emit("kicked","Game room has closed!", room = p.sid)

            id_to_remove = p.player_id

            # removes all reference to this player
            del self.sid_to_player[p.sid]
            del self.id_to_player[id_to_remove]
        
        self.players = []


        if self.timer_thread is not None:
            self.timer_thread.cancel()
            self.timer_thread = None

        self.destroySelf = True

    def checkTimeout(self, _time):
        if self.started:
            return

        if len(self.players) == self.max_players: # if room is full, we should never time out
            return

        if _time - self.last_interaction_time > self.timeout_time:
            self.destroyThisGame()
            #print("GAME TIMED OUT")


    def readyToBeDestroyed(self):
        return self.destroySelf

    def disconnectPlayer(self, sid):
        remove_client = self.sid_to_player.get(sid, None)

        # this happens most likely when someone connects to server, but never gets to connect to the game;
        if(remove_client is None):
            #print("trying to remove nonexistant player... this shouldn't happen lol")
            return

        id_to_remove = remove_client.player_id

        # removes all reference to this player
        del self.sid_to_player[sid]
        del self.id_to_player[id_to_remove]
        self.players.remove(remove_client)

        self.players_in_room -= 1

        if not self.started:
            # reset interaction time
            # destroys game on player leave if no one has interacted in forever
            if time.time() - self.last_interaction_time > self.timeout_time:
                self.destroyThisGame()
                # have to send this extra here as well
                self.socketio.emit("kicked","Game timed out", room = sid)
                return

            self.last_interaction_time = time.time()

            if self.timer_thread is not None:
                self.timer_thread.cancel()
                self.socketio.emit("timer", {"status":0,"msg":"A player left the game before it could start!","time":0,"event":"gamestartpaused"}, room = self.room_num)
                self.timer_thread = None
            self.socketio.emit("pleave",id_to_remove, room = self.room_num)
            self.socketio.emit("kicked","You have left the game room",room = sid)
        else:
            # to many people have quit during the game! Kicked everyone to the lobby 
            if self.players_in_room <= self.min_players_before_force_exit:
                self.destroyThisGame()
                return
            

            order_index_to_remove = 0
            i = 0
            while(i < len(self.player_order)):
                if self.player_order[i] == id_to_remove:
                    self.player_order.pop(i)
                    order_index_to_remove = i
                    break
                i += 1


            self.this_pile_player_amount -= 1

            for p in self.players:
                self.socketio.emit("pleave",id_to_remove, room = p.sid)


            # one edge case: if I was the last one who would have made a pass, than it should clear to the next player
            if self.passes >= self.this_pile_player_amount - 1:
                if (self.turn_number == len(self.player_order)):
                    self.turn_number = 0

                #print("Someone quit in game! PANIK")
                #print(self.passes)
                #print(self.this_pile_player_amount)
                self.clearTablePile(self.turn_number)

                game_messages = {}
                game_messages.update({"turn":{"id":-1, "cards":[], "new_id":self.turn_number, "refresh":1, "win":[]}})
                game_messages.update({"timestamp":int(time.time()*1000)})
                                    
                for p in self.players:
                    self.socketio.emit("turn", game_messages, room = p.sid)
                return

            
            # some hacky stuff to make it so that if that quit was a lower order than other, then decrease turn number
            #print(self.turn_number)
            if order_index_to_remove < self.turn_number:
                self.turn_number -= 1

            if (self.turn_number == len(self.player_order)):
                self.turn_number = 0

            game_messages = {}
            game_messages.update({"turn":{"id":-1, "cards":[], "new_id":self.turn_number, "refresh":0, "win":[]}})
            game_messages.update({"timestamp":int(time.time()*1000)})
                            



            for p in self.players:
                self.socketio.emit("turn", game_messages, room = p.sid)
            

    # {"pvt":{"cards": player.getState(),"p":player.ping}}

    # returns the time we estimate the game will timeout
    def getTimeoutTime(self):
        if self.started:
            return -1 
        
        if len(self.players) == self.max_players:
            return -1 # if we are in a transition phase between rounds where game hasn't technically started, but still have full room
  
        return round(self.last_interaction_time + self.timeout_time,1)

    def getPlayers(self):
        allplayers = []

        for p in self.players:
            allplayers.append(p.getNameAndId())

        return allplayers;

    # sends a ping to a specific player
    def send_ping(self,player):
        ping_id = player.next_ping_id

        self.socketio.emit("p", ping_id, room = player.sid)

        player.sent_pings.update({ping_id:time.time()*1000})
        player.next_ping_id += 1
    def ping_return(self, sid, pingid):
        player = self.sid_to_player.get(sid, None)
        if player is None:
            #print("ping linked to no client")
            return

        return_time = time.time() * 1000

        player.calc_ping(pingid, return_time)

    # connects a new client to this game
    def addNewPlayer(self,sid, name):
        # if game already started, don't let them join. 
        # will be a spectator feature later
        if self.started == True:
            return False

        self.last_interaction_time = time.time()
        # gives new client an unique player_id
        self.players_in_room += 1

        new_player = playerclass.Player(self, self.free_player_id, sid, name)
        self.free_player_id += 1

        self.players.append(new_player)
        self.sid_to_player.update({sid:new_player})
        self.id_to_player.update({new_player.player_id:new_player})

        # im pretty sure this is guarenteed to be in order....
        self.socketio.emit("join match", {"success":1,"id":new_player.player_id, "timestamp":int(time.time() * 1000), "others":self.getPlayers()}, room = sid)

        self.socketio.emit("pjoin", {"id": new_player.player_id, "name":new_player.name}, room = self.room_num)


        if len(self.players) == self.max_players:
            #print("Match starting soon!")

            order = []

            for player in self.players:
                order.append(player.player_id)

            self.startTimer(5,self.room_num, self.preStartRound,"Round starting soon!", order = order)

        return True
    
    def checkGameOver(self):
        # will end the game if it should
        if len(self.player_order) <= self.min_players_before_force_exit:
            self.last_interaction_time = time.time()
            # stops inputs from being registered
            self.started = False

            msg = {}

            # list of player winners in order

            new_order = []
            winners = []
            for player in self.wonPlayers:
                winners.append([player.name, player.player_id])
                # if this player is still in the game (could have quit after they won!)
                if player in self.players:
                    new_order.append(player.player_id)
            
            # last place! rip. It just works so just go with it...
            lastplace = self.id_to_player[self.player_order[0]]
            
            winners.append([lastplace.name, lastplace.player_id])
            new_order.append(self.player_order[0])

            msg.update({"winners":winners})
            msg.update({"order":new_order})
            
            for p in self.players:
                self.socketio.emit("over", msg, room = p.sid)

            # for now, I automatically start new again
            #print(len(self.players))
            if len(self.players) == self.max_players:
                self.startTimer(7,self.room_num, self.preStartRound,"Round starting soon!", order = new_order)

    # if the room is open
    def canJoin(self):
        if self.started:
            return False

        # one extra check to make sure the game shouldn't be deleted by this point
        if time.time() - self.last_interaction_time > self.timeout_time:
            return False
        
        return self.players_in_room < self.max_players

    # A timer calls this
    def preStartRound(self, **kwargs):
        # checking one last time, although this should always be true
        if len(self.players) == self.max_players:
            order = kwargs["order"]

            #print("Starting round!")
            self.startRound(order)

            # manually doing this for now
            self.timer_thread = None


    def startTimer(self, time, room_to_tell, callback, msg, **kwargs):
        if self.timer_thread is None:
            #print("Starting a timer!")
            self.timer_thread = threading.Timer(time, callback, kwargs=kwargs)
            self.timer_thread.daemon = True

            self.socketio.emit("timer", {"status":1,"msg":msg,"time":get_current_time_in_ms() + time*1000,"event":"gamestart"}, room = room_to_tell)
            self.timer_thread.start()