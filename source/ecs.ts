import { Entity } from "./entity.js";
import { Scene } from "./scene.js";

export interface System {
  defaultComponent?: string;
  priority?: number;
  init?(entity: Entity): void;
  init?(entities: Entity[]): void;
  update?(entity: Entity): void;
  update?(entities: Entity[]): void;
  destroy?(entity: Entity): void;
  destroy?(entities: Entity[]): void;
}

export class ECS {
  components: Map<string, any>;
  systems: Map<string, System>;
  sorted: System[];
  scene: Scene;

  constructor() {
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
    for(let [k,v] of this.systems) {
      if(this.scene.subscriptions.has(k) ||! v.defaultComponent) {
        this.sorted.push(v);
      }
    }
    this.sorted.sort((a, b) => b.priority! - a.priority!);
  }
}