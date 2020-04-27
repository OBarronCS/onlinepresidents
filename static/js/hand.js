import Card from "./card.js"


export default class Hand {

    constructor(x,y){
        this.x = x
        this.y = y
        this.cards = []
    }

    addCard(card){
        this.cards.push(card)
    }

    toString(){
        let str = ""
        for(let i = 0; i < this.cards.length; i++){
            str += this.cards[i].objectToString()
            
            if(i != this.cards.length - 1){
                str += ", "
            }
        }

        return str
    }

    removeCard(suit, value){
        for(let i = 0; i < this.cards.length; i++){
            if(this.cards[i].value == value) {
                if(this.cards[i].suit == suit){
                    return this.cards.splice(i,1)
                }
            }
        }
    }

    anySelected(){
        for(let i = 0; i < this.cards.length; i++){
            if(this.cards[i].sprite.isSelected){
                return true
            }
        }

        return false
    }

    // returns all the selected cards in a list of card Objects
    getSelected(){
        let returncards = []

        for(let i = 0; i < this.cards.length; i++){
            if(this.cards[i].sprite.isSelected){
                returncards.push(this.cards[i])
            }
        }
        return returncards
    }

    clearHand(){
        for(let i = 0; i < this.cards.length; i++){
            this.cards[i].cleanUp();
        }
        this.cards = []
    }

    getCardsAndRefresh(){
        const refCopy = this.cards

        this.cards = [] 

        return refCopy;
    }
}