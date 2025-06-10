export class EnsureMap<K, V> extends Map<K, V> {
	constructor(private readonly initializer: () => V) {
		super();
	}

	get(key: K): V {
		if (this.has(key)) {
			return super.get(key) as V;
		}

		const value = this.initializer();
		this.set(key, value);

		return value;
	}

	update(key: K, updater: (value: V) => V): V {
		const value = this.get(key);

		const updatedValue = updater(value);
		this.set(key, updatedValue);

		return updatedValue;
	}
}
