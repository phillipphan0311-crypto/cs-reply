(function attachFilename(root) {
  const dateStamp = (date) => date.toISOString().slice(0, 10);
  root.CSReplyFilename = {
    create: (kind, records, format, date = new Date()) => {
      if (kind === "detail") {
        const smsOrderId = String(records[0]?.smsOrderId ?? "");
        const safeId = /^\d+$/.test(smsOrderId) ? smsOrderId : "unknown";
        return `etsy-sms-order-detail-${safeId}-${dateStamp(date)}.${format}`;
      }
      return `etsy-sms-orders-list-${dateStamp(date)}.${format}`;
    },
  };
})(globalThis);
