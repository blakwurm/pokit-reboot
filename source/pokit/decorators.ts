import { System } from "./ecs";
import { PokitOS } from "./pokit";

declare global {
  function worker(): (ctr: ModuleConstructor)=>any;
  function api(name?: string): (ctr: ModuleConstructor)=>any;
  function handler(name?: string): (target: any, propertyName: string, descriptor: TypedPropertyDescriptor<(...args:any[])=>Promise<void>>)=>any;
  function system(name?: string): (ctr: SystemConstructor)=>any;
}

interface ModuleConstructor {
  new(engine: PokitOS): Object;
}

interface Anon {
  [key: string]: any;
}

window.worker = function () {
  return function(ctr: ModuleConstructor) {
    let inst = new ctr(Pokit);
    if(ctr.prototype.__pokitevents) {
      for(let evt in ctr.prototype.__pokitevents) {
        let func = ctr.prototype.__pokitevents[evt].bind(inst);
        Pokit.modules.registerEvent(evt, func);
      }
    }
  }
}

window.api = function (name?: string) {
  return function(ctr: ModuleConstructor) {
    name = name || ctr.name;
    let inst = new ctr(Pokit);
    Pokit.modules.set(name, inst);
    if(ctr.prototype.__pokitevents) {
      for(let evt in ctr.prototype.__pokitevents) {
        let func = ctr.prototype.__pokitevents[evt].bind(inst);
        Pokit.modules.registerEvent(evt, func);
      }
    }
  }
}

window.handler = function (name?: string) {
  return function(target: any, propertyName: string, descriptor: TypedPropertyDescriptor<(...args:any[])=>Promise<void>>) {
    name = name || propertyName;
    let proto = target.constructor.prototype;
    if(!proto.__pokitevents) proto.__pokitevents = {};
    (<Anon>proto.__pokitevents)[name] = target[propertyName];
  }
}

interface SystemConstructor {
  new(engine: PokitOS): System;
}

window.system = function (name?: string) {
  return function(ctr: SystemConstructor) {
    name = name || ctr.name;
    Pokit.ecs.registerSystem(name, new ctr(Pokit));
  }
}