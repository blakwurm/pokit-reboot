import { ECS } from "./ecs.js";
import { Entity } from "./entity.js";
import { Identity, IJsonSerializableObject, Vector } from "./pokit.js";
import { deepMergeNoConcat, defaultParent, uuid, VectorOne, VectorZero } from "./utils.js";

export class Scene implements Identity{
  subscriptions: Map<string, Set<Entity>>;
  entities: Map<string, Entity>;
  systems?: string[];
  ecs: ECS;
  
  id: string;
  parent?: string | Identity | undefined;
  bounds: Vector;
  position: Vector;
  z: number;
  depth: number;
  scale: Vector;
  rotation: number;

  constructor(ecs: ECS, systems?: string[], pos?: Identity) {
    this.subscriptions = new Map<string, Set<Entity>>();
    this.entities = new Map<string, Entity>();
    this.systems = systems;
    this.ecs = ecs;

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
      if(this.ecs.scene == this) {
        this.ecs.callEventSingle("init", entity, component);
      }
    }
  }

  unsubcribeEntity(component: string, entity: Entity) {
    let e = this.subscriptions.get(component)!;
    e.delete(entity);

    if(e.size < 1) this.subscriptions.delete(component);

    this.ecs.callEventSingle("destroy", entity, component);
  }

  makeEntity(ident: Identity) {
    let e = new Entity(ident, this);
    this.entities.set(e.id, e);
    if(this.ecs.scene == this) {
      this.ecs.callEventSingle("init", e);
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
}