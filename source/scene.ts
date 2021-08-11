import { Entity } from "./entity";

export class Scene {
  entities: Entity[];
  constructor() {
    this.entities = [];
  }
}