import { createRecallServer } from '../server.mjs';

export function hostingOptions(env = process.env) {
  const publicHosts = [env.VERCEL_URL, env.VERCEL_PROJECT_PRODUCTION_URL, ...(env.PUBLIC_HOSTS ?? '').split(',')]
    .filter(host => typeof host === 'string' && /^[a-zA-Z0-9.-]+$/.test(host));
  return { apiKey: (env.GEMINI_API_KEY ?? '').trim(), demoAccessCode: (env.DEMO_ACCESS_CODE ?? '').trim(), requireDemoAccess: true, publicHosts };
}

export function createHostedHandler(options) {
  const server = createRecallServer(options);
  // The platform supplies the request/response; no public listener is opened here.
  return server.listeners('request')[0];
}
