import { api, handler, module } from "../../../modloader.js";
import { PokitOS } from "../../../pokit.js";
import { clamp, expandGpIndex } from "../../../utils.js";
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

/* 4 most significant bits of axis/button index are the gamepad selection */

interface GamepadMapping {
    gamepads?: string[],
    deadzone: number,
    axes: Record<number, [string, string]>;
    hatSwitches: Record<number, string[][]>,
    buttons: Record<number,string>;
}

const GAMEPAD_0 = 0 << 28;
const GAMEPAD_1 = 1 << 28;
const GAMEPAD_2 = 2 << 28;
const GAMEPAD_3 = 3 << 28;
const GAMEPAD_4 = 4 << 28;
const GAMEPAD_5 = 5 << 28;
const GAMEPAD_6 = 6 << 28;
const GAMEPAD_7 = 7 << 28;
const GAMEPAD_8 = 8 << 28;
const GAMEPAD_9 = 9 << 28;
const GAMEPAD_10 = 10 << 28;
const GAMEPAD_11 = 11 << 28;
const GAMEPAD_12 = 12 << 28;
const GAMEPAD_13 = 13 << 28;
const GAMEPAD_14 = 14 << 28;
const GAMEPAD_15 = 15 << 28;

let gamepadInput: GamepadInput;

@api()
class GamepadMappings extends Map<string, GamepadMapping>  {
    gamepads: string[] = [];
    private _mapping = "standard";
    private timestamp = 0;
    constructor(engine: PokitOS){
        super();

        this.set("standard", {
            deadzone: .01,
            axes: {
                0: ["right","left"],
                1: ["down","up"],
            },
            hatSwitches:{},
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

        this.set("switchpro", {
            deadzone: .01,
            axes: {
                0: ["right","left"],
                1: ["down","up"],
            },
            hatSwitches:{
                9: [["up"],["up","right"],["right"],["down","right"],["down"],["down","left"],["left"],["up","left"]]
            },
            buttons: {
                0: "x",
                1: "a",
                2: "b",
                3: "y",
                4: "l",
                5: "r",
                6: "l",
                7: "r",
                8: "select",
                9: "start",
                12: "opt",
                13: "opt",
            }
        })
    }

    setMapping(name: string) {
        this._mapping = name;
    }

    get mapping() {
        return this.get(this._mapping)!;
    }

    get connectedGamepads() {
        return gamepadInput.gamepads.keys();
    }

    get pendingChanges() {
        let sum = 0;
        let gamepads = navigator.getGamepads();
        this.gamepads.forEach((x)=>{
            let gpo = gamepadInput.gamepads.get(x)!;
            let gp = gamepads[gpo.index]!;
            sum += gp.timestamp;
        })
        if(sum != this.timestamp) {
            this.timestamp = sum;
            return true;
        }
        return false;
    }
}

@module() 
class GamepadInput {
	constructor(engine: PokitOS) {
		this.engine = engine

        window.addEventListener('gamepadconnected', (e) => {
            console.log(`Gamepad connected.`, e.gamepad)
            let mapid = `${e.gamepad.id} (Index: ${e.gamepad.index})`
            this.gamepads.set(mapid, e.gamepad)
        })

        window.addEventListener('gamepaddisconnected', (e) => {
            let mapid = `${e.gamepad.id} (Index: ${e.gamepad.index})`
            let i = this.mappings!.gamepads.indexOf(mapid);
            this.gamepads.delete(mapid)
            if(i != -1) {
                this.mappings!.gamepads.splice(i,1);
            }
        })

        gamepadInput = this;
	}

	@handler()
	async postLoad() {
		this.inputmap = this.engine.modules.get('input');
        this.mappings = this.engine.modules.get('GamepadMappings');
	}

    getPad(i: number): [Gamepad, number] {
        let[gp,index] = expandGpIndex(i);
        let key = this.mappings!.gamepads[gp];
        let g = this.gamepads.get(key);
        return [navigator.getGamepads()[g!.index]!, index];
    }

    getAxis(i: number) {
        let [gp,index] = this.getPad(i);
        return gp.axes[index];
    }
    
    getButton(i: number) {
        let [gp,index] = this.getPad(i);
        return gp.buttons[index].value;
    }

    getHatSwitchQueue(n: number, map: string[][]) {
        let q: {key:string, value:number}[] = [];
        let v = -1;
        if(n != 0 && Math.abs(n) <= 1) {
            let na = map.length -1;
            v = Math.round((n+1)/2*na);
        }
        for(let i in map) {
            let value = 0;
            if(parseInt(i)===v) value = 1;
            for(let s of map[i]) q.push({key:s, value})
        }

        return q;
    }

    @handler()
    async preUpdate() {
        if(this.mappings!.gamepads.length < 1) return;
        if(!this.mappings!.pendingChanges) return;

        let q: {key: string, value: number}[] = [];
        let o = new Map<string,number>();
        let m = this.mappings!.mapping;

        for(let [i,[p,n]] of Object.entries(m.axes)){
            let v = this.getAxis(parseInt(i));
            v = Math.abs(v) >= m.deadzone ? v : 0;

            let pv = clamp(v, 0,1);
            let nv = -clamp(v, -1, 0);

            q.push({key: p, value: pv});
            q.push({key: n, value: nv});
        }
        for(let [i,k] of Object.entries(m.buttons)) {
            let v = this.getButton(parseInt(i));
            v = Math.abs(v) >= m.deadzone ? v : 0;
            q.push({key:k, value:v});
        }
        for(let [i,map] of Object.entries(m.hatSwitches)) {
            let v = this.getAxis(parseInt(i))
            let arr = this.getHatSwitchQueue(v, map);
            q.push(...arr);
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
    gamepads = new Map<string, Gamepad>()
    mappings?: GamepadMappings;
}