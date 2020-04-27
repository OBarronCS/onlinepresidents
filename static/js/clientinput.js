export default class ClientInputListener {

	constructor() {
		this.mouse_down = false;

		this.movement_keys = {
			up: false,
			down: false,
			left: false,
			right: false,
		}

		this.setKeyboardListeners();
		this.setMouseListeners();
	}

	setMouseListeners(){
		window.addEventListener("click", (data) => {
			//console.log("CLICK")
			this.mouse_down = true;
		})
	}

	setKeyboardListeners() {
		let movement_keys = this.movement_keys;

		document.addEventListener('keydown', function (event) {
			switch (event.keyCode) {
				case 65: // A
					movement_keys.left = true;
					break;
				case 87: // W
					movement_keys.up = true;
					break;
				case 68: // D
					movement_keys.right = true;
					break;
				case 83: // S
					movement_keys.down = true;
					break;
			}
		});

		document.addEventListener('keyup', function (event) {
			switch (event.keyCode) {
				case 65: // A
					movement_keys.left = false;
					break;
				case 87: // W
					movement_keys.up = false;
					break;
				case 68: // D
					movement_keys.right = false;
					break;
				case 83: // S
					movement_keys.down = false;
					break;
			}
		});
	}

	getMovementState() {
		let horz = 0;
		let vert = 0;

		if (this.movement_keys.left) {
			horz -= 1;
		}
		if (this.movement_keys.right) {
			horz += 1;
		}
		if (this.movement_keys.up) {
			vert -= 1;
		}
		if (this.movement_keys.down) {
			vert += 1;
		}

		if (horz != 0 || vert != 0) {
			return { "horz": horz, "vert": vert }
		} else {
			return false;
		}
	}

	// returns dict {x:_ , y:} of the location of mouse pointer. Absolute value
	getMousePoint(){
		//console.log(window.mouse)
		//console.log(`${window.renderer.camera.pivot.x}, ${window.renderer.camera.pivot.y}`)
		return {"x":window.mouse.x + window.renderer.camera.pivot.x, "y":window.mouse.y + window.renderer.camera.pivot.y};

	
	}
	
	getMouseDown(){
		let temp_val = this.mouse_down
		this.mouse_down = false;
		return temp_val

	}
}