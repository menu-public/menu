
(() => {
  const ENDPOINT = "https://public-menu-analytics.io-stalin.workers.dev/track";

  function getSessionId() {
    let id = sessionStorage.getItem("analytics_session");

    if (!id) {
      id = crypto.randomUUID().replace(/-/g, "");
      sessionStorage.setItem("analytics_session", id);
    }

    return id;
  }

  function getLanguage() {
    const htmlLang = document.documentElement.lang || "";

    if (htmlLang.startsWith("he")) return "he";
    if (htmlLang.startsWith("ru")) return "ru";
    if (htmlLang.startsWith("en")) return "en";

    return "unknown";
  }

  function detectSource() {
    const params = new URLSearchParams(location.search);

    if (params.get("utm_source"))
      return params.get("utm_source");

    if (document.referrer)
      return new URL(document.referrer).hostname;

    return "direct";
  }

  function sendAnalytics() {
    const navigation =
      performance.getEntriesByType("navigation")[0];

    const payload = {
      page: location.pathname,
      page_title: document.title,
      language: getLanguage(),

      source: detectSource(),
      referrer: document.referrer || "direct",

      utm_source:
        new URLSearchParams(location.search).get("utm_source") || "",
      utm_medium:
        new URLSearchParams(location.search).get("utm_medium") || "",
      utm_campaign:
        new URLSearchParams(location.search).get("utm_campaign") || "",
      utm_content:
        new URLSearchParams(location.search).get("utm_content") || "",
      utm_term:
        new URLSearchParams(location.search).get("utm_term") || "",

      screen_size:
        screen.width + "x" + screen.height,

      session_id: getSessionId(),

      status_code: 200,

      load_time_ms: navigation
        ? Math.round(navigation.loadEventEnd)
        : null
    };

    fetch(ENDPOINT, {
      method: "POST",
      mode: "cors",
      keepalive: true,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    }).catch(() => {});
  }

  if (document.readyState === "complete") {
    sendAnalytics();
  } else {
    window.addEventListener("load", sendAnalytics, {
      once: true
    });
  }
})();
