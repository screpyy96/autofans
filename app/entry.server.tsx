import type { RenderToPipeableStreamOptions } from "react-dom/server";
import { renderToPipeableStream } from "react-dom/server";
import { PassThrough, Readable } from "node:stream";
import { ServerRouter } from "react-router";
import type { EntryContext } from "react-router";

export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
  options?: RenderToPipeableStreamOptions
) {
  return new Promise((resolve, reject) => {
    let shellRendered = false;
    const { pipe, abort } = renderToPipeableStream(
      <ServerRouter context={routerContext} url={request.url} />,
      {
        ...options,
        onShellReady() {
          shellRendered = true;
          // Use a Node.js PassThrough (Writable) for renderToPipeableStream
          const nodeStream = new PassThrough();
          pipe(nodeStream);

          // Convert Node Readable to Web ReadableStream for the Fetch Response
          const body = Readable.toWeb(nodeStream) as unknown as ReadableStream;

          responseHeaders.set("Content-Type", "text/html");
          resolve(
            new Response(body, {
              headers: responseHeaders,
              status: responseStatusCode,
            })
          );
        },
        onShellError(error: unknown) {
          reject(error);
        },
        onError(error: unknown) {
          console.error(error);
          responseStatusCode = 500;
          if (shellRendered) {
            console.error(error);
          }
        },
      }
    );

    setTimeout(abort, 5000);
  });
}