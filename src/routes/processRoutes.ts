import { Hono } from "hono";
import { streamFile } from "../middlewares/streamMiddleware";
import {
	createProcess,
	getProcessResult,
	deleteProcess,
	checkFileExistsInProcess,
	getFilePath,
	processFromTruyenVn,
	getAllProcesses,
} from "../services/processService";
import { galleryTemplate } from "../utils/htmlTemplates";

const processRouter = new Hono();

// Create a new process
processRouter.post("/process", async (c) => {
	const { images } = await c.req.json();
	const id = await createProcess(images);
	return c.json({ id });
});
processRouter.post("/process/crawl", async (c) => {
	const { url } = await c.req.json();
	const id = await processFromTruyenVn(url);
	console.log(url);
	return c.json({
		id: id,
	});
});

// Get process details
processRouter.get("/process/:id", async (c) => {
	const id = c.req.param("id");
	const result = await getProcessResult(id);

	if (!result) {
		return c.json({ error: "Process not found" }, 404);
	}

	return c.json(result);
});

processRouter.get("/process", async (c) => {
	return c.json(await getAllProcesses());
});

processRouter.get("/gallery", async (c) => {
	return c.html(galleryTemplate());
});

// Delete a process
processRouter.delete("/process/:id", async (c) => {
	const id = c.req.param("id");
	const success = await deleteProcess(id);

	if (!success) {
		return c.json({ error: "Process not found" }, 404);
	}

	return c.json({ id });
});

// Stream output file
processRouter.get("/static/:id/output/:file", async (c) => {
	const { id, file } = c.req.param();
	console.log(id, file);
	if (!checkFileExistsInProcess(id, file)) {
		return c.json({ error: "File not found" }, 404);
	}

	const filePath = getFilePath(id, file);
	return streamFile(c, filePath);
});

export default processRouter;
