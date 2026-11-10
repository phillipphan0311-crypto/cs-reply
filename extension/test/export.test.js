import test from "node:test";
import assert from "node:assert/strict";
import "../src/export.js";

test("CSV keeps the canonical IDs and joins arrays without changing their meaning", () => {
  const csv = globalThis.CSReplyExport.toCsv([{
    smsOrderId: "1420283",
    etsyOrderId: "4221692643",
    smsInternalId: "22c7cf78-b966-4457-9136-08df3b396c19",
    tags: ["TEXT", "FULFILLMENT REJECTED"],
    orderAlerts: ["URGENT", "LATE SHIP"],
  }]);
  assert.match(csv, /smsOrderId,etsyOrderId,smsInternalId/);
  assert.match(csv, /"1420283","4221692643","22c7cf78-b966-4457-9136-08df3b396c19"/);
  assert.match(csv, /"TEXT \| FULFILLMENT REJECTED"/);
  assert.match(csv, /"URGENT \| LATE SHIP"/);
});
