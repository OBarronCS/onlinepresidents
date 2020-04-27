

const objects = []
requestAnimationFrame(loop)

let internal_id = 0

// Returns an ID that you can use to remove the given entry from the list 
export function addObjectToInterpolate(object, key, start_time, end_time, x1, x2,callback){
        objects.push({
        "id":internal_id,
        "object":object,
        "key":key,
        "start":start_time, 
        "end":end_time,
        "x1":x1,
        "x2":x2,
        "cb":callback,
        "ease":easeInOutQuart,
        "round": null
        });

        return internal_id++;
    }

    function loop(){
        const real_time = Date.now()

        for(let i = 0; i < objects.length; i++){
            const obj = objects[i]

            if(real_time < obj.start) continue;

            const percent = (real_time - obj.start) / (obj.end - obj.start)
            const final_percent = obj.ease(percent)
            //easeInOutQuart(percent)

            obj.object[obj.key] = obj.x1 + ((obj.x2 - obj.x1) * final_percent)
            
            if(obj.round != null){
                let _str = obj.object[obj.key].substring(0,obj.round)
                if(_str.slice(-1) == "."){
                    _str = _str.substring(0,_str.length - 1)
                }

                obj.object[obj.key] = _str
                
            }

            if(percent > 1){
                obj.object[obj.key] = obj.x2

                if(obj.cb != null){
                    obj.cb();
                }
                
                objects.splice(i,1)
                i--
            }
        }
    
    
        requestAnimationFrame(loop)
    }

    function linear(x){
        return x
    }

    function easeInOutQuart(x) {
        return x < 0.5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2;
    }

    export function setIDLinear(id){
        for(let i = 0; i < objects.length;i++){
            if(objects[i].id == id){
                objects[i].ease = linear
                break;
            }
        }
    }

    export function setIDRound(id,decimals){
        for(let i = 0; i < objects.length;i++){
            if(objects[i].id == id){
                objects[i].round = decimals
                break;
            }
        }
    }
    
    export function removeInterpolatingObject(id){
        for(let i = 0; i < objects.length;i++){
            if(objects[i].id == id){
                objects.splice(i,1)
                break;
            }
        }
    }
    
