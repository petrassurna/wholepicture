// Product analytics via Vercel Web Analytics. Privacy rule: we send event NAMES
// and low-cardinality flags only — never the user's financial figures. Nothing
// personal leaves the browser. `track` no-ops on the server and in local dev,
// and only sends once Web Analytics is enabled for the project on Vercel.

import { track } from '@vercel/analytics/sveltekit';

let engagedFired = false;

/** Fire a product event. Keep props to non-sensitive flags — never dollar values. */
export function trackEvent(name: string, props?: Record<string, string | number | boolean>): void {
	track(name, props);
}

/** The key signal: the first time a visitor actually changes an input. Fires once. */
export function trackEngaged(): void {
	if (engagedFired) return;
	engagedFired = true;
	track('engaged');
}
