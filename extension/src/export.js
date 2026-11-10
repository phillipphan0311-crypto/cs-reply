(function attachExport(root) {
  const fields = [
    "smsOrderId", "etsyOrderId", "smsInternalId", "shop", "marketplace",
    "orderDate", "shipDeadline", "status", "items", "tags", "orderAlerts",
    "notes", "detailUrl",
  ];
  const csvValue = (value) => {
    const text = Array.isArray(value) ? value.join(" | ") : String(value ?? "");
    return '"' + text.replaceAll('"', '""') + '"';
  };
  root.CSReplyExport = {
    toJson: (records) => JSON.stringify(records, null, 2),
    toCsv: (records) => [
      fields.join(","),
      ...records.map((record) => fields.map((field) => csvValue(record[field])).join(",")),
    ].join("\r\n"),
  };
})(globalThis);
