import { handler, module } from "../../modloader.js";
import { PokitOS } from "../../pokit.js";

@module("Test")
class WeirdClassName {
  engine: PokitOS;

  constructor(engine: PokitOS) {
    this.engine = engine;
  }

  @handler("postLoad")
  async neatocustomfuncname() {
    console.log(this);
  }
  
  @handler()
  async postUpdate() {
    console.log("spin!");
  }
}