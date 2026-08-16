import {
  appUrl,
  footerHtml,
  heroChip,
  type PageUrls
} from "../animation/shared";

export const title = "Compose.Market - Terms of Service";
export const description =
  "Terms of Service for Compose.Market, the technical conduit providing USDC-native access to independent AI model providers.";

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
      <section class="panel legal-panel" aria-labelledby="terms-title">
        <header class="legal-header band">
          <span class="cm-kicker">Legal Framework</span>
          <h1 class="cm-display legal-title" id="terms-title">TERMS OF <em>SERVICE</em></h1>
          <div class="hero-chip-list legal-meta" aria-label="Policy metadata">
            ${heroChip("receipt", `Version ${VERSION}`, "cyan")}
            ${heroChip("tracing", `Effective ${EFFECTIVE_DATE}`, "fuchsia")}
          </div>
        </header>

        <article class="legal-container band cm-glass neon-border cm-cell" data-tone="cyan" tabindex="0" aria-label="Scrollable Terms of Service">
          <div class="legal-intro">
            <div>
              <p class="cm-kicker">Compose.Market // Policy ${VERSION}</p>
              <p class="cm-copy">Compose.Market operates as a <strong class="section-em">technical conduit</strong> providing unified access to <span class="section-number">700+</span> AI models from <span class="section-number">30+</span> families. We do not own or operate those models, we do not train on your data, and model outputs are provided as-is.</p>
            </div>
            <span class="legal-scroll-cue" aria-hidden="true">Scroll to review</span>
          </div>

          <div class="legal-clauses">
            ${clause("01", "Agreement", "Acceptance & Scope", `
              <p>These Terms of Service ("Terms") govern access to the Compose.Market platform, applications, APIs, and x402 facilitator services (collectively, the "Service"), operated by Compose ("Compose," "we," "us," "our").</p>
              <p>By connecting a wallet, creating an account, or using the Service, you agree to these Terms, our <a href="/privacy/" class="legal-link" data-page-link="privacy">Privacy Policy</a>, and the <strong class="section-em">AI Pass-Through &amp; Liability Disclaimer</strong> signed upon first login. If you do not agree, do not use the Service.</p>
            `)}

            ${clause("02", "Architecture", "Technical Conduit & Aggregator", `
              <p>Compose acts solely as a technical conduit and aggregator, transmitting data to and from AI models operated by independent laboratories, inference providers, and cloud platforms ("Third-Party Providers").</p>
              <p>Compose does not own, operate, control, review, validate, or determine the processing performed by Third-Party Providers. We are not responsible for the availability, performance, correctness, suitability, legality, or security of any Third-Party Provider, model, or output. Review the provider directory and applicable policies at <a href="${providers}" target="_blank" rel="noopener noreferrer" class="legal-link">${providers}</a>.</p>
            `)}

            ${clause("03", "Access", "Accounts & Wallets", `
              <p>Access is provided through thirdweb smart accounts, externally connected wallets, passkeys, or social sign-in. You are responsible for securing your credentials, devices, and recovery methods, and for all activity under your account. Compose cannot recover lost credentials and is not liable for unauthorized wallet or account access.</p>
            `)}

            ${clause("04", "Settlement", "Payments & x402 Facilitator", `
              <p>Paid model and agent usage is dynamically metered and settled in USDC through on-chain payment rails on supported networks. Fees are displayed before a session or request is executed. Blockchain transactions are final and cannot be reversed. You are responsible for applicable network costs and taxes.</p>
            `)}

            ${clause("05", "Ownership", "Intellectual Property", `
              <p>You retain your rights in prompts, inputs, and model outputs to the extent permitted by applicable law. You grant Compose only the limited rights necessary to transmit, process, and relay data through the Service to fulfill your requests.</p>
            `)}

            ${clause("06", "Privacy", "Zero General Training", `
              <p>Compose does not use prompts, inputs, or outputs to train or fine-tune foundation models. Where contractually available, Compose prohibits Third-Party Providers from using your prompts or outputs for general model training on our behalf. Data relayed to a provider remains subject to that provider's terms and data practices.</p>
            `)}

            ${clause("07", "Conduct", "Prohibited Uses", `
              <p>You may not use the Service to generate or distribute unlawful content; violate privacy, intellectual property, export-control, or sanctions laws; deploy malware; attack or reverse-engineer the Service; circumvent security, usage, metering, or payment controls; resell access without authorization; or violate a Third-Party Provider's acceptable-use terms.</p>
            `)}

            ${clause("08", "Reliability", "Outputs Provided “As Is”", `
              <p>AI outputs are probabilistic and may be inaccurate, incomplete, outdated, biased, unsafe, or non-unique. The Service and all outputs are provided on an <strong class="section-em">“AS IS”</strong> and <strong class="section-em">“AS AVAILABLE”</strong> basis without warranties of accuracy, merchantability, fitness for a particular purpose, or non-infringement. Outputs are not professional, legal, financial, medical, or other regulated advice. You must independently verify outputs before relying on them.</p>
            `)}

            ${clause("09", "Protection", "Discharge of Liability", `
              <p>To the fullest extent permitted by law, Compose disclaims liability for acts, omissions, interruptions, errors, security practices, data handling, and outputs of Third-Party Providers, and for direct, indirect, incidental, special, consequential, or punitive damages arising from the Service. Where liability cannot be excluded, Compose's aggregate liability is limited to amounts paid to Compose in the three months preceding the claim.</p>
            `)}

            ${clause("10", "Governance", "Changes, Termination & Contact", `
              <p>Material revisions increment the policy version and may require renewed acknowledgment when you next log in. We may suspend access for violations, security reasons, or legal requirements. You may stop using the Service by disconnecting your wallet.</p>
              <p>These Terms are governed by the laws applicable to the operating entity of Compose, without regard to conflict-of-law principles. Questions or disputes should first be sent to <a href="mailto:legal@compose.market" class="legal-link">legal@compose.market</a>.</p>
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
