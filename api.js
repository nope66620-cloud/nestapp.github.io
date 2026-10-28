// Wrapper ke Apps Script backend (JSON API).
// Action names mengikuti backend Code.gs: login, login_pin, me, dashboard,
// tx.list, tx.save, tx.delete, master, budget.list, budget.save, dll.
(function () {
  const cfg = window.NEST_CONFIG || {};
  const base = (cfg.API_URL || "").replace(/\/$/, "");

  function token() { return localStorage.getItem(cfg.TOKEN_KEY || "nest_token"); }
  function setToken(t) { localStorage.setItem(cfg.TOKEN_KEY || "nest_token", t); }
  function clearToken() { localStorage.removeItem(cfg.TOKEN_KEY || "nest_token"); }

  async function request(action, params, method) {
    method = method || "POST";
    const payload = { action: action, token: token() || "", data: params || {} };
    const res = await fetch(base, {
      method: method,
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const json = await res.json();
    if (!json || json.ok === false) throw new Error((json && json.error) || "API error");
    return json.data;
  }

  window.API = {
    token, setToken, clearToken,
    login: (username, password) => request("login", { username, password }),
    loginPin: (userId, pin) => request("login_pin", { user_id: userId, pin }),
    me: () => request("me", {}),
    master: () => request("master", {}),
    dashboard: (f) => request("dashboard", f || {}),
    transactions: (f) => request("tx.list", f || {}),
    saveTransaction: (d) => request("tx.save", d),
    deleteTransaction: (id) => request("tx.delete", { id }),
    budget: (f) => request("budget.list", f || {}),
    saveBudget: (d) => request("budget.save", d),
    settings: () => request("me", {}).then((r) => r.settings),
  };
})();
