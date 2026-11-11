import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

const parserSource = readFileSync(new URL("../src/parser.js", import.meta.url), "utf8");
const extractorSource = readFileSync(new URL("../src/page-extractor.js", import.meta.url), "utf8");

function extract(chatText) {
  const sandbox = {
    URL,
    window: { location: { href: "https://sms.example.test/orders/order-detail?id=22c7cf78-b966-4457-9136-08df3b396c19" } },
    document: {
      body: { innerText: "Order #9300017\nDogFactsFun\n#8991000111" },
      querySelectorAll: () => [],
      querySelector: (selector) => selector === "app-order-chat-box .chat-container .chat-area" && chatText
        ? { innerText: chatText }
        : null,
    },
  };
  runInNewContext(parserSource, sandbox);
  return runInNewContext(extractorSource, sandbox);
}

test("captures visible chat-area text when the chat is expanded", () => {
  const result = extract("Customer: Synthetic question\nReply: Synthetic answer");
  assert.equal(result.kind, "detail");
  assert.equal(result.records[0].etsyChatText, "Customer: Synthetic question\nReply: Synthetic answer");
});

test("leaves chat text empty when the chat panel is collapsed", () => {
  const result = extract("");
  assert.equal(result.kind, "detail");
  assert.equal(result.records[0].etsyChatText, "");
});
