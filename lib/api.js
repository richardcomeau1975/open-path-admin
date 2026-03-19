const API_URL = process.env.NEXT_PUBLIC_API_URL;

let _token = null;

export function getToken() {
  if (_token) return _token;
  if (typeof window !== "undefined") {
    _token = sessionStorage.getItem("admin_token");
  }
  return _token;
}

export function setToken(token) {
  _token = token;
  if (typeof window !== "undefined") {
    sessionStorage.setItem("admin_token", token);
  }
}

export function clearToken() {
  _token = null;
  if (typeof window !== "undefined") {
    sessionStorage.removeItem("admin_token");
  }
}

export async function adminFetch(path, options = {}) {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(error.detail || "Request failed");
  }

  return res.json();
}
