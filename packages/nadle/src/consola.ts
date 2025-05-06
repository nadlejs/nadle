// eslint-disable-next-line no-restricted-imports
import consola from "consola";

if (process.env.NODE_ENV === "test" || process.env.CI === "true") {
	consola.level = 2;
}

export const Consola = consola;
