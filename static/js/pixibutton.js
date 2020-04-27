const Sprite = PIXI.Sprite;
const resources = PIXI.Loader.shared.resources;

export default class PixiButton {

    constructor(outline_texture_path, x, y, width, height, text, value, callback){
        this.x = x
        this.y = y

        
        
        this.texture = resources[outline_texture_path].texture

        this.sprite = new Sprite(this.texture);

        this.sprite.basecolor = 0x2365cf
        this.sprite.hovercolor = 0x6ea5ff

        this.sprite.anchor.x = 0.5;
        this.sprite.anchor.y = 0.5;

        this.sprite.x = x;
        this.sprite.y = y;

        this.sprite.tint = this.sprite.basecolor

        this.sprite.width = width
        this.sprite.height = height

        this.sprite.interactive = true;

        this.sprite.buttonMode = true

        this.sprite.isSelected = false
        this.sprite.callback = callback
        this.sprite
                // hovering / unhover
                .on('mouseover', onButtonOver)
                .on('mouseout', onButtonOut)

                // click / tap
                .on('click', click)
                .on('tap', click)
        
                function updateColor(thing){
                    if(!thing.isOver){
                        thing.tint = thing.basecolor;

                        if(thing.isSelected){
                            thing.tint = 0xcf3030
                        }
                    } else if(thing.isOver){
                        thing.tint = thing.hovercolor 

                        if(thing.isSelected){
                            thing.tint = 0xf22727
                        }
                    }
                }

                function onButtonOver()
                {
                    this.isOver = true;
                    updateColor(this)
                }

                function onButtonOut()
                {
                    this.isOver = false;
                    updateColor(this)
                }

                function click()
                {
                    this.callback()
                    updateColor(this)
                    //this.isSelected = !this.isSelected;
                    
                }

        this.text = new PIXI.Text(text,
            {fontFamily : 'Arial', fontSize: 26, fill : 0x000000, align : 'center'}
        );

        this.text.x = x - this.text.width / 2
        this.text.y = y - this.text.height / 2 - 6

        this.last_text = text

        const substyle = new PIXI.TextStyle({
            fontFamily: "\"Courier New\", Courier, monospace",
            fontSize: 16,
            fontWeight: 300,
            align : 'center'
        });

        this.subtext = new PIXI.Text('', substyle);

        this.outline = new PIXI.Graphics()


        const superStyle = new PIXI.TextStyle({
            fontFamily: "Verdana",
            fontSize: 10,
            fontWeight: "bold"
        });
        this.superText = new PIXI.Text('', superStyle);



        window.renderer.addSprite(this.text,15)
        window.renderer.addSprite(this.subtext,14)
        window.renderer.addSprite(this.superText,13)
        window.renderer.addSprite(this.sprite, 11)
        window.renderer.addSprite(this.outline, 12)
    }

    setSuperText(text,d){


        this.superText.text = text.toString().substring(0, d)

        if(this.superText.text.slice(-1) == "."){
            this.superText.text  = this.superText.text .substring(0,this.superText.text.length - 1)
        }


        const _x = this.x
        const _y = this.y


        this.superText.x = _x - this.superText.width / 2
        this.superText.y = _y - this.superText.height / 2 - 23
    }

    setSubtext(text){
        this.subtext.text = text

        const _x = this.x
        const _y = this.y


        this.subtext.x = _x - this.subtext.width / 2
        this.subtext.y = _y - this.subtext.height / 2 + 23
    }

    shiftAllText(dy){
        this.text.y += dy
        this.subtext.y += dy
        this.superText.y += dy
    }

    disable(){
        this.sprite.interactive = false
        this.sprite.tint = 0xb5b5b5
    }

    enable(){
        this.sprite.interactive = true
        this.sprite.tint = 0xffffff
    }

    turnOff(){
        this.sprite.interactive = false;
        this.sprite.visible = false
        this.text.visible = false
        this.subtext.visible = false
        this.superText.visible = false
    }

    drawOutline(){
        this.outline.lineStyle(2,0x53eb34)
        this.outline.drawRoundedRect(this.sprite.x - this.sprite.width / 2,this.sprite.y - this.sprite.height / 2,this.sprite.width,this.sprite.height)
    }

    clearOutLine(){
        this.outline.clear()
    }

    turnOn(){
        this.sprite.interactive = true;
        this.sprite.visible = true
        this.text.visible = true
        this.subtext.visible = true
    }


    setText(_text){
        if(_text != this.last_text){
            this.last_text = _text

            this.text.text = _text
            this.text.x = this.sprite.x - this.text.width / 2
        }
    }

    cleanUp(){
        window.renderer.removeSprite(this.subtext)
        window.renderer.removeSprite(this.sprite)
        window.renderer.removeSprite(this.text)
        window.renderer.removeSprite(this.superText)
        window.renderer.removeSprite(this.outline)
    }



}