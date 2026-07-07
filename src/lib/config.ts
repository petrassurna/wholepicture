// Where user feedback goes. This address becomes public via the mailto links —
// swap it for a dedicated inbox (e.g. hello@yourdomain) if you'd rather not
// publish a personal one.
export const FEEDBACK_EMAIL = 'petras.surna@gmail.com';

export const feedbackMailto = `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent(
	'Whole Picture feedback'
)}`;
