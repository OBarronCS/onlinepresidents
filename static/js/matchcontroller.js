import Hand from "./hand.js";
import Player from "./player.js";
import Card from "./card.js";
import PixiButton from "./pixibutton.js";
import HiddenPixiButton from './hiddenpixibutton.js'
import ProgressBar from "./progressbar.js";
import addMoveSprite from "./spritemover.js";
import { addObjectToInterpolate }  from "./interpolator.js"
import { addCurveFollow } from "./curvefollower.js"
import { addMainNotification, addSubNotification, resetSubNum, showGuide, hideGuide} from "./notificationsystem.js"
 
const Sprite = PIXI.Sprite;
const resources = PIXI.Loader.shared.resources;
const Point = PIXI.Point



export default class MatchConnection {

    //data is what was returned from the request to join this game    
    constructor(server_connection, socket, data){
        // Here for testing

        window.pixiapp.renderer.plugins.interaction.autoPreventDefault = true;
        window.pixiapp.renderer.view.style.touchAction = 'none';

        this.server_connection = server_connection;
        window.match = this

        this.socket = socket;
        // console.log(data["timestamp"])
        // player id (int) : object
        this.players = {};
        this.playerlist = [];

        this.my_id = data["id"]
        this.my_player = null


        // the cards that are cleared from table go here and cleared at the end
        this.extra_cards = []

        this.hand = new Hand(0,0);


        this.table_pile = new Hand(window.tableSprite.x, window.tableSprite.y);

        this.order = []
        this.turn_number = 0;

        this.last_time = 0


        
        const others = data["others"]
        //[id, name]
        for(let i = 0; i < others.length; i++){
            if(others[i][0] != this.my_id){
                this.addPlayer(others[i][0],others[i][1])
            } else {
                // sets this so I have easy access to it
                this.my_player = this.addPlayer(others[i][0],others[i][1])
            }
        }


        this.setSocketListeners();

        const turn_width = 135 * 3
        const turn_height = 79 * 3
        //static/images/button.png"
        this.turnButton = new HiddenPixiButton(
        window.tableSprite.x + 7,
        window.tableSprite.y - 6,
        turn_width,
        turn_height,
        "Play cards",1,submit)

        this.turnButton.turnOff();

        const _bind = this
        function submit(){
            _bind.sendSelected();
        }

        // makes Back to Lobby button

        
        this.backButton = new PixiButton("static/images/button.png", 96, 50, 170,60,"Back",1,back)
    
        function back(){
            _bind.attemptToGracefullyLeave()
        }


        this.timer_started = false
        this.progressbar = null

        this.arrow = new Sprite(resources["static/images/smallarrow.png"].texture)
        this.arrow.visible = false
        this.arrow.anchor.x = .5
        this.arrow.anchor.y = .5
        this.arrow.scale.x = .2
        this.arrow.scale.y = .2
        this.count = 0
        window.renderer.addSprite(this.arrow,21)

        requestAnimationFrame(this.arrowLoop.bind(this))


        this.arrow.placeToBe = 0

        this.last_player = null

        this.flybox = new PIXI.Sprite(PIXI.Texture.WHITE)
        this.flybox.anchor.x = .5
        this.flybox.anchor.y = .5
        this.flybox.x = -20
        this.flybox.y = -20

        this.flybox.scale.x = .7
        this.flybox.scale.y = .7
        

        window.renderer.addSprite(window.tableSprite, 10)
        
        window.renderer.addSprite(this.flybox,1000)

        this.guide_button = new PixiButton("static/images/button.png",
        renderer.getPercentWidth(1) - 30, 
        renderer.getPercentHeight(1) - 30, 
        50,
        50,
        "?",1,showGuide)
    }

    arrowLoop(){
        // Check if i have anything selected 

        const px = window.place_to_point[this.arrow.placeToBe].x
        const py = window.place_to_point[this.arrow.placeToBe].y - 110

        this.arrow.x = px
        this.arrow.y = py + Math.sin(this.count) * 10
    
        this.count += .06;

        this.arrow.alpha -= .005



        if(this.order[this.turn_number] == this.my_id){
            if(this.hand.anySelected()){
                this.turnButton.setText("Play cards")
            } else {
                this.turnButton.setText("Pass")
            }
        } else {
            this.turnButton.setText("Try to play cards")
        }
        
    
        requestAnimationFrame(this.arrowLoop.bind(this))
    }

    attemptToGracefullyLeave(){
        this.socket.emit("leave room", "now")
    }

    // sends the cards to the server which you wish to put down
    sendSelected(){
        let cardslist = this.hand.getSelected();

        let send_cards = []
        for(let i = 0;i < cardslist.length; i++){
            send_cards.push(cardslist[i].getSendState())
        }

        this.socket.emit("card", send_cards)
    }

    addPlayer(id, name){
        if( !this.players[id] ){
            this.order.push(id)
            // just puts new player in the last position
            let new_player = new Player(id, name, this.playerlist.length);
                    
            this.players[id] = new_player;
            this.playerlist.push(new_player)

            return new_player
        } else {
            console.log("ERROR ERROR ERROR WHY DID THIS HAPPEN")
        }
    }
    

    // this completely ends the match and removes any references to itself
    // however, if I'm still connected to the match one the server side, 
    // then I will keep getting messages from it.
    // so I also need to make a server side LEAVE ROOM command..., and then when it confirms that I can leave I will
    // call this function
    cleanUpMatch(){
        window.pixiapp.renderer.plugins.interaction.autoPreventDefault = false;
        window.pixiapp.renderer.view.style.touchAction = 'auto';
        // cleans up my button
        hideGuide()
        this.backButton.cleanUp();
        this.turnButton.cleanUp();
        this.hand.clearHand();
        this.table_pile.clearHand();
        this.guide_button.cleanUp()

        window.renderer.removeSprite(this.flybox)
        window.renderer.removeSprite(this.arrow);
        window.renderer.removeSprite(window.tableSprite)
        
        if(this.progressbar != null){
            this.progressbar.clear()
        }

        for (let i = 0; i < this.extra_cards.length; i++) {
            const card = this.extra_cards[i];
            card.cleanUp()
        }

        this.extra_cards = []

        for(let i = 0; i < this.playerlist.length; i++){
            this.playerlist[i].cleanUp()
        }

        // so now the screen should be blank, and we should be in back in the lobby . . .
        this.server_connection.game = null;

        this.socket.removeEventListener("turn")
        this.socket.removeEventListener("begin")
        this.socket.removeEventListener("attempt")
        this.socket.removeEventListener("over")
        this.socket.removeEventListener("kicked")
        this.socket.removeEventListener("timer")
        this.socket.removeEventListener("pjoin")
        this.socket.removeEventListener("pleave")
        // right after this function i should be recieiving the room list...
    }


    moveClearedPile(card_list){
        
        const time = Date.now()
        for (let i = 0; i < card_list.length; i++) {
            const card = card_list[i].sprite;
            this.extra_cards.push(card_list[i])
            const fx = renderer.getPercentWidth(.86)
            const fy = renderer.getPercentHeight(.5)

            addMoveSprite(card,time,time+1000,card.x,card.y,fx,fy)
            card.alpha = .9
            card.tint = 0x9e9e9e
        }
    }
    

    setSocketListeners(){

        // this gets triggered when a turn was made, (someone placed a card, )
        this.socket.on("turn", message => {
            // confusing, but the two id's are different
            // first ID is actually the player id, and new_id is the index of the array
            // {"turn":{"id":player.player_id, "cards":quick_hand.getCards(), "new_id":self.turn_number, "refresh":0}})
            // "win":[id, place]

            const turndata = message["turn"]


            if(turndata["id"] == -1){
                addSubNotification("Someone left mid game!",2)

                if(turndata["refresh"] == 1){
                    this.table_pile.clearHand();
                    addSubNotification(`The deck was cleared!`,2)
                }
                
                // this is the index in the array that is going next
                this.turn_number = turndata["new_id"]

                //console.log(this.order)
                //console.log(this.turn_number)
                //console.log(this.order[this.turn_number])
                //console.log("MY ID: " + this.my_id)
                if(this.order[this.turn_number] == this.my_id){
                    addMainNotification(`It is your turn!`,0)
                    this.turnButton.drawOutline()
                }

            } else {
                let won = false;

                const new_cards = turndata["cards"];
        
                if(turndata["id"] == this.my_id){
                    if(new_cards.length == 0){
                        addSubNotification(`You passed your turn`,2)
                    } else {
                        let str = ""
    
                        const time = Date.now()
                        for(let i = 0; i < new_cards.length; i++){
                            // this makes it unselectable
                            let c = this.hand.removeCard(new_cards[i][0],new_cards[i][1])
                            c = c[0]
                            c.turnStatic()

                            // brings it the the top of the list :)
                            renderer.removeSprite(c.sprite)
                            renderer.addCard(c.sprite)

                            this.table_pile.addCard(c);
                            str += c.objectToString()

                            addMoveSprite(c.sprite,time, time + 400,c.sprite.x, c.sprite.y, this.table_pile.x + (i * 9), this.table_pile.y)
                            if(i != new_cards.length - 1){
                                str += ", "
                            }
                        }
    
                        addSubNotification("You put down: " + str, 0)
                    } 
                } else {
                    // adding someone elses cards
                    const temp_hand = new Hand(0,0)

                    const _player = this.players[turndata["id"]]

                    let i;
                    const now = Date.now()
                    for(i = 0; i < new_cards.length; i++){
                        const p = window.place_to_point[_player.place]

                        const _x = p.x
                        const _y = p.y
                        
                        const f_x = this.table_pile.x + ((Math.random() * 2 - 1) * 17)
                        const f_y = this.table_pile.y

                        
                        let card = new Card(new_cards[i][0], new_cards[i][1], false, _x, _y);

                        this.table_pile.addCard(card);

                        addMoveSprite(card.sprite,now, now + 500,_x,_y,f_x,f_y)
                        card.sprite.scale.x = .2
                        card.sprite.scale.y = .2

                        addObjectToInterpolate(card.sprite.scale,"x",now, now + 300,.2,1)
                        addObjectToInterpolate(card.sprite.scale,"y",now, now + 300,.2,1)

                        temp_hand.addCard(card)  
                    } 
                    const name = this.players[turndata["id"]].name
                    if(new_cards.length == 0){
                        addSubNotification(`${name} passed their turn`,2)
                    } else {
                        addSubNotification(`${name} placed: ${temp_hand.toString()}`,0)
                    }
                    
                }


                // this turn made someone win!
                if(turndata["win"].length > 0){
                    const winid = turndata["win"][0];
                    const winplace = turndata["win"][1];

                    // if someone else won, get rid of them for your list
                    for(let i = 0; i < this.order.length; i++){
                        if (this.order[i] == winid){
                            this.order.splice(i,1)
                            break;
                        }
                    }

                    if(winid == this.my_id){
                        won = true;
                        const become = Player.getPlaceName(winplace,this.playerlist.length)
                        addMainNotification(`You will become ${become}!`, 0)
                    } else {
                        const become = Player.getPlaceName(winplace,this.playerlist.length)
                        
                        const name = this.players[winid].name
                        addSubNotification(`${name} is out of cards and will become ${become}!`, 0)
                    }
                }

                let this_player = this.players[this.order[turndata["new_id"]]]

                if((this.last_player != this_player)){
                    const p1 = new Point(this.flybox.x, this.flybox.y)
                    //const p1 = new Point(this.last_player.sprite.x, this.last_player.sprite.y)
                    const p2 = new Point(renderer.getPercentWidth(.5), renderer.getPercentHeight(.5))
                    const p3 = new Point(this_player.sprite.x, this_player.sprite.y)
    
                    ////////////////////
                    this.flybox.x = p1.x
                    this.flybox.y = p1.y
                    this.flybox.alpha = 1
    
    
                    const max_width = renderer.getPercentWidth(1)
                    const max_height = renderer.getPercentHeight(1)

                    const rn = Date.now()
                    addCurveFollow(this.flybox,rn, rn + 1000,p1,p2,p3,"fasttoslow")
                    addObjectToInterpolate(this.flybox,"angle",rn, rn + 1400, 0,600)
                    addObjectToInterpolate(this.flybox,"alpha",rn, rn + 1400, 1,0)
                }

                this.last_player = this_player;
                

                if(turndata["refresh"] == 1){
                    const _cards = this.table_pile.getCardsAndRefresh()

                    this.moveClearedPile(_cards)
                    //this.table_pile.clearHand();
                    
                    addSubNotification(`The deck was cleared!`,2)
                }
                
                // this is the index in the array that is going next
                this.turn_number = turndata["new_id"]

                if(!won && this.order[this.turn_number] == this.my_id){
                    addMainNotification(`It is your turn!`,0)

                    this.turnButton.drawOutline()
                }
            }     
            
            this.arrow.placeToBe = this.players[this.order[turndata["new_id"]]].place
            this.arrow.alpha = 1
        });

        // received at start of each round
        // "cards" : [[suit,value],[,],[,],[,]]
        // "order" : [id,id,id,id,id,..]
        this.socket.on("begin", message => {
            
            // thinking about resending this list at beginning of every game. just in case
            /*
           const others = data["others"]

            for(let i = 0; i < others.length; i++){
            this.addPlayer(others[i][0],others[i][1])
            }
           */

            this.arrow.visible = true
            this.arrow.alpha = 1

            for (let i = 0; i < this.extra_cards.length; i++) {
                const card = this.extra_cards[i];
                card.cleanUp()
            }
        
            this.extra_cards = []

            this.backButton.turnOff();

            this.turnButton.turnOn();
            // in case it restarts!
            this.hand.clearHand()
            this.table_pile.clearHand()

            this.hand = new Hand(0,0);
            this.table_pile = new Hand(window.tableSprite.x, window.tableSprite.y - 13);
            

            this.turn_number = 0;

            
            
            const cards = message["cards"]


            const _x = window.renderer.getPercentWidth(.5) - (cards.length * 53 / 2)
            const _y = 90

            const dis = 53

            let i;
            for(i = 0; i < cards.length; i++){
                let card = new Card(cards[i][0], cards[i][1], true, _x + dis * i, _y);
                this.hand.addCard(card);
            }

            // i extremely overcomplicated the whole order thing...
            this.order = message["order"]

            this.last_player = this.players[this.order[0]]

            this.flybox.x = this.last_player.sprite.x
            this.flybox.y = this.last_player.sprite.y
            this.flybox.alpha = 0;

            this.setPlayerPlaces(this.order)
            if(this.my_id == message["order"][0]){
                addMainNotification(`You go first, President`,0)
                this.turnButton.drawOutline()
            }
        });

        // you make an attempt to put card down. 
        // It will respond with a success or failure message
        // the "turn" socket one will also be called if this is a success
        // {"status":"0/1", "message": string_message, "cards": cards to remove}
        this.socket.on("attempt", message => {

            const status = message["status"]
            const msg = message["message"]
            //console.log(`${status}, ${msg}`)

            if(status == 0){
                addMainNotification(`${msg}`, 1)
            } else {
                this.turnButton.clearOutLine()
            }// moved success to be implicit in the TURN COMMAND
            
            /*
            const private_data = message["pvt"]
            const data = message["game"]

            this.ping = private_data["p"] / 2
            this.ping_text.text = `Ping: ${this.ping}ms`;
            */
        })

        this.socket.on("over", data => {
            this.arrow.visible = false
            this.turnButton.turnOff();
            this.turnButton.clearOutLine()

            this.order = data["order"]

            //resetSubNum()
            addSubNotification("The round has ended!",0)
            //[player.name, player.player_id]
            if(data["winners"].length > 2){
                for (let i = 0; i < data["winners"].length; i++) {
                    const player_name = data["winners"][i][0]
        
                    addSubNotification(`${player_name} ---> ${Player.getPlaceName(i + 1,data["winners"].length)}`,0)
                }
            }
  
            this.setPlayerPlaces(this.order)

            this.backButton.turnOn()

        });

        this.socket.on("kicked", data => {

            addMainNotification(data)
            this.cleanUpMatch()
        });

        // "status": 0/1 (stop/start), "msg": text to display, "event":"game started", time":time in ms till server takes action
        this.socket.on("timer", data => {
            const status = data["status"]
            const msg = data["msg"]
            const end_time_ms = data["time"]

            const event = data["event"]

            // cancelling a timer
            if(status == 0){
                this.timer_started = false
                this.end_time = 0
                this.time_timer_received = 0
                this.current_timer_event = ""

                if(this.progressbar != null){
                    this.progressbar.clear()
                }
                if (event == "gamestartpaused"){
                    this.backButton.turnOn()
                }
            }

            else if(status == 1){
                if(event == "gamestart"){
                    this.timer_started = true

                    const w = 300 
                    const h = 67
            
                    const _x = window.renderer.getPercentWidth(.5)
                    const _y = 30

                    this.progressbar = new ProgressBar(Date.now(), end_time_ms,msg,_x, _y, w, h);
                    this.progressbar.start()
                } else if(event == "go"){

                }
            }

        });


        // a player has joined!
        //{"id": new_player.player_id, "name":new_player.name}
        this.socket.on("pjoin", message => {


            const id = message["id"]

            // This gets called when I join, but this personal clients stuff is death specially
            if(id == this.my_id){
                return
            }
            // if its myself, no point in doing anything here
            
            const name = message["name"]

            addSubNotification(`${name} has joined the room`,2)
            
            this.addPlayer(id, name)
            this.setPlayerPlaces(this.order)
        });

        this.socket.on("pleave", id => {
            addSubNotification(`${this.players[id].name} has left the room`,1)

            this.players[id].cleanUp();

            delete this.players[id]

            for(let i = 0; i < this.order.length; i++){
                if (this.order[i] == id){
                    this.order.splice(i,1)
                    break;
                }
            }

            for(let j = 0; j < this.playerlist.length; j++){
                if(this.playerlist[j].id == id){
                    this.playerlist.splice(j,1)
                    break;
                }
            }    

            this.setPlayerPlaces(this.order)
        });
    }

    // array, index is place and number is ID
    setPlayerPlaces(order){
        for(let i = 0; i < order.length; i++){
            this.players[order[i]].setPlace(i,order.length)
        }
    }
}
/*


    getInput(){
        return this.input.getMovementState();
    }

    processInputs(){
        const mousepoint = this.input.getMousePoint(); 

        let sample_input = this.input.getMovementState();

        const mousedown = this.input.getMouseDown();

        if(false){
            window.socket.emit("cmd", sample_input.horz, sample_input.vert, this.input_number, angle_delta, mousedown)
            this.input_number += 1;
        }
    }
*/