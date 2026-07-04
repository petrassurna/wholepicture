import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

// Prototype credentials — checked server-side, never shipped to the browser.
// TODO: replace with a Postgres user lookup + hashed password (bcrypt/argon2).
const EMAIL = 'petras.surna@yart.com.au';
const PASSWORD = '123456';

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const data = await request.formData();
		const email = String(data.get('email') ?? '')
			.trim()
			.toLowerCase();
		const password = String(data.get('password') ?? '');

		if (email === EMAIL && password === PASSWORD) {
			cookies.set('session', 'ok', {
				path: '/',
				httpOnly: true,
				sameSite: 'lax',
				maxAge: 60 * 60 * 24 * 7 // 7 days
			});
			throw redirect(303, '/app');
		}

		// Return the email so the field stays filled; never return the password.
		return fail(400, { email, error: 'Wrong email or password.' });
	}
};
