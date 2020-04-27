const Sprite = PIXI.Sprite;
const resources = PIXI.Loader.shared.resources;
const Point = PIXI.Point

export default class Renderer {


    constructor() {
        //https://stackoverflow.com/questions/3514784/what-is-the-best-way-to-detect-a-mobile-device
        window.isMobile = function() {
            let check = false;
            (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|ipad|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
            return check;
        }();
    

        document.body.style.zoom = 1.0

        let width = screen.availWidth 
        let height = screen.availHeight - 89

        if(isMobile){
            //width = document.documentElement.clientWidth;
            //height = document.documentElement.clientHeight;
        }

        this.ratio = width / height

        const bgColor = 0x797880
        this.pixiapp = new PIXI.Application({width: width, height: height, backgroundColor : bgColor })


        //automatically resizes
            const window_width = window.innerWidth - 10
            const window_height = window.innerHeight - 10

            if (window_width / window_height >= this.ratio) {
                var w = window_height * this.ratio;
                var h = window_height;
            } else {
                var w = window_width;
                var h = window_width / this.ratio;
            }

            // CSS changing, just scaling really
            this.pixiapp.renderer.view.style.width = w + 'px';
            this.pixiapp.renderer.view.style.height = h + 'px';
            
        this.pixiapp.sortableChildren = true;
            this.pixiapp.renderer.view.style.touchAction = 'auto';
        
        //document.body.style.backgroundColor = '#4d5c63';

        this.camera = new PIXI.Container();
        this.camera.sortableChildren = true;
        this.camera.zIndex = 0;
        this.pixiapp.stage.addChild(this.camera) 

        this.gui = new PIXI.Container();
        this.gui.zIndex = 1;
        this.pixiapp.stage.addChild(this.gui)

        const displayDiv = document.querySelector('#display')
        displayDiv.appendChild(this.pixiapp.view);
        console.log("Renderer loaded")


        const game_sprites = ["static/images/tables/table0.png","static/images/roundrect.png","static/images/smallarrow.png","static/images/stickperson.png","static/images/player.png", "static/images/cards.png","static/images/button.png"]

        PIXI.Loader.shared
            .add(game_sprites)

        const _bind = this;

        window.onresize = function (event){
            // This triggers on phone or iPad zoom, so we actually dont want to do anything
            if(window.isMobile) return

            const window_width = window.innerWidth - 10
            const window_height = window.innerHeight - 10

            if (window_width / window_height >= _bind.ratio) {
                var w = window_height * _bind.ratio;
                var h = window_height;
            } else {
                var w = window_width;
                var h = window_width / _bind.ratio;
            }
            this.pixiapp.renderer.view.style.width = w + 'px';
            this.pixiapp.renderer.view.style.height = h + 'px';


            //this.pixiapp.renderer.view.width = w;
            //this.pixiapp.renderer.view.height = h;
            return
            
        }
        this.card_counter = 20

        
        
    }

    setTableSprite(){
        const table = new Sprite(resources["static/images/tables/table0.png"].texture)
        table.scale.x = 3
        table.scale.y = 3
        table.x = renderer.getPercentWidth(.5)
        table.y = renderer.getPercentHeight(.65)
        table.anchor.x = .5
        table.anchor.y = .5

        table.mainWidth = 135 * 3
        table.mainHeight = 79 * 3
        return table
    }

    getPercentWidth(percent){
        return percent * parseInt(this.pixiapp.renderer.view.width,10)
    }

    getPercentHeight(percent){
        return percent * parseInt(this.pixiapp.renderer.view.height,10)
    }


    resetRatio(width, height){
        this.ratio = width/height
    }


    addCard(sprite){
        sprite.zIndex = this.card_counter;
        this.card_counter++;
        this.camera.addChild(sprite)
        this.camera.sortChildren();
    }


    // adds the given sprite to the canvas at the given z layer. The higher the layer, the closer to the top
    addGUI(sprite){
        this.gui.addChild(sprite)
    }
    
    addSprite(sprite, z){
        sprite.zIndex = z;
        this.camera.addChild(sprite)
        this.camera.sortChildren();
    }

    removeSprite(sprite){
        this.camera.removeChild(sprite)
    }

    getPixiApp() {
        return this.pixiapp;
    }
}

const renderer = new Renderer();
window.renderer = renderer;
window.pixiapp = renderer.getPixiApp();