import {
	Decoration,
	DecorationSet,
	EditorView,
	ViewPlugin,
	ViewUpdate,
	WidgetType,
} from "@codemirror/view";
import { EditorSelection, RangeSetBuilder, StateEffect } from "@codemirror/state";
import { MarkdownView } from "obsidian";
import LiveVariables from "../main";
import {
	isKnownVariable,
	liveVariableRegex,
	resolveLiveVariableValueDetailed,
	resolveLiveVariablesInText,
} from "./live-variable-shared";

const refreshLiveVariablesEffect = StateEffect.define<void>();

export const refreshAllLiveVariables = (plugin: LiveVariables) => {
	plugin.app.workspace.getLeavesOfType("markdown").forEach((leaf) => {
		const view = leaf.view;
		if (view instanceof MarkdownView) {
			const cm = (view.editor as unknown as { cm?: EditorView }).cm;
			cm?.dispatch({ effects: refreshLiveVariablesEffect.of() });
		}
	});
};

class LiveVariableWidget extends WidgetType {
	constructor(
		private readonly value: string,
		private readonly highlight: boolean,
		private readonly source: string,
		private readonly cleanKey: string,
		private readonly isBlur: boolean,
		private readonly plugin: LiveVariables
	) {
		super();
	}

	eq(other: LiveVariableWidget): boolean {
		return (
			other.value === this.value &&
			other.highlight === this.highlight &&
			other.source === this.source &&
			other.cleanKey === this.cleanKey &&
			other.isBlur === this.isBlur
		);
	}

	toDOM(view: EditorView): HTMLElement {
		const span = view.dom.ownerDocument.createElement("span");
		
		let cls = "";
		if (this.highlight) cls += "lv-live-text ";
		if (this.isBlur) cls += "lv-spoiler ";
		if (cls) span.className = cls.trim();

		span.dataset.variable = this.cleanKey;
		span.textContent = this.value;

		// Click selects variable text
		span.addEventListener("pointerdown", (event) => {
			event.preventDefault();
			const pos = view.posAtDOM(span);
			view.dispatch({
				selection: EditorSelection.range(
					pos,
					pos + this.source.length
				),
			});
			view.focus();
		});

		// Inside toDOM() in live-variable-extension.ts
		span.addEventListener("mouseover", (event) => {
			const targetFile = this.plugin.app.metadataCache.getFirstLinkpathDest(this.cleanKey, "");
			if (targetFile) {
				this.plugin.app.workspace.trigger("hover-link", {
					event,
					source: "preview",
					hoverParent: view,
					targetEl: span,
					linktext: targetFile.path,
				});
			}
		});

		// Double-click to open frontmatter edit prompt!
		span.addEventListener("dblclick", (e) => {
			e.preventDefault();
			e.stopPropagation();
			const activeFile = this.plugin.app.workspace.getActiveFile();
			if (!activeFile) return;

			const newValue = prompt(`Edit property "${this.cleanKey}":`, this.value);
			if (newValue !== null) {
				void this.plugin.app.fileManager.processFrontMatter(activeFile, (frontmatter) => {
					frontmatter[this.cleanKey] = newValue;
				});
			}
		});

		return span;
	}

	ignoreEvent(): boolean {
		return true;
	}
}

const buildDecorations = (
	view: EditorView,
	plugin: LiveVariables
): DecorationSet => {
	const builder = new RangeSetBuilder<Decoration>();
	const selectionRanges = view.state.selection.ranges;

	for (const { from, to } of view.visibleRanges) {
		const text = view.state.doc.sliceString(from, to);
		liveVariableRegex.lastIndex = 0;
		let match: RegExpExecArray | null;
		while ((match = liveVariableRegex.exec(text)) !== null) {
			const content = match[1];
			if (!isKnownVariable(content, plugin.vaultProperties)) {
				continue;
			}
			const start = from + match.index;
			const end = start + match[0].length;

			const revealSource = selectionRanges.some(
				(range) =>
					(range.empty &&
						range.from <= end &&
						range.to >= start) ||
					(range.from === start && range.to === end)
			);
			if (revealSource) {
				continue;
			}

			const res = resolveLiveVariableValueDetailed(
				content,
				plugin.vaultProperties
			);
			if (res === undefined) {
				continue;
			}

			builder.add(
				start,
				end,
				Decoration.replace({
					widget: new LiveVariableWidget(
						res.value,
						plugin.settings.highlightText,
						match[0],
						res.cleanKey,
						res.isBlur,
						plugin
					),
				})
			);
		}
	}

	return builder.finish();
};

const liveVariableViewPlugin = (plugin: LiveVariables) =>
	ViewPlugin.fromClass(
		class {
			decorations: DecorationSet;

			constructor(view: EditorView) {
				this.decorations = buildDecorations(view, plugin);
			}

			update(update: ViewUpdate) {
				const forced = update.transactions.some((tr) =>
					tr.effects.some((e) => e.is(refreshLiveVariablesEffect))
				);
				if (
					update.docChanged ||
					update.viewportChanged ||
					update.selectionSet ||
					forced
				) {
					this.decorations = buildDecorations(update.view, plugin);
				}
			}
		},
		{
			decorations: (instance) => instance.decorations,
		}
	);

const liveVariableClipboardFilter = (plugin: LiveVariables) =>
	EditorView.clipboardOutputFilter.of((text) => {
		if (!plugin.settings.copyResolvedValues) {
			return text;
		}
		return resolveLiveVariablesInText(text, plugin.vaultProperties);
	});

export const liveVariableExtension = (plugin: LiveVariables) => [
	liveVariableViewPlugin(plugin),
	liveVariableClipboardFilter(plugin),
];