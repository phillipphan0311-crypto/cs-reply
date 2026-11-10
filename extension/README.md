# CS Reply Etsy SMS Reader 0.1.4

## Install

1. Extract this ZIP.
2. Open chrome://extensions and enable Developer mode.
3. Choose Load unpacked and select this extension folder.
4. Open the SMS Orders List or an order detail page, then open the extension and export JSON or CSV.

## Order detail export

- smsOrderId is read from the Order heading.
- etsyOrderId is read from the Etsy order number shown near a supported shop.
- smsInternalId is read from the URL id parameter.
- The visible page text is also included in detailText.

The extension does not open pages or click controls. It reads the current page after the operator opens the popup. The full detail text can contain customer information; keep exports private.
