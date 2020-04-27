const Sprite = PIXI.Sprite;
const resources = PIXI.Loader.shared.resources;

const CLUBS = 0
const DIAMONDS = 1
const HEARTS = 2
const SPADES = 3
const JOKER = 4

const CARD_WIDTH = 78//79
const CARD_HEIGHT = 122 //123

const VERT_GAP = 1
const HORZ_GAP = 1

// 20+79*N+20*N

export default class Card {

    constructor(suit, value, active, x, y){
        this.suit = suit;
        this.value = value;

        const left = HORZ_GAP + (CARD_WIDTH) * (value - 1) + (HORZ_GAP * (value - 1))
        const top = VERT_GAP + (CARD_HEIGHT) * (suit) + HORZ_GAP * (suit)

        const card_spritesheet = resources["static/images/cards.png"].texture
        const card_texture = new PIXI.Texture(card_spritesheet, new PIXI.Rectangle(left, top, CARD_WIDTH, CARD_HEIGHT));

        this.sprite = new Sprite(card_texture);
        
        this.sprite.anchor.x = 0.5;
        this.sprite.anchor.y = 0.5;

        const _maxrot = 1.1

        this.sprite.rotation = Math.max(-_maxrot, Math.min(Math.random() * 2 - 1, _maxrot)) * Math.PI / 10;
        // if this card should be interactable
        if(active){
            this.sprite.isSelected = false;
            this.sprite.holding = false;

            // So that I can reference it later
            this.sprite.card = this

            this.sprite.interactive = true;
            this.sprite.buttonMode = true;
            // ----------------
            this.sprite
                // hovering / unhover
                .on('mouseover', onButtonOver)
                .on('mouseout', onButtonOut)

                // click / tap
                .on('mousedown', onButtonDown)
                .on('touchstart', onButtonDown)

                // unclick - untap
                .on('mouseup', onButtonUp)
                .on('touchend', onButtonUp)
                .on('mouseupoutside', onButtonUp)
                .on('touchendoutside', onButtonUp)

                .on('mousemove', onDragMove)
                .on('touchmove', onDragMove);
            

                function onButtonOver()
                {
                    this.isOver = true;
                    updateColor(this)
                }

                function updateColor(thing){
                    if(!thing.isOver){
                        thing.tint = 0xFFFFFF;

                        if(thing.isSelected){
                            thing.tint = 0xcf3030
                        }
                    } else if(thing.isOver){
                        thing.tint = 0xf5e23d 

                        if(thing.isSelected){
                            thing.tint = 0xf22727
                        }
                    }

                    if(thing.dragging){
                        thing.tint = 0x4b555c
                    }
                }

                function onButtonOut()
                {
                    this.isOver = false;
                    updateColor(this)
                }

                function onButtonDown(event)
                {
                    if(!this.holding){
                    this.lastdata = [event.data.global.x, event.data.global.y]
                    }
                    this.data = event.data;
                    this.alpha = 0.5;

                    // flips whether or not this value is selected
                    
                    this.isSelected = !this.isSelected;
                    
                    
                    this.holding = true
                    updateColor(this)
                }
                
                function onButtonUp()
                {

                    this.alpha = 1;
                    this.dragging = false;
                    this.holding = false
                    // set the interaction data to null
                    this.data = null;
                    this.lastdata = null
                    updateColor(this)
                }
                
                function onDragMove()
                {
 
                    if(this.holding){
                        const dx = this.lastdata[0] - window.mouse.x
                        const dy = this.lastdata[1] - window.mouse.y

                        const distance = Math.sqrt(dx * dx + dy * dy);
                        
                        if(distance > 32){
                            this.dragging = true
                        }
                    }

                    if (this.dragging)
                    {
                        this.isSelected = false
                        var newPosition = this.data.getLocalPosition(this.parent);
                        this.position.x = Math.max(0,Math.min(newPosition.x, window.renderer.getPercentWidth(1)));
                        this.position.y = Math.max(0,Math.min(newPosition.y, window.renderer.getPercentHeight(1)));
                    }
                    updateColor(this)
                }
        }

        this.sprite.x = x;
        this.sprite.y = y;

        window.renderer.addCard(this.sprite)
    }

    turnStatic(){
        this.sprite.interactive = false;
        this.sprite.tint = 0xffffff;
    }

    cleanUp(){
        window.renderer.removeSprite(this.sprite)
    }


    getSendState(){
        return [this.suit, this.value]
    }

    equals(other){
        return this.suit == other.suit && this.value == other.value
    }

    objectToString(){
        return Card.toString(this.suit, this.value)
    }

    static toString(suit, value) {
        if (suit == JOKER) {
            if (value == 1){ 
               return "Joker";
            } else {
                return "Joker #" + value;
            }
        } else {
           return Card.getValueAsString(value) + " of " + Card.getSuitAsString(suit);
        }
     }

    static getSuitAsString(suit) {
        switch(suit) {
            case SPADES:   return "Spades"; 
            case HEARTS:   return "Hearts";
            case DIAMONDS: return "Diamonds";
            case CLUBS:    return "Clubs";
            default:       return "Joker";
        }
     }
     
    static getValueAsString(value) {
        switch (value) {
           case 1:   return "Ace";
           case 2:   return "2";
           case 3:   return "3";
           case 4:   return "4";
           case 5:   return "5";
           case 6:   return "6";
           case 7:   return "7";
           case 8:   return "8";
           case 9:   return "9";
           case 10:  return "10";
           case 11:  return "Jack";
           case 12:  return "Queen";
           default:  return "King";
        }
    }
    
     
   
}