

export default class ProgressBar {

    constructor(starttime, endtime, text, center_x, center_y, width, height){
        this.starttime = starttime;
        this.endtime = endtime - 200
        this.text = text
        this.x = center_x;
        this.y = center_y;
        this.w = width;
        this.h = height;



        this.bar = new PIXI.Graphics()

        const style = new PIXI.TextStyle({
            fontFamily: "Helvetica",
            fontSize: 14,
            fontWeight: 300,
        });
    
        this.textObject = new PIXI.Text(text, style);
        this.textObject.style = {fill: 0xffffff}
        this.textObject.x = center_x - (this.textObject.width / 2)
        this.textObject.y = center_y + 15
        



        window.renderer.addSprite(this.textObject,4)
        window.renderer.addSprite(this.bar,3)
        this.textObject.visible = false
        this.bar.visible = false;
    }

    start(){
        this.bar.visible = true
        this.textObject.visible = true  

        const _bind = this
        function progressBar(timestamp){
            const current_time = Date.now()


            const start_percent = .15
            const real_percent = (current_time - _bind.starttime) / (_bind.endtime - _bind.starttime)
        
            const adjustedPercent = _bind.easeInOutQuart(real_percent)

            // background
            _bind.bar.clear()
            
            _bind.bar.alpha = Math.min(1,(real_percent / (start_percent + .3) ))
            _bind.bar.beginFill(0x243027)
            _bind.bar.lineStyle(2, 0x69f551, .2)

            _bind.bar.drawRoundedRect(_bind.x - (_bind.w / 2),_bind.y,_bind.w,_bind.h)

            

            _bind.bar.lineStyle(0, 0x000000, 1)
            _bind.bar.beginFill(0x32a852)

            const dis = Math.max(40,_bind.w * adjustedPercent)
            _bind.bar.drawRoundedRect(_bind.x - (_bind.w / 2),_bind.y,dis,_bind.h)
            

        

            if(current_time < _bind.endtime){
                requestAnimationFrame(progressBar)
            } else {
                _bind.clear()
            }
        }

        requestAnimationFrame(function(timestamp){
            progressBar(timestamp)
        });
    }

    easeInOutQuart(x) {
        return x < 0.5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2;
    }

    clear(){
        window.renderer.removeSprite(this.bar)
        window.renderer.removeSprite(this.textObject)
    }


}