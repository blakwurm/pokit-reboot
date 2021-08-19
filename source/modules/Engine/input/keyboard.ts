import { handler, module } from "../../../modloader";
import { PokitOS } from "../../../pokit";
import { InputMod } from "./input";

let keycodeToButton = new Map(
  [
    ['KeyA', 'a'],
    ['KeyS', 'b'],
    ['KeyQ', 'x'],
    ['KeyW', 'y'],
    ['Digit1', 'l'],
    ['Digit2', 'r'],
    ['ShiftLeft', 'start'],
    ['ControlLeft', 'select'],
    ['AltLeft', 'opt'],
  ]
)

@module() 
class KeyboardInput {
	constructor(engine: PokitOS) {
		this.engine = engine
	}

	@handler()
	async postLoad() {
		this.inputmap = this.engine.modules.get('input')
		let body = document.body
		body.addEventListener('keydown', this.handleKeyDown)
		body.addEventListener('keyup', this.handleKeyUp)
	}

	handleKeyDown(keyevent: KeyboardEvent) {
		console.log('KeyDown', keyevent.code)
		let button = keycodeToButton.get(keyevent.code)
		if (button) {
			this.inputmap?.set(button, 1)
		}
		console.log(this.inputmap?.entries())
	}

	handleKeyUp(keyevent: KeyboardEvent) {
		console.log('KeyUp', keyevent.code)
		let button = keycodeToButton.get(keyevent.code)
		if (button) {
			this.inputmap?.set(button, 0)
		}
		console.log(this.inputmap?.entries())
	}

	engine: PokitOS
	inputmap?: InputMod
}