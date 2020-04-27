
const Point = PIXI.Point

// https://easings.net/
function easeInOutQuart(x) {
    return x < 0.5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2;
}

function easeInOutCubic(x) {
    return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
    }
    

const easings = {
    "linear": x => x,
    "default":easeInOutQuart,
    "fasttoslow":easeInOutCubic
}

const objects = []
requestAnimationFrame(loop)
export function addCurveFollow(sprite, start_time, end_time, p1,p2,p3, easing){
        objects.push({
        "sprite":sprite,
        "start":start_time, 
        "end":end_time,
        "p1":p1,
        "p2":p2,
        "p3":p3,
        "easing":easing
        });
    }

    function loop(){
        const real_time = Date.now() //only need to calc it once
        for(let i = 0; i < objects.length; i++){
            const obj = objects[i]
            const spr = obj.sprite

            const percent = (real_time - obj.start) / (obj.end - obj.start)
            const final_percent = easings[obj.easing](percent)
            //console.log(percent)
            const x1 = obj.p1.x
            const y1 = obj.p1.y

            const x2 = obj.p2.x
            const y2 = obj.p2.y

            const x3 = obj.p3.x
            const y3 = obj.p3.y

            spr.x = (((1 - final_percent)**2) * x1) + (2 * (1-final_percent) * final_percent * x2) + ((final_percent**2)*x3)
            spr.y = (((1 - final_percent)**2) * y1) + (2 * (1-final_percent) * final_percent * y2) + ((final_percent**2)*y3)
            
            if(percent > 1){
                spr.x = x3
                spr.y = y3

                objects.splice(i,1)
                i--
            }
        }
    
    
        requestAnimationFrame(loop)
    }

    