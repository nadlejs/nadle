export class StringBuilder {
	public constructor(private readonly separator = " ") {}

	private readonly items: string[] = [];

	public add(item: string | false): this {
		if (item === false) {
			return this;
		}

		this.items.push(item);

		return this;
	}

	public addIf(condition: boolean, item: string): this {
		if (condition) {
			return this.add(item);
		}

		return this;
	}

	public build(): string {
		if (this.items.length === 0) {
			return "";
		}

		return this.items.join(this.separator);
	}
}
