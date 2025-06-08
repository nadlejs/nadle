import { configure } from "nadle";

configure({
	maxWorkers: 32,
	minWorkers: "20%"
});
