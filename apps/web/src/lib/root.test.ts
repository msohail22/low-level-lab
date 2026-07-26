import { describe, expect, it } from "vitest";

import { getRequiredRootElement } from "./root";

describe("getRequiredRootElement", () => {
	it("returns the application root", () => {
		const rootElement = {} as Element;
		const documentRef = { getElementById: () => rootElement } as Pick<Document, "getElementById">;

		expect(getRequiredRootElement(documentRef)).toBe(rootElement);
	});

	it("throws when the application root is missing", () => {
		const documentRef = { getElementById: () => null } as Pick<Document, "getElementById">;

		expect(() => getRequiredRootElement(documentRef)).toThrow("Root element not found");
	});
});
