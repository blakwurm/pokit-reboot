import { system } from "../../ecs.js";
import { Entity } from "../../entity.js";
import { handler, module } from "../../modloader.js";
import { PokitOS, Vector } from "../../pokit.js";
import { uuid } from "../../utils.js";
import * as gl from "./backend/opengl.js";

@module()
class Jewls {
  engine: PokitOS;

  constructor(engine: PokitOS) {
    this.engine = engine;
  }

  @handler()
  async postLoad() {
    await gl.initContext(this.engine.canvas);
    //gl.createCamera('main', 320, 320, true, 255, 255, 255, 255);
    this.engine.ecs.registerComponent("debug", {
      color: [255, 0, 0, 255]
    })
  }

  @handler()
  async render() {
    gl.render();
  }
}

@system()
class Renderer {
  defaultComponent = "rendered";

  async init(entity: Entity) {
    gl.createActor(entity.id, "tiles", entity.bounds.x, entity.bounds.y)
  }

  async update(entity: Entity) {
    let sprite = entity.get("sprite");
    let coords: Vector = sprite.frames[sprite.currentFrame];

    gl.setActorSprite(entity.id, coords.x, coords.y, 0, [1,0,1,1]);
    gl.translateActor(entity.id, entity.position.x, entity.position.y);
    gl.rotateActor(entity.id, entity.rotation);
    gl.scaleActor(entity.id, entity.scale.x, entity.scale.y);
  }

  async destroy(entity: Entity) {
    gl.deleteActor(entity.id);
  }
}

@system()
class Camera {
  defaultComponent = "camera";

  async init(entity: Entity) {
    let main = entity.get("camera").isMainCamera;
    if(main) {
      gl.createCamera(entity.id, 320, 320, true, 255,255,255,255);
      return;
    }
    gl.createCamera(entity.id, entity.bounds.x, entity.bounds.y, false, 255, 255, 255, 255);
  }

  async update(entity: Entity) {
    gl.translateCamera(entity.id, entity.position.x, -entity.position.y);
  }

  async destroy(entity: Entity) {
    gl.deleteCamera(entity.id);
  }
}

@system()
class Debug extends Renderer {
  defaultComponent = "debug";

  async init(entity: Entity) {
    let color = entity.get("debug").color;
    gl.createRawTexture(entity.id, 1, 1, new Uint8Array(color))
    gl.createActor(entity.id, entity.id, 1, 1);
    entity.set("sprite", {})
  }

  async update(entity: Entity) {
    super.update(entity);
    gl.scaleActor(entity.id, entity.scale.x * entity.bounds.x, entity.scale.y * entity.bounds.y);
  }

  async destroy(entity: Entity) {
    gl.deleteTexture(entity.id)
    super.destroy(entity);
  }
}