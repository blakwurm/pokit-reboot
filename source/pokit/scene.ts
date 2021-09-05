import { ECS, System } from "./ecs.js";
import { Entity } from "./entity.js";
import { Identity, IdentityProps, Vector } from "./pokit.js";
import { deepMergeNoConcat, uuid, VectorOne, VectorZero } from "./utils.js";

export class Scene implements Identity{
  subscriptions: Map<string, Set<Entity>>;
  entities: Map<string, Entity>;
  systems?: string[];
  ecs: ECS;
  sorted: System[];
  
  id: string;
  parent?: string | Identity | undefined;
  bounds: Vector;
  position: Vector;
  z: number;
  depth: number;
  scale: Vector;
  rotation: number;

  constructor(ecs: ECS, systems?: string[], pos?: IdentityProps) {
    this.subscriptions = new Map<string, Set<Entity>>();
    this.entities = new Map<string, Entity>();
    this.systems = systems;
    this.ecs = ecs;
    this.sorted = [];

    this.id = uuid();
    this.bounds = VectorOne();
    this.position = VectorZero();
    this.z = 0;
    this.depth = 0;
    this.scale = VectorOne();
    this.rotation = 0;

    let o = deepMergeNoConcat(this, pos);
    Object.assign(this, o);
  }

  get globalPosition() {
    return this.position;
  }

  set globalPosition(value: Vector) {
    this.position = value;
  }

  get globalScale() {
    return this.scale;
  }

  set globalScale(value: Vector) {
    this.scale = value;
  }

  get globalRotation() {
    return this.rotation;
  }

  set globalRotation(value: number) {
    this.rotation = value;
  }

  subscribeEntity(component: string, entity: Entity) {
    if(!this.subscriptions.has(component)) {
      this.subscriptions.set(component, new Set<Entity>())
    }

    let e = this.subscriptions.get(component)!;
    if(!e.has(entity)) {
      e.add(entity)
      if(this.ecs.has(this.id)) {
        this.callEventSingle("init", entity, component);
      }
    }
  }

  unsubcribeEntity(component: string, entity: Entity) {
    let e = this.subscriptions.get(component)!;
    e.delete(entity);

    if(e.size < 1) this.subscriptions.delete(component);

    this.callEventSingle("destroy", entity, component);
  }

  makeEntity(ident: Identity) {
    let e = new Entity(ident, this);
    this.entities.set(e.id, e);
    if(this.ecs.has(this.id)) {
      this.callEventSingle("init", e);
    }
    return e;
  }

  async resolveLineage() {
    for(let [,v] of this.entities){
      if(typeof v.parent == "string") {
        v.parent = this.entities.get(v.parent);
      }
    }
  }

  async callEvent(evt: string) {
    for(let sys of this.sorted) {
      if(!(<any>sys)[evt]) continue;
      if(sys.defaultComponent) {
        if(!this.subscriptions.has(sys.defaultComponent)) continue;
        let arr = [...this.subscriptions.get(sys.defaultComponent)!];
        for(let e of arr) {
          await (<any>sys)[evt](e);
        }
        continue;
      }
      let arr = [...this.entities.values()];
      await (<any>sys)[evt](arr);
    }
  }

  async callEventSingle(evt: string, e: Entity, component?: string) {
    let sorted = this.sorted.filter((x)=> {
      return x.defaultComponent==component 
    });

    let a = component ? e : [e];
    for(let sys of sorted) {
      if(!(<any>sys)[evt]) continue;
      await (<any>sys)[evt](a);
    }
  }

  public async activate() {
    this.ecs.set(this.id, this);
    await this.callEvent("init");
  }

  public async destroy() {
    await this.callEvent("destroy");
    this.ecs.delete(this.id);
  }

  public sortSystems() {
    this.sorted = [];
    if(this.systems) {
      let systems = this.ecs.systems;
      this.sorted = this.systems.map(s=>systems.get(s)!);
    }
    for(let [k,v] of this.ecs.systems) {
      if(this.subscriptions.has(k) ||! v.defaultComponent) {
        this.sorted.push(v);
      }
    }
    this.sorted.sort((a, b) => b.priority! - a.priority!);
  }
}