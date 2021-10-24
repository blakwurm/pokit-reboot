import { CartManifest, EntityStub, SceneStub } from "./cartloader.js";
import { Entity } from "./entity.js";
import { Identity, IdentityProps, IJsonSerializableObject, PokitOS } from "./pokit.js";
import { Scene } from "./scene.js";
import { deepMerge, deepMergeNoConcat } from "./utils.js";

export interface System {
  defaultComponent?: string;
  priority?: number;
  init?(entity: Entity | Entity[]): void;
  update?(entity: Entity | Entity[]): void;
  destroy?(entity: Entity | Entity[]): void;
}

export class ECS extends Map<string, Scene> {
  entityStubs: Map<string, EntityStub>;
  sceneStubs: Map<string, SceneStub>;
  components: Map<string, any>;
  systems: Map<string, System>;

  constructor() {
    super();

    this.entityStubs = new Map<string, EntityStub>();
    this.sceneStubs = new Map<string, SceneStub>();
    this.components = new Map<string, any>();
    this.systems = new Map<string, System>();

    this.set("__default__", new Scene(this, undefined, {id: "__default__"}));
    this.set("__persistent__", new Scene(this, undefined, {id: "__persistent__"}));
  }

  async callEvent(evt: string) {
    for(let [,v] of this) {
      await v.callEvent(evt);
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

  async getSubscriptions(component: string): Promise<Set<Entity>> {
    let subscriptions = new Set<Entity>();
    for(let [,scene] of this) {
      let subs = scene.subscriptions.get(component) || [];
      for(let entity of subs) {
        if(!subscriptions.has(entity)) subscriptions.add(entity);
      }
    }
    return subscriptions;
  }

  async resolveLineage(stub: string, cart: CartManifest) {
    let order = [stub]
    let obj = cart.entities[stub];

    for(let inherit of obj.inherits){
      order.push(...await this.resolveLineage(inherit, cart))
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

  public async loadScene(name: string, pos?: IdentityProps) {
    let sStub = this.sceneStubs.get(name)!;
    let scene = new Scene(this, sStub.systems, pos);
    for (let e in sStub.entities) {
      let eStub = this.entityStubs.get(e)!;
      for(let i in sStub.entities[e]) {
        this.makeEntity(sStub.entities[e][i], eStub, scene);
      }
    }
    await scene.resolveLineage();
    scene.sortSystems();
    return scene;
  }

  async makeEntity(ovr: IdentityProps, stub: EntityStub, scene?: Scene) {
    let persistent = ovr.persistent || (stub.components["identity"] as IdentityProps)?.persistent;
    scene = persistent ? this.get("__persistent__")! : scene || this.get("__default__")!;
    let ident = stub.components["identity"] || {} as Identity;
    let lident = <Identity>deepMerge(ident, ovr);
    let entity = scene.makeEntity(lident);
    if(stub.children) await this.makeChildren(entity, stub, scene);
    for(let c in stub.components) {
      if(c == 'identity') continue;
      entity.set(c, stub.components[c]);
    }
  }

  async makeChildren(e: Entity, stub: EntityStub, scene: Scene) {
    for(let [s,instances] of Object.entries(stub.children!)) {
      for(let instance of instances) {
        instance.parent = e.id;
        await this.makeEntity(instance, this.entityStubs.get(s)!, scene);
      }
    }
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
    for(let [,v] of this) {
      v.sortSystems();
    }
  }
}
