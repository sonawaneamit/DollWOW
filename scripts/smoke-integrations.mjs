import fs from "node:fs";

const API_VERSION = "2026-04";

function loadEnvFile(path = ".env.local") {
  if (!fs.existsSync(path)) return;
  for (const rawLine of fs.readFileSync(path, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#") || !line.includes("=")) continue;
    const [key, ...rest] = line.split("=");
    if (!process.env[key]) {
      process.env[key] = rest.join("=").trim().replace(/^["']|["']$/g, "");
    }
  }
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is missing`);
  return value;
}

function storefrontAuthHeaders(token) {
  const trimmed = token.trim();
  const looksPrivate = /^shpat_|^shpua_/i.test(trimmed);

  return looksPrivate
    ? { "Shopify-Storefront-Private-Token": trimmed }
    : { "X-Shopify-Storefront-Access-Token": trimmed };
}

async function checkShopify() {
  const domain = requireEnv("SHOPIFY_STORE_DOMAIN").replace(/^https?:\/\//, "");
  const token = requireEnv("SHOPIFY_STOREFRONT_ACCESS_TOKEN");
  const response = await fetch(`https://${domain}/api/${API_VERSION}/graphql.json`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...storefrontAuthHeaders(token)
    },
    body: JSON.stringify({
      query: `query Smoke {
        shop { name }
        products(first: 1) { edges { node { id handle title } } }
      }`
    })
  });

  const payload = await response.json();
  if (!response.ok || payload.errors?.length) {
    const errorText = payload.errors?.map((error) => error.message).filter(Boolean).join("; ");
    throw new Error(errorText || `Shopify returned ${response.status}`);
  }

  const product = payload.data.products.edges[0]?.node;
  console.log("Shopify: ok", {
    shop: payload.data.shop.name,
    firstProduct: product ? `${product.title} (${product.handle})` : "no published products"
  });
}

async function checkSupabase() {
  const url = requireEnv("SUPABASE_URL").replace(/\/$/, "");
  const serviceRole = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  const response = await fetch(`${url}/rest/v1/support_leads?select=id&limit=1`, {
    headers: {
      apikey: serviceRole,
      authorization: `Bearer ${serviceRole}`
    }
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase returned ${response.status}: ${text}`);
  }

  console.log("Supabase: ok", { supportLeadsTable: "reachable" });
}

loadEnvFile();

try {
  try {
    await checkShopify();
  } catch (error) {
    throw new Error(`Shopify check failed: ${error instanceof Error ? error.message || error.name : String(error)}`);
  }

  try {
    await checkSupabase();
  } catch (error) {
    throw new Error(`Supabase check failed: ${error instanceof Error ? error.message || error.name : String(error)}`);
  }

  console.log("Integration smoke test passed.");
} catch (error) {
  console.error("Integration smoke test failed:", error instanceof Error ? error.message : error);
  process.exit(1);
}
