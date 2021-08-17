import main from "./init.js";
import { PokitOS } from "./pokit.js";

export class ModLoader extends Map<string, Object>{
  cartPath = "";
  handlers: Map<string, any[]>;

  constructor() {
    super();
    this.handlers = new Map<string, Function[]>();
  }

  get<T>(name:string): T {
    return <T>super.get(name);
  }

  registerEvent(evt: string, handler: Function) {
    if(!this.handlers.has(evt)) this.handlers.set(evt, []);
    this.handlers.get(evt)!.push(handler);
  }
  
  async callEvent(evt: string, ...args: any[]) {
    if(this.handlers.has(evt)) {
      for(let handler of this.handlers.get(evt)!) {
        await handler(...args);
      }
    }
  }

  async loadModules(cartPath: string, uris: string[]) {
    this.cartPath = cartPath;
    let tasks = uris.map((uri)=>this.loadSingle(uri));
    return new Promise<void>(async (resolve)=>{
      for(let task of tasks) await task;
      await this.callEvent("postLoad");
      resolve();
    });
  }

  private async loadSingle(uri: string) {
    let path = this.getPath(uri);
    await import(path);
  }

  private getPath(uri: string) {
    if(uri.startsWith("@")) {
      let tokens = uri.substr(1).split(":");
      return this.resolveModule(tokens[0], tokens[1]);
    }

    return this.cartPath+"/modules/"+uri+"/main.js";
  }

  private resolveModule(provider: string, module: string) {
    let path = "";
    switch(provider.toLowerCase()) {
      case "pokit":
        return "./modules/"+module+"/main.js";
    }
    return path;
  }
}

interface ModuleConstructor {
  new(engine: PokitOS): Object;
}

interface Anon {
  [key: string]: any;
}

export function module() {
  return function(ctr: ModuleConstructor) {
    let inst = new ctr(window.Pokit);
    if(ctr.prototype.__pokitevents) {
      for(let evt in ctr.prototype.__pokitevents) {
        let func = ctr.prototype.__pokitevents[evt].bind(inst);
        window.Pokit.modules.registerEvent(evt, func);
      }
    }
  }
}

export function api(name?: string) {
  return function(ctr: ModuleConstructor) {
    name = name || ctr.name;
    let inst = new ctr(window.Pokit);
    window.Pokit.modules.set(name, inst);
    if(ctr.prototype.__pokitevents) {
      for(let evt in ctr.prototype.__pokitevents) {
        let func = ctr.prototype.__pokitevents[evt].bind(inst);
        window.Pokit.modules.registerEvent(evt, func);
      }
    }
  }
}

export function handler(name?: string) {
  return function(target: any, propertyName: string, descriptor: TypedPropertyDescriptor<(...args:any[])=>Promise<void>>) {
    name = name || propertyName;
    let proto = target.constructor.prototype;
    if(!proto.__pokitevents) proto.__pokitevents = {};
    (<Anon>proto.__pokitevents)[name] = target[propertyName];
  }
}