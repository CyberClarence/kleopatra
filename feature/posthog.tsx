"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";

const POSTHOG_KEY = "phc_myQYs3Rjeuf2iLo3ZWuw3q9e2EuLY6W9ude7kn4YqWkx";

/**
 * Manual pageview capture. We only send the pathname (never query strings),
 * so nothing typed can ever leak through the URL.
 */
function PostHogPageview() {
  const pathname = usePathname();
  useEffect(() => {
    if (!pathname || !posthog.__loaded) return;
    posthog.capture("$pageview", {
      $current_url: window.location.origin + pathname,
    });
  }, [pathname]);
  return null;
}

export function PHProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window === "undefined" || posthog.__loaded) return;

    posthog.init(POSTHOG_KEY, {
      // First-party EU proxy (RGPD): all traffic goes through kleopatra.app.
      api_host: "/posthog-gpdr",
      ui_host: "https://eu.posthog.com",

      // Privacy-preserving defaults: anonymous, no query strings in pageviews.
      person_profiles: "identified_only",
      capture_pageview: false,
      capture_pageleave: true,
      autocapture: true,

      // ── Never capture sensitive content, anywhere ──────────────────────
      // Autocapture: strip the text and attributes of every clicked element
      // so a key ID / fingerprint / label can't ride along in an event.
      mask_all_text: true,
      mask_all_element_attributes: true,

      // Session replay: mask every input/textarea value (covers typed messages,
      // pasted keys, passphrases, the armored-key fields), plus any element
      // explicitly tagged `.ph-mask` — the sensitive *non-input* displays
      // (decrypted output, ciphertext, fingerprints, key IDs, emails, names).
      // The rest of the UI stays visible so recordings are actually useful.
      session_recording: {
        maskAllInputs: true,
        maskTextSelector: ".ph-mask",
      },
    });

    // Expose the instance (same as PostHog's script-tag install) for debugging.
    (window as unknown as { posthog?: typeof posthog }).posthog = posthog;
  }, []);

  return (
    <PostHogProvider client={posthog}>
      <PostHogPageview />
      {children}
    </PostHogProvider>
  );
}
