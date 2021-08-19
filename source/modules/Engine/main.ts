import { ECS } from "../../ecs.js";
import { handler, module } from "../../modloader.js";
import { PokitOS } from "../../pokit.js";
import "./input/input.js"
import "./input/keyboard.js"

@module()
class Engine {
  engine: PokitOS;
  ecs: ECS;

  constructor(engine: PokitOS) {
    this.engine = engine;
    this.ecs = engine.ecs;
  }

  @handler()
  async postLoad() {
    this.ecs.registerComponent("sprite", {
      palette: 0,
      currentFrame: 0,
      frames: [{x: 0, y: 0}]
    });
    this.ecs.registerComponent("rendered", {
      visible: true
    })
    this.ecs.registerComponent("tilemap", {
      width: 0,
      tilewidth: 0,
      tileheight: 0,
      tilelayers: []
    });
    this.ecs.registerComponent("camera", {
      isMainCamera: false
    })
  }
}