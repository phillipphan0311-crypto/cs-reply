import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

const parserSource = readFileSync(new URL("../src/parser.js", import.meta.url), "utf8");
const extractorSource = readFileSync(new URL("../src/page-extractor.js", import.meta.url), "utf8");

function extract(chatText, detailDom = {}) {
  const sandbox = {
    URL,
    window: { location: { href: "https://sms.example.test/orders/order-detail?id=22c7cf78-b966-4457-9136-08df3b396c19", pathname: "/orders/order-detail" } },
    document: {
      body: { innerText: "Order #9300017\nDogFactsFun\n#8991000111" },
      querySelectorAll: (selector) => detailDom.querySelectorAll?.(selector) ?? [],
      querySelector: (selector) => selector === "app-order-chat-box .chat-container .chat-area" && chatText
        ? chatText
        : selector === "app-order-detail" && detailDom.orderDetail
          ? detailDom.orderDetail
          : null,
    },
  };
  runInNewContext(parserSource, sandbox);
  return runInNewContext(extractorSource, sandbox);
}

function extractRemoteMonitor() {
  const orderDetail = { querySelectorAll: (selector) => selector.includes(".order-item-title")
    ? [{ innerText: "Synthetic item title" }]
    : [] };
  const sandbox = {
    URL,
    window: { location: { href: "https://sms.example.test/remote-access/monitor", pathname: "/remote-access/monitor" } },
    document: {
      body: { innerText: "Order #9300017\nNew\nDogFactsFun\n#8991000111\nJan 5, 09:30" },
      querySelectorAll: () => [],
      querySelector: (selector) => selector === "app-order-detail"
        ? orderDetail
        : null,
    },
  };
  runInNewContext(parserSource, sandbox);
  return runInNewContext(extractorSource, sandbox);
}

test("captures visible chat-area text when the chat is expanded", () => {
  const customerMessage = { innerText: "Synthetic customer message", tagName: "DIV", contains: () => false, matches: () => false, closest: () => null };
  const sellerMessage = { innerText: "Synthetic seller message", tagName: "DIV", contains: () => false, matches: () => false, closest: () => null };
  const templateOption = { innerText: "2. Confirm address · this shop", tagName: "DIV", contains: () => false, matches: () => false, closest: () => ({}) };
  const chatArea = {
    innerText: "Synthetic customer message\nSynthetic seller message\nReply\nPick a template…\n2. Confirm address · this shop\nCopy",
    querySelectorAll: (selector) => selector.includes("message")
      ? [customerMessage, sellerMessage, templateOption]
      : [],
  };
  const result = extract(chatArea);
  assert.equal(result.kind, "detail");
  assert.equal(result.records[0].etsyChatText, "Synthetic customer message\n\nSynthetic seller message");
});

test("leaves chat text empty when the chat panel is collapsed", () => {
  const result = extract("");
  assert.equal(result.kind, "detail");
  assert.equal(result.records[0].etsyChatText, "");
});

test("fallback chat cleanup removes composer and template UI without splitting message text", () => {
  const leaves = ["Synthetic customer message mentioning Pick a template", "Reply", "Pick a template…", "2. Confirm address · this shop", "Copy"]
    .map((text) => ({ innerText: text, children: [], remove() { this.removed = true; } }));
  const clone = {
    querySelectorAll: (selector) => selector === "*" ? leaves : [],
    cloneNode: () => clone,
    get innerText() { return leaves.filter((leaf) => !leaf.removed).map((leaf) => leaf.innerText).join("\n"); },
  };
  const chatArea = {
    innerText: "Synthetic customer message mentioning Pick a template\nReply\nPick a template…\n2. Confirm address · this shop\nCopy",
    querySelectorAll: (selector) => selector.includes("message") ? [] : [],
    cloneNode: () => clone,
  };
  const result = extract(chatArea);
  assert.equal(result.records[0].etsyChatText, "Synthetic customer message mentioning Pick a template");
});

test("uses cleaned panel text when semantic message selectors omit most visible chat", () => {
  const partialMessage = { innerText: "Short fragment", tagName: "DIV", contains: () => false, matches: () => false, closest: () => null };
  const leaves = [
    "Full synthetic customer message with several useful details that should remain visible in the export.",
    "Full synthetic seller response with additional details that were absent from the partial semantic match.",
    "Reply",
    "Pick a template…",
    "Copy",
  ].map((text) => ({ innerText: text, children: [], remove() { this.removed = true; } }));
  const clone = {
    querySelectorAll: (selector) => selector === "*" ? leaves : [],
    cloneNode: () => clone,
    get innerText() { return leaves.filter((leaf) => !leaf.removed).map((leaf) => leaf.innerText).join("\n"); },
  };
  const chatArea = {
    innerText: "Full synthetic customer message...\nFull synthetic seller response...\nReply\nPick a template…\nCopy",
    querySelectorAll: (selector) => selector.includes("message") ? [partialMessage] : [],
    cloneNode: () => clone,
  };
  const result = extract(chatArea);
  assert.match(result.records[0].etsyChatText, /Full synthetic customer message with several useful details/);
  assert.match(result.records[0].etsyChatText, /Full synthetic seller response with additional details/);
  assert.doesNotMatch(result.records[0].etsyChatText, /Pick a template|^Reply$|^Copy$/m);
});

test("keeps separators between visible chat text blocks in the cleaned-panel fallback", () => {
  const leafTexts = [
    "LS Lillie Springer",
    "Etsy conversation",
    "Phát Phan",
    "thank you so much for your help!!",
    "lillie springer",
    "I see the payment has gone through.",
  ];
  const leaves = leafTexts.map((text) => ({ innerText: text, children: [], remove() { this.removed = true; } }));
  const control = { innerText: "Reply", children: [], remove() { this.removed = true; } };
  leaves.push(control);
  const clone = {
    querySelectorAll: (selector) => selector === "*" ? leaves : [],
    cloneNode: () => clone,
    get innerText() { return leaves.filter((leaf) => !leaf.removed).map((leaf) => leaf.innerText).join(""); },
  };
  const chatArea = {
    innerText: leafTexts.join(""),
    querySelectorAll: () => [],
    cloneNode: () => clone,
  };

  const result = extract(chatArea);
  assert.match(result.records[0].etsyChatText, /Lillie Springer\nEtsy conversation/);
  assert.match(result.records[0].etsyChatText, /Phát Phan\nthank you so much/);
  assert.match(result.records[0].etsyChatText, /lillie springer\nI see the payment/);
  assert.doesNotMatch(result.records[0].etsyChatText, /Reply/);
});

test("preserves text on parent elements as well as nested chat elements", () => {
  const textNode = (text) => ({ nodeType: 3, nodeValue: text });
  const makeElement = (tagName, childNodes = [], innerText = "") => {
    const element = {
      nodeType: 1,
      tagName: tagName.toUpperCase(),
      childNodes,
      children: childNodes.filter((child) => child.nodeType === 1),
      innerText,
      removed: false,
      remove() { this.removed = true; },
    };
    return element;
  };
  const firstParagraph = makeElement("p", [textNode("I see the $5 payment has gone through — thank you.")], "I see the $5 payment has gone through — thank you.");
  const instructions = makeElement("div", [
    textNode("I have given our designer "),
    makeElement("strong", [textNode("the exact instructions")], "the exact instructions"),
    textNode(":"),
  ], "I have given our designer the exact instructions:");
  const secondParagraph = makeElement("p", [textNode("The unlimited edits policy covers changes to the design.")], "The unlimited edits policy covers changes to the design.");
  const replyControl = makeElement("div", [textNode("Reply")], "Reply");
  const bubble = makeElement("div", [
    textNode("The customer wrote: "),
    firstParagraph,
    instructions,
    secondParagraph,
    replyControl,
  ], "The customer wrote: I see the $5 payment has gone through — thank you. I have given our designer the exact instructions: The unlimited edits policy covers changes to the design. Reply");
  const allElements = [bubble, firstParagraph, instructions, instructions.children[0], secondParagraph, replyControl];
  const clone = makeElement("div", [bubble], bubble.innerText);
  clone.cloneNode = () => clone;
  clone.querySelectorAll = (selector) => selector === "*" ? allElements : [];
  const chatArea = {
    innerText: bubble.innerText,
    querySelectorAll: () => [],
    cloneNode: () => clone,
  };

  const result = extract(chatArea);
  assert.match(result.records[0].etsyChatText, /The customer wrote:/);
  assert.match(result.records[0].etsyChatText, /I see the \$5 payment has gone through/);
  assert.match(result.records[0].etsyChatText, /I have given our designer the exact instructions/);
  assert.match(result.records[0].etsyChatText, /unlimited edits policy covers changes/);
  assert.doesNotMatch(result.records[0].etsyChatText, /Reply/);
});

test("extracts detail item titles, safe image URLs, and Etsy listing URLs", () => {
  const itemTitleSelector = ".order-item-title, .product-title";
  const itemTitle = { textContent: "Synthetic embroidered item title", innerText: "Synthetic embroidered item title", contains: () => false, matches: () => false, closest: () => null };
  const addOnTitle = { textContent: "Add on Item: Synthetic sleeve option", innerText: "Add on Item: Synthetic sleeve option", children: [] };
  const activitiesHeading = { textContent: "Activities", innerText: "Activities", children: [] };
  const image = { currentSrc: "https://images.example.test/customer-photo.jpg?token=synthetic-secret#preview", getAttribute: (name) => name === "src" ? "https://images.example.test/customer-photo.jpg?token=synthetic-secret#preview" : null, closest: () => null };
  const systemLogo = { currentSrc: "https://sms.example.test/assets/img/icons/platforms/etsy.svg", getAttribute: (name) => name === "src" ? "https://sms.example.test/assets/img/icons/platforms/etsy.svg" : null, closest: () => null };
  const listingLink = { href: "https://www.etsy.com/listing/1234567890/synthetic-item?ref=shop_home", textContent: "Synthetic listing", innerText: "Synthetic listing" };
  const orderDetail = { querySelectorAll: (selector) => selector === itemTitleSelector
    ? [itemTitle]
    : selector === "*"
      ? [addOnTitle, activitiesHeading]
      : [] };
  const result = extract("Synthetic visible conversation", {
    orderDetail,
    querySelectorAll: (selector) => {
      if (selector === "app-order-detail img, app-order-chat-box .chat-area img") return [image, systemLogo];
      if (selector === "app-order-detail a[href], app-order-chat-box a[href]") return [listingLink];
      return [];
    },
  });
  assert.deepEqual(Array.from(result.records[0].items), ["Synthetic embroidered item title", "Add on Item: Synthetic sleeve option"]);
  assert.deepEqual(Array.from(result.records[0].imageUrls), ["https://images.example.test/customer-photo.jpg"]);
  assert.equal(result.records[0].etsyListingUrl, "https://www.etsy.com/listing/1234567890/synthetic-item");
});

test("recognizes the remote-access monitor order component", () => {
  const result = extractRemoteMonitor();
  assert.equal(result.kind, "remote-monitor");
  assert.equal(result.records[0].smsOrderId, "9300017");
  assert.equal(result.records[0].smsInternalId, "");
  assert.deepEqual(Array.from(result.records[0].items), ["Synthetic item title"]);
  assert.equal(result.records[0].detailSource, "remote-access-monitor");
});
