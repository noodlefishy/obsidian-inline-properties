export const stringifyIfObj = (obj: unknown): string => {
	if (typeof obj === "object" && obj !== null) {
		return JSON.stringify(obj);
	}
	return String(obj);
};

export const trancateString = (str: string, maxLength: number): string => {
	return str.length > 100 ? str.substring(0, maxLength) + "..." : str;
};
