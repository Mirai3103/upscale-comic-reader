// Load environment variables from .env file

export const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001;
export const DB_PATH = process.env.DB_PATH || "data.db";
export const PROCESS_DIR = process.env.PROCESS_DIR || "processes";
export const REALCUGAN_PATH =
	process.env.REALCUGAN_PATH || "D:/realcugan/realcugan-ncnn-vulkan.exe";
export const MODELS_PATH = process.env.MODELS_PATH || "D:/realcugan/models-pro";
export const CONCURRENCY_QUEUE = process.env.CONCURRENCY_QUEUE
	? parseInt(process.env.CONCURRENCY_QUEUE)
	: 1;
export const UPSCALE_CONCURRENCY = process.env.UPSCALE_CONCURRENCY
	? parseInt(process.env.UPSCALE_CONCURRENCY)
	: 2;
export const DOWNLOAD_CONCURRENCY = process.env.DOWNLOAD_CONCURRENCY
	? parseInt(process.env.DOWNLOAD_CONCURRENCY)
	: 5;
export const HOST_URL = process.env.HOST_URL || "http://localhost:3001";
