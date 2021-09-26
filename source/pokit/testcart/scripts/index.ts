import { system } from "../../ecs.js";
import { Entity } from "../../entity.js";
import { InputMod } from "../../modules/Engine/input/input.js";
import { Identity, PokitOS } from "../../pokit.js";

window.Pokit.ecs.registerComponent("moveable", {
  speed: 25
});

@system()
class Move {
  public defaultComponent = "moveable";
  public priority = 0;

  engine: PokitOS;
  input?: InputMod;

  constructor(engine: PokitOS) {
    this.engine = engine;
  }

  async init(entity: Entity) {
    console.log("Init!");
    this.input = this.engine.modules.get("input");
  }

  async update(entity: Entity) {
    let move = entity.get("moveable");
    let [left,right,up,down] = this.input!.getMany("left", "right", "up", "down");
    let state = entity.get("rigidBody");

    state.impulse = {
      x: (left*-move.speed) + (right*move.speed),
      y: (up*-move.speed) + (down*move.speed)
    }

    if(this.input!.get("x"))console.log("x");
  }

  async destroy(entity: Entity) {
    console.log("Goodbye!")
  }
}