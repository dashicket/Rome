(function () {
  "use strict";
  // Only known article IDs can become a redirect destination.
  const pages = {
  "operation-hours": "notice-operation-hours.html",
  "privacy-verification": "notice-privacy-verification.html",
  "small-payment-checklist": "notice-small-payment-checklist.html",
  "content-fee-range": "notice-content-fee-range.html",
  "bank-maintenance": "notice-bank-maintenance.html"
};
  const id = new URLSearchParams(location.search).get("id");
  const destination = id === null ? pages["operation-hours"] : Object.hasOwn(pages, id) ? pages[id] : "faq.html#notices";
  location.replace(destination);
})();
