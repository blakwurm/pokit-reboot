export type InputRecord = {key:string, value:number};
@api('input')
export class InputMod extends Map<string, Number> {

	q: InputRecord[]

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

		this.q = [];
	}

	getMany(...args: string[]): number[] {
		let ret = []
		for(let key of args) {
			ret.push(this.get(key));
		}
		return ret as number[];
	}

	push(...o: InputRecord[]) {
		this.q.push(...o);
	}

	@handler()
	async preUpdate() {
		let o = new Map<string,number>();
		while(this.q.length) {
			let e = this.q.pop()!;
			let v = o.get(e.key) || e.value;
			if(e.value >= v) o.set(e.key, e.value);
		}
		for(let [k,v] of o) {
			this.set(k, v);
		}
	}
}