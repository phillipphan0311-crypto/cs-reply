(function attachParser(root) {
  const ALERTS = ["URGENT", "LATE SHIP"];
  const SHOPS = [
    "VuEmbroidery", "KevinEmbroidery", "MarkEmbroideryy",
    "BruceEmbroideryStore", "DogFactsFun", "VinkEmbroidery",
  ];
  const STATUSES = ["Pending", "New", "Designing", "Designed", "Clarification"];
  const clean = (value) => decodeEntities(value)
    .replace(/<br\s*\/?\s*>/gi, "\n")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  function decodeEntities(value) {
    return value.replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&")
      .replace(/&lt;/gi, "<").replace(/&gt;/gi, ">")
      .replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'");
  }

  function blocks(html) {
    return [...html.matchAll(/<(?:span|a|button|div)[^>]*>([\s\S]*?)<\/(?:span|a|button|div)>/gi)]
      .map((match) => clean(match[1])).filter(Boolean);
  }

  function cells(row) {
    return [...row.matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((match) => match[1]);
  }

  function parseOrdersDocument(html, pageUrl = "") {
    const table = [...html.matchAll(/<table\b[^>]*>[\s\S]*?<\/table>/gi)]
      .find((match) => /Order Number/i.test(match[0]) && /\bID\b/i.test(match[0]));
    if (!table) return [];
    const rowHtml = [...table[0].matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].map((match) => match[1]);
    if (!rowHtml.length) return [];
    const headers = cells(rowHtml[0]).map((cell) => clean(cell).toLowerCase());
    const indexOf = (...names) => headers.findIndex((header) => names.includes(header));
    const indexes = {
      smsOrderId: indexOf("id"), shop: indexOf("store", "shop"),
      etsyOrderId: indexOf("order number", "order no."),
      orderDate: indexOf("order date"), shipDeadline: indexOf("ship deadline", "ship by"),
      status: indexOf("status"), items: indexOf("items", "item"),
      tags: indexOf("tags", "tag"), notes: indexOf("notes", "note"),
    };
    if (indexes.smsOrderId < 0 || indexes.etsyOrderId < 0) return [];
    let baseUrl = "";
    try { baseUrl = new URL(pageUrl).href; } catch {}
    const records = [];
    const seenSmsIds = new Set();
    const seenEtsyIds = new Set();

    for (const row of rowHtml.slice(1)) {
      const values = cells(row);
      const at = (key) => indexes[key] < 0 ? "" : (values[indexes[key]] ?? "");
      const smsOrderId = clean(at("smsOrderId"));
      const etsyCell = at("etsyOrderId");
      const orderAlerts = [...new Set([...blocks(etsyCell), ...blocks(row)]
        .map((token) => ALERTS.find((label) => token.toUpperCase() === label))
        .filter(Boolean))];
      let etsyOrderId = clean(etsyCell);
      for (const alert of orderAlerts) etsyOrderId = etsyOrderId.replace(new RegExp(alert, "ig"), " ");
      etsyOrderId = etsyOrderId.match(/\b\d{6,}\b/)?.[0] ?? "";
      if (smsOrderId && !/^\d+$/.test(smsOrderId)) continue;
      if (!smsOrderId && !etsyOrderId) continue;
      const detailHref = [...row.matchAll(/\bhref\s*=\s*["']([^"']+)["']/gi)]
        .map((match) => match[1]).find((href) => /(?:\?|&)id=/i.test(href));
      let detailUrl = "", smsInternalId = "";
      try {
        if (detailHref) {
          const url = new URL(detailHref, baseUrl || undefined);
          detailUrl = url.href;
          smsInternalId = url.searchParams.get("id") ?? "";
        }
      } catch {}
      const tagCell = at("tags");
      const tags = (blocks(tagCell).length ? blocks(tagCell) : (clean(tagCell) ? [clean(tagCell)] : []))
        .filter((tag) => !ALERTS.includes(tag.toUpperCase()));
      const record = {
        smsOrderId, etsyOrderId, smsInternalId,
        shop: clean(at("shop")), marketplace: "Etsy",
        orderDate: clean(at("orderDate")), shipDeadline: clean(at("shipDeadline")),
        status: clean(at("status")), items: clean(at("items")), tags, orderAlerts,
        notes: at("notes").replace(/<br\s*\/?\s*>/gi, "\n").replace(/<[^>]*>/g, "").trim(),
        detailUrl,
      };
      if (smsOrderId) {
        if (seenSmsIds.has(smsOrderId)) continue;
        seenSmsIds.add(smsOrderId);
      } else {
        if (seenEtsyIds.has(etsyOrderId)) continue;
        seenEtsyIds.add(etsyOrderId);
      }
      records.push(record);
    }
    return records;
  }

  function parseOrderDetailDocument(visibleText, pageUrl = "") {
    let pageUrlObject;
    try { pageUrlObject = new URL(pageUrl); } catch { return null; }
    const smsInternalId = pageUrlObject.searchParams.get("id") ?? "";
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(smsInternalId)) return null;
    const safeUrl = new URL(pageUrlObject.origin + pageUrlObject.pathname);
    safeUrl.searchParams.set("id", smsInternalId);
    const detailText = String(visibleText ?? "").trim();
    const lines = detailText.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const headingLine = lines.find((line) => /^Order\s*#\s*\d+/i.test(line)) ?? "";
    const smsOrderId = headingLine.match(/^Order\s*#\s*(\d+)/i)?.[1] ?? "";
    const headingIndex = lines.indexOf(headingLine);
    const statusWindow = lines.slice(Math.max(0, headingIndex), Math.max(0, headingIndex) + 4).join(" ");
    const status = STATUSES.find((value) => new RegExp("\\b" + value + "\\b", "i").test(statusWindow)) ?? "";
    const shopIndex = lines.findIndex((line) => SHOPS.some((name) => line === name || line.startsWith(name + " ")));
    const shop = SHOPS.find((name) => shopIndex >= 0 &&
      (lines[shopIndex] === name || lines[shopIndex].startsWith(name + " "))) ?? "";
    const shopWindow = shop ? lines.slice(shopIndex, shopIndex + 7) : [];
    const etsyOrderId = shopWindow.map((line) => line.match(/#\s*(\d{6,})/)?.[1]).find(Boolean) ?? "";
    const orderDate = shopWindow.map((line) => line.match(/\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},\s+\d{1,2}:\d{2}\b/i)?.[0]).find(Boolean) ?? "";
    const shipDeadline = detailText.match(/\bSHIP\s+BY\s+((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2})\b/i)?.[1] ?? "";
    return {
      smsOrderId,
      etsyOrderId,
      smsInternalId,
      shop,
      marketplace: "Etsy",
      orderDate,
      shipDeadline,
      status,
      items: "",
      tags: [],
      orderAlerts: [],
      notes: "",
      detailUrl: safeUrl.href,
      detailText,
    };
  }

  root.CSReplyParser = { parseOrdersDocument, parseOrderDetailDocument };
})(globalThis);
