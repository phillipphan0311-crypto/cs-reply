import test from "node:test";
import assert from "node:assert/strict";
import "../src/parser.js";
import { readFile } from "node:fs/promises";

const fixture = await readFile(new URL("./fixtures/orders-list.html", import.meta.url), "utf8");
const { parseOrdersDocument, parseOrderDetailDocument } = globalThis.CSReplyParser;

test("keeps SMS, Etsy, and internal IDs separate and extracts row data", () => {
  const records = parseOrdersDocument(fixture, "https://sms.example.test/orders");
  assert.equal(records.length, 3);
  assert.deepEqual(
    {
      smsOrderId: records[0].smsOrderId,
      etsyOrderId: records[0].etsyOrderId,
      smsInternalId: records[0].smsInternalId,
    },
    {
      smsOrderId: "1420283",
      etsyOrderId: "4221692643",
      smsInternalId: "22c7cf78-b966-4457-9136-08df3b396c19",
    },
  );
  assert.deepEqual(records[0].orderAlerts, ["URGENT", "LATE SHIP"]);
  assert.deepEqual(records[0].tags, ["TEXT", "FULFILLMENT REJECTED"]);
  assert.equal(records[0].notes, "Synthetic note line one\nSynthetic note line two");
  assert.equal(records[0].shop, "VuEmbroidery");
});

test("deduplicates by SMS ID, falling back to Etsy ID only when SMS ID is missing", () => {
  const records = parseOrdersDocument(fixture, "https://sms.example.test/orders");
  assert.deepEqual(records.map((record) => record.smsOrderId), ["1420283", "1420284", ""]);
  assert.equal(records[2].etsyOrderId, "4221692650");
});

test("returns no records for a document without the expected order columns", () => {
  assert.deepEqual(parseOrdersDocument("<html><body>No table</body></html>", "https://example.test"), []);
});

test("captures the complete visible detail text and keeps the URL ID in smsInternalId", () => {
  const detail = parseOrderDetailDocument(
    "Order #9300017\nDESIGNED PAID\nDogFactsFun\n#8991000111\nJan 5, 09:30 Operator Example\nSHIP BY JAN 8\nSynthetic order note mentions URGENT",
    "https://sms.example.test/orders/detail?id=22c7cf78-b966-4457-9136-08df3b396c19&token=synthetic-secret",
    { etsyChatText: "Customer: Is my order confirmed?\nReply: Yes, it is confirmed." },
  );
  assert.equal(detail.smsOrderId, "9300017");
  assert.equal(detail.etsyOrderId, "8991000111");
  assert.equal(detail.smsInternalId, "22c7cf78-b966-4457-9136-08df3b396c19");
  assert.equal(detail.shop, "DogFactsFun");
  assert.equal(detail.status, "Designed");
  assert.equal(detail.orderDate, "Jan 5, 09:30");
  assert.equal(detail.shipDeadline, "JAN 8");
  assert.deepEqual(detail.orderAlerts, []);
  assert.equal(detail.detailText, "Order #9300017\nDESIGNED PAID\nDogFactsFun\n#8991000111\nJan 5, 09:30 Operator Example\nSHIP BY JAN 8\nSynthetic order note mentions URGENT");
  assert.equal(detail.detailUrl, "https://sms.example.test/orders/detail?id=22c7cf78-b966-4457-9136-08df3b396c19");
  assert.equal(detail.marketplace, "Etsy");
  assert.equal(detail.etsyChatText, "Customer: Is my order confirmed?\nReply: Yes, it is confirmed.");
});

test("reads a remote-access monitor order without inventing smsInternalId", () => {
  const detail = parseOrderDetailDocument(
    "Order #9300017\nNew\nDogFactsFun\n#8991000111\nJan 5, 09:30\nSHIP BY JAN 8",
    "https://sms.example.test/remote-access/monitor",
    { allowMissingInternalId: true, detailSource: "remote-access-monitor", items: "Synthetic item title" },
  );
  assert.equal(detail.smsOrderId, "9300017");
  assert.equal(detail.etsyOrderId, "8991000111");
  assert.equal(detail.smsInternalId, "");
  assert.equal(detail.shop, "DogFactsFun");
  assert.equal(detail.items, "Synthetic item title");
  assert.equal(detail.detailSource, "remote-access-monitor");
  assert.equal(detail.detailUrl, "https://sms.example.test/remote-access/monitor");
});

test("does not treat a page without an internal order ID as an order detail page", () => {
  assert.equal(parseOrderDetailDocument("Some page", "https://sms.example.test/orders/detail"), null);
});

test("does not assign an Etsy ID when no supported shop block is present", () => {
  const detail = parseOrderDetailDocument(
    "Order #9300017\nUnknown shop\n#8991000111",
    "https://sms.example.test/orders/detail?id=22c7cf78-b966-4457-9136-08df3b396c19",
  );
  assert.equal(detail.smsOrderId, "9300017");
  assert.equal(detail.etsyOrderId, "");
  assert.equal(detail.shop, "");
});
