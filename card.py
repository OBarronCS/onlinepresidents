
class Card:
    CLUBS = 0
    DIAMONDS = 1
    HEARTS = 2
    SPADES = 3
    JOKER = 4

    # values ranges from 1-14 (ACE - KING)
    def __init__(self, suit, value):
        self.suit = suit
        self.value = value

    def copy(self):
        return Card(self.suit, self.value)
        

    def getSendState(self):
        return [self.suit, self.value]

    def __eq__(self, other):
        return self.suit == other.suit and self.value == other.value


    def __repr__(self):
        return self.toString()

    def toString(self):
        if(self.suit == Card.JOKER):
            return "Joker"

        return self.getValueAsString() + " of " + self.getSuitAsString();

    def getSuitAsString(self):
        
        if self.suit == Card.SPADES:
            return "Spades"
        elif self.suit == Card.HEARTS:   
            return "Hearts"
        elif self.suit ==  Card.DIAMONDS:
            return "Diamonds"
        elif self.suit ==  Card.CLUBS:
            return "Clubs"
        elif self.suit ==  Card.JOKER:
            return "Joker"
        else:
            return "ERROR IN SUIT"
      
   
    def getValueAsString(self):
        if (self.suit == Card.JOKER):
            return ""
        else:
            if self.value == 1:
                return "Ace"
            elif self.value == 2:    
                return "2"
            elif self.value == 3:   
                return "3"
            elif self.value == 4:   
                return "4"
            elif self.value == 5:   
                return "5"
            elif self.value ==  6:
                return "6"
            elif self.value == 7:   
                return "7"
            elif self.value ==  8:   
                return "8"
            elif self.value == 9:   
                return "9"
            elif self.value == 10:  
                return "10"
            elif self.value == 11:  
                return "Jack"
            elif self.value ==  12:  
                return "Queen"
            elif self.value == 13:  
                return "King"
            else: 
                return "Error in value"


