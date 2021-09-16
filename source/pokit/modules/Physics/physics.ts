import { system } from "../../ecs";
import { Entity } from "../../entity";
import { api, handler, module } from "../../modloader";
import { PokitOS, Vector } from "../../pokit";
import SpatialHashMap, { vectorEqual, vectorMultiply, VectorOne } from "../../utils";

class Collision {
    agent: Entity;
    collider: Entity;
    ended: boolean;

    constructor(agent: Entity, collider: Entity) {
        this.agent = agent;
        this.collider = collider;
        this.ended = false;
    }

    equals(x: Collision) {
        return this.agent === x.agent && this.collider === x.collider;
    }
}

@api("Physics")
export default class PhysicsModule {
    engine: PokitOS;
    static: SpatialHashMap;
    dynamic: SpatialHashMap;
    collisions: Collision[];

    constructor(engine: PokitOS) {
        this.engine = engine;
        this.static = new SpatialHashMap(64);
        this.dynamic = new SpatialHashMap(64);
        this.collisions = [];
    }

    @handler()
    async preRender(){
        let agents = await this.engine.ecs.getSubscriptions("rigidBody");
        let colliders = await this.engine.ecs.getSubscriptions("dynamicCollider");
        this.dynamic.clear();
        this.dynamic.addMany([...colliders]);

        for(let agent of agents) {
            let staticColliders = this.static.findColliding(agent);
            let dynamicColliders = this.dynamic.findColliding(agent);
            let colliding = [...staticColliders, ...dynamicColliders];
            for(let collider of colliding){
                if(collider === agent) continue;
                await this.handleCollision(agent, collider as Entity);
            }    
        }
        this.collisions = this.collisions.filter((e)=>{
            if(e.ended) {
                e.agent.callEvent("onCollisionExit", e);
                e.collider.callEvent("onCollisionExit", e);
                return false;
            }
            e.ended = true;
            return true;
        });
    }

    async handleCollision(agent: Entity, collider: Entity) {
        let col = new Collision(agent, collider);
        let handled = false;
        for(let e of this.collisions) {
            if(e.equals(col)){
                handled = true;
                e.ended = false;
                break;
            }
        }

        if(!handled) {
            this.collisions.push(col);
            agent.callEvent("onCollisionEnter", col);
            collider.callEvent("onCollisionEnter", col);
        }
    }
}

@system()
class Physics {
    defaultComponent = "staticCollider";
    physics: PhysicsModule;
    engine: PokitOS;
    cachedBounds:  Vector;
    cachedPos: Vector;

    constructor(engine: PokitOS) {
        this.engine = engine;
        this.physics = this.engine.modules.get("Physics");
        this.cachedBounds = VectorOne();
        this.cachedPos = VectorOne();
    }

    async init(entity: Entity) {
        this.physics.static.add(entity);
    }

    async update(entity: Entity) {
        let bounds = vectorMultiply(entity.scale,entity.bounds);
        if(vectorEqual(bounds,this.cachedBounds) &&
        vectorEqual(entity.globalPosition, this.cachedPos)) return;

        this.cachedBounds = bounds;
        Object.assign(this.cachedPos, entity.globalPosition);
        this.physics.static.delete(entity);
        this.physics.static.add(entity);
    }

    async destroy(entity: Entity) {
        this.physics.static.delete(entity);
    }
}

export interface IPhysicsState {
    collidable: boolean;
    gravity: boolean;
    mass: number;
}