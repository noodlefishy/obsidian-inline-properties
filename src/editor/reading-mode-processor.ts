import LiveVariables from "../main";
import {
	isKnownVariable,
	liveVariableRegex,
	resolveLiveVariableValueDetailed,
} from "./live-variable-shared";

const isInsideCode = (node: Node): boolean => {
	let el = node.parentElement;
	while (el) {
		const tag = el.tagName;
		if (tag === "CODE" || tag === "PRE") {
			return true;
		}
		el = el.parentElement;
	}
	return false;
};

export const liveVariableReadingProcessor =
	(plugin: LiveVariables) => (el: HTMLElement) => {
		const doc = el.ownerDocument;
		const walker = doc.createTreeWalker(
			el,
			NodeFilter.SHOW_TEXT,
			null
		);
		const targets: Text[] = [];
		let current = walker.nextNode();
		while (current) {
			const text = current.nodeValue ?? "";
			if (text.includes("{{") && !isInsideCode(current)) {
				targets.push(current as Text);
			}
			current = walker.nextNode();
		}

		for (const node of targets) {
			const text = node.nodeValue ?? "";
			liveVariableRegex.lastIndex = 0;
			let match: RegExpExecArray | null;
			let lastIndex = 0;
			let replaced = false;
			const fragment = doc.createDocumentFragment();

			while ((match = liveVariableRegex.exec(text)) !== null) {
				const content = match[1];
				if (!isKnownVariable(content, plugin.vaultProperties)) {
					continue;
				}
				const res = resolveLiveVariableValueDetailed(
					content,
					plugin.vaultProperties
				);
				if (res === undefined) {
					continue;
				}

				if (match.index > lastIndex) {
					fragment.appendChild(
						doc.createTextNode(
							text.slice(lastIndex, match.index)
						)
					);
				}
				const span = doc.createElement("span");
				let cls = "";
				if (plugin.settings.highlightText) cls += "lv-live-text ";
				if (res.isBlur) cls += "lv-spoiler ";
				if (cls) span.className = cls.trim();

				span.dataset.variable = res.cleanKey;
				span.textContent = res.value;
				fragment.appendChild(span);
				lastIndex = match.index + match[0].length;
				replaced = true;
			}

			if (!replaced) {
				continue;
			}
			if (lastIndex < text.length) {
				fragment.appendChild(
					doc.createTextNode(text.slice(lastIndex))
				);
			}
			node.replaceWith(fragment);
		}
	};