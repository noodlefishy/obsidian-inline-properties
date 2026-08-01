import VaultProperties from "../VaultProperties";
import { stringifyIfObj } from "../utils";

export const liveVariableRegex = /\{\{([^{}]+?)\}\}/g;

export const isKnownVariable = (
	content: string,
	vaultProperties: VaultProperties
): boolean => {
	const trimmed = content.trim();
	return (
		trimmed.length > 0 &&
		vaultProperties.getLocalKeysAndAllVariableKeys().includes(trimmed)
	);
};

export const resolveLiveVariableValue = (
	content: string,
	vaultProperties: VaultProperties
): string | undefined => {
	const [keyPart, fallbackPart] = content.split("??");
    const key = keyPart.trim();
    const fallback = fallbackPart?.trim().replace(/^["']|["']$/g, ""); // quotes

    const value = vaultProperties.getProperty(key);
    if (value === undefined || value === null) {
        return fallback;
    }
    return stringifyIfObj(value);
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
