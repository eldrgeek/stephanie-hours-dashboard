// SOMA Auth config for Stephanie's Hours & Work Dashboard.
// Anon/publishable key — safe in client-side code (RLS-gated; grants nothing
// beyond what Supabase Row-Level Security allows). NEVER put the service_role
// key here. Shared SOMA Auth project (same as Legends / Playmaker / etc.).
//
// `methods` controls which sign-in options login.html offers. Each also requires
// the matching provider enabled in the Supabase dashboard — see
// SOMA/standards/SOMA-AUTH.md → "Provider dashboard setup".
window.SOMA_AUTH_CONFIG = {
  url: 'https://omfwcodoimjmbrhssvfl.supabase.co',
  anonKey: 'sb_publishable_vi2qDWjozUJ5mi9dwirkLA_rj6UaqLf',

  methods: {
    magicLink: true,      // passwordless email link (default SOMA method)
    emailOtp:  false,
    password:  true,      // classic email + password (sign-up + reset)
    phone:     false,
    oauth:     ['google'] // "Continue with Google"
  }
};
