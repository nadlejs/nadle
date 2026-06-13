import { it, expectTypeOf } from "vitest";
import { definePlugin, type NadlePlugin } from "nadle";

it("threads the Options generic into hooks", () => {
	const plugin = definePlugin<{ threshold: number }>({
		name: "timing",
		hooks: {
			beforeTask: (ctx) => {
				expectTypeOf(ctx.pluginOptions).toEqualTypeOf<{ threshold: number }>();
			}
		}
	});

	expectTypeOf(plugin).toMatchTypeOf<NadlePlugin<{ threshold: number }>>();
});
