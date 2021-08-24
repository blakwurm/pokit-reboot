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
Up until now we haven't written any actual code, this is the point at which we start diving in a little bit. We are still going to be dealing mostly with raw data, but we start to integrate light scripting. Components are bags of data much like entities, but slightly more focused. Components can be targeted by systems, to help them figure out which entities they should be acting on and which can be ignored. They are also used to store entity specific data for the system, and even be used to pass data between systems.