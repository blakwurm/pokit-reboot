import { system } from "../../ecs.js";
import { Entity } from "../../entity.js";

window.Pokit.ecs.registerComponent("moveable", {
  speed: 25
});

@system()
class Move {
  public defaultComponent = "moveable";
  public priority = 0;

  async init(entity: Entity) {
    console.log("Init!");
  }

  async update(entity: Entity) {
    //console.log("Wee!");
    entity.rotation +=5;
  }

  async destroy(entity: Entity) {
    console.log("Goodbye!")
  }
}