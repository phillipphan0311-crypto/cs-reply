(function attachFilename(root) {
  const dateStamp = (date) => date.toISOString().slice(0, 10);
  root.CSReplyFilename = {
    create: (kind, records, format, date = new Date()) => {
      const smsOrderId = String(records[0]?.smsOrderId ?? "");
      const safeId = /^\d+$/.test(smsOrderId) ? smsOrderId : "unknown";
      if (kind === "remote-monitor") {
        return `etsy-sms-remote-order-${safeId}-${dateStamp(date)}.${format}`;
      }
      if (kind === "detail") {
        return `etsy-sms-order-detail-${safeId}-${dateStamp(date)}.${format}`;
      }
      return `etsy-sms-orders-list-${dateStamp(date)}.${format}`;
    },
  };
})(globalThis);
