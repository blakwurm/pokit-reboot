import { system } from "../../ecs.js";
import { Entity } from "../../entity.js";
import { api, handler, module } from "../../modloader.js";
import { PokitOS, Vector } from "../../pokit.js";
import SpatialHashMap, { vectorAbs, vectorAdd, vectorClamp, vectorDist, vectorDivide, VectorEast, vectorEqual, vectorMultiply, VectorNeg, VectorNorth, VectorOne, vectorSign, VectorSouth, vectorSub, VectorWest, VectorZero } from "../../utils.js";

export class Collision {
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
            await agent.callEvent("onCollisionEnter", col);
            await collider.callEvent("onCollisionEnter", col);
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
        let tbounds = vectorMultiply(entity.globalScale,entity.bounds);
        let rot = entity.globalRotation;
        let bounds = (rot > 45 && rot < 135) || (rot > 225 || rot < 315) ? {
            x: tbounds.y,
            y: tbounds.x
        } : tbounds;

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

function getDepth(col: Collision, accel: Vector): Vector {
    let dir = vectorSign(accel);
    dir.x = dir.x != 0 ? dir.x : 1;
    dir.y = dir.y != 0 ? dir.y : 1;
    let vec2 = {x:2,y:2};
    let eBounds = vectorMultiply(col.agent.bounds, col.agent.globalScale);
    let cBounds = vectorMultiply(col.collider.bounds, col.collider.globalScale);
    eBounds = vectorDivide(eBounds, vec2);
    cBounds = vectorDivide(cBounds, vec2);
    eBounds = vectorMultiply(eBounds, dir);
    cBounds = vectorMultiply(cBounds, dir);
    let ePoint = vectorAdd(col.agent.globalPosition, eBounds);
    let cPoint = vectorSub(col.collider.globalPosition, cBounds);
    return vectorSub(ePoint, cPoint);
}

function getNormal(accel: Vector, overlap: Vector): [Vector, string] {
    if(accel.y == 0 || (accel.x != 0 && Math.abs(overlap.x) < Math.abs(overlap.y))) {
        if(accel.x > 0) return [VectorWest(), 'EAST'];
        return [VectorEast(), 'WEST'];
    }
    if(accel.y < 0) return [VectorSouth(), 'NORTH'];
    return [VectorNorth(), 'SOUTH'];
}

function getResolution(normal: Vector, col: Collision) {
    let v2 = {x:2,y:2};
    let eBounds = vectorMultiply(col.agent.bounds, col.agent.globalScale);
    let cBounds = vectorMultiply(col.collider.bounds, col.collider.globalScale);
    eBounds = vectorDivide(eBounds, v2);
    cBounds = vectorDivide(cBounds, v2);
    let abs = vectorAbs(normal);
    eBounds = vectorMultiply(eBounds, abs);
    cBounds = vectorMultiply(cBounds, abs);
    let offset = vectorAdd(eBounds,cBounds);
    offset = vectorMultiply(offset, normal);
    let pos = vectorMultiply(col.collider.globalPosition, abs);
    pos = vectorAdd(pos, offset); 
    return {
        x: pos.x != 0 ? pos.x : col.agent.globalPosition.x,
        y: pos.y != 0 ? pos.y : col.agent.globalPosition.y
    }
}

function handleCollision(vector: Vector, col: Collision) {
    let collider = col.collider.get("staticCollider") || col.collider.get("dynamicCollider")
    let map = {
        "NORTH": "blockSouth",
        "EAST": "blockWest",
        "SOUTH": "blockNorth",
        "WEST": "blockEast"
    } as Record<string,string>;
    let depth = getDepth(col, vector);
    let [normal, direction] = getNormal(vector, depth);

    if(!collider[map[direction]]) return;

    let resolve = getResolution(normal, col);
    col.agent.globalPosition = resolve;


    col.ended = true;

    return resolve;
}

@system()
class ColResolution {
    defaultComponent="rigidBody";

    constructor(engine: PokitOS) {
        engine.ecs.registerComponent("physicsState", {});
    }

    async init(entity: Entity) {
        entity.set("physicsState", {
            last: Object.assign({}, entity.globalPosition)
        });
    }

    async update(entity: Entity) {
        let state = entity.get("physicsState");
        state.last = state.next;
        state.next = Object.assign({}, entity.globalPosition);
    }

    async onCollisionEnter(entity :Entity,col: Collision) {
        let state = entity.get("physicsState");
        let last = state.last;
        let dir = vectorSub(entity.globalPosition, last);
        state.valid = dir.x !== 0 || dir.y !== 0 ? dir : state.valid;
        col.agent.get("physicsState").next = handleCollision(state.valid, col);
    }
}

let vec = {} as Vector;
@system()
class RigidBody {
    defaultComponent="rigidBody";
    priority=-Infinity;
    
    async update(entity: Entity) {
        let state = entity.get("rigidBody");
        state.vector = vectorAdd(state.vector, state.impulse);
        state.vector.y += state.gravity;
        state.vector.x -= state.vector.x != 0 ? Math.sign(state.vector.x) * state.friction.x : 0;
        state.vector.y -= state.vector.y != 0 ? Math.sign(state.vector.y) * state.friction.y : 0;
        let min = vectorMultiply(state.terminal, VectorNeg());
        state.vector = vectorClamp(state.vector, min, state.terminal);

        entity.globalPosition = vectorAdd(state.vector, entity.globalPosition);
        state.impulse = VectorZero();
        Object.assign(vec, state.vector);
    }

    async onCollisionEnter(entity :Entity, col: Collision) {
        let state = entity.get("rigidBody");
        state.last = state.vector.x !== 0 || state.vector.y !== 0 ? Object.assign({}, state.vector) : state.last;
        handleCollision(state.last, col);
    }
}

export interface IPhysicsState {
    last: Vector;
    next: Vector;
    valid: Vector;
}