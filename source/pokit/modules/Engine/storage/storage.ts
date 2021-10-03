import { IJsonTypes, PokitOS } from "../../../pokit"

@api()
export class Settings {
    engine: PokitOS

    constructor(engine:PokitOS) {
        this.engine = engine;
    }

    path(namespace: string) {
        let ns = namespace.endsWith('/') ? namespace : namespace + '/'
        return {
            get: (name: string) => {
                let obj = {value: {} as IJsonTypes, isfolder: false};
                this.engine.modules.callEvent('loadSetting', ns + name, obj);
                if (obj.isfolder) {
                    return this.path(`${ns}/${name}`)
                }
                return obj.value;
            },
            set: (name: string, value: IJsonTypes) => {
                this.engine.modules.callEvent('saveSetting', ns + name, value);
            },
            list: ()=>{
                let arr: string[] = []
                this.engine.modules.callEvent('querySettings', ns, arr);
                return arr;
            },
            getAll: function() {
                let list = this.list()
                let ret: Record<string, any> = {}
                for (let thing of list) {
                    ret[thing] = this.get(thing)
                }
                return ret
            }
        }
    }
}