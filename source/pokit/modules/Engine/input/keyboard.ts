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
		body.addEventListener('keydown', this.handleKeyDown.bind(this))
		body.addEventListener('keyup', this.handleKeyUp.bind(this))
	}

	handleKeyDown(keyevent: KeyboardEvent) {
		let button = keycodeToButton.get(keyevent.code)
		if (button) {
			this.inputmap!.set(button, 1)
		}
	}

	handleKeyUp(keyevent: KeyboardEvent) {
		let button = keycodeToButton.get(keyevent.code)
		if (button) {
			this.inputmap!.set(button, 0)
		}
	}

	engine: PokitOS
	inputmap?: InputMod
}