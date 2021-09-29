import { PokitOS } from "../../pokit.js";

@worker()
class Test {
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

@api()
class TestApi {
  engine: PokitOS;

  constructor(engine: PokitOS) {
    this.engine = engine;
  }

  public myFunc() {
    console.log("You called an API function!");
  }

  @handler()
  public async postLoad() {
    console.log(this);
  }
}

@api("TestApi2")
class MyClass {
  
}