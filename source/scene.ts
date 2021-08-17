import { ECS } from "./ecs.js";
import { Entity } from "./entity.js";
import { Identity, IJsonSerializableObject } from "./pokit.js";

export class Scene {
  subscriptions: Map<string, Set<Entity>>;
  entities: Map<string, Entity>;
  ecs: ECS;


  constructor(ecs: ECS) {
    this.subscriptions = new Map<string, Set<Entity>>();
    this.entities = new Map<string, Entity>();
    this.ecs = ecs;
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

  makeEntity(ident: Identity) {
    let e = new Entity(ident, this);
    this.entities.set(e.id, e);
    return e;
  }
}