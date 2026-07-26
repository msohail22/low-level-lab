export function getRequiredRootElement(documentRef: Pick<Document, "getElementById">): Element {
	const rootElement = documentRef.getElementById("root");

	if (!rootElement) {
		throw new Error("Root element not found");
	}

	return rootElement;
}
