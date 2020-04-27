import eventlet;
eventlet.monkey_patch();


import gamelogic;

import threading

import json, atexit, time, logging, os, html

from flask import Flask, render_template, request, jsonify
from flask_socketio import SocketIO, emit, join_room, leave_room

app = Flask(__name__);
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0
#socketio = SocketIO(app, async_mode='eventlet')
socketio = SocketIO(app)


free_room_id = 0

# player_to_roomnum dict ------------> MAKE LATER
sid_to_game = {}
room_to_game = {}
# only one game for now
#game = gamelogic.Game(socketio, 1)

def createRoom(amount):
    global free_room_id
    new_game_id = free_room_id
    new_game = gamelogic.Game(socketio,new_game_id, amount)
    room_to_game.update({new_game_id:new_game})

    free_room_id += 1

    return new_game_id

# removes player from his current move
def removePlayerFromRoom(sid):

    # if websocket connection broken, remove player from the game they are in
    game = sidToGame(request.sid)

    sid_to_game.pop(sid,None)
    
    if game is not None:
        game.disconnectPlayer(request.sid);
        return game

    return None



def sidToGame(sid):
    return sid_to_game.get(sid, None)



def getRoomInfo():
    info = []

    check_all_destroy_games()

    for key in room_to_game.keys():

        game = room_to_game[key]

        # so everytime this is called, it checks every game to see if it wants to be destroyed. I
        # if so, KILL IT, if not, just ad it to the list
        can_join = 1 if game.canJoin() else 0

        info.append([key,game.max_players,game.players_in_room,can_join, game.getTimeoutTime()])

    return info

@app.route("/")
def index():
    #print("User went to site")

    timestamp = int(time.time());
    return render_template("index.html", timestamp = timestamp)

@socketio.on("connect")
def connect():
    #print("A user has connected to through a socket");
    pass


@socketio.on("disconnect")
def disconnect():
    #print(f"{request.sid} has disconnected")

    removePlayerFromRoom(request.sid)

    emit("roomlist", getRoomInfo(), broadcast=True, include_self=False)

@socketio.on("getgames")
def returngames(data):
    emit("roomlist", getRoomInfo())

@socketio.on("creategame")
def makeCreate(max_amount):
    if(max_amount < 3 or max_amount > 6):
        #print("Room size was WRONG")
        return

    createRoom(max_amount)

    emit("roomlist", getRoomInfo(), broadcast=True)



# if player is eligible to join a room given room.
def playerCanJoinRoom(sid, room_num):
    if room_num not in room_to_game.keys():
        #print("Player tried to join non-existent room")
        return False

    if sid in sid_to_game.keys():
        #print("Player is trying to join a room while already in a room!")
        return False

    this_game = room_to_game[room_num]
    if not this_game.canJoin():
        return False
    
    return True

def addPlayerToRoom(sid, room_num, name):
    #print("A player has requested to join game " + str(room_num))
    safe_name = html.escape(name)  
    this_game = room_to_game[room_num]

    sid_to_game.update({sid:this_game})
    this_game.addNewPlayer(sid, safe_name)


@socketio.on("leave room")
def leavematch(data):
    game = sid_to_game.get(request.sid, None)

    if game is not None:
        if not game.started: # If games has started, don't let them leave!
            leave_room(game.room_num)
            game = removePlayerFromRoom(request.sid)

            emit("roomlist", getRoomInfo(), broadcast=True)
        else:
            pass
            #print("Player tried to leave a game that was already start!")
    

# joins a specific match!
@socketio.on("join room")
def joinmatch(info):
    # check name input here! 

    if len(info["name"]) > 15:
        #print("That name is too long!")
        emit("join match", {"success":0,"msg":"Name too long"})
        return

    room_num = info["room"]
    sid = request.sid

    if playerCanJoinRoom(sid,room_num):    
        join_room(room_num)
        addPlayerToRoom(sid, room_num, info["name"])
            
        #updates everyones room list 
        emit("roomlist", getRoomInfo(), broadcast=True, include_self=False)
    else:
        # this sends back updated list in case a game had been destroyed
        emit("roomlist", getRoomInfo(), broadcast=True)
        emit("join match", {"success":0,"msg":"Room not open"})




@socketio.on("card")
def movement(card_info):
    game = sidToGame(request.sid)

    if game is None:
        #print("Player is not in a game!")
        emit("kicked","Too many people quit the game!")
        emit("roomlist", getRoomInfo())
        return

    game.queueInput(request.sid, card_info)


# client returns 
@socketio.on("p")
def ping_return(data):
    game = sidToGame(request.sid)

    game.ping_return(request.sid, data)


# TESTING
@socketio.on("testping")
def testping(data):
    emit("testpong","hi")
    


# called before some functions to break any connections between room and sids to games
def check_all_destroy_games():
    games = tuple(room_to_game.values())

    for game in games:
        destroy_game(game.room_num)
        

# returns whether or not the room ended up being destroyed
def destroy_game(room_num):
    

    global sid_to_game
    game = room_to_game.get(room_num, None)

    if game is None:
        return False

    _time = time.time()
    game.checkTimeout(_time)

    if not game.readyToBeDestroyed():
        return False

    #print(room_to_game)
    #print(sid_to_game)

    room_to_game.pop(room_num, None)

    sid_to_game = {key:val for key, val in sid_to_game.items() if val != game}

    #print(room_to_game)
    #print(sid_to_game)
    return True

# error handling
"""
@socketio.on_error_default
def default_error_handler(e):
    print("Error in input!")
    print(request.event["message"]) # "my error event"
    print(request.event["args"])    # (data,)
    print(request.event)
"""


if __name__ == '__main__':
    print("__main__")
    #createRoom(3)
    #createRoom(4)
    # this only runs when locally testing, mate!
    #socketio.run(app)
    port = int(os.environ.get('PORT', 5000))
    #socketio.run(app, host="0.0.0.0", port=port)
    print("Starting socketio through executing the python file")
    
    socketio.run(app, host="0.0.0.0", port="80")



