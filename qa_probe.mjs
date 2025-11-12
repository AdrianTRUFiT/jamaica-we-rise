// qa_probe.mjs
import fetch from "node-fetch";

const BACKEND = "http://127.0.0.1:10000";

async function get(path) {
  const r = await fetch(BACKEND + path);
  return { ok: r.ok, status: r.status, path, ct: r.headers.get("content-type"), body: r };
}

async function post(path, body) {
  const r = await fetch(BACKEND + path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return { ok: r.ok, status: r.status, path, ct: r.headers.get("content-type"), body: r };
}

(async () => {
  const results = [];
  results.push(await get("/health"));
  results.push(
    await post("/create-checkout-session", {
      name: "QA Tester",
      email: "qa@example.com",
      amount: 5,
    })
  );
  results.push(await get("/check-username/qatester"));
  results.push(await get("/donations/stats"));

  for (const r of results) {
    let snippet = "";
    try {
      const j = await r.body.clone().json();
      snippet = JSON.stringify(j).slice(0, 120);
    } catch {
      const t = await r.body.text();
      snippet = (t || "").slice(0, 120);
    }
    console.log(
      `${r.ok ? "✅" : "❌"} [${r.status}] ${r.path} ct=${r.ct} -> ${snippet}`
    );
  }
})();
