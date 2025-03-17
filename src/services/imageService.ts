import { downloadFile, deleteFile } from "../utils/fileUtils";
import Queue from "p-queue";
import {
	DOWNLOAD_CONCURRENCY,
	UPSCALE_CONCURRENCY,
	REALCUGAN_PATH,
	MODELS_PATH,
} from "../config/env";

export async function downloadImages(
	images: string[],
	inputDir: string
): Promise<void> {
	const queue = new Queue({ concurrency: DOWNLOAD_CONCURRENCY });

	for (const imageUrl of images) {
		queue.add(async () => {
			const fileName = imageUrl.split("/").pop() as string;
			try {
				console.log(`Downloading: ${imageUrl}`);
				await downloadFile(imageUrl, `${inputDir}/${fileName}`);
			} catch (error) {
				console.error(`Failed to download: ${imageUrl}`, error);
			}
		});
	}

	await queue.onIdle();
}

export async function upscaleImages(
	inputDir: string,
	outputDir: string
): Promise<boolean> {
	try {
		const files = await import("fs").then((fs) => fs.readdirSync(inputDir));
		const upscaleQueue = new Queue({ concurrency: UPSCALE_CONCURRENCY });

		for (const file of files) {
			upscaleQueue.add(async () => {
				const inputPath = `${inputDir}/${file}`;
				const outputPath = `${outputDir}/${
					file.split(".")[0]
				}_x2_denoise3x.png`;

				console.log(`Upscaling: ${inputPath} -> ${outputPath}`);

				await new Promise<void>((resolve, reject) => {
					Bun.spawn(
						[
							REALCUGAN_PATH,
							"-i",
							inputPath,
							"-o",
							outputPath,
							"-s",
							"2",
							"-n",
							"3",
							"-m",
							MODELS_PATH,
						],
						{
							onExit(subprocess, exitCode, signalCode, error) {
								if (exitCode === 0) {
									resolve();
								} else {
									reject(error);
								}
							},
						}
					);
				});

				console.log(`Upscaled: ${inputPath}`);

				await deleteFile(inputPath);
			});
		}

		await upscaleQueue.onIdle();
		return true;
	} catch (error) {
		console.error("Error during upscaling:", error);
		throw error;
	}
}
