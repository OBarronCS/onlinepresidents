import { addObjectToInterpolate } from "./interpolator.js";
const Sprite = PIXI.Sprite;
const resources = PIXI.Loader.shared.resources;
const Point = PIXI.Point

const style = new PIXI.TextStyle({
    align: "center",
    fontFamily: "Tahoma, Geneva, sans-serif",
    fontSize: 23,
    fontWeight: "lighter",
    wordWrap: true,
    wordWrapWidth: 350
});


let tex = null;
let guide = null;
export function setUpNotifications(){
    tex = resources["static/images/roundrect.png"].texture
    
    guide = createGuideBox(0x99caf7)
        
    window.renderer.addSprite(guide[0],1100)
    window.renderer.addSprite(guide[1], 1200)
}

function createNewMainNotification(color){
    //const tex = resources["static/images/roundrect.png"].texture
    const spr = new Sprite(tex) 

    spr.tint = color
    spr.width = 350
    spr.height = 80
    spr.anchor.x = .5
    spr.anchor.y = .5


    let _x = (renderer.getPercentWidth(1) - (spr.width / 2)) - 20

    spr.x = _x
    spr.y = -100

    const text = new PIXI.Text('',style);
    text.x = _x
    text.y = -100

    return [spr, text]
}


const yDown = 55;

export function addMainNotification(msg, good){
    let color = 0xffffff
    if(good == 0){
        color = 0x00bd0c
    } if (good == 1) {
        color = 0xd11313
    } else if (good == 2){
        color = 0xffa617
    }

    const new_notif = createNewMainNotification(color)
    const main_sprite = new_notif[0]
    const main_text = new_notif[1]

    renderer.addSprite(main_text,1100)
    renderer.addSprite(main_sprite, 1000)

    main_text.text = msg
    main_text.x = main_sprite.x - (main_text.width / 2);

    const textOffset = 28;
    const time = Date.now()
    const ms = 700;
    const start_fade = 2000
    const end_fade = 2700
    addObjectToInterpolate(main_sprite,"y",time, time + ms,-50,yDown)
    addObjectToInterpolate(main_sprite,"alpha",time + start_fade, time + end_fade,1,0, () => {renderer.removeSprite(main_sprite)})
    
    addObjectToInterpolate(main_text,"y",time, time + ms, -50 - textOffset,yDown - textOffset)
    addObjectToInterpolate(main_text,"alpha",time + start_fade, time + end_fade,1,0 , () => {renderer.removeSprite(main_text)})
}


const maxSubNum = 8;
let subNum = 0

const xRight = 100
const topSubY = 115
const yGap = 66

export function resetSubNum(){
    subNum = 0
}

export function addSubNotification(msg, good){
    let color = 0xffffff
    if(good == 0){
        color = 0x00bd0c
    } if (good == 1) {
        color = 0xd11313
    } else if (good == 2){
        color = 0xffa617
    }

    const new_notif = createNewSubNotification(color,msg)
    const main_sprite = new_notif[0]
    const main_text = new_notif[1]

    renderer.addSprite(main_text,1100)
    renderer.addSprite(main_sprite, 1000)

    main_text.x = main_sprite.x - (main_text.width / 2);

    const textOffset = (main_text.width / 2);
    const time = Date.now();
    const ms = 700;
    const start_fade = 4500;
    const end_fade = 5300;


    const _y = topSubY + subNum * yGap;
    main_sprite.y = _y

    if(main_text.height < 25){
        main_text.y = main_sprite.y - 11
    } else if(main_text.height < 40){
        main_text.y = main_sprite.y - 21
    } else {
        main_text.y = main_sprite.y - 27
    }

    const start_x = -80;

    
    addObjectToInterpolate(main_text,"x",time, time + ms,     start_x - textOffset,   xRight - textOffset);
    addObjectToInterpolate(main_text,"alpha",time + start_fade, time +end_fade ,1,0, () => {renderer.removeSprite(main_text);});

    addObjectToInterpolate(main_sprite,"x",time, time + ms,      start_x,       xRight);
    addObjectToInterpolate(main_sprite,"alpha",time + start_fade, time + end_fade,1,0, () => {renderer.removeSprite(main_sprite);});
    

    subNum += 1;
    if(subNum == maxSubNum) subNum = 0
}

const subStyle = new PIXI.TextStyle({
    align: "center",
    fontFamily: "Tahoma, Geneva, sans-serif",
    fontSize: 16,
    fontWeight: "lighter",
    wordWrap: true,
    wordWrapWidth:  350 / 2
});

function createNewSubNotification(color,msg){
    //const tex = resources["static/images/roundrect.png"].texture
    const spr = new Sprite(tex) 

    spr.tint = color
    spr.width = 350 / 2
    spr.height = 60
    spr.anchor.x = .5
    spr.anchor.y = .5

    //off screen
    spr.x = -200
    spr.y = -200

    const text = new PIXI.Text(msg,subStyle);
    text.x = -200
    text.y = -200

    return [spr, text]
}


//// GUIDE THING THAT POPS UP
function createGuideBox(color){
    //const tex = resources["static/images/roundrect.png"].texture
    const spr = new Sprite(tex) 

    spr.tint = color
    spr.width = 350
    spr.height = 280
    spr.anchor.x = .5
    spr.anchor.y = .5


    let _x = (renderer.getPercentWidth(1)) + 200
    let _y = (renderer.getPercentHeight(1) - (spr.height / 2)) - 60

    spr.x = _x
    spr.y = _y

    const guideStyle = new PIXI.TextStyle({
        fontFamily: "Tahoma, Geneva, sans-serif",
        fontSize: 22,
        fontWeight: "lighter",
        wordWrap: true,
        wordWrapWidth: 320
    });
    
    const text = new PIXI.Text('Select cards by clicking (or tapping) them. Click on the table to play your selected cards.\nSpecial rules:\nPlacing a two will clear the deck. At any point, complete a four-of-a-kind to clear the deck as well. Ace is low.',guideStyle);
    text.x = _x - (text.width / 2) + 15;
    text.y = _y - 120

    return [spr, text]
}


let showing = false 

export function showGuide(){
    showing = !showing
    if(showing){
        const main_sprite = guide[0]
        const main_text = guide[1]

        const start_x = main_sprite.x
        const final_x = renderer.getPercentWidth(1) - 200

        const start_text_x = start_x - main_sprite.width / 2 + 15
        const final_text_x = final_x - main_sprite.width / 2 + 15

        const time = Date.now()
        const ms = 700;

        addObjectToInterpolate(main_sprite,"x",time, time + ms, start_x,final_x)
            
        addObjectToInterpolate(main_text,  "x",time, time + ms, start_text_x,final_text_x)
    } else {
        const main_sprite = guide[0]
        const main_text = guide[1]

        const start_x = main_sprite.x
        const final_x = (renderer.getPercentWidth(1)) + 200

        const start_text_x = start_x - main_sprite.width / 2 + 15
        const final_text_x = final_x - main_sprite.width / 2 + 15

        const textOffset = 28;
        const time = Date.now()
        const ms = 700;

        addObjectToInterpolate(main_sprite,"x",time, time + ms, start_x,final_x)
            
        addObjectToInterpolate(main_text,  "x",time, time + ms, start_text_x,final_text_x)
    }
}

export function hideGuide(){
    showing = true
    showGuide()
}