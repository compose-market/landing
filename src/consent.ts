/**
 * Compose.Market — Landing Page Consent & Cookie Banner
 *
 * Implements GDPR Art. 28 transparency and cookie preferences with
 * cyberpunk HUD aesthetics matching @compose-market/theme.
 */

const STORAGE_KEY = "compose_consent_v1";

export function initLandingConsent(): void {
  if (typeof window === "undefined") return;

  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) return;

  const banner = document.createElement("div");
  banner.id = "cm-landing-consent";
  banner.className = "cm-consent-banner";
  banner.innerHTML = `
    <div class="cm-consent-banner__backdrop"></div>
    <div class="cm-consent-banner__inner">
      <div class="cm-consent-banner__content">
        <div class="cm-consent-banner__badge">
          <span class="cm-consent-banner__dot"></span>
          <span>PRIVACY & AI PASS-THROUGH NOTICE</span>
        </div>
        <p class="cm-consent-banner__text">
          Compose.Market acts as a technical conduit to 700+ third-party AI models and uses essential cookies to manage sessions.
          By using our platform, you acknowledge our
          <a href="https://app.compose.market/providers" target="_blank" rel="noopener noreferrer">Model Providers</a>,
          <a href="/terms/" data-page-link="terms">Terms</a>, and
          <a href="/privacy/" data-page-link="privacy">Privacy Policy</a>.
        </p>
      </div>
      <div class="cm-consent-banner__actions">
        <button type="button" id="cm-consent-essential" class="cm-consent-btn cm-consent-btn--secondary">
          Essential Only
        </button>
        <button type="button" id="cm-consent-accept" class="cm-consent-btn cm-consent-btn--primary">
          Accept All
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(banner);

  // Trigger entrance animation
  requestAnimationFrame(() => {
    banner.classList.add("is-visible");
  });

  const dismiss = (preference: "all" | "essential") => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        preference,
        timestamp: new Date().toISOString(),
      })
    );
    banner.classList.remove("is-visible");
    banner.classList.add("is-dismissing");
    setTimeout(() => {
      banner.remove();
    }, 400);
  };

  document.getElementById("cm-consent-accept")?.addEventListener("click", () => dismiss("all"));
  document.getElementById("cm-consent-essential")?.addEventListener("click", () => dismiss("essential"));
}
