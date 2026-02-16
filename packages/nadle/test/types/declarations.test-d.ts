import { it, describe, expectTypeOf } from "vitest";
import { Inputs, Outputs, type Declaration, type DirDeclaration, type FileDeclaration } from "nadle";

describe.concurrent("Declaration", () => {
	it("is FileDeclaration | DirDeclaration", () => {
		expectTypeOf<Declaration>().toEqualTypeOf<FileDeclaration | DirDeclaration>();
	});
});

describe.concurrent("FileDeclaration", () => {
	it("has type 'file' and patterns", () => {
		expectTypeOf<FileDeclaration["type"]>().toEqualTypeOf<"file">();
		expectTypeOf<FileDeclaration["patterns"]>().toEqualTypeOf<string[]>();
	});
});

describe.concurrent("DirDeclaration", () => {
	it("has type 'dir' and patterns", () => {
		expectTypeOf<DirDeclaration["type"]>().toEqualTypeOf<"dir">();
		expectTypeOf<DirDeclaration["patterns"]>().toEqualTypeOf<string[]>();
	});
});

describe.concurrent("Inputs", () => {
	it("files() returns FileDeclaration", () => {
		expectTypeOf(Inputs.files("*.ts")).toEqualTypeOf<FileDeclaration>();
	});

	it("dirs() returns DirDeclaration", () => {
		expectTypeOf(Inputs.dirs("src")).toEqualTypeOf<DirDeclaration>();
	});
});

describe.concurrent("Outputs", () => {
	it("files() returns FileDeclaration", () => {
		expectTypeOf(Outputs.files("*.js")).toEqualTypeOf<FileDeclaration>();
	});

	it("dirs() returns DirDeclaration", () => {
		expectTypeOf(Outputs.dirs("dist")).toEqualTypeOf<DirDeclaration>();
	});
});
