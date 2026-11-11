import test from "node:test";
import assert from "node:assert/strict";
import "../src/filename.js";

test("uses a distinct filename for an orders list export", () => {
  assert.equal(
    globalThis.CSReplyFilename.create("list", [], "json", new Date("2026-11-11T12:00:00Z")),
    "etsy-sms-orders-list-2026-11-11.json",
  );
});

test("labels detail exports and includes the SMS Order ID", () => {
  assert.equal(
    globalThis.CSReplyFilename.create("detail", [{ smsOrderId: "1420283" }], "csv", new Date("2026-11-11T12:00:00Z")),
    "etsy-sms-order-detail-1420283-2026-11-11.csv",
  );
});

test("uses a safe fallback when detail ID is missing or invalid", () => {
  assert.equal(
    globalThis.CSReplyFilename.create("detail", [{ smsOrderId: "../private" }], "json", new Date("2026-11-11T12:00:00Z")),
    "etsy-sms-order-detail-unknown-2026-11-11.json",
  );
});
