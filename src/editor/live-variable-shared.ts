import VaultProperties from "../VaultProperties";
import { stringifyIfObj } from "../utils";

export const liveVariableRegex = /\{\{([^{}]+?)\}\}/g;

export interface VariableResolution {
	value: string;
	isBlur: boolean;
	cleanKey: string;
}

export const isKnownVariable = (
	content: string,
	vaultProperties: VaultProperties
): boolean => {
	const trimmed = content.trim();
	if (trimmed.length === 0) return false;

	const baseKey = extractBaseKey(trimmed);
	if (baseKey.startsWith("this.")) return true;

	return (
		vaultProperties.getLocalKeysAndAllVariableKeys().includes(baseKey) ||
		vaultProperties.getProperty(baseKey) !== undefined
	);
};

const extractBaseKey = (content: string): string => {
	let key = content;
	if (key.includes("?")) key = key.split("?")[0];
	if (key.includes("??")) key = key.split("??")[0];
	if (key.includes("|")) key = key.split("|")[0];
	return key.trim();
};

export const resolveLiveVariableValueDetailed = (
	content: string,
	vaultProperties: VaultProperties
): VariableResolution | undefined => {
	let expr = content.trim();
	if (expr.length === 0) return undefined;

	let isBlur = false;

	// Ternary logic: {{ is_pu ? "pu word" : "nimi sin" }}
	if (expr.includes("?") && !expr.includes("??")) {
		const [condition, rest] = expr.split("?");
		const [trueVal, falseVal] = (rest ?? "")
			.split(":")
			.map((s) => s.trim().replace(/^["']|["']$/g, ""));
		const propVal = vaultProperties.getProperty(condition.trim());
		return {
			value: propVal ? trueVal : falseVal,
			isBlur: false,
			cleanKey: condition.trim(),
		};
	}

	let fallback: string | undefined = undefined;
	if (expr.includes("??")) {
		const parts = expr.split("??");
		expr = parts[0].trim();
		fallback = parts[1]?.trim().replace(/^["']|["']$/g, "");
	}

	const parts = expr.split("|").map((s) => s.trim());
	const mainKey = parts[0];
	const filters = parts.slice(1);

	// Using `any` like a man 🥹
	let rawVal: any = vaultProperties.getProperty(mainKey);
	if (rawVal === undefined || rawVal === null) {
		if (fallback !== undefined) {
			rawVal = fallback;
		} else {
			return undefined;
		}
	}

	let separator = ", ";

	for (const filter of filters) {
		if (filter === "blur") {
			isBlur = true;
		} else if (filter === "first" && Array.isArray(rawVal)) {
			rawVal = rawVal[0];
		} else if (filter === "last" && Array.isArray(rawVal)) {
			rawVal = rawVal[rawVal.length - 1];
		} else if (filter === "count" && Array.isArray(rawVal)) {
			rawVal = `${rawVal.length}`;
		} else if (filter === "upper" && typeof rawVal === "string") {
			rawVal = rawVal.toUpperCase();
		} else if (filter === "lower" && typeof rawVal === "string") {
			rawVal = rawVal.toLowerCase();
		} else if (filter === "capitalize" && typeof rawVal === "string") {
			rawVal = rawVal.charAt(0).toUpperCase() + rawVal.slice(1);
		} else if (filter.startsWith("join(")) {
			const match = filter.match(/join\(["'](.*?)["']\)/);
			if (match) separator = match[1];
		}
	}

	return {
		value: stringifyIfObj(rawVal, separator),
		isBlur,
		cleanKey: mainKey,
	};
};

export const resolveLiveVariableValue = (
	content: string,
	vaultProperties: VaultProperties
): string | undefined => {
	return resolveLiveVariableValueDetailed(content, vaultProperties)?.value;
};

export const resolveLiveVariablesInText = (
	text: string,
	vaultProperties: VaultProperties
): string => {
	return text.replace(liveVariableRegex, (token: string, content: string) => {
		if (!isKnownVariable(content, vaultProperties)) return token;
		return resolveLiveVariableValue(content, vaultProperties) ?? token;
	});
};