export enum Status {
	PENDING = "pending",
	RUNNING = "running",
	COMPLETED = "completed",
	FAILED = "failed",
}

export interface IProcess {
	id: string;
	status: string;
	images: string;
	title: string;
}

export interface ProcessResult {
	id: string;
	status: string;
	images?: string[];
	remaining?: number;
}
