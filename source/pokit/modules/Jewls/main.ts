import { CartManifest } from "../../cartloader.js";
import { system } from "../../ecs.js";
import { Entity } from "../../entity.js";
import { handler, module } from "../../modloader.js";
import { PokitOS, Vector } from "../../pokit.js";
import * as gl from "./backend/opengl.js";

let globalVars = {
  width: 0
}

@module()
class Jewls {
  engine: PokitOS;

  constructor(engine: PokitOS) {
    this.engine = engine;
  }

  @handler()
  async postLoad() {
    await gl.initContext(this.engine.canvas);
    this.engine.ecs.registerComponent("debug", {
      color: [255, 0, 0, 255]
    })
  }

  @handler()
  async cartLoad(manifest: CartManifest, tilesheet: HTMLImageElement) {
    gl.createImageTexture("tiles", tilesheet);
    globalVars.width = tilesheet.width;
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
    gl.translateActor(entity.id, entity.globalPosition.x, entity.globalPosition.y);
    gl.rotateActor(entity.id, -entity.globalRotation);
    gl.scaleActor(entity.id, entity.globalScale.x, entity.globalScale.y);
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
    gl.translateCamera(entity.id, entity.globalPosition.x, -entity.globalPosition.y);
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
    gl.scaleActor(entity.id, entity.globalScale.x * entity.bounds.x, entity.globalScale.y * entity.bounds.y);
  }

  async destroy(entity: Entity) {
    gl.deleteTexture(entity.id)
    super.destroy(entity);
  }
}

@system()
class Tilemap extends Renderer {
  defaultComponent = "tilemap";

  async init(entity: Entity) {
    let tm = entity.get("tilemap");
    let numSpritesRow = Math.ceil(globalVars.width / tm.tilewidth);
    gl.createTileMap(
      entity.id,
      "tiles", 
      numSpritesRow,
      tm.width,
      tm.tilewidth,
      tm.tileheight,
      1,
      tm.tiles
    );
  }
}