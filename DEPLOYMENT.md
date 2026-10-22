# Hosted presenter demo

The Vercel deployment uses the Other preset, static files in `public/`, and `api/[route].mjs` for the existing API routes. No build script or npm runtime dependency is needed. The function has a 60-second ceiling; the Google request times out sooner.

Configure `GEMINI_API_KEY` and `DEMO_ACCESS_CODE` as sensitive server environment variables for the target environment. Neither value belongs in source, frontend build variables, screenshots or chat. The presenter code is entered in a password field, sent only with model API requests, kept in page memory and excluded from exports. Share it privately with intended demo users. The Google key stays on the backend.

The hosted adapter requires both secrets and rejects unconfigured hosts, foreign browser origins and model requests without a correct presenter code. Hostnames come from `VERCEL_URL`, `VERCEL_PROJECT_PRODUCTION_URL` and optional comma-separated `PUBLIC_HOSTS`. Use hostnames only, without a scheme or path. Never broaden this to arbitrary incoming hosts.

The existing local launcher remains loopback-only and does not require a presenter code. No firewall, trust, certificate or local listener setting is weakened for hosting.

The backend is stateless. Its in-process concurrency flag applies per function instance, not across a scaled deployment. The presenter code restricts access but is not user-account authentication, a distributed quota limit or billing protection. Do not publish the code or claim unlimited public model access. Provider and hosting limits still apply. Notes, questions and answers are sent to Google's hosted API; the application does not persist them. Vercel and Google apply their own service policies.

Acceptance requires checking the deployed static page, API health and anonymous denial, then privately entering the presenter code and making a real generation request. A successful build alone does not establish live AI behavior. Deployment was still pending when this document was prepared.
