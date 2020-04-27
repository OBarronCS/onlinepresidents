

// obj: sprite, start: , end:
const sprites = []
requestAnimationFrame(loop)
export default function addMoveSprite(sprite, start_time, end_time, x1, y1, x2, y2){
        sprites.push({
        "sprite":sprite,
        "start":start_time, 
        "end":end_time,
        "x1":x1,
        "y1":y1,
        "x2":x2,
        'y2':y2
        });
    }

function loop(){
        for(let i = 0; i < sprites.length; i++){
            const obj = sprites[i]
            const percent = (Date.now() - obj.start) / (obj.end - obj.start)
            const final_percent = easeInOutQuart(percent)
            obj.sprite.x = obj.x1 + ((obj.x2 - obj.x1) * final_percent)
            obj.sprite.y = obj.y1 + ((obj.y2 - obj.y1) * final_percent)
            
            if(percent > 1){
                obj.sprite.x = obj.x2
                obj.sprite.y = obj.y2

                sprites.splice(i,1)
                i--
            }
        }
    
    
        requestAnimationFrame(loop)
    }

    function easeInOutQuart(x) {
        return x < 0.5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2;
    }

    function removeSprite(sprite){
        for(let i = 0; i < sprites.length;i++){
            if(sprites[i].sprite == sprite){
                sprites.splice(i,1)
            }
        }
    }

