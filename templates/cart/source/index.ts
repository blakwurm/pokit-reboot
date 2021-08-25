import { PokitOS, Entity } from '/pokit/pokit';
import { system } from '/pokit/ecs.js';

window.Pokit.ecs.registerComponent("moveable", {
  speed: 0
});

@system()
class Move {
  defaultComponent = "moveable";

  engine: PokitOS;
  input?: Map<string,number>;

  constructor(engine: PokitOS) {
    this.engine = engine;
  }

  init(entity: Entity) {
    this.input = this.engine.modules.get("input") as Map<string,number>;
  }

  update(entity: Entity) {
    let speed = entity.get("moveable").speed as number;
    entity.position.y -= this.input!.get("up")! * speed!;
    entity.position.y += this.input!.get("down")! * speed!;
    entity.position.x -= this.input!.get("left")! * speed!;
    entity.position.x += this.input!.get("right")! * speed!;
  }
}