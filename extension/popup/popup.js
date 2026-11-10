const status = document.querySelector("#status");
const buttons = [...document.querySelectorAll("button")];

async function readVisibleOrders() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) throw new Error("No active tab is available.");
  const results = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ["src/parser.js", "src/page-extractor.js"],
  });
  return results[0]?.result ?? [];
}

async function exportOrders(format) {
  buttons.forEach((button) => { button.disabled = true; });
  status.textContent = "Reading visible rows…";
  try {
    const records = await readVisibleOrders();
    if (!records.length) throw new Error("No matching visible order rows were found.");
    const content = format === "json" ? CSReplyExport.toJson(records) : CSReplyExport.toCsv(records);
    const blob = new Blob([content], { type: format === "json" ? "application/json" : "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "etsy-sms-orders-" + new Date().toISOString().slice(0, 10) + "." + format;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    status.textContent = "Exported " + records.length + " visible row(s).";
  } catch (error) {
    status.textContent = error.message || "Could not read this tab.";
  } finally {
    buttons.forEach((button) => { button.disabled = false; });
  }
}

document.querySelector("#json").addEventListener("click", () => exportOrders("json"));
document.querySelector("#csv").addEventListener("click", () => exportOrders("csv"));
