# Intro to the Pokit MACES

## Overview

Pokit is a web based game engine that focuses on reducing boilerplate to bring your ideas to life faster than any other web based engine. as such there are a few things to go over before you can jump right in. In this primer you will learn about the basic high level concepts in Pokit and it's event driven MACES system, which enables you to hook in behavior at any level of the engine, and even override existing engine behaviors

----
## The Cart Manifest

In Pokit, cart is short for cartridge, in essence the cart represents everything about your game. As such we need a way to define key features about your game, we do this in the cart manifest. The cart manifest will store data such as scenes, entities, which scene to load first, and more. Here is an example of what your cart manifest may look like.

```json
{
  "author": "Jordan 'Croug' LaPrise",
  "name": "Test Cart",
  "defaultScene": "default",
  "modules": ["@pokit:Engine","@pokit:Jewls"],
  "scripts": ["index.js"],
  "sceneShards": ["default.json"],
  "entityShards": [
      "player.json",
      "camera.json",
      "background.json"
      ]
}
```

This cart manifest is deceptively simple, but it is doing a lot for us. First it is defining the author and the name of the cart. This is simple meta data which can be used by the player or site to display important information about the cart. Next `defaultScene` tells us which scene we want to load first, usually this will be some kind of menu or lobby. Next the manifest tells us that we should be loading the Engine and Jewls renderer from the pokit module set. We will learn more about creating our own modules later.

This next part is where some manifests will differ, this manifest has opted to shard out it's entity and scene stubs, for the sake of logical organization, however it is possible to define entity and scene stubs directly in the cart, by defining them in the optional `scenes` and `entities` fields. For the time being we will stick with the sharded stubs to keep our workspace tidy.

By looking at this manifest we can infer what the project structure should look like. All scripts must be in a scripts folder, all entities must be in an entities folder, and all scenes must be in a scenes folder. This is what the project structure of this cart looks like

>> entities
>>> player.json
>>>
>>> camera.json
>>>
>>> background.json
>
>> scenes
>>> default.json
>
>> scripts
>>> index.js
>
> cart.json
>
> sprites.png

As you may have guessed. `cart.json` is the cart manifest. If you're particularly astute you may have noticed the sprites.png is not listed in the cart manifest. This is because Pokit only allows you one tilesheet for the cart. This may seem like an odd restriction, but it allows the assets to be easier compressed for delivery over the web, it does present some interesting challenges for the developer however, as you may not have tile padding or border, and all of the cell sizes must easily fit into each other to allow for easy sprite indexing. We'll go over the tilesheet later in more detail later

----
## Entities

If you have used a game engine before, you are likely familiar with the concept of entities or actors. Entities serve as logical groupings of data, which store a state at some position in the logical world. Entities are responsible for holding data that is passed between various scripts, to make it easy to represent your data in the logical world. 

There are a few different ways to create an entity, but the most useful way is to create an entity stub in your project directory. As mentioned in the Cart Manifest section, there are 2 different ways to define an entity stub. Directly in the cart manifest, or in a manifest shard. For the sake of scope we will opt for the latter. In the project directory we will create a folder called `entities` if it is not already created. We will create a few entities here, the first of which will be the main camera. We will create this in a file called `camera.json` which will later be able to be referenced as `camera`. Here is an example of what our main camera entity may look like.
```json
{
  "inherits": [],
  "components": {
    "camera": {
      "isMainCamera": true
    }
  }
}
```
This camera entity is incredibly simple, but will later be very powerful. Due to the nature of our system, it is only necessary to specify that which deviates from the default, so it is possible for entity stubs to be deceptively simple. In this stub all that is necessary is to add the camera component, and specify that it should be the main camera.

Let's create a couple more entities. These next two samples are the `player.json` and `background.json`.
```json
{
  "inherits": [],
  "components": {
    "moveable": {
      "speed": 10
    },
    "sprite": {
        "source": {
            "x":0,
            "y":2
        }
    },
    "rendered": {}
  }
}
```
```json
{
  "inherits": [],
  "components": {
    "identity": {
        "z":10,
        "scale": {
            "x":20,
            "y":20
        }
    },
    "sprite": {
        "source": {
            "x":26,
            "y":13
        }
    },
    "rendered": {}
  }
}
```

The first entity is more of the same, we specify an entity with a moveable component and a speed of 10 units per frame, then we specify a sprite source of 0, 2. This sprite is from our sprites.png atlas that we discussed briefly in the cart manifest section. The sprite origin can be calculated by multiplying the entity bounds by the sprite source, and the size will be equivalent to the entity bounds. The default entity bounds are 32*32px. The display size on screen can be calculated by multiplying the entity bounds by the entity scale. Finally we add the rendered component to specify that the sprite should be rendered to the screen, we don't need to override any of the defaults here so we specify an empty object.

The second entity we introduce something new, the `Identity` component. The `Identity` exists on every entity regardless of if it's specified, it contains the information about how and where the entity takes up space. In this case we've specified that the z value should be 10 pushing it behind the active scene, so it's still visible but not in front of our other entities. The other components on the entity have already been discussed, so we'll skip over them.

---
## Scenes

Now that we have entities, we need to place them into a level, in Pokit we call our levels `Scenes`. Each scene is simply a logical grouping of entities, and where they exist in the world. Scenes can be used to prepare groups of entities to be loaded while the player is already interacting in the world allowing you to seamlessly transition between worlds.

Let's create the `default.json` scene in the `scenes` folder like we saw earlier.

```json
{
  "systems": ["Move", "Renderer", "Camera"],
  "entities": {
    "player": [{
      "id": "player"
    }],
    "background": [{}],
    "camera": [{
      "parent": "player"
    }]
  }
}
```

Let's break this down a bit. The first parameter `systems` is responsible for identifying which scripts we want to be active in this scene, in this case we activate a Move system, the Renderer system, and our Camera system. Next we specify which stubs to instantiate, and where to instantiate them. We do this in an object where the key is the name of the entity stub, and the value is an array of `Identity` overrides. The first stub we instantiate is our player. The only value we override here is the id, normally the id is randomly populated, but we specifically set it here so we can identify it later. Then we specify that we want an instance of our background entity in the scene, and we don't want to override any of it's values, the default position (0,0), bounds, and the scale we defined in the stub, will work fine for us. Finally we specify we want an instance of our camera entity, and we override it's parent value, and set it to the id of our player that we set earlier. Adding this entity lineage, means that our camera will automatically follow our player around without us having to write any additional code!

---
## Components
Up until now we haven't written any actual code, this is the point at which we start diving in a little bit. We are still going to be dealing mostly with raw data, but we start to integrate light scripting. You have seen us mention components earlier in this document but what actually are they. Components are bags of data much like entities, but slightly more focused. Components can be targeted by systems, to help them figure out which entities they should be acting on and which can be ignored. They are also used to store entity specific data for the system, and even be used to pass data between systems.

Registering components is incredibly simple, you'll just pass into the engine an object with all of the default values for your components. Let's go ahead and create the `moveable` component we saw earlier. To do this we just need to call the `registerComponent` function on our ecs or `Entity Component System` and pass in the component name, and that object we mentioned earlier. If we were developing in standard javascript we would proceed by creating our scripts folder and populating it with our code files, but in our instance we want to utilize a superset of javascript known as typescript. Create a folder called `source` and populate it with one `index.ts` file. Later we will configure typescript to transpile that file into our `scripts` folder as `index.js`. We will put more into this file later but for now all we need to add is as follows.

```ts
window.Pokit.ecs.registerComponent("moveable", {
  speed: 0
});
```

That's all it takes to register a component. We can now attach this component to entities, either in code or by adding it to an entity stub. The `Engine` module also exports some default components, to make it easier on you the cart developer, when it comes time to swap out different modules, such as input our the rednerer. You can find a list of these default components in the engine docs or by taking a look at the source for the `Engine` module.

---
## Systems

Finally we've arrived at the real meat of any game. The code. Systems are objects which exist on a scene. These objects are called at specific events, and can be called on specific entities, or for every entity. In particular, there are 3 events that are called on a system, `init`, `update`, and `destroy`. `init` is called, either when the scene is made active, or when a component which the system is listening for, is added to the `entity` (only if the scene is active). `update` is called once per frame (and by entity depending) and is where the bulk of your game logic will go. `destroy` is called when an entity with the component the system was listening for, is destroyed, or when the scene is being terminated.

As I mentioned previously, systems can be set to listen for events only on entities which contain a specific component, or on every entity, but how do you specify which type your system should be. The answer is fairly simple, you just have to specify the `defaultComponent` parameter for your object, and set it to the name of the component you want to listen for. If you specify the `defaultComponent` parameter your events will now be called per entity only for entities that contain the specified component, and the event will pass in the referenced entity, otherwise, the events will only be called once per event, and will pass in an array of every entity on the scene.

Let's go ahead and build the `Move` system, so we can control our player. Building systems in Pokit using typescript is simple. We simply decorate our class with `@system()` and optionally a system name (default is the class name), and it will be automatically added to MACES for use. Let's try that now, go ahead and add the following code to our `index.ts`

```ts
import { PokitOS } from '/pokit/pokit.js';

/* -- component code here -- */

@system()
class Move {
  defaultComponent = "moveable";

  engine: PokitOS;
  input?: Map<string,number>;
  speed?: number;

  constructor(engine: PokitOS) {
    this.engine = engine;
  }

  init(entity: Entity) {
    this.input = engine.modules.get("input") as Map<string,number>;
    this.speed = entity.get("moveable").speed as number;
  }

  update(entity: Entity) {
    entity.position.y -= this.input!.get("up") * speed!;
    entity.position.y += this.input!.get("down") * speed!;
    entity.position.y -= this.input!.get("left") * speed!;
    entity.position.y += this.input!.get("right") * speed!;
  }
}
```

This code is prety simple and straight forward, but we introduce a few new concepts here, so we'll go over it. The first thing we do is create a class and decorate it with `@system()` to add it to the MACES. Then we specify that we want to listen for events around the `moveable` component. Next we set up a couple of class properties, that we'll fill in later. Then we come across the constructor, when system classes are added this way, the engine instance is passed into the system constructor, so we'll store this on the class properties, however a good portion of the engine is still being initialized here, so we don't want to try to access any of the engines functions. Next we move into the init function, here the engine has been fully instantiated, and the scene is activating, we'll take this opprotunity to grab an instance of the input mappings from the engines modules. The input module, is a common api module added by the `Engine` module, it is a map of strings to numbers, representing 0 not pressed, or 1 fully pressed.

Now we get to the meat of our Move system, the `update` event. Even though we're doing the bulk of our work here, our code is still straight forward and simple. We simply take the value of each input direction, and multiply it by the speed, then add or subtract it from the entity position. By default with only the systems we've provided, we will only be listening for keyboard input, which will make the values 0 or 1, however if you wanted to add joystick support later, it would be trivial with this setup.

---
## ECS Conclusion

We have now covered the last 3 letters of MACES, CES, or more commonly ECS. This is all you need, in addition to the source and api reference, to start developing game carts with Pokit! These simple concepts applied correctly, can result in even the most advanced of games, but without the complex and lengthy setup. Although this primer has been long so far, once you get the hang of it, this will create an efficient streamlined workflow, especially once you add the toolchain!

In the next section, we will cover the first two letters of MACES, Module and API. These are for more advanced developers, and allow you to create extensions that hook into the behavior of the engine itself, to create addons for yourself, or even other developers to utilize in their game carts. You can develop things like alternate input mappings, a custom phsyics system, or even your own renderer!

---
# Modules & APIs

Modules and APIs make up the first two letters of the MACES system, and are functionally identical. They both are instantiated in essentially the same way, and loaded in the same way, the only difference is when a module is specified as an API it is made available for other modules and the cart to be accessed and interacted with via modules.get. Now it is here that we make a distinction between the module and the module class. A module can contain multiple apis and module classes. The module itself is a collection of files made available through an entry point, the main.js file, when the engine is loaded, it will first check with the cart to determine which modules should be loaded, and then it will run each modules main.js file, where the module will then take over. A module class can then be registered inside of the module, which has engine lifetime events.

To create a module on our cart, all we need to do is make a folder named `modules` in the project, then make a subfolder with our module name, typically the first letter is capitalized in the module name. Then we make a main.js. or main.ts file. Finally we need to activate the module, by adding it's name to the list of modules in the cart manifest.

To create a module class, simply decorate it as `@module()` or `@api()` just like the system, the engine instance will be passed into the constructor. Once you have decorated your class as a module or an api, you will likely want to receive events from the engine. To do this simply decorate a member function with `@handler()` optionally passing in the event you want to listen for (defaults to function name).

Here are the events you can listen for.
> * `postLoad()` - Called once all of the modules are loaded
> * `cartLoad(manifest: CartManifest, tilesheet: HTMLImageElement)` - Called once the cart is fully loaded
> * `awake()` - Called once the engine is fully initialized
> * `preRender()` - Called before the render step
> * `render()` - Called as the render step
> * `postRender()` - Called after the render step
> * `preUpdate()` - Called before the ecs update
> * `postUpdate()` - Called after the ecs update

As you can say developing modules under Pokit and MACES is a simple process, meant to help your code work in tandem with the pokit MACES for an efficient and streamlined workflow. You can leverage this system to create additions to the Pokit ecosystem and help build our library of growing modules!