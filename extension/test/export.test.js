import test from "node:test";
import assert from "node:assert/strict";
import "../src/export.js";

test("CSV keeps the canonical IDs and joins arrays without changing their meaning", () => {
  const csv = globalThis.CSReplyExport.toCsv([{
    smsOrderId: "1420283",
    etsyOrderId: "4221692643",
    smsInternalId: "22c7cf78-b966-4457-9136-08df3b396c19",
    items: ["Synthetic main product", "Synthetic add-on"],
    tags: ["TEXT", "FULFILLMENT REJECTED"],
    orderAlerts: ["URGENT", "LATE SHIP"],
    imageUrls: ["https://images.example.test/synthetic-photo.jpg"],
    etsyListingUrl: "https://www.etsy.com/listing/1234567890",
  }]);
  assert.match(csv, /smsOrderId,etsyOrderId,smsInternalId/);
  assert.match(csv, /"1420283","4221692643","22c7cf78-b966-4457-9136-08df3b396c19"/);
  assert.match(csv, /"TEXT \| FULFILLMENT REJECTED"/);
  assert.match(csv, /"Synthetic main product \| Synthetic add-on"/);
  assert.match(csv, /"URGENT \| LATE SHIP"/);
  assert.match(csv, /"https:\/\/images.example.test\/synthetic-photo.jpg"/);
  assert.match(csv, /"https:\/\/www.etsy.com\/listing\/1234567890"/);
});

test("CSV keeps the complete detail text in one escaped field", () => {
  const csv = globalThis.CSReplyExport.toCsv([{
    detailText: 'Line one\nLine two, with "quotes"',
    etsyChatText: 'Customer said, "hello"',
  }]);
  assert.match(csv, /"Line one\nLine two, with ""quotes"""/);
  assert.match(csv, /"Customer said, ""hello"""/);
});
