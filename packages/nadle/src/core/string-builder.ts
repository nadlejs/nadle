interface StringBuilderParams {
	readonly separator?: string;
}

export class StringBuilder {
	private readonly items: string[] = [];
	constructor(private params?: StringBuilderParams) {}

	add(item: string | false): StringBuilder {
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

		const separator = this.params?.separator ?? ", ";

		return this.items.join(separator);
	}
}
