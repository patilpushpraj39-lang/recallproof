export function apiFetch(path, options = {}) {
  const headers = new Headers(options.headers);
  const code = document.getElementById('demo-code')?.value.trim();
  if (code) headers.set('x-demo-code', code);
  return fetch(path, { ...options, headers });
}
