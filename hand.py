
# represents an ordered collection of cards
class Hand:
    def __init__(self):
        self.cards = []


    def getCards(self):
        send_cards = []
        for card in self.cards:
            send_cards.append(card.getSendState())
        return send_cards

    def getLastNCardsAsHand(self, n):
        subhandcards = self.cards[-n:]

        subhand = Hand()

        for card in subhandcards:
            subhand.addCard(card)

        return subhand


    def containsHand(self, other_hand):
        for card in other_hand.cards:
            if card not in self.cards:
                return False
        
        return True

    # returns whether or not all cards in the hand are the same :)
    def allSame(self):
        firstcard = self.cards[0]
        allEqual = True
        
        for item in self.cards:
            if firstcard.value != item.value:
                allEqual = False
                break;
        
        return allEqual

    def removeHand(self, other_hand):
        for card in other_hand.cards:
            if card in self.cards:
                self.cards.remove(card)
        
        return True

    def addCard(self, card):
        self.cards.append(card)


    def removeCard(self, card):
        self.cards.remove(card)
        

    def copyHand(self):
        new_hand = Hand();

        for card in self.cards:
            new_hand.addCard(card.copy())

        return new_hand

    def clearHand(self):
        self.cards.clear()