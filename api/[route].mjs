import { createHostedHandler, hostingOptions } from '../lib/hosting.mjs';

export const config = { maxDuration: 60 };
export default createHostedHandler(hostingOptions());
