import { getStore } from "@netlify/blobs";

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });

export default async (req) => {
  const store = getStore("vault");

  if (req.method === "GET") {
    const data = await store.get("menu", { type: "json" });
    return json(data ?? null);
  }

  if (req.method === "POST") {
    const expected = Netlify.env.get("ADMIN_PASSWORD");
    if (!expected) return json({ error: "ADMIN_PASSWORD is not set in Netlify environment variables." }, 500);
    if (req.headers.get("x-admin-password") !== expected) return json({ error: "Wrong password." }, 401);

    let body;
    try { body = await req.json(); } catch { return json({ error: "Invalid JSON." }, 400); }
    if (!body || typeof body.settings !== "object" || !Array.isArray(body.cookies)) {
      return json({ error: "Menu must include settings and cookies." }, 400);
    }
    await store.setJSON("menu", body);
    return json({ ok: true });
  }

  return json({ error: "Method not allowed." }, 405);
};

export const config = { path: "/api/menu" };
