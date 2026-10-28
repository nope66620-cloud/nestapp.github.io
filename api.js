// Wrapper fetch ke Apps Script backend. Prototype masih pakai data.js dummy;
// ganti sumber data di app.js dari DATA ke API.* bertahap.
(function () {
  const cfg = window.NEST_CONFIG || {};
  const base = (cfg.API_URL || "").replace(/\/$/, "");

  function token() { return localStorage.getItem(cfg.TOKEN_KEY || "nest_token"); }
  function setToken(t) { localStorage.setItem(cfg.TOKEN_KEY || "nest_token", t); }
  function clearToken() { localStorage.removeItem(cfg.TOKEN_KEY || "nest_token"); }

  async function request(action, params, method) {
    method = method || "GET";
    const url = new URL(base);
    url.searchParams.set("action", action);
    if (token()) url.searchParams.set("token", token());
    const opts = { method };
    if (method === "POST") {
      opts.headers = { "Content-Type": "application/json" };
      opts.body = JSON.stringify(Object.assign({ action }, params || {}));
    } else {
      Object.keys(params || {}).forEach(k => url.searchParams.set(k, params[k]));
    }
    const res = await fetch(url.toString(), opts);
    if (!res.ok) throw new Error("HTTP " + res.status);
    const json = await res.json();
    if (json && json.error) throw new Error(json.error);
    return json;
  }

  window.API = {
    token, setToken, clearToken,
    login: (u, pin) => request("auth.login", { username: u, pin }, "POST"),
    accounts: () => request("accounts.list"),
    categories: () => request("categories.list"),
    transactions: (p) => request("transactions.list", p || {}),
    addTransaction: (d) => request("transactions.add", d, "POST"),
    updateTransaction: (d) => request("transactions.update", d, "POST"),
    deleteTransaction: (id) => request("transactions.delete", { id }, "POST"),
    budget: (p) => request("budget.list", p || {}),
    upsertBudget: (d) => request("budget.upsert", d, "POST"),
    dashboard: (p) => request("dashboard.summary", p || {}),
    period: (p) => request("periods.current", p || {}),
    settings: () => request("settings.get"),
  };
})();
