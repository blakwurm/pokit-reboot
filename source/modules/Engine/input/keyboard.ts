import { handler, module } from "../../../modloader";
import { PokitOS } from "../../../pokit";
import { InputMod } from "./input";

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
	}

	handleKeyUp(keyevent: KeyboardEvent) {
		console.log('KeyUp', keyevent.code)
	}

	engine: PokitOS
	inputmap?: InputMod
}