import { ECS } from "../../ecs.js";
import { handler, module } from "../../modloader.js";
import { PokitOS } from "../../pokit.js";
import { VectorZero } from "../../utils.js";
import "./input/input.js"
import "./input/keyboard.js"
import "./input/gamepad.js"

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
      currentAnimation: "idle",
      source: {x:0,y:0},
      animations: {
        "idle":[{x:0,y:0}]
      }
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
    });
    this.ecs.registerComponent("rigidBody", {
      resolveCollisions: true,
      gravity: 5,
      density: 9001,
      terminal: {
        x: 30,
        y: 40
      },
      friction: {
        x: 5,
        y: 0
      },
      vector: VectorZero(),
      impulse: VectorZero()
    });
    let collider = {
      blockNorth: true,
      blockEast: true,
      blockSouth: true,
      blockWest: true
    }
    this.ecs.registerComponent("staticCollider", collider);
    this.ecs.registerComponent("dynamicCollider", collider);
  }
}