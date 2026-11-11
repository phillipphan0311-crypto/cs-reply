(function () {
  const table = [...document.querySelectorAll("table")]
    .find((candidate) => /Order Number/i.test(candidate.innerText) && /\bID\b/i.test(candidate.innerText));
  if (table) {
    const records = globalThis.CSReplyParser.parseOrdersDocument(table.outerHTML, window.location.href);
    if (records.length) return { kind: "list", records };
  }

  const headerCells = [...document.querySelectorAll(".datatable-header-cell, [role='columnheader']")];
  const dataRows = [...document.querySelectorAll(".datatable-body-row, [role='row']")]
    .filter((row) => !row.querySelector(".datatable-header-cell, [role='columnheader']"));
  if (headerCells.length && dataRows.length) {
    const cellHtml = (row) => [...row.querySelectorAll(".datatable-body-cell, [role='gridcell']")]
      .map((cell) => "<td>" + cell.innerHTML + "</td>").join("");
    const normalizedTable = "<table><tr>" +
      headerCells.map((cell) => "<th>" + cell.textContent + "</th>").join("") +
      "</tr>" + dataRows.map((row) => "<tr>" + cellHtml(row) + "</tr>").join("") + "</table>";
    const records = globalThis.CSReplyParser.parseOrdersDocument(normalizedTable, window.location.href);
    if (records.length) return { kind: "list", records };
  }

  const chatArea = document.querySelector("app-order-chat-box .chat-container .chat-area");
  const textOf = (element) => (element?.innerText ?? element?.textContent ?? "").trim();
  const extractChatText = (area) => {
    if (!area) return "";
    const messageNodes = [...(area.querySelectorAll?.("[data-message-id], [data-testid*='message'], [class*='message'], [class*='bubble']") ?? [])]
      .filter((element) => !/^(?:SVG|PATH|BUTTON|INPUT|SELECT|TEXTAREA)$/i.test(element.tagName ?? ""))
      .filter((element) => !element.matches?.("button, [role='button'], [role='combobox'], [contenteditable='true'], input, textarea, select"))
      .filter((element) => !element.closest?.("button, [role='button'], [role='combobox'], [contenteditable='true'], input, textarea, select, [class*='composer'], [class*='template'], [class*='reply-box'], [class*='toolbar']"))
      .filter((element) => textOf(element));
    const messageLeaves = messageNodes.filter((element) =>
      !messageNodes.some((candidate) => candidate !== element && element.contains?.(candidate)));
    const semanticText = [...new Set(messageLeaves.map(textOf).filter(Boolean))].join("\n\n");

    const clone = area.cloneNode?.(true);
    if (!clone) return semanticText;
    clone.querySelectorAll?.("button, input, select, textarea, [role='button'], [role='combobox'], [contenteditable='true'], [class*='composer'], [class*='template'], [class*='reply-box'], [class*='toolbar']")
      .forEach((element) => element.remove());
    [...(clone.querySelectorAll?.("*") ?? [])]
      .filter((element) => !element.children?.length && /^(?:Reply|Copy|Pick a template…?|Confirm address\s*[·-].*|\d+\.\s*.+\s*[·-]\s*this shop)$/i.test(textOf(element)))
      .forEach((element) => element.remove());
    const blockTags = new Set(["ADDRESS", "ARTICLE", "BLOCKQUOTE", "DD", "DIV", "DL", "DT", "FIELDSET", "FIGCAPTION", "FIGURE", "FOOTER", "H1", "H2", "H3", "H4", "H5", "H6", "HEADER", "LI", "MAIN", "OL", "P", "SECTION", "UL"]);
    const renderNode = (node) => {
      if (!node || node.removed) return "";
      if (node.nodeType === 3) return node.nodeValue ?? node.textContent ?? "";
      if (node.nodeType === 1) {
        if (node.hidden || node.getAttribute?.("aria-hidden") === "true") return "";
        const style = window.getComputedStyle?.(node);
        if (style?.display === "none" || style?.visibility === "hidden") return "";
      }
      const children = [...(node.childNodes ?? [])];
      if (!children.length) return textOf(node);
      let result = "";
      let previousWasBlock = false;
      for (const child of children) {
        const part = renderNode(child);
        if (!part) continue;
        const isBlock = blockTags.has(child.tagName?.toUpperCase());
        if (result) {
          if (isBlock || previousWasBlock) result += "\n";
          else if (/[\p{L}\p{N}]$/u.test(result) && /^[\p{L}\p{N}]/u.test(part)) result += " ";
        }
        result += part;
        previousWasBlock = isBlock;
      }
      return result;
    };
    let cleanedVisibleText;
    if (clone.childNodes != null) {
      cleanedVisibleText = renderNode(clone)
        .replace(/[ \t]*\n[ \t]*/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .replace(/[ \t]{2,}/g, " ")
        .trim();
    } else {
      // Test doubles and older host wrappers may expose only leaf text elements.
      cleanedVisibleText = [...(clone.querySelectorAll?.("*") ?? [])]
        .filter((element) => !element.removed && !element.children?.length)
        .map(textOf)
        .filter(Boolean)
        .join("\n") || textOf(clone);
    }
    // The cleaned cloned panel retains parent text and nested message content;
    // semantic candidates are only a fallback when the panel exposes no text.
    return cleanedVisibleText || semanticText;
  };
  const etsyChatText = extractChatText(chatArea);
  const itemTitleSelector = ".order-item-title, .product-title";
  const orderDetailRoot = document.querySelector("app-order-detail") ?? document;
  const itemCandidates = [...(orderDetailRoot.querySelectorAll?.(itemTitleSelector) ?? [])]
    .filter((element) => !element.matches?.("button, [role='button']"))
    .filter((element) => !element.closest?.("app-order-chat-box"));
  const explicitItemTitles = itemCandidates
    .filter((element) => !itemCandidates.some((candidate) => candidate !== element && element.contains?.(candidate)))
    .map(textOf)
    .filter((title) => title && title.length <= 300 && !/^(?:Order\s*#|Activities\b|Design Information\b|Personalization\b|Gift Message\b|Shipping Address\b|Payment\b|Tags\b|Fulfillment\b)/i.test(title));
  const addOnTitles = [...(orderDetailRoot.querySelectorAll?.("*") ?? [])]
    .filter((element) => !element.children?.length)
    .map(textOf)
    .filter((title) => /^Add on Item:\s*\S/i.test(title) && title.length <= 300);
  const items = [...new Set([...explicitItemTitles, ...addOnTitles])];
  const imageUrls = [...document.querySelectorAll("app-order-detail img, app-order-chat-box .chat-area img")]
    .filter((image) => !image.closest?.("[class*='avatar'], [class*='logo']"))
    .map((image) => ({ image, source: image.currentSrc || image.getAttribute("src") || image.getAttribute("data-src") || "" }))
    .map(({ image, source }) => {
      try {
        const url = new URL(source, window.location.href);
        if (!/^https?:$/.test(url.protocol)) return "";
        const className = typeof image.className === "string" ? image.className : "";
        const metadata = `${image.alt ?? ""} ${image.getAttribute("title") ?? ""} ${className}`;
        const systemContainer = image.closest?.("[class*='icon'], [class*='platform']");
        if (/\b(?:logo|avatar|icon|easypost)\b/i.test(metadata) || systemContainer) return "";
        if (/developers\.etsy\.com/i.test(url.hostname) || /(?:^|\/)(?:[^/]*logo[^/]*|icons?\/platforms\/[^/]+)\.(?:svg|png|jpe?g|webp)$/i.test(url.pathname)) return "";
        url.search = "";
        url.hash = "";
        return url.href;
      } catch { return ""; }
    })
    .filter(Boolean);
  const etsyListingUrl = [...document.querySelectorAll("app-order-detail a[href], app-order-chat-box a[href]")]
    .map((link) => {
      try {
        const url = new URL(link.href, window.location.href);
        if (!/(^|\.)etsy\.com$/i.test(url.hostname) || !/^\/listing\/\d+/i.test(url.pathname)) return "";
        url.search = "";
        url.hash = "";
        return url.href;
      } catch { return ""; }
    })
    .find(Boolean) ?? "";
  const detailOptions = { items, imageUrls: [...new Set(imageUrls)], etsyListingUrl, etsyChatText };
  if (window.location.pathname.replace(/\/+$/, "") === "/remote-access/monitor" && document.querySelector("app-order-detail")) {
    const remoteDetail = globalThis.CSReplyParser.parseOrderDetailDocument(
      document.body?.innerText,
      window.location.href,
      { ...detailOptions, allowMissingInternalId: true, detailSource: "remote-access-monitor" },
    );
    return remoteDetail
      ? { kind: "remote-monitor", records: [remoteDetail] }
      : { kind: "unsupported", records: [] };
  }
  const detail = globalThis.CSReplyParser.parseOrderDetailDocument(
    document.body?.innerText,
    window.location.href,
    detailOptions,
  );
  return detail ? { kind: "detail", records: [detail] } : { kind: "unsupported", records: [] };
})();
