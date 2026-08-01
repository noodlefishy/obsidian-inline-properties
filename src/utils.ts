export const stringifyIfObj = (obj: unknown, separator = ", "): string => {
	if (typeof obj === "object" && obj !== null) {
		return formatValue(obj, separator);
	}
	return String(obj);
};

export const trancateString = (str: string, maxLength: number): string => {
	return str.length > maxLength ? str.substring(0, maxLength) + "..." : str;
};

export function formatValue(value: unknown,  separator = ", "): string {
    if (value === null || value === undefined) {
        return "";
    }


    if (Array.isArray(value)) {
        return value
            .map((item) => (typeof item === "object" ? JSON.stringify(item) : String(item)))
            .filter((item) => item.trim() !== "")
            .join(separator);
    }

    if (typeof value === "object") {
        return JSON.stringify(value);
    }

	return String(value);
}