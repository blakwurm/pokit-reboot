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

export interface GamepadMapping {
    gamepads?: string[],
    deadzone: number,
    axes: Record<number, [string, string]>;
    hatSwitches: Record<number, string[][]>,
    buttons: Record<number,string>;
}

export const GAMEPAD_0 = 0 << 28;
export const GAMEPAD_1 = 1 << 28;
export const GAMEPAD_2 = 2 << 28;
export const GAMEPAD_3 = 3 << 28;
export const GAMEPAD_4 = 4 << 28;
export const GAMEPAD_5 = 5 << 28;
export const GAMEPAD_6 = 6 << 28;
export const GAMEPAD_7 = 7 << 28;
export const GAMEPAD_8 = 8 << 28;
export const GAMEPAD_9 = 9 << 28;
export const GAMEPAD_10 = 10 << 28;
export const GAMEPAD_11 = 11 << 28;
export const GAMEPAD_12 = 12 << 28;
export const GAMEPAD_13 = 13 << 28;
export const GAMEPAD_14 = 14 << 28;
export const GAMEPAD_15 = 15 << 28;

let gamepadInput: GamepadInput;

export interface GpInfo {
  title: string
  index: number
  vendor: string
  product: string
  id: string
}

export function getGpInfo(controllerID: string): GpInfo {
    // https://regex101.com/r/wey9T8/1
    let reg = /(?<title>.*?(?= \()) \((?:.*?(?=Vendor:|\)))(?:Vendor: (?<vendor>[a-zA-Z0-9]+))?(?: Product: (?<product>[a-zA-Z0-9]+))?\) \(Index: (?<index>[0-9+])\)/
    let thing = (reg.exec(controllerID) as any)
    let groups = thing.groups
    groups.index = parseInt(groups.index)
    groups.id = controllerID
    return groups
}

@api()
export class GamepadMappings extends Map<string, GamepadMapping>  {
    engine: PokitOS;
    private _mapping = "standard";
    private _gamepads: string[] = [];
    private timestamp = 0;
    constructor(engine: PokitOS){
        super();

        this.engine = engine;

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

        this.set("generic", {
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

        this.set('switch_pro', this.get('generic')!)
    }

    override set(name: string, map: GamepadMapping) {
        super.set(name, map);
        this.engine.modules.callEvent("onGpMapUpdated", name, map);

        return this;
    }

    setMapping(name: string) {
        this._mapping = name;
        this.engine.modules.callEvent("onActiveGpMapChanged", name);
    }

    get mapping() {
        return this.get(this._mapping)!;
    }

    get mappingName() {
        return this._mapping;
    }

    get connectedGamepads() {
        return [...gamepadInput.gamepads.keys()];
    }

    get pendingChanges() {
        let sum = 0;
        let gamepads = navigator.getGamepads();
        this._gamepads.forEach((x)=>{
            let gpo = gamepadInput.gamepads.get(x)!;
            let gp = gamepads[gpo.index]!;
            sum += gp.timestamp;
        })
        if(sum != this.timestamp) {
            this.timestamp = sum;
            let gp = this.gamepads.map((key)=>{
                let old = gamepadInput.gamepads.get(key)!;
                return gamepads[old.index];
            })
            this.engine.modules.callEvent("onGamepadInput", gp);
            return true;
        }
        return false;
    }

    get gamepads() {
        return [...this._gamepads];
    }

    set gamepads(value: string[]) {
        this._gamepads = value;
        this.engine.modules.callEvent("onActiveGpChanged", this.gamepads);
        if(value.length) {
            let gp = gamepadInput.gamepads.get(value[0])!;
            let map = gp.mapping === "standard" ? "standard" : "generic";
            this.setMapping(map);
        }
    }
    getGpInfo = getGpInfo
}

@worker() 
class GamepadInput {
	constructor(engine: PokitOS) {
		this.engine = engine



        window.addEventListener('gamepadconnected', (e) => {
            console.log(`Gamepad connected.`, e.gamepad)
            this.recognize_gamepad(e.gamepad)
            // make engine event
        })


        window.addEventListener('gamepaddisconnected', (e) => {
            let mapid = `${e.gamepad.id} (Index: ${e.gamepad.index})`
            let i = this.mappings!.gamepads.indexOf(mapid);
            this.gamepads.delete(mapid)
            if(i != -1) {
                let keys = this.mappings!.connectedGamepads;
                let set = false;
                let arr = this.mappings!.gamepads;
                for(let k of keys) {
                    if(arr.indexOf(k) === -1) {
                        arr[i] = k;
                        set = true;
                        break;
                    }
                }
                if(!set) arr.splice(i, 1);
                this.mappings!.gamepads = arr;
            }
            this.engine.modules.callEvent('onGpDisconnected', mapid)
        })

        gamepadInput = this;
	}

    recognize_gamepad(gamepad: Gamepad | null) {
            if (gamepad) {
                let mapid = `${gamepad.id} (Index: ${gamepad.index})`
                this.gamepads.set(mapid, gamepad)
                if(this.mappings!.gamepads.length < 1) {
                    let arr = this.mappings!.gamepads;
                    arr.push(mapid);
                    this.mappings!.gamepads = arr;
                    let map = gamepad.mapping === "standard" ? "standard" : "generic";
                    this.mappings!.setMapping(map);
                }
                this.engine.modules.callEvent('onGpConnected', mapid)
            }
    }

	@handler()
	async postLoad() {
		this.inputmap = this.engine.modules.get('input');
        this.mappings = this.engine.modules.get('GamepadMappings');
        // Check to see if there are any gamepads in the system post-load
        let start_gamepads = navigator.getGamepads()
        for (let gamepad of start_gamepads) {
            this.recognize_gamepad(gamepad)
        }
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

    /**
     * 
     * @param n actual input value
     * @param map what convrted input values should be mapped to
     * @returns ur mom
     */
    getHatSwitchQueue(n: number, map: string[][]) {
        // Get some shit, for some fucking reason idk
        // I guess it's a vector?
        // Jordan: Yeah, I just removed all the silent letters from 'queue'
        // Alex: but... it's an array, not a queue
        // Jordan: I..... <facepalm> learn to javascript noob
        let q: {key:string, value:number}[] = [];
        // Yeah because -1 is better then 0
        // But no fr the value starts at -1, not -1, not 43. -1
        let v = -1;
        // This is a loop.
        // haha j/k
        // It's an if statement. If n is within bounds, do shit
        if(n != 0 && Math.abs(n) <= 1) {
            // na na naaaa naaaaa
            // heeey heeey heeeeeeeeeeeeeeeeeeeeeeeeeeey
            // get map.leeeeeength
            let na = map.length -1;
            // If you don't know what Math.round does by now
            // I'm afraid there's no hope for you
            v = Math.round((n+1)/2*na);
            // But like fr, we get it this way so that the -1 to 1 value gets converted
            // into ints between 0 and n
        }
        // NOOOOOOW it's a loop
        for(let i in map) {
            // omg seriously? we set a value to 0. You know this... right?
            let value = 0;
            // parseInt is obvious, but what *isn't* obvious is that we do it because
            // javascript is FUCKING DUMB and converts a number into a string
            // when you use it as a key in an object. Yeah. So stick *that* in your
            // bong and blow it up your ass!
            if(parseInt(i)===v) value = 1;
            // Just serialize the values
            for(let s of map[i]) q.push({key:s, value})
        }

        // I wonder what the fuck this could be
        return q;
    }

    @handler()
    async input() {
        if(this.mappings!.gamepads.length < 1) return;
        if(!this.mappings!.pendingChanges) return;

        let m = this.mappings!.mapping;

        for(let [i,[p,n]] of Object.entries(m.axes)){
            let v = this.getAxis(parseInt(i));
            v = Math.abs(v) >= m.deadzone ? v : 0;

            let pv = clamp(v, 0,1);
            let nv = -clamp(v, -1, 0);

            this.inputmap!.push({key: p, value: pv});
            this.inputmap!.push({key: n, value: nv});
        }
        for(let [i,k] of Object.entries(m.buttons)) {
            let v = this.getButton(parseInt(i));
            v = Math.abs(v) >= m.deadzone ? v : 0;
            this.inputmap!.push({key:k, value:v});
        }
        for(let [i,map] of Object.entries(m.hatSwitches)) {
            let v = this.getAxis(parseInt(i))
            let arr = this.getHatSwitchQueue(v, map);
            this.inputmap!.push(...arr);
        }
    }


	engine: PokitOS
	inputmap?: InputMod
    gamepads = new Map<string, Gamepad>()
    mappings?: GamepadMappings;
}