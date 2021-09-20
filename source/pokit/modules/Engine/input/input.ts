import { api } from "../../../modloader.js";

@api('input')
export class InputMod extends Map<string, Number> {
	constructor() {
		super()
		for (let n of [
			'up',
			'down',
			'left',
			'right',
			'x',
			'y',
			'b',
			'a',
			'l',
			'r',
			'start',
			'select',
			'opt'
		]) {
			this.set(n, 0)
		}
	}

	getMany(...args: string[]): number[] {
		let ret = []
		for(let key of args) {
			ret.push(this.get(key));
		}
		return ret as number[];
	}
}