// Preserve legacy service URLs, search terms and deep links after the guide merge.
location.replace(
  "guide.html" + location.search + (location.hash || "#services"),
);
