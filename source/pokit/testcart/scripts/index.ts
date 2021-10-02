import { Entity } from "../../entity.js";
import { Logger, PokitDebug } from "../../modules/Debug/main.js";
import { InputMod } from "../../modules/Engine/input/input.js";
import { Identity, PokitOS } from "../../pokit.js";

Pokit.ecs.registerComponent("moveable", {
  speed: 25
});

@system()
class Move {
  public defaultComponent = "moveable";
  public priority = 0;

  engine: PokitOS;
  input?: InputMod;
  logger?: Logger;

  constructor(engine: PokitOS) {
    this.engine = engine;
  }

  async init(entity: Entity) {
    console.log("Init!");
    this.input = this.engine.modules.get("input");
    this.logger = (this.engine.modules.get("Debug") as PokitDebug).makeLogger();
  }

  async update(entity: Entity) {
    let move = entity.get("moveable");
    let [left,right,up,down] = this.input!.getMany("left", "right", "up", "down");
    let state = entity.get("rigidBody");

    state.impulse = {
      x: (left*-move.speed) + (right*move.speed),
      y: (up*-move.speed) + (down*move.speed)
    }

    if(this.input!.get("x"))this.logger!.Info("x");
  }

  async destroy(entity: Entity) {
    console.log("Goodbye!")
  }
}