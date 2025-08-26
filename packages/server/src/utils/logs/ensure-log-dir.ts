import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { createWriteStream } from "node:fs";

export const createLogWriteStream = async (logPath: string) => {
	// Ensure the log directory exists before creating the write stream
	try {
		await mkdir(dirname(logPath), { recursive: true });
	} catch (error) {
		console.error("Failed to create log directory:", error);
	}
	
	return createWriteStream(logPath, { flags: "a" });
};