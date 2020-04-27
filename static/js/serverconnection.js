import MatchConnection from "./matchcontroller.js";
import PixiButton from "./pixibutton.js";
import { addMainNotification } from "./notificationsystem.js";
import { addObjectToInterpolate, setIDLinear, setIDRound } from "./interpolator.js";

export default class ServerConnection {
    constructor(){
        //this.socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);
        this.socket = io({transports: [ 'websocket' ]});
        this.game = null;

        ///////////////
        window.testtest = this;
        this.time = Date.now();
        //////////////

        this.choosing_name = true;
    
        this.name = ""

        window.socket = this.socket;
        this.setSocketListeners();

        const _bind = this;

        const bar_width = Math.min(500,renderer.getPercentWidth(.8))

        this.input = new PIXI.TextInput({
            input: {
                fontSize: '25pt',
                padding: '14px',
                width: bar_width + 'px',
                color: '#26272E'
            }, 
            box: {
                default: {fill: 0xE8E9F3, rounded: 16, stroke: {color: 0xCBCEE0, width: 4}},
                focused: {fill: 0xE1E3EE, rounded: 16, stroke: {color: 0xABAFC6, width: 4}},
                disabled: {fill: 0xDBDBDB, rounded: 16}
            }
        })


        this.input.maxLength = 15
        

        this.input.on('keydown', keycode => {
            // 13 is enter key
            if(keycode == 13) {
                _bind.sendName(this.input.text);
                this.input.blur()
            }
        })

        const half_x = window.renderer.getPercentWidth(.5)
        const half_y = window.renderer.getPercentHeight(.5)


        this.enterButton = new PixiButton("static/images/button.png",half_x,half_y + 200,300, 170,"Enter name",1,() => {
            _bind.sendName(this.input.text);
            this.input.blur()
        })

        this.enterButton.disable()

        this.input.on("input",new_text => {
            if(new_text.length == 1){
                _bind.enterButton.enable()
            } else if (new_text.length == 0) {
                _bind.enterButton.disable()
            }
        });


        this.input.placeholder = 'Enter your name...'
        this.input.x = half_x
        this.input.y = half_y

        this.input.pivot.x = this.input.width/2
        this.input.pivot.y = this.input.height/2


        window.renderer.addSprite(this.input, 0)
    

        const style = new PIXI.TextStyle({
            fontFamily: 'Arial',
            fontSize: 72,
            fontStyle: 'italic',
            fontWeight: 'bold',
            fill: ['#ffffff', '#c9c9c9'], // gradient
            stroke: '#000000',
            strokeThickness: 5,
            dropShadow: true,
            dropShadowColor: '#000000',
            dropShadowBlur: 4,
            dropShadowAngle: Math.PI / 6,
            dropShadowDistance: 6,
            wordWrap: true,
            wordWrapWidth: 440,
        });

        this.presidentTitle = new PIXI.Text("Presidents", style)

        this.presidentTitle.x = half_x - (this.presidentTitle.width / 2);
        this.presidentTitle.y = 50;
        
        renderer.addSprite(this.presidentTitle,1);

        const smallStyle = new PIXI.TextStyle({
            fontFamily: 'Arial',
            fontSize: 36,
            fontStyle: 'italic',
            //fontWeight: 'bold',
            fill: ['#ffffff', '#c9c9c9'], // gradient
            stroke: '#000000',
            strokeThickness: 3,

            dropShadow: true,
            dropShadowColor: '#000000',
            dropShadowBlur: 2,
            dropShadowAngle: Math.PI / 6,
            dropShadowDistance: 4,
            dropShadowAlpha: 0.5,
        });


        this.smallPresidentsTitle = new PIXI.Text("Presidents",smallStyle)
        
        this.matchButtons = []
        this.creating_match = false;

        this.create_new_match_button = null;
        //this.joinGame();
    }

    // Just sets my name locally
    sendName(name){
        if(name == ""){
            return
        }

        this.choosing_name = false
        this.name = name

        window.renderer.removeSprite(this.input)
        renderer.removeSprite(this.presidentTitle)
        this.enterButton.cleanUp();

        this.getGames()
    }

    // asks server for list of games
    getGames(){
        this.socket.emit("getgames","Games?")
    }

    // clears the game lobby area with list of games
    clearRoomButtons(){

        for(let i = 0; i < this.matchButtons.length; i++){
            this.matchButtons[i].cleanUp();
        }
        
        if(this.create_new_match_button != null){
            this.create_new_match_button.cleanUp()
        }

        renderer.removeSprite(this.smallPresidentsTitle)
        
        // empty it!
        this.matchButtons = []
    }

    // asks server if I can join a specific game.
    joinGame(room){
        if(this.name == ""){
            alert("You'll need to provide a name before joining the match!")
            return
        }

        this.socket.emit("join room",{"name":this.name, "room":room})
    }
    

    // sets up the create a match page and then does all necessary clean-up
    setUpCreateMatch(){
        this.clearRoomButtons()
        this.creating_match = true
        this.create_new_match_button.cleanUp()

       

        const maxInput = new PIXI.TextInput({
            input: {
                fontSize: '20pt',
                padding: '10px',
                width: '500px',
                color: '#26272E'
            }, 
            box: {
                default: {fill: 0xE8E9F3, rounded: 16, stroke: {color: 0xCBCEE0, width: 4}},
                focused: {fill: 0xE1E3EE, rounded: 16, stroke: {color: 0xABAFC6, width: 4}},
                disabled: {fill: 0xDBDBDB, rounded: 16}
            }
        })

        maxInput.on('keydown', keycode => {
            // 13 is enter key
            if(keycode == 13) {
                maxInput.blur()
                sendRequest()
            } else {
                maxInput.text = ""
            }
        })

        const half_x = window.renderer.getPercentWidth(.5)
        const half_y = window.renderer.getPercentHeight(.5)

        maxInput.restrict = "3456"
        maxInput.placeholder = 'Enter player amount (3-6)'
        maxInput.x = half_x
        maxInput.y = half_y
        
        

        maxInput.pivot.x = maxInput.width/2
        maxInput.pivot.y = maxInput.height/2

        window.renderer.addSprite(maxInput,1)

        maxInput.select()

        const submitGameButton = new PixiButton("static/images/button.png",half_x,half_y + 200,300, 170,"Create Match",1,sendRequest)

        const nvmButton = new PixiButton("static/images/button.png", 90, 40 ,165, 60,"Back to lobby",1,nevermind)

        const _bind = this

        function clear(){
            submitGameButton.cleanUp()
            window.renderer.removeSprite(maxInput)
            nvmButton.cleanUp()
            _bind.creating_match = false
        }

        function nevermind(){
            clear()
            _bind.getGames()
        }

        function sendRequest() {
            const amount = parseInt(maxInput.text, 10)

            if(amount < 3 || amount > 6 || isNaN(amount)){
                addMainNotification("Choose a valid number",1)
                return
            }

            clear()
            
            // this returns roomlist
            _bind.socket.emit("creategame",amount)
        }
    }


    setSocketListeners(){
        this.socket.on('connect', () => {
            console.log("Successfully connnected to the server");
        });

        socket.on('disconnect', () => {
            addMainNotification("Connection to server has failed. Try refreshing page")
        });

        this.socket.on("roomlist", data => {
            //if currently in a match, i dont care about this data
            if(this.game != null){
                return
            }

            // If havent even picked name yet, don't care about these updates
            if(this.choosing_name){
                return
            }

            if(this.creating_match){
                return
            }
            
            if (data.length == 0){
                // no games on server
                // make game function
            }

            const bx = window.renderer.getPercentWidth(1) - 150
            const by = window.renderer.getPercentHeight(1) - 75
    

            this.clearRoomButtons()

            // click on this to bring up new screen to create a match . . .
            this.create_new_match_button = new PixiButton("static/images/button.png",bx,by,220, 90,"Create New Match",1,() => {
                this.setUpCreateMatch();
            })

            renderer.addSprite(this.smallPresidentsTitle,1000)
            this.smallPresidentsTitle.x = window.renderer.getPercentWidth(.5) - (this.smallPresidentsTitle.width / 2)
            this.smallPresidentsTitle.y = 4
            // key,game.max_players,game.players_in_room

            const TOPGAP = 24
            let gap = 20

            let width, height, _mod;

            let max_games; 


            if(renderer.getPercentWidth(1) > renderer.getPercentHeight(1)){
                let _height = renderer.getPercentHeight(1)
                _height -= TOPGAP
                _height -= 5 * gap
                _height /= 4;
                height = _height

                let _width = renderer.getPercentWidth(1)
                _width -= 6 * gap
                _width /= 5;
                width = _width

                _mod = 4

                max_games = 4 * 5
            } else { // if device taller than wide, so like a iPad or phone
                let _height = renderer.getPercentHeight(1)
                _height -= TOPGAP
                _height -= 7 * gap
                _height /= 6;
                height = _height

                let _width = renderer.getPercentWidth(1)
                _width -= 4 * gap
                _width /= 3;
                width = _width

                _mod = 6

                max_games = 6 * 3
            }

            // if we have to many games.. they fill the screen!
            if(data.length > max_games - 1){
                width /= 2
                height /= 2
                gap /= 2
                _mod *= 2
            }

                for(let i = 0; i < data.length; i++){
                    const key = data[i][0]
                    const cap = data[i][1]
                    const cur = data[i][2]
                    const canJoin = data[i][3]
                    const timeout = data[i][4]

    
            
                    const b = new PixiButton("static/images/roundrect.png",
                    gap + width/2 + (Math.floor(i / _mod) * (width + gap)),
                    TOPGAP + gap + height/2 + (Math.floor(i % _mod) * (height + gap)),
                            width,
                            height,
                            "Game #" + key,
                            key,
                            () => {
                                this.joinGame(key)
                            });
    
                    b.setSubtext("Capacity: " + cap + "\n" + "Players: " + cur)
                    
                    
                    
                    if(data.length > max_games - 1){
                        b.shiftAllText(-8)
                    } else if (timeout != -1){ // simply not enough space otherwise
                        const time_to_go = timeout - (Date.now()/1000) //seconds
                        b.setSuperText(time_to_go,3)
                        const id = addObjectToInterpolate(b.superText,"text",Date.now(),timeout * 1000,time_to_go, 0)
                        setIDLinear(id)
                        setIDRound(id,3)
                    }

                    if(canJoin == 0){
                        b.sprite.interactive = false
                        b.sprite.alpha = .23
                    }
                    this.matchButtons.push(b)
                }
            



            
            
        });

        this.socket.on("join match", (data) => {
            // console.log(data);

            if(data["success"] == 1){
                this.clearRoomButtons()
                this.game = new MatchConnection(this,this.socket, data);
            } else {
                addMainNotification(data["msg"],1)
            }
        })

        //Server calls this periodically to get the round trip time
        this.socket.on("p", (data) => {
            //console.log("P")
            this.socket.emit("p", data)
        });


        ///// TESTING
        this.socket.on("testpong", (data) => {
            console.log(Date.now() - this.time);
        });
    }

    ///TESTING PURPOSES
    ping(){
        this.time = Date.now();
        this.socket.emit("testping","hi")
    }

    getSocket(){
        return this.socket();
    }
}