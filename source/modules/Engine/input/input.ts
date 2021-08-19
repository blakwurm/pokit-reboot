import { api } from "../../../modloader";

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
}