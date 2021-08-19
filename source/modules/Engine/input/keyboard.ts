import { handler, module } from "../../../modloader.js";
import { PokitOS } from "../../../pokit.js";
import { InputMod } from "./input.js";

let keycodeToButton = new Map(
  [
    ['KeyA', 'a'],
    ['KeyS', 'b'],
    ['KeyQ', 'x'],
    ['KeyW', 'y'],
    ['ArrowUp', 'up'],
    ['ArrowDown', 'down'],
    ['ArrowLeft', 'left'],
    ['ArrowRight', 'right'],
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
		body.addEventListener('keydown', (e) => this.handleKeyDown(e))
		body.addEventListener('keyup', (e) => this.handleKeyUp(e))
	}

	handleKeyDown(keyevent: KeyboardEvent) {
		console.log('KeyDown', keyevent.code)
		let button = keycodeToButton.get(keyevent.code)
		console.log(button)
		if (button) {
			this.inputmap!.set(button, 1)
		}
		console.log(this.inputmap!.entries())
	}

	handleKeyUp(keyevent: KeyboardEvent) {
		console.log('KeyUp', keyevent.code)
		let button = keycodeToButton.get(keyevent.code)
		console.log(button)
		if (button) {
			this.inputmap!.set(button, 0)
		}
		console.log(this.inputmap!.entries())
	}

	engine: PokitOS
	inputmap?: InputMod
}