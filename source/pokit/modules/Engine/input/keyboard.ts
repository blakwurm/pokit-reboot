import { PokitOS } from "../../../pokit.js";
import { InputMod } from "./input.js";

let keycodeToButton = new Map(
  [
    ['KeyJ', 'a'],
    ['KeyK', 'b'],
    ['KeyU', 'x'],
    ['KeyI', 'y'],
    ['ArrowUp', 'up'],
    ['ArrowDown', 'down'],
    ['ArrowLeft', 'left'],
    ['ArrowRight', 'right'],
    ['KeyW', 'up'],
    ['KeyS', 'down'],
    ['KeyA', 'left'],
    ['KeyD', 'right'],
    ['Digit7', 'l'],
    ['Digit8', 'r'],
    ['ShiftLeft', 'start'],
    ['ControlLeft', 'select'],
    ['AltLeft', 'opt'],
  ]
)

let currentPresses: string[] = [];

@worker() 
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
		if (button && currentPresses.indexOf(button) < 0) {
			this.inputmap!.push({key:button,value:1})
			currentPresses.push(button);
		}
	}

	handleKeyUp(keyevent: KeyboardEvent) {
		let button = keycodeToButton.get(keyevent.code)
		if (button) {
			this.inputmap!.push({key:button, value:0})
			currentPresses.splice(currentPresses.indexOf(button), 1)
		}
	}

	engine: PokitOS
	inputmap?: InputMod
}