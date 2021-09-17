import { system } from "../../ecs.js";
import { Entity } from "../../entity.js";
import { Identity, PokitOS } from "../../pokit.js";

window.Pokit.ecs.registerComponent("moveable", {
  speed: 25
});

@system()
class Move {
  public defaultComponent = "moveable";
  public priority = 0;

  engine: PokitOS;
  input?: Map<string,number>;

  constructor(engine: PokitOS) {
    this.engine = engine;
  }

  async init(entity: Entity) {
    console.log("Init!");
    this.input = this.engine.modules.get("input");
  }

  async update(entity: Entity) {
    let move = entity.get("moveable");
    if(this.input!.get("up")) entity.position.y -= move.speed;
    if(this.input!.get("down")) entity.position.y += move.speed;
    if(this.input!.get("left")) entity.position.x -= move.speed;
    if(this.input!.get("right")) entity.position.x += move.speed;
  }

  async onCollisionEnter() {
    console.log("enter");
  }

  async onCollisionExit() {
    console.log("exit");
  }

  async destroy(entity: Entity) {
    console.log("Goodbye!")
  }
}