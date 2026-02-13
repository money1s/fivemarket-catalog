function phpSerializeString(value) {
  const normalized = String(value ?? "");
  return `s:${Buffer.byteLength(normalized, "utf8")}:"${normalized}";`;
}

function phpSerializeAssoc(entries) {
  return `a:${entries.length}:{${entries.map(([key, value]) => `${phpSerializeString(key)}${phpSerializeString(value)}`).join("")}}`;
}

function buildProductsPayloadFromCartItems(cartItemsRaw) {
  if (!cartItemsRaw) {
    return "";
  }

  try {
    const parsed = JSON.parse(cartItemsRaw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return "";
    }

    const body = parsed
      .map((item, index) => {
        const productId = String(item.crm_id ?? item.product_id ?? 0);
        const price = String(item.price_uah ?? item.price ?? 0);
        const count = String(item.quantity ?? item.count ?? 1);
        const assoc = phpSerializeAssoc([
          ["product_id", productId],
          ["price", price],
          ["count", count],
        ]);

        return `i:${index};${assoc}`;
      })
      .join("");

    return `a:${parsed.length}:{${body}}`;
  } catch {
    return "";
  }
}

function getHeader(headers, key) {
  return headers[key] || headers[key.toLowerCase()] || "";
}

function buildSenderPayload(event, fallbackSender) {
  if (fallbackSender && /^a:\d+:\{/.test(fallbackSender)) {
    return fallbackSender;
  }

  const headers = event.headers || {};
  const host = getHeader(headers, "x-forwarded-host") || getHeader(headers, "host");
  const forwardedFor = getHeader(headers, "x-forwarded-for");
  const remoteAddr = (forwardedFor || "").split(",")[0].trim();
  const referrer = getHeader(headers, "referer");
  const userAgent = getHeader(headers, "user-agent");
  const requestUri =
    (event.rawUrl && (() => {
      try {
        const parsed = new URL(event.rawUrl);
        return `${parsed.pathname}${parsed.search || ""}`;
      } catch {
        return "";
      }
    })()) || "/checkout/";

  const entries = [
    ["HTTP_HOST", host],
    ["REQUEST_URI", requestUri],
    ["REMOTE_ADDR", remoteAddr],
    ["HTTP_X_FORWARDED_FOR", forwardedFor],
    ["HTTP_REFERER", referrer],
    ["HTTP_USER_AGENT", userAgent],
  ].filter(([, value]) => String(value || "").length > 0);

  return phpSerializeAssoc(entries);
}

function parseBody(event) {
  const raw = event.body || "";
  const params = new URLSearchParams(raw);
  const result = {};
  for (const [key, value] of params.entries()) {
    result[key] = value;
  }
  return result;
}

function appendIfPresent(params, key, value) {
  if (value !== undefined && value !== null && String(value).length > 0) {
    params.set(key, String(value));
  }
}

exports.handler = async function handler(event) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  const form = parseBody(event);
  const headers = event.headers || {};
  const host = getHeader(headers, "x-forwarded-host") || getHeader(headers, "host");
  const proto = getHeader(headers, "x-forwarded-proto") || "https";

  const crmEndpoint =
    process.env.CRM_ORDER_ENDPOINT ||
    process.env.NEXT_PUBLIC_CRM_FORM_ACTION ||
    form.crm_action ||
    "";
  const crmApiKey =
    process.env.CRM_API_KEY ||
    process.env.NEXT_PUBLIC_CRM_API_KEY ||
    form.key ||
    "";
  const crmOffice = process.env.CRM_OFFICE || process.env.NEXT_PUBLIC_CRM_OFFICE || form.office || "9";
  const crmCountry = process.env.CRM_COUNTRY || process.env.NEXT_PUBLIC_CRM_COUNTRY || form.country || "UA";
  const crmDelivery = process.env.CRM_DELIVERY_ID || process.env.NEXT_PUBLIC_CRM_DELIVERY_ID || form.delivery || "1";
  const crmPayment = process.env.CRM_PAYMENT_ID || process.env.NEXT_PUBLIC_CRM_PAYMENT_ID || form.payment || "4";
  const crmEmail = process.env.CRM_DEFAULT_EMAIL || process.env.NEXT_PUBLIC_CRM_DEFAULT_EMAIL || form.email || "";

  if (!crmEndpoint || !crmApiKey) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "CRM endpoint or API key is not configured" }),
    };
  }

  const orderId = form.order_id || String(Date.now());
  const productsPayload =
    buildProductsPayloadFromCartItems(form.cart_items) || form.products || "";
  const senderPayload = buildSenderPayload(event, form.sender);

  const crmParams = new URLSearchParams();
  appendIfPresent(crmParams, "key", crmApiKey);
  appendIfPresent(crmParams, "order_id", orderId);
  appendIfPresent(crmParams, "country", crmCountry);
  appendIfPresent(crmParams, "office", crmOffice);
  appendIfPresent(crmParams, "products", productsPayload);
  appendIfPresent(crmParams, "bayer_name", form.bayer_name || form.name || "");
  appendIfPresent(crmParams, "phone", form.phone || "");
  appendIfPresent(crmParams, "email", crmEmail);
  appendIfPresent(crmParams, "comment", form.comment || form.product_name || "");
  appendIfPresent(crmParams, "delivery", crmDelivery);
  appendIfPresent(crmParams, "delivery_adress", form.delivery_adress || form.office_address || "");
  appendIfPresent(crmParams, "payment", crmPayment);
  appendIfPresent(crmParams, "sender", senderPayload);
  appendIfPresent(crmParams, "utm_source", form.utm_source || "");
  appendIfPresent(crmParams, "utm_medium", form.utm_medium || "");
  appendIfPresent(crmParams, "utm_term", form.utm_term || "");
  appendIfPresent(crmParams, "utm_content", form.utm_content || "");
  appendIfPresent(crmParams, "utm_campaign", form.utm_campaign || "");
  appendIfPresent(crmParams, "additional_1", form.additional_1 || "");
  appendIfPresent(crmParams, "additional_2", form.additional_2 || "");
  appendIfPresent(crmParams, "additional_3", form.additional_3 || "");
  appendIfPresent(crmParams, "additional_4", form.additional_4 || "");

  appendIfPresent(crmParams, "price", form.price || "");
  appendIfPresent(crmParams, "id", form.id || "");
  appendIfPresent(crmParams, "quantity", form.quantity || "");
  appendIfPresent(crmParams, "order_items", form.order_items || "");
  appendIfPresent(crmParams, "product_name", form.product_name || "");
  appendIfPresent(crmParams, "user_ip", form.user_ip || "");

  let crmOk = false;
  let crmOrderId = "";
  let crmResponseText = "";
  try {
    const crmResponse = await fetch(crmEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: crmParams.toString(),
    });
    crmResponseText = await crmResponse.text();

    if (crmResponse.ok) {
      try {
        const parsed = JSON.parse(crmResponseText);
        crmOk = parsed?.status === "ok";
        crmOrderId = parsed?.data?.[0]?.id ? String(parsed.data[0].id) : "";
      } catch {
        crmOk = crmResponse.ok;
      }
    }
  } catch (error) {
    crmResponseText = String(error);
    crmOk = false;
  }

  const fallbackThanks = `${proto}://${host}/thanks/`;
  const redirectRaw = form.success_url || form.redirect || form.success_redirect || fallbackThanks;
  const redirectUrl = new URL(redirectRaw, fallbackThanks);
  redirectUrl.searchParams.set("crm_status", crmOk ? "ok" : "error");
  if (crmOrderId) {
    redirectUrl.searchParams.set("crm_order_id", crmOrderId);
  }
  if (!crmOk && crmResponseText) {
    redirectUrl.searchParams.set("crm_message", crmResponseText.slice(0, 180));
  }

  return {
    statusCode: 302,
    headers: {
      Location: redirectUrl.toString(),
      "Cache-Control": "no-store",
    },
    body: "",
  };
};
