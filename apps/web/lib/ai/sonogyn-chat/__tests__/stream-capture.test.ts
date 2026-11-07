import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { captureOpenRouterStreamText } from "../stream-client";

const encoder = new TextEncoder();

function sse(...deltas: string[]): string {
  return (
    deltas.map((content) => `data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\n`).join("") +
    "data: [DONE]\n\n"
  );
}

function streamOf(chunks: string[]): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      for (const c of chunks) controller.enqueue(encoder.encode(c));
      controller.close();
    },
  });
}

async function readAll(stream: ReadableStream<Uint8Array>): Promise<string> {
  return new Response(stream).text();
}

describe("captureOpenRouterStreamText", () => {
  it("passes bytes through unchanged and assembles the answer across split chunks", async () => {
    const raw = sse("Киста ", "без солидного ", "компонента.");
    const cut1 = raw.indexOf("солид");
    const cut2 = raw.indexOf("[DONE]") - 3;
    const chunks = [raw.slice(0, cut1), raw.slice(cut1, cut2), raw.slice(cut2)];
    const saved: string[] = [];

    const out = await readAll(
      captureOpenRouterStreamText(streamOf(chunks), async (text) => {
        saved.push(text);
      }),
    );

    assert.equal(out, raw);
    assert.deepEqual(saved, ["Киста без солидного компонента."]);
  });

  it("splits multi-byte characters across chunks without corrupting the text", async () => {
    const raw = encoder.encode(sse("Рекомендация"));
    const mid = raw.indexOf(0xd0, 20) + 1;
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(raw.slice(0, mid));
        controller.enqueue(raw.slice(mid));
        controller.close();
      },
    });
    let saved = "";
    await readAll(
      captureOpenRouterStreamText(stream, async (text) => {
        saved = text;
      }),
    );
    assert.equal(saved, "Рекомендация");
  });

  it("does not save an empty answer", async () => {
    let calls = 0;
    await readAll(
      captureOpenRouterStreamText(streamOf(["data: [DONE]\n\n"]), async () => {
        calls += 1;
      }),
    );
    assert.equal(calls, 0);
  });

  it("delivers the full answer even when saving fails", async () => {
    const raw = sse("Ответ");
    const out = await readAll(
      captureOpenRouterStreamText(streamOf([raw]), async () => {
        throw new Error("db down");
      }),
    );
    assert.equal(out, raw);
  });

  it("saves only after the client has received every byte", async () => {
    const order: string[] = [];
    const reader = captureOpenRouterStreamText(streamOf([sse("A", "B")]), async () => {
      order.push("save");
    }).getReader();
    while (true) {
      const { done } = await reader.read();
      if (done) break;
      order.push("chunk");
    }
    assert.equal(order.at(-1), "save");
    assert.ok(order.includes("chunk"));
  });
});
