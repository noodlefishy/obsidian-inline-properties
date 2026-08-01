export const stringifyIfObj = (obj: unknown): string => {
	if (typeof obj === "object" && obj !== null) {
		return formatValue(obj);
	}
	return String(obj);
};

export const trancateString = (str: string, maxLength: number): string => {
	return str.length > maxLength ? str.substring(0, maxLength) + "..." : str;
};

export function formatValue(value: unknown): string {
    if (value === null || value === undefined) {
        return "";
    }


    if (Array.isArray(value)) {
        return value
            .map((item) => (typeof item === "object" ? JSON.stringify(item) : String(item)))
            .filter((item) => item.trim() !== "")
            .join(", ");
    }

    if (typeof value === "object") {
        return JSON.stringify(value);
    }

    return String(value);
}
