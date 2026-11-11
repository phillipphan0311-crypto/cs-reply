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

  const etsyChatText = document.querySelector("app-order-chat-box .chat-container .chat-area")?.innerText?.trim() ?? "";
  const detail = globalThis.CSReplyParser.parseOrderDetailDocument(
    document.body?.innerText,
    window.location.href,
    etsyChatText,
  );
  return detail ? { kind: "detail", records: [detail] } : { kind: "unsupported", records: [] };
})();
