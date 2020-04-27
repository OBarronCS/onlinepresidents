import addMoveSprite from "./spritemover.js";
import { addObjectToInterpolate, removeInterpolatingObject }  from "./interpolator.js"

const Sprite = PIXI.Sprite;
const resources = PIXI.Loader.shared.resources;
const Point = PIXI.Point
// TODO : Add sprite, make sure they are in correct places, have correct title
// Movement between places


// Place To Title
const place_to_title = {
    "3":["President","Citizen","Scum"],
    "4":["President","Vice-President","Vice-Scum","Scum"],
    "5":["President","Vice-President","Citizen","Vice-Scum","Scum"],
    "6":["President","Vice-President","Citizen","Citizen","Vice-Scum","Scum"]
}

export default class Player {

    static getPlaceName(place, max){
        return place_to_title["" + max][place - 1]
    }
    // Will hold things like player position (President, VP, ect, )
    // and their sprite and name. 

     //new_entity.setSprite("static/images/player.png")
    constructor(id, name, initial_place){
        this.id = id
        this.name = name;

        this.place = initial_place

        const tex = resources["static/images/stickperson.png"].texture
        this.sprite = new Sprite(tex);
        window.renderer.addSprite(this.sprite, 20)
        
        this.sprite.anchor.x = .5
        this.sprite.anchor.y = .9

        const p = window.place_to_point[initial_place]

        this.sprite.x = p.x
        this.sprite.y = p.y



        this.text = new PIXI.Text(name)
        this.text.x = -(this.text.width / 2)
        this.text.y = -90


        const style = new PIXI.TextStyle({
            fontFamily: "Georgia",
            fontSize: 12,
            fontWeight: "bold"
        });

        this.title_text = new PIXI.Text(this.title,style)
        
        this.sprite.addChild(this.text)
        this.sprite.addChild(this.title_text)
        //window.renderer.addSprite(this.text)

        this.fade_key = -1;
    }

    // number 0-5 for which point it should go too
    setPlace(num,player_amount){
        const goto = window.place_to_point[num]
        this.place = num
        const now = Date.now()
        this.title_text.alpha = 1

        if(this.fade_key != -1){
            removeInterpolatingObject(this.fade_key)
            this.fade_key = 1
        }

        if(player_amount >= 3){
            this.title_text.text = place_to_title["" + player_amount][num]
            this.title_text.x = -(this.title_text.width / 2)
            this.title_text.y = 30
            const t = Date.now()
            this.fade_key = addObjectToInterpolate(this.title_text,"alpha",t + 7000, t + 8000,1,0)
        } else {
            this.title_text.text = ""
        }

        addMoveSprite(this.sprite, now, now + 1000, this.sprite.x, this.sprite.y,goto.x,goto.y)
    }

   
    cleanUp(){
        window.renderer.removeSprite(this.sprite)
        window.renderer.removeSprite(this.text)
        window.renderer.removeSprite(this.title_text)
    }
}