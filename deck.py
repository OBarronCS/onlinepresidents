from enum import Enum

import random

import card




class Deck:
    def __init__(self):
        # create deck

        temp_cards = []

        for x in range(4):
            for y in range(1,14):
                temp_cards.append(card.Card(x,y))

        #temp_cards.append(card.Card(card.Card.JOKER,13))
        #temp_cards.append(card.Card(card.Card.JOKER,13))
    
        self.cards = self.shuffle(temp_cards)


    def hasNext(self):
        return len(self.cards) > 0

    def next(self):
        return self.cards.pop(0)

    # returns the deck in a shuffled way
    def shuffle(self, temp_list):
        cards = []

        for x in range(0,52):
            max_index = 51 - x

            num = random.randint(0,max_index)

            cards.append(temp_list[num])

            temp_list[max_index], temp_list[num] = temp_list[num], temp_list[max_index] 

        return cards


