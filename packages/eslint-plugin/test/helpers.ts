import { it, afterAll, describe } from "vitest";
import { RuleTester } from "@typescript-eslint/rule-tester";

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

export function createRuleTester(): RuleTester {
	return new RuleTester();
}
