import { api, handler, module } from "../../../modloader.js";
import { PokitOS } from "../../../pokit.js";
import { clamp } from "../../../utils.js";
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

interface GamepadMapping {
    axes: Record<number, [string, string]>;
    deadzone: number,
    buttons: Record<number,string>;
}

@api()
class GamepadMappings extends Map<string, GamepadMapping>  {
    constructor(engine: PokitOS){
        super();

        this.set("standard", {
            axes: {
                0: ["right","left"],
                1: ["down","up"],
            },
            deadzone: .01,
            buttons: {
                0: "a",
                1: "b",
                2: "x",
                3: "y",
                4: "l",
                5: "r",
                6: "l",
                7: "r",
                8: "select",
                9: "start",
                12: "up",
                13: "down",
                14: "left",
                15: "right",
                16: "opt"
            }
        });
    }
}

@module() 
class GamepadInput {
	constructor(engine: PokitOS) {
		this.engine = engine
        this.timestamp = 0;
        window.addEventListener('gamepadconnected', (e) => {
            console.log(`Gamepad connected.`, e.gamepad)
            let mapid = `${e.gamepad.id} (Index: ${e.gamepad.index})`
            this.gamepads.set(mapid, e.gamepad)
            this.activepad = mapid;
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
		this.inputmap = this.engine.modules.get('input');
        this.mappings = this.engine.modules.get('GamepadMappings');
	}

    @handler()
    async preUpdate() {
        let go = this.gamepads.get(this.activepad!);
        if(!go) return;
        let g = navigator.getGamepads()![go.index]!;
        if(g.timestamp === this.timestamp) return;
        this.timestamp = g.timestamp;

        let q: {key: string, value: number}[] = [];
        let o = new Map<string,number>();
        let m = this.mappings!.get(g.mapping)!;

        for(let [i,[p,n]] of Object.entries(m.axes)){
            let v = g.axes[parseInt(i)];
            v = Math.abs(v) >= m.deadzone ? v : 0;

            let pv = clamp(v, 0,1);
            let nv = -clamp(v, -1, 0);

            q.push({key: p, value: pv});
            q.push({key: n, value: nv});
        }
        for(let [i,k] of Object.entries(m.buttons)) {
            let v = g.buttons[parseInt(i)].value;
            v = Math.abs(v) >= m.deadzone ? v : 0;
            q.push({key:k, value:v});
        }
        for(let e of q) {
            let v = o.get(e.key) || e.value;
            if(e.value >= v) o.set(e.key, e.value);
        }
        for(let [k,v] of o) {
            this.inputmap!.set(k, v);
        }
    }


	engine: PokitOS
	inputmap?: InputMod
    activepad?: string
    gamepads = new Map<string, Gamepad>()
    mappings?: GamepadMappings;
    timestamp: number;
}