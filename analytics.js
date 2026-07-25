(() => {
  const ENDPOINT =
    "https://public-menu-analytics.io-stalin.workers.dev/track";

  const INTERNAL_HOSTS = new Set([
    "pub-lic.net",
    "www.pub-lic.net",
    "menu-public.github.io",
    location.hostname.toLowerCase()
  ]);

  const ATTRIBUTION_KEY = "analytics_attribution";
  const SESSION_KEY = "analytics_session";

  function getSessionId() {
    let id = sessionStorage.getItem(SESSION_KEY);

    if (!id) {
      if (crypto.randomUUID) {
        id = crypto.randomUUID().replace(/-/g, "");
      } else {
        id =
          Date.now().toString(36) +
          Math.random().toString(36).slice(2);
      }

      sessionStorage.setItem(SESSION_KEY, id);
    }

    return id;
  }

  function getLanguage() {
    const htmlLang =
      document.documentElement.lang.toLowerCase();

    if (htmlLang.startsWith("he")) return "he";
    if (htmlLang.startsWith("ru")) return "ru";
    if (htmlLang.startsWith("en")) return "en";

    return "unknown";
  }

  function getExternalReferrer() {
    if (!document.referrer) {
      return {
        source: "direct",
        referrer: "direct"
      };
    }

    try {
      const referrerUrl = new URL(document.referrer);
      const hostname = referrerUrl.hostname
        .toLowerCase()
        .replace(/^www\./, "");

      const currentHostname = location.hostname
        .toLowerCase()
        .replace(/^www\./, "");

      const isInternal =
        hostname === currentHostname ||
        INTERNAL_HOSTS.has(hostname) ||
        INTERNAL_HOSTS.has(`www.${hostname}`);

      if (isInternal) {
        return {
          source: "direct",
          referrer: "direct"
        };
      }

      return {
        source: hostname,
        referrer: document.referrer
      };
    } catch {
      return {
        source: "direct",
        referrer: "direct"
      };
    }
  }

  function getAttribution() {
    const stored = sessionStorage.getItem(
      ATTRIBUTION_KEY
    );

    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        sessionStorage.removeItem(ATTRIBUTION_KEY);
      }
    }

    const params = new URLSearchParams(location.search);
    const externalReferrer = getExternalReferrer();

    const utmSource =
      params.get("utm_source")?.trim() || "";

    const attribution = {
      source: utmSource || externalReferrer.source,
      referrer: externalReferrer.referrer,

      utm_source: utmSource,
      utm_medium:
        params.get("utm_medium")?.trim() || "",
      utm_campaign:
        params.get("utm_campaign")?.trim() || "",
      utm_content:
        params.get("utm_content")?.trim() || "",
      utm_term:
        params.get("utm_term")?.trim() || ""
    };

    sessionStorage.setItem(
      ATTRIBUTION_KEY,
      JSON.stringify(attribution)
    );

    return attribution;
  }

  function sendAnalytics() {
    const navigation =
      performance.getEntriesByType("navigation")[0];

    const attribution = getAttribution();

    const payload = {
      page: location.pathname,
      page_title: document.title,
      language: getLanguage(),

      source: attribution.source,
      referrer: attribution.referrer,

      utm_source: attribution.utm_source,
      utm_medium: attribution.utm_medium,
      utm_campaign: attribution.utm_campaign,
      utm_content: attribution.utm_content,
      utm_term: attribution.utm_term,

      screen_size:
        `${screen.width}x${screen.height}`,

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
    window.addEventListener(
      "load",
      sendAnalytics,
      { once: true }
    );
  }
})();
