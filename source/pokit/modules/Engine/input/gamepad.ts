import { handler, module } from "../../../modloader.js";
import { PokitOS } from "../../../pokit.js";
import { InputMod } from "./input.js";

type GamepadTranslator = (gamepad: Gamepad) => Record<string, number>

let translator_reg = new Map<string, GamepadTranslator>()

translator_reg.set('standard', (gamepad: Gamepad) => {
    let inputs = {}
    return inputs
})

translator_reg.set('switch', (gamepad: Gamepad) => {
    let inputs = {}
    return inputs
})


function load_mappings() {
    let mappings = JSON.parse(localStorage.getItem('gamepad_mappings') || '{}')

    localStorage.setItem('gamepad_mappings', JSON.stringify(mappings))
    return mappings
}

function detect_gamepad_mapping(gamepad: Gamepad) {
    return gamepad.mapping || 'switch'
}

export function start_gamepad_subsystem() {
}


@module() 
class GamepadInput {
	constructor(engine: PokitOS) {
		this.engine = engine
        window.addEventListener('gamepadconnected', (e) => {
            console.log(`Gamepad connected.`, e.gamepad)
            let mapid = `${e.gamepad.id} (Index: ${e.gamepad.index})`
            this.gamepads.set(mapid, e.gamepad)
            if (this.gamepads.size === 1) {
                this.activepad = mapid
            }
        })

        window.addEventListener('gamepaddisconnected', (e) => {
            let mapid = `${e.gamepad.id} (Index: ${e.gamepad.index})`
            this.gamepads.delete(mapid)
            if (this.activepad === mapid) {
                this.activepad = this.gamepads?.keys()?.next()?.value || undefined
            }
        })
	}

	@handler()
	async postLoad() {
		this.inputmap = this.engine.modules.get('input')
	}

    @handler()
    async preUpdate() {
        
    }


	engine: PokitOS
	inputmap?: InputMod
    activepad?: string
    gamepads = new Map<string, Gamepad>()
    mappings = load_mappings()
}