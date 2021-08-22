import { Entity } from "../../entity";
import { handler, module } from "../../modloader";
import { PokitOS } from "../../pokit";
import { vectorMultiply } from "../../utils";

@module()
export default class Physics {
    engine: PokitOS;

    constructor(engine: PokitOS) {
        this.engine = engine;
    }

    @handler()
    async postUpdate() {
        this.engine.ecs.scene.entities.forEach(this.updateEntity.bind(this));
    }

    async updateEntity(entity: Entity) {
        const bounds = vectorMultiply(entity.bounds, entity.globalScale);
        
    }
}

export interface IPhysicsState {
    collidable: boolean;
    gravity: boolean;
    mass: number;
}