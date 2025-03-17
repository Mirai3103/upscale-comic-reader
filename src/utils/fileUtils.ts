import {
	mkdirSync,
	createWriteStream,
	rmdirSync,
	readdirSync,
	unlink,
	existsSync,
} from "fs";
import axios from "axios";
import { HttpsProxyAgent } from "https-proxy-agent";
import UserAgent from "user-agents";
//

export function createDirectory(path: string): void {
	mkdirSync(path, { recursive: true });
}

export function removeDirectory(path: string): void {
	rmdirSync(path, { recursive: true });
}

export function listFiles(path: string): string[] {
	try {
		return readdirSync(path);
	} catch (error) {
		return [];
	}
}

export function deleteFile(path: string): Promise<void> {
	return new Promise((resolve, reject) => {
		unlink(path, (err) => {
			if (err) {
				reject(err);
			} else {
				resolve();
			}
		});
	});
}

export function checkFileExists(path: string): boolean {
	return existsSync(path);
}
const proxyUrl = "http://hoagxxll:310303@103.82.194.100:3128";
const agent = new HttpsProxyAgent(proxyUrl);

export async function downloadFile(url: string, path: string): Promise<void> {
	const response = await axios.get(url, {
		responseType: "stream",
		httpsAgent: agent,
		httpAgent: agent,
		headers: {
			"User-Agent": new UserAgent().toString(),
		},
	});
	const writer = createWriteStream(path);
	response.data.pipe(writer);

	return new Promise<void>((resolve, reject) => {
		writer.on("finish", resolve);
		writer.on("error", reject);
	});
}
