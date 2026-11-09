import posthog from 'posthog-js';

const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;

const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;

// only the production domain sends events; local, preview and redirect hosts stay silent
if (
  process.env.NODE_ENV === 'production' &&
  window.location.hostname === 'www.ui-theme.dev' &&
  token &&
  host
) {
  posthog.init(token, {
    api_host: host,
    defaults: '2026-08-30',
    // one pageview per route, including client navigation and back/forward
    capture_pageview: 'history_change',
    capture_pageleave: true,
    autocapture: true,
    capture_dead_clicks: true,
    enable_heatmaps: true,
    capture_exceptions: true,
    capture_performance: { web_vitals: true, network_timing: true },
    disable_session_recording: false,
    enable_recording_console_log: true,
    session_recording: {
      // the site has no private inputs; keep search queries readable in replays
      maskAllInputs: false,
      maskInputOptions: { password: true },
    },
  });
}
