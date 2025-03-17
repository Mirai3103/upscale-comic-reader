import { Context } from "hono";
import { stream } from "hono/streaming";

export function streamFile(c: Context, filePath: string) {
	const bunFile = Bun.file(filePath);
	c.res.headers.set(
		"Content-Type",
		bunFile.type || "application/octet-stream"
	);

	return stream(c, async (stream) => {
		const fileStream = bunFile.stream();

		stream.onAbort(() => {
			console.log(`Stream aborted for file: ${filePath}`);
			fileStream.cancel();
		});

		await stream.pipe(fileStream);
	});
}
