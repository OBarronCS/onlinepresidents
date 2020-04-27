import math, hand


class Player:
    def __init__(self, match, player_id, sid, name):
        self.match = match
        self.player_id = player_id;
        self.sid = sid;

        self.name = name

        self.hand = hand.Hand()


        # list dict of last pings sent, code : timestamp in MS
        self.sent_pings = {}
        self.next_ping_id = 0
        # list of pings times to this client
        self.ping_list = []

        self.ping = 0
        
    # return cards in [[suit,value], [s,v], [s,v]] format
    def getState(self):
        return self.hand.getCards()


    def getNameAndId(self):
        return [self.player_id, self.name]

    def calc_ping(self, pingid, return_time):
        sent_time = self.sent_pings.get(pingid, None)

        if sent_time is None:
            print("PING ID unrecognized")
            return;

        del self.sent_pings[pingid]
        
        self.ping_list.append(return_time - sent_time)

        if len(self.ping_list) > 10:
            self.ping_list.pop(0)

        # print(sum(self.ping_list))

        # rough average. later can make it favor recent ones more
        self.ping = math.ceil(sum(self.ping_list) / len(self.ping_list))
