export class StringBuilder {
	private readonly items: string[] = [];

	add(item: string | false): this {
		if (item === false) {
			return this;
		}

		this.items.push(item);

		return this;
	}

	build(): string {
		if (this.items.length === 0) {
			return "";
		}

		return this.items.join(", ");
	}
}
