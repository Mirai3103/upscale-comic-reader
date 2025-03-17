import { v4 as uuidv4 } from "uuid";
import Queue from "p-queue";
import db from "../db";
import { Status, IProcess, ProcessResult } from "../types/process";
import { PROCESS_DIR, CONCURRENCY_QUEUE, HOST_URL } from "../config/env";
import UserAgent from "user-agents";
import {
	createDirectory,
	removeDirectory,
	listFiles,
	checkFileExists,
} from "../utils/fileUtils";
import { downloadImages, upscaleImages } from "./imageService";
import axios from "axios";
import * as cheerio from "cheerio";
import { HttpsProxyAgent } from "https-proxy-agent";

const processQueue = new Queue({ concurrency: CONCURRENCY_QUEUE });

async function preProcessImages(
	id: string
): Promise<{ inputDir: string; outputDir: string }> {
	const dir = `${PROCESS_DIR}/${id}`;
	createDirectory(dir);

	const inputDir = `${dir}/input`;
	createDirectory(inputDir);

	const outputDir = `${dir}/output`;
	createDirectory(outputDir);

	const process = await getProcessById(id);
	if (!process) {
		throw new Error(`Process with id ${id} not found`);
	}

	const images = JSON.parse(process.images);
	await downloadImages(images, inputDir);

	return { inputDir, outputDir };
}

async function postProcessImages(id: string): Promise<void> {
	await updateProcessStatus(id, Status.COMPLETED);
	// Remove input directory to free up space
	removeDirectory(`${PROCESS_DIR}/${id}/input`);
}

export async function processImages(id: string): Promise<void> {
	try {
		await updateProcessStatus(id, Status.RUNNING);
		const { inputDir, outputDir } = await preProcessImages(id);

		const files = listFiles(inputDir);
		console.log(`Processing ${files.length} images for job ${id}`);

		await upscaleImages(inputDir, outputDir);
		await postProcessImages(id);
	} catch (error) {
		console.error(`Failed to process images for job ${id}:`, error);
		await updateProcessStatus(id, Status.FAILED);
	}
}

export async function createProcess(
	images: string[],
	title?: string
): Promise<string> {
	const id = uuidv4();

	db.query(
		`INSERT INTO processes (id, status, images,title) VALUES ($id, $status, $images, $title);`
	).run({
		$id: id,
		$status: Status.PENDING,
		$images: JSON.stringify(images),
		$title: title || id,
	});

	processQueue.add(async () => {
		await processImages(id);
	});

	return id;
}

export async function getProcessById(id: string): Promise<IProcess | null> {
	return db
		.query(`SELECT * FROM processes WHERE id = $id;`)
		.get({ $id: id }) as IProcess | null;
}

export async function getProcessResult(
	id: string
): Promise<ProcessResult | null> {
	const process = await getProcessById(id);

	if (!process) {
		return null;
	}

	const result: ProcessResult = {
		id: process.id,
		status: process.status,
		remaining: listFiles(`${PROCESS_DIR}/${id}/input`).length,
	};

	if (process.status === Status.COMPLETED) {
		const outputDir = `${PROCESS_DIR}/${id}/output`;
		const files = listFiles(outputDir).sort();

		result.images = files.map(
			(file) => `${HOST_URL}/api/static/${id}/output/${file}`
		);
	}

	return result;
}

export async function deleteProcess(id: string): Promise<boolean> {
	const process = await getProcessById(id);

	if (!process) {
		return false;
	}

	db.query(`DELETE FROM processes WHERE id = $id;`).run({ $id: id });
	removeDirectory(`${PROCESS_DIR}/${id}`);

	return true;
}

export async function updateProcessStatus(
	id: string,
	status: Status
): Promise<void> {
	db.query(`UPDATE processes SET status = $status WHERE id = $id;`).run({
		$id: id,
		$status: status,
	});
}

export function checkFileExistsInProcess(id: string, file: string): boolean {
	const filePath = `${PROCESS_DIR}/${id}/output/${file}`;
	console.log(filePath);
	return checkFileExists(filePath);
}

export function getFilePath(id: string, file: string): string {
	return `${PROCESS_DIR}/${id}/output/${file}`;
}
const proxyUrl = "http://hoagxxll:310303@103.82.194.100:3128";
const agent = new HttpsProxyAgent(proxyUrl);
export async function processFromTruyenVn(url: string): Promise<string> {
	const rest = await axios.get(url, {
		headers: {
			"User-Agent": new UserAgent().toString(),
			"Accept-Language": "en-US,en;q=0.9",
			Referer: "https://truyenvn.nl/",
		},
		httpAgent: agent,
		httpsAgent: agent,
	});
	const $ = cheerio.load(rest.data);

	const images = Array.from($("img[id^='image-']")).map((img) => {
		return $(img).attr("src")!;
	});

	const title = ($("title").text() || "").split("|")[0].trim();
	const id = await createProcess(
		images.filter((img) => img !== undefined),
		title
	);
	return id;
}

export async function getAllProcesses(): Promise<IProcess[]> {
	return db.query(`SELECT * FROM processes;`).all() as IProcess[];
}
