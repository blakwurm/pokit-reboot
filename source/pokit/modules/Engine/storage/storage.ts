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
                let obj = {value: {} as IJsonTypes};
                this.engine.modules.callEvent('loadSetting', ns + name, obj);
                return obj.value;
            },
            set: (name: string, value: IJsonTypes) => {
                this.engine.modules.callEvent('saveSetting', ns + name, value);
            },
            list: ()=>{
                let arr: string[] = []
                this.engine.modules.callEvent('querySettings', ns, arr);
                return arr;
            }
        }
    }
}