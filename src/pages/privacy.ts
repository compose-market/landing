import {
  appUrl,
  footerHtml,
  heroChip,
  type PageUrls
} from "../animation/shared";

export const title = "Compose.Market - Privacy Policy";
export const description =
  "Privacy Policy for Compose.Market, including consent receipts, transient AI relaying, analytics, and third-party provider transparency.";

const VERSION = "1.0.0";
const EFFECTIVE_DATE = "August 15, 2026";

function clause(number: string, kicker: string, heading: string, body: string): string {
  return `
        <section class="legal-clause">
          <header class="legal-clause__header">
            <span class="cm-icon" aria-hidden="true">${number}</span>
            <div>
              <p class="cm-kicker">${kicker}</p>
              <h2>${heading}</h2>
            </div>
          </header>
          <div class="legal-clause__body cm-copy">${body}</div>
        </section>`;
}

export function render(urls: PageUrls): string {
  const providers = appUrl(urls.appBase, "/providers");

  return `
      <section class="panel legal-panel" aria-labelledby="privacy-title">
        <header class="legal-header band">
          <span class="cm-kicker">Data Governance</span>
          <h1 class="cm-display legal-title" id="privacy-title">PRIVACY <em>POLICY</em></h1>
          <div class="hero-chip-list legal-meta" aria-label="Policy metadata">
            ${heroChip("identity", `Version ${VERSION}`, "cyan")}
            ${heroChip("tracing", `Effective ${EFFECTIVE_DATE}`, "fuchsia")}
          </div>
        </header>

        <article class="legal-container band cm-glass neon-border cm-cell" data-tone="cyan" tabindex="0" aria-label="Scrollable Privacy Policy">
          <div class="legal-intro">
            <div>
              <p class="cm-kicker">Privacy by Design // Policy ${VERSION}</p>
              <p class="cm-copy">Compose.Market uses a <strong class="section-em">zero-training architecture</strong>. Prompts and outputs are relayed to your selected provider rather than used to train Compose models. Signed consent receipts are retained for compliance auditability.</p>
            </div>
            <span class="legal-scroll-cue" aria-hidden="true">Scroll to review</span>
          </div>

          <div class="legal-clauses">
            ${clause("01", "Scope", "Scope & GDPR Transparency", `
              <p>This Privacy Policy describes how Compose ("Compose," "we," "us," "our") collects, uses, discloses, and protects information when you use the Compose.Market platform, applications, APIs, and x402 facilitator services (collectively, the "Service").</p>
              <p>For GDPR Article 28 transparency, our current Third-Party Providers, jurisdictions, terms, privacy notices, and available Data Processing Agreements are listed at <a href="${providers}" target="_blank" rel="noopener noreferrer" class="legal-link">${providers}</a>.</p>
            `)}

            ${clause("02", "Collection", "Data We Collect", `
              <p><strong class="section-em">Identity data:</strong> EVM smart-account and Solana addresses used to resolve multi-chain identity and sessions.</p>
              <p><strong class="section-em">Consent receipts:</strong> Your address, disclaimer type, policy version, signed message, signature or receipt, acceptance timestamp, and limited client metadata used to evidence consent.</p>
              <p><strong class="section-em">Usage telemetry:</strong> Request, model, token, latency, settlement, and transaction metadata used for service delivery, receipts, accounting, security, and analytics.</p>
              <p><strong class="section-em">Browser preferences:</strong> Local storage entries such as <code class="section-token">compose_consent_v1</code> that remember your privacy choices.</p>
            `)}

            ${clause("03", "Relay", "Prompt & Output Processing", `
              <p>Prompts, inputs, and outputs are transmitted through the relay to the selected Third-Party Provider to fulfill a request. Compose does not use those payloads for general model training. Operational processing and retention by each selected provider remain governed by that provider's terms and privacy notice.</p>
              <p>Do not submit personal, confidential, regulated, or sensitive data unless you have the necessary rights and have reviewed the selected provider's policies.</p>
            `)}

            ${clause("04", "Sharing", "Third-Party Providers", `
              <p>The Service relies on independent AI laboratories, inference platforms, cloud infrastructure, wallet infrastructure, databases, analytics services, and payment networks. Information is disclosed only as required to provide, secure, meter, settle, and improve the Service.</p>
              <p>Where contractually available, Compose requires upstream AI providers not to train general models on prompts or outputs submitted through our API access. The provider directory identifies the policies governing each integration.</p>
            `)}

            ${clause("05", "Training", "Zero General Training", `
              <p>Compose does not train or fine-tune foundation models using your prompts or outputs. Compose may use aggregated or de-identified operational data that does not identify you or reveal prompt content to improve reliability, security, routing, and user experience.</p>
            `)}

            ${clause("06", "Preferences", "Cookies, Local Storage & Analytics", `
              <p>Essential browser storage supports session continuity, cached account identity, network preferences, and consent choices. Optional analytics may include Vercel Analytics, Mixpanel, and PostHog to understand product performance and usage.</p>
              <p>The landing-page consent control stores your choice locally. You may reset that choice by clearing site data in your browser. We do not use third-party advertising cookies or sell personal information for cross-context behavioral advertising.</p>
            `)}

            ${clause("07", "Rights", "Your Data Protection Rights", `
              <p>Depending on your location, you may request access, correction, deletion, restriction, portability, or objection; withdraw consent; or complain to a supervisory authority. Send requests to <a href="mailto:legal@compose.market" class="legal-link">legal@compose.market</a>. We may need to verify wallet control or identity before fulfilling a request.</p>
            `)}

            ${clause("08", "Retention", "Retention & Security", `
              <p>Identity and consent records are retained while needed to provide the Service, evidence acceptance, resolve disputes, prevent fraud, and satisfy legal obligations. Operational telemetry is retained according to service, accounting, security, and compliance needs.</p>
              <p>Safeguards include encrypted transport, managed databases, access controls, signed session tokens, restricted cross-origin access, and wallet-based authorization. Compose does not custody your wallet private keys.</p>
            `)}

            ${clause("09", "Transfers", "International Processing", `
              <p>Compose and its providers may process information in multiple jurisdictions. Where required, international transfers rely on adequacy decisions, contractual protections, or other lawful transfer mechanisms. Provider locations are disclosed in the provider directory.</p>
            `)}

            ${clause("10", "Governance", "Changes & Contact", `
              <p>Material revisions increment the policy version and may require renewed acknowledgment when you next log in. The effective date shown above identifies the current version.</p>
              <p>Questions, concerns, or data-subject requests should be sent to <a href="mailto:legal@compose.market" class="legal-link">legal@compose.market</a>. Related service terms are available in our <a href="/terms/" class="legal-link" data-page-link="terms">Terms of Service</a>.</p>
            `)}
          </div>
        </article>

        ${footerHtml()}
      </section>
  `;
}

export function wire(_content: HTMLElement): () => void {
  return () => { };
}
