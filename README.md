# Inline Properties (Improved)

<div align="center">

An Obsidan plugin that turns frontmatter properties into dynamic, live-rendering inline variables anywhere in your vault using `{{variable}}` syntax. 

Works seamlessly in both **Live Preview** and **Reading Mode** 
(_so fancy_)

</div>

---

## 🌟 Key Features

* **High Performance:** Incremental metadata caching for lag-free typing, even in massive vaults
* **Wikilink & Cross-Note References:** Use `{{[[ike]].meaning}}` or `{{ike.meaning}}` to reference properties across notes without typing full paths.
* **Dot Notation:** Access nested YAML objects like `{{sign.handshape}}` or `{{etymology.language}}`.
* **Clean Array Formatting:** YAML lists render cleanly as `bad, evil, complex` instead of raw JSON brackets.
* **Pipes & Formatting Filters:** Transform text on the fly (`upper`, `lower`, `capitalize`, `first`, `last`, `count`, `join`).
* **Spoiler Blur Study Mode:** Use `{{sign.movement | blur}}` to blur values until hovered—ideal for studying vocabulary or testing gestures!
* **Double-Click Frontmatter Editing:** Double-click any rendered variable in Live Preview to pop up a prompt and edit its YAML value directly.
* **Fallbacks & Conditionals:** Support default values (`{{sign ?? "None"}}`) and ternary expressions (`{{is_pu ? "pu" : "nimi sin"}}`).
* **Built-in Pseudo-Variables:** Use `{{this.title}}`, `{{this.folder}}`, and `{{this.mtime}}` without adding extra YAML tags.
* **CSS Data Attributes:** Rendered spans include `data-variable="key"` for deep custom styling.

---

## Syntax 

### Basic & Nested Properties
Given the following frontmatter in `ike.md`:

```yaml
---
word: ike
meaning:
  - bad
  - evil
  - complex
  - unnesecuarry 
sign:
  handshape: curved-5
  location: chin
  movement: tap twice
---
```

| Syntax | Output / Rendered Result |
| :--- | :--- |
| `{{word}}` | `ike` |
| `{{meaning}}` | `bad, evil, complex, unnesecuarry` *(auto-joined array)* |
| `{{sign.handshape}}` | `curved-5` *(nested dot notation)* |
| `{{sign.location}}` | `chin` |

---

### Cross-Note References & Wikilinks
Reference properties from other notes anywhere in your vault:

| Syntax | Description |
| :--- | :--- |
| `{{[[ike]].meaning}}` | Reference `meaning` from note `ike` using Obsidian Wikilinks |
| `{{ike.meaning}}` | Reference `meaning` from note `ike` using note name |
| `{{Notes/ike.md.sign.handshape}}` | Reference using full vault file path |

---

### 3. Formatting Filters & Pipes
Chain filters using the pipe (`|`) operator:

```markdown
- Custom Joiner: {{meaning | join(" • ")}}      --> bad • evil • complex
- First Item:    {{meaning | first}}            --> bad
- Item Count:    {{meaning | count}}            --> 3
- Uppercase:     {{word | upper}}               --> IKE
- Capitalise:    {{sign.location | capitalise}} --> Chin
```

---

### Spoiler Blur
Append `| blur` to any variable to hide it behind a blur filter until hovered or tapped:

```markdown
What is the handshape for moku? {{sign.handshape | blur}}
```

> **Result:** The handshape will be blurred out. Hovering or tapping reveals `curved-5`. Perfect for flashcard prep or self-testing!

---

### Fallbacks & Ternary Expressions

#### Default Fallbacks (`??`)
Provide a fallback string if a property is missing or undefined:
```markdown
Movement: {{sign.movement ?? "No gesture documented"}}
```

#### Ternary Conditionals (`? :`)
Output different text based on boolean or truthy values:
```markdown
Status: {{is_pu ? "Official pu word" : "nimi sin"}}
Type: {{two_handed ? "👐 Both Hands" : "✋ Single Hand"}}
```

---

### Built-in Pseudo-Variables
Access active file metadata without editing YAML:

* `{{this.title}}` or `{{this.name}}` — Active note title (`ike`)
* `{{this.folder}}` — Name of the parent folder (`Words`)
* `{{this.mtime}}` — Last modified date (`10/24/2026`)

---

## Interactive Editing & Keyboard Shortcuts

* **Single Click / Pointer Down:** Selects the variable's underlying source code (`{{variable}}`) for quick retyping or replacing.
* **Double-Click:** Pops up an interactive prompt letting you change the frontmatter value on the fly without scrolling to the top of the file.
* **Copying Text:** When copying text from the editor, resolved variable values are copied rather than raw `{{...}}` code (configurable in settings).

---

## Custom CSS Styling

Rendered variables are wrapped in spans containing `data-variable` attributes and utility classes.

### Blur Filter CSS
Include this in your plugin's `styles.css` or an Obsidian CSS snippet:

```css
/* Blur / Spoiler filter */
.lv-spoiler {
	filter: blur(5px);
	background-color: var(--background-modifier-border);
	border-radius: 3px;
	padding: 0 4px;
	cursor: pointer;
	transition: filter 0.2s ease, background-color 0.2s ease;
}

.lv-spoiler:hover,
.lv-spoiler:active {
	filter: blur(0);
	background-color: transparent;
}
```

### Style Specific Variables
Target variables by name using data attributes:

```css
/* Highlight category tags like badges */
.lv-live-text[data-variable="category"] {
	background-color: var(--color-accent);
	color: white;
	padding: 2px 6px;
	border-radius: 4px;
	font-weight: bold;
}
```