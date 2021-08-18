import { CartManifest, EntityStub, SceneStub } from "./cartloader.js";
import { Entity } from "./entity.js";
import { Identity, IJsonSerializableObject, PokitOS } from "./pokit.js";
import { Scene } from "./scene.js";
import { deepMerge, deepMergeNoConcat } from "./utils.js";

export interface System {
  defaultComponent?: string;
  priority?: number;
  init?(entity: Entity | Entity[]): void;
  update?(entity: Entity | Entity[]): void;
  destroy?(entity: Entity | Entity[]): void;
}

export class ECS {
  entityStubs: Map<string, EntityStub>;
  sceneStubs: Map<string, SceneStub>;
  components: Map<string, any>;
  systems: Map<string, System>;
  sorted: System[];
  scene: Scene;

  constructor() {
    this.entityStubs = new Map<string, EntityStub>();
    this.sceneStubs = new Map<string, SceneStub>();
    this.components = new Map<string, any>();
    this.systems = new Map<string, System>();
    this.scene = new Scene(this);
    this.sorted = [];
  }

  async callEvent(evt: string) {
    for(let sys of this.sorted) {
      if(!(<any>sys)[evt]) continue;
      if(sys.defaultComponent) {
        let arr = [...this.scene.subscriptions.get(sys.defaultComponent)!];
        for(let e of arr) {
          await (<any>sys)[evt](e);
        }
        continue;
      }
      let arr = [...this.scene.entities.values()];
      await (<any>sys)[evt](arr);
    }
  }

  async callEventSingle(evt: string, e: Entity, component?: string) {
    let sorted = component ? this.sorted.filter((x)=> {
      x.defaultComponent==component 
    }) : this.sorted;

    for(let sys of sorted) {
      if(!(<any>sys)[evt]) continue;
      if(sys.defaultComponent && e.has(sys.defaultComponent)) {
        await (<any>sys)[evt](e);
        continue;
      }
      await (<any>sys)[evt]([e]);
    }
  }

  public async loadStubs(cart: CartManifest) {
    for (let stub in cart.entities) {
      let lineage = await this.resolveLineage(stub, cart);
      this.entityStubs.set(stub, await this.applyInheritance(lineage, cart))
    }

    for (let stub in cart.scenes) {
      this.sceneStubs.set(stub, cart.scenes[stub]);
    }
  }

  async resolveLineage(stub: string, cart: CartManifest) {
    let order = [stub]
    let obj = cart.entities[stub];

    for(let inherit of obj.inherits){
      order.concat(...await this.resolveLineage(inherit, cart))
    }

    return order;
  }

  async applyInheritance(lineage: string[], cart: CartManifest) {
    let base = {};
    while(lineage.length) {
      let stub = cart.entities[lineage.pop()!];
      base = deepMergeNoConcat(base, stub)
    }
    return base as EntityStub;
  }

  public async loadScene(name: string) {
    let sStub = this.sceneStubs.get(name)!;
    let scene = new Scene(this, sStub.systems);
    for (let e in sStub.entities) {
      let eStub = this.entityStubs.get(e)!;
      let ident = eStub.components["identity"] || {} as Identity;
      ident = <Identity>deepMerge(ident, sStub.entities[e]);
      let entity = scene.makeEntity(ident);
      for(let c in eStub.components) {
        if(c == 'identity') continue;
        entity.set(c, eStub.components[c]);
      }
    }
    return scene;
  }

  public async transition(scene: Scene) {
    await this.callEvent("destroy");
    this.scene = scene;
    this.sortSystems();
    await this.callEvent("init");
  }

  public registerSystem(name: string, system: System) {
    if(!system.priority)system.priority = 0;
    this.systems.set(name, system);
    this.sortSystems();
  }

  public registerComponent(name: string, component: any) {
    this.components.set(name, component);
  }

  public sortSystems() {
    this.sorted = [];
    if(this.scene.systems) {
      let systems = this.systems;
      this.sorted = this.scene.systems.map(s=>systems.get(s)!);
    }
    for(let [k,v] of this.systems) {
      if(this.scene.subscriptions.has(k) ||! v.defaultComponent) {
        this.sorted.push(v);
      }
    }
    this.sorted.sort((a, b) => b.priority! - a.priority!);
  }
}

interface SystemConstructor {
  new(engine: PokitOS): System;
}

export function system(name?: string) {
  return function(ctr: SystemConstructor) {
    name = name || ctr.name;
    window.Pokit.ecs.registerSystem(name, new ctr(window.Pokit));
  }
}