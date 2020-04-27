//This is where the app starts
import Renderer from "./renderer.js";

import ServerConnection from "./serverconnection.js";
import Card from "./card.js";
import { addObjectToInterpolate }  from "./interpolator.js"
import { addCurveFollow } from "./curvefollower.js"
import { addMainNotification, addSubNotification, setUpNotifications, showGuide } from "./notificationsystem.js"
import addMoveSprite from "./spritemover.js";

const Sprite = PIXI.Sprite;
const resources = PIXI.Loader.shared.resources;
const Point = PIXI.Point


PIXI.Loader.shared.load(() => {
    setUpNotifications()

    window.tableSprite = window.renderer.setTableSprite()

    console.log("Sprites loaded");
    console.log("Initiating Connection")

    //Set this global so other things can access it fast.
    window.mouse = window.pixiapp.renderer.plugins.interaction.mouse.global
    window.pixiapp.renderer.plugins.interaction.autoPreventDefault = false;

    const Point = PIXI.Point
    
    // index = place, 0-5
    /*
    window.place_to_point = 
    [
        new Point(renderer.getPercentWidth(.3), renderer.getPercentHeight(.5)),
        new Point(renderer.getPercentWidth(.45), renderer.getPercentHeight(.3)),
        new Point(renderer.getPercentWidth(.60), renderer.getPercentHeight(.3)),
        new Point(renderer.getPercentWidth(.7), renderer.getPercentHeight(.5)),
        new Point(renderer.getPercentWidth(.60), renderer.getPercentHeight(.8)),
        new Point(renderer.getPercentWidth(.45), renderer.getPercentHeight(.8)),
    ]
    */

    const t = window.tableSprite
    const w = t.mainWidth
    const h = t.mainHeight
    const x = t.x
    const y = t.y

    const x_gap = 19
    const y_gap = 13
   window.place_to_point = 
    [   
        new Point(x - w / 2 - x_gap, y ),
        new Point(x - w / 4, y - h/2 - y_gap),
        new Point(x + w / 4, y - h/2 - y_gap),

        new Point(x + w / 2 + x_gap * 2, y ),
        new Point(x + w / 4, y + h/2 + y_gap * 4),
        new Point(x - w / 4, y + h/2 + y_gap * 4),
    ]
    
    const server = new ServerConnection();
});
