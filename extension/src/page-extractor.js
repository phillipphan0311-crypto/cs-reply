(function () {
  const table = [...document.querySelectorAll("table")]
    .find((candidate) => /Order Number/i.test(candidate.innerText) && /\bID\b/i.test(candidate.innerText));
  if (table) {
    return globalThis.CSReplyParser.parseOrdersDocument(table.outerHTML, window.location.href);
  }

  const headerCells = [...document.querySelectorAll(".datatable-header-cell, [role='columnheader']")];
  const dataRows = [...document.querySelectorAll(".datatable-body-row, [role='row']")]
    .filter((row) => !row.querySelector(".datatable-header-cell, [role='columnheader']"));
  if (!headerCells.length || !dataRows.length) return [];
  const cellHtml = (row) => [...row.querySelectorAll(".datatable-body-cell, [role='gridcell']")]
    .map((cell) => "<td>" + cell.innerHTML + "</td>").join("");
  const normalizedTable = "<table><tr>" +
    headerCells.map((cell) => "<th>" + cell.textContent + "</th>").join("") +
    "</tr>" + dataRows.map((row) => "<tr>" + cellHtml(row) + "</tr>").join("") + "</table>";
  return globalThis.CSReplyParser.parseOrdersDocument(normalizedTable, window.location.href);
})();
