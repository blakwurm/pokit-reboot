import { handler, module } from "../../modloader.js";

@module("Test")
class WeirdClassName {
  @handler("update")
  async neatocustomfuncname() {
    console.log(this);
  }
}