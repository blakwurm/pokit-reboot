import { system } from "../../ecs.js";
import { Entity } from "../../entity.js";

window.Pokit.ecs.registerComponent("moveable", {
  speed: 25
});

@system()
class Move {
  public defaultComponent = "moveable";
  public priority = 0;

  async update(entity: Entity) {
    console.log("Wee!");
  }
}