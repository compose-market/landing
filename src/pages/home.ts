import { dashboardDemo } from "../dashboard";
import { pollMetrics, type MetricKey } from "../metrics";
import {
  appUrl,
  deferUntilNear,
  footerHtml,
  heroChip,
  organism,
  type PageUrls
} from "../animation/shared";

export {
  formatMetricCount,
  formatMetricUsdc,
  metricDeltas,
  metricValues,
  metricsUrl,
  type MetricKey,
  type MetricsPayload
} from "../metrics";
export { Strand, fade, focus, net, pulse, type Hit, type Net, type Vec } from "../animation/model";
export type { Mount, PageOptions, PageUrls } from "../animation/shared";

/** @deprecated Use PageOptions. */
export type MountOptions = import("../animation/shared").PageOptions;

type PartnerLogo = { src: string; alt: string };
type PartnerBadge = PartnerLogo & {
  tone: "green" | "blue" | "cyan" | "purple";
};

const icons: Record<MetricKey, string> = {
  agents: '<path d="M12 8V4H8" /><rect width="16" height="12" x="4" y="8" rx="2" /><path d="M2 14h2" /><path d="M20 14h2" /><path d="M15 13v2" /><path d="M9 13v2" />',
  volume: '<path d="M20 12v6a2 2 0 0 1-2 2H6a4 4 0 0 1 0-8h14Z" /><path d="M4 12V8a2 2 0 0 1 2-2h12v6" /><path d="M18 16h.01" /><path d="M8 6V4h8v2" />',
  settlements: '<path d="M15 7a4 4 0 1 1-3.46 6" /><path d="M2 20l7.5-7.5" /><path d="M6 16l2 2" /><path d="M8 14l2 2" />',
  downloads: '<path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /><path d="M12 22V12" /><path d="m3.3 7 8.7 5 8.7-5" /><path d="M8 15l4 4 4-4" />'
};

const partnerLogos: PartnerLogo[] = [
  { src: "/partners/11labs.webp", alt: "ElevenLabs" },
  { src: "/partners/aiven.webp", alt: "AIven" },
  { src: "/partners/algolia.svg", alt: "Algolia" },
  { src: "/partners/alibaba.webp", alt: "Alibaba Cloud" },
  { src: "/partners/anam.webp", alt: "Anam" },
  { src: "/partners/apify.svg", alt: "Apify" },
  { src: "/partners/asicloud.webp", alt: "ASI:Cloud" },
  { src: "/partners/avalanche.svg", alt: "Avalanche" },
  { src: "/partners/azure-ai.webp", alt: "Azure AI" },
  { src: "/partners/cartesia.webp", alt: "Cartesia" },
  { src: "/partners/chroma.webp", alt: "ChromaDB" },
  { src: "/partners/cloudflare.webp", alt: "Cloudflare" },
  { src: "/partners/composio.webp", alt: "Composio" },
  { src: "/partners/confluent.webp", alt: "Confluent" },
  { src: "/partners/confidence.webp", alt: "Confidence" },
  { src: "/partners/couchbase.webp", alt: "Couchbase" },
  { src: "/partners/datadog.webp", alt: "Datadog" },
  { src: "/partners/daytona.svg", alt: "Daytona" },
  { src: "/partners/deepgram.webp", alt: "Deepgram" },
  { src: "/partners/deepinfra.webp", alt: "DeepInfra" },
  { src: "/partners/digitalocean.webp", alt: "DigitalOcean" },
  { src: "/partners/fireworks-ai.webp", alt: "Fireworks AI" },
  { src: "/partners/intercom.webp", alt: "Intercom" },
  { src: "/partners/lambda.webp", alt: "Lambda AI" },
  { src: "/partners/linkup.webp", alt: "Linkup" },
  { src: "/partners/mixpanel.webp", alt: "Mixpanel" },
  { src: "/partners/modal.webp", alt: "Modal" },
  { src: "/partners/mongodb.webp", alt: "MongoDB" },
  { src: "/partners/neo4j.webp", alt: "Neo4j" },
  { src: "/partners/neon.webp", alt: "Neon" },
  { src: "/partners/nvidia.webp", alt: "NVIDIA" },
  { src: "/partners/openai.webp", alt: "OpenAI" },
  { src: "/partners/perplexity.webp", alt: "Perplexity" },
  { src: "/partners/posthog.webp", alt: "PostHog" },
  { src: "/partners/quicknode.webp", alt: "Quicknode" },
  { src: "/partners/redis.webp", alt: "Redis" },
  { src: "/partners/roboflow.webp", alt: "Roboflow" },
  { src: "/partners/telnyx.webp", alt: "Telnyx" },
  { src: "/partners/temporal.webp", alt: "Temporal" },
  { src: "/partners/thirdweb.webp", alt: "Thirdweb" },
  { src: "/partners/vertex-ai.webp", alt: "Vertex AI" }
];

const partnerBadges: PartnerBadge[] = [
  {
    src: "/partners/badges/nvidia-badge.webp",
    alt: "NVIDIA Inception Program",
    tone: "green"
  },
  {
    src: "/partners/badges/microsoft-badge.webp",
    alt: "Microsoft for Startups",
    tone: "blue"
  }
];

function glyph(key: MetricKey): string {
  return `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${icons[key]}</svg>`;
}

function logoTag(logo: PartnerLogo): string {
  return `<div class="cm-partner-logo"><img src="${logo.src}" alt="${logo.alt}" title="${logo.alt}" decoding="async" fetchpriority="low" draggable="false" /></div>`;
}

function badgeTag(badge: PartnerBadge): string {
  return `
    <div class="cm-partner-badge" data-tone="${badge.tone}">
      <img src="${badge.src}" alt="${badge.alt}" decoding="async" fetchpriority="low" draggable="false" />
    </div>`;
}

function marquee(): string {
  const mid = Math.ceil(partnerLogos.length / 2);
  const top = partnerLogos.slice(0, mid);
  const bottom = partnerLogos.slice(mid);
  const topHtml = top.map(logoTag).join("");
  const bottomHtml = bottom.map(logoTag).join("");
  return `
    <div class="cm-partner-marquee" aria-label="Partner logos">
      <div class="cm-partner-marquee__row">
        <div class="cm-marquee-track cm-partner-marquee__inner" style="animation-duration:80s">${topHtml}${topHtml}</div>
      </div>
      <div class="cm-partner-marquee__row">
        <div class="cm-marquee-track-reverse cm-partner-marquee__inner" style="animation-duration:90s">${bottomHtml}${bottomHtml}</div>
      </div>
    </div>`;
}

function hydratePartners(root: ParentNode) {
  const badges = root.querySelector<HTMLElement>("[data-partner-badges]");
  const marqueeHost = root.querySelector<HTMLElement>("[data-partner-marquee]");

  if (!badges || !marqueeHost || marqueeHost.dataset.hydrated === "true") {
    return () => { };
  }

  badges.innerHTML = partnerBadges.map(badgeTag).join("");
  marqueeHost.innerHTML = marquee();
  marqueeHost.dataset.hydrated = "true";

  const marqueeEl = marqueeHost.querySelector<HTMLElement>(".cm-partner-marquee");
  const marqueeToggle = (paused: boolean) => {
    const tracks = marqueeEl?.querySelectorAll<HTMLElement>(".cm-partner-marquee__inner") ?? [];
    for (const track of tracks) {
      track.style.animationPlayState = paused ? "paused" : "running";
    }
  };
  const enterMarquee = () => marqueeToggle(true);
  const leaveMarquee = () => marqueeToggle(false);
  marqueeEl?.addEventListener("pointerenter", enterMarquee);
  marqueeEl?.addEventListener("pointerleave", leaveMarquee);

  return () => {
    marqueeEl?.removeEventListener("pointerenter", enterMarquee);
    marqueeEl?.removeEventListener("pointerleave", leaveMarquee);
  };
}

function deferPartners(root: ParentNode, scroll: HTMLElement | null) {
  let cleanup = () => { };
  let stopObserver = () => { };
  let hydrated = false;
  const hydrateOnce = () => {
    if (hydrated) {
      return;
    }

    hydrated = true;
    stopObserver();
    cleanup = hydratePartners(root);
  };

  stopObserver = deferUntilNear(root.querySelector(".partners-panel"), scroll, "80% 0px", hydrateOnce);

  return () => {
    stopObserver();
    cleanup();
  };
}

export const title = "Compose.Market - Inference & x402 Facilitator";
export const description =
  "Compose.Market Inference & x402 Facilitator power the Agentic Economy: 700+ SOTA models, USDC-native, no subs, usage-based — 5.5x cheaper than any inference aggregator.";

export function render(urls: PageUrls): string {
  const keys = urls.keys;
  const inferenceDocs = appUrl(urls.docsBase, "/inference/introduction");
  const facilitatorDocs = appUrl(urls.docsBase, "/x402/introduction");

  return `
      <section class="panel hero" aria-label="Compose.Market Inference landing">
        <div class="hero-title" data-rail-target="text">
          <p class="cm-kicker">Inference &times; x402 Facilitator</p>
          <h1 class="cm-display" aria-label="The Financial Rails for your Agents">THE FINANCIAL RAILS<br /><em>FOR YOUR AGENTS</em></h1>
        </div>

        <article class="float-card card-a cm-glass cm-cell" aria-label="Inference">
          <p class="cm-kicker">Serverless Inference</p>
          <p class="cm-copy hero-rich">Access <span class="hero-number">700+</span> SOTA models from <strong class="hero-em">a single endpoint</strong>: <code class="hero-code">/v1/responses</code>. <br><br>We built per-family & per-modality adapters, <strong class="hero-em">so that you don't have to</strong>.
          <div class="hero-chip-list" aria-label="Inference model types">
            ${heroChip("reasoning", "LLM", "cyan")}
            ${heroChip("media", "Media", "fuchsia")}
            ${heroChip("embeddings", "Embeddings", "blue")}
          </div>
        </article>

        <article class="float-card card-d cm-glass cm-cell" aria-label="Dashboard & Analytics">
          <p class="cm-kicker">Dashboard & Analytics</p>
          <p class="cm-copy hero-rich">Built-in Dashboard & Analytics to track <strong class="hero-em">dozens</strong> of metrics for each inference call. Organized in accounting-ready Receipts. <strong class="hero-em">In real-time, at no extra cost</strong>.</p>
          <div class="hero-chip-list" aria-label="Inference model types">
            ${heroChip("analytics", "Analytics", "blue")}
            ${heroChip("telemetry", "Telemetry", "cyan")}
          </div>
        </article>

        <article class="float-card card-c cm-glass cm-cell" aria-label="SDK and APIs">
          <p class="cm-kicker">SDK/APIs</p>
          <p class="cm-copy hero-rich"><code class="hero-code">npm i @compose-market/sdk</code>:<br>one strongly-typed package to <strong class="hero-em">manage your keys</strong> and <strong class="hero-em">payments</strong>, and <strong class="hero-em">integrate all catalogs</strong> out of the box.</p>
          <div class="hero-chip-list" aria-label="Inference model types">
            ${heroChip("sdk", "SDK", "cyan")}
            ${heroChip("api", "APIs", "fuchsia")}
            ${heroChip("factory", "Catalogs", "blue")}
          </div>
        </article>
        
        <article class="float-card card-b cm-glass cm-cell" data-tone="purple" aria-label="x402 Facilitator">
          <p class="cm-kicker">x402 Facilitator: 'upto'</p>
          <p class="cm-copy hero-rich"><strong class="hero-em">USDC-settled inference</strong> for humans & agents alike. Spend only what you use, with <strong class="hero-em">the lowest fee in the world</strong> (1%). <br><br><strong class="hero-em">One key. No latency. No subs.</strong></p>
          <div class="hero-chip-list" aria-label="Inference model types">
            ${heroChip("route", "4 Chains", "blue")}
            ${heroChip("usdc", "USDC", "cyan")}
            ${heroChip("x402", "1% Fee", "fuchsia")}
          </div>
        </article>

        <div class="hero-mid">
          <p class="protocol hero-rich" data-rail-target="text">Power your agents with our <strong class="hero-em">live catalog</strong> of <span class="hero-number">700+</span> flagship models: <span class="hero-number">8</span> modalities, <span class="hero-number">20+</span> families, from one single <code class="hero-token">/v1/responses</code> endpoint. Track <strong class="hero-em">every call</strong> through our <strong class="hero-em">Dashboard & Telemetry</strong>, and pay in USDC on <span class="hero-number">4</span> different chains at <strong class="hero-em">the lowest aggregator fee</strong> in the market (<strong class="hero-em">1%</strong>).</p>
          <div class="actions" aria-label="Primary actions">
            <a class="action cm-button cm-button-primary primary" href="${keys}">Set your Key <span aria-hidden="true">-&gt;</span></a>
            <a class="action cm-button cm-button-secondary secondary" href="${inferenceDocs}">Inference Docs</a>
          </div>
        </div>

      </section>

        <section class="panel deck-panel" aria-label="Settlement highlights">
          <div class="panel-copy band cm-glass neon-border" data-rail-target="block">
            <p class="cm-kicker">Zero-Latency Settlement</p>
            <h2 class="cm-display"><em>DYNAMIC</em> METERING & TELEMETRY</h2>
            <div class="organism" data-organism>
              <div class="organism-track">
                <article class="organism-panel is-active" id="organism-chapter-flow" role="tabpanel" aria-labelledby="organism-tab-flow" aria-hidden="false" data-organism-panel>
                  <p class="organism-label"><span class="section-number">01</span> The Request Pays for Itself</p>
                  <p class="cm-copy section-rich">Create a Session, set up the budget, and export your Compose Key. Then <strong class="hero-em">you or your agents</strong> can autonomously call any model's endpoint, while our <code class="section-token">x402 Facilitator</code> will settle it for you at <strong class="hero-em">no added latency</strong> in any network you chose.<br><br><strong class="hero-em">No subs, credits or invoices necessary.</strong></p>
                </article>
                <article class="organism-panel" id="organism-chapter-catalog" role="tabpanel" aria-labelledby="organism-tab-catalog" aria-hidden="true" inert data-organism-panel>
                  <p class="organism-label"><span class="section-number">02</span> No Guessing. No Lazy Routing.</p>
                  <p class="cm-copy section-rich">Compose <strong class="section-em">never secretly re-routes</strong> you to a cheaper model.<br><br>Access our <strong class="section-em">enterprise-grade</strong> telemetry & analytics to analyze traces, track the model used and the tokens spent. Access your Dashboard to see results, spending and <strong class="section-em">accounting-ready receipts</strong> appear in real-time.</p>
                </article>
              </div>
              <div class="organism-dots" role="tablist" aria-label="Settlement chapters">
                <button class="organism-dot is-active" id="organism-tab-flow" type="button" role="tab" aria-selected="true" aria-controls="organism-chapter-flow" aria-label="Read x402 flow chapter" data-organism-dot></button>
                <button class="organism-dot" id="organism-tab-catalog" type="button" role="tab" aria-selected="false" aria-controls="organism-chapter-catalog" aria-label="Read catalog metering chapter" tabindex="-1" data-organism-dot></button>
              </div>
            </div>
          </div>
          <div class="features band">
          <article class="feature cm-glass cm-cell" data-tone="cyan">
            <span class="cm-icon">01</span>
            <h3>Catalog</h3>
            <p class="cm-copy section-rich">Be the first to access: Compose' live catalog is <strong class="section-em">consistently first to serve SOTA, flagship models</strong>, giving you instant access to <span class="section-number">700+</span> models across <span class="section-number">8</span> modalities.</p>
          </article>
          <article class="feature cm-glass cm-cell" data-tone="violet">
            <span class="cm-icon">02</span>
            <h3>x402 Metering</h3>
            <p class="cm-copy section-rich">Every call is settled in <code class="section-token">USDC</code> on <span class="section-number">4</span> chains, and <strong class="section-em">metered dynamically</strong> based on your real use.<br>With a <span class="section-number">1%</span> fee — <span class="section-number">5x</span> cheaper than any other Inference aggregator.</p>
          </article>
          <article class="feature cm-glass cm-cell" data-tone="blue">
            <span class="cm-icon">03</span>
            <h3>Dashboard</h3>
            <p class="cm-copy section-rich">Spend, requests, tokens &amp; latency charted over <span class="section-number">24h</span> to <span class="section-number">180d</span>. Cost &amp; calls per model, success rates &amp; <strong class="section-em">TTFT</strong> per request, filtered by network — receipts on every settlement.</p>
          </article>
          </div>
        </section>

        <section class="panel metrics-panel" aria-label="Network metrics">
          <div class="stats band">
          <article class="stat cm-glass cm-cell" data-metric="agents" data-tone="cyan">
            <div class="stat-top"><span class="stat-icon cm-icon" aria-hidden="true">${glyph("agents")}</span><span class="stat-label">Global Agents</span></div>
            <strong aria-live="polite"></strong>
            <p class="stat-delta" data-delta aria-live="polite"></p>
            <a class="stat-link cm-button cm-button-secondary" href="${keys}">Create your Key</a>
          </article>
          <article class="stat cm-glass cm-cell" data-metric="volume" data-tone="violet">
            <div class="stat-top"><span class="stat-icon cm-icon" aria-hidden="true">${glyph("volume")}</span><span class="stat-label">Inference Volume</span></div>
            <strong aria-live="polite"></strong>
            <p class="stat-delta" data-delta aria-live="polite"></p>
            <a class="stat-link cm-button cm-button-secondary" href="${inferenceDocs}">Inference Docs</a>
          </article>
          <article class="stat cm-glass cm-cell" data-metric="settlements" data-tone="cyan">
            <div class="stat-top"><span class="stat-icon cm-icon" aria-hidden="true">${glyph("settlements")}</span><span class="stat-label">Settled Transactions</span></div>
            <strong aria-live="polite"></strong>
            <p class="stat-delta" data-delta aria-live="polite"></p>
            <a class="stat-link cm-button cm-button-secondary" href="${facilitatorDocs}">Facilitator Docs</a>
          </article>
          <article class="stat cm-glass cm-cell" data-metric="downloads" data-tone="violet">
            <div class="stat-top"><span class="stat-icon cm-icon" aria-hidden="true">${glyph("downloads")}</span><span class="stat-label">SDK Downloads</span></div>
            <strong aria-live="polite"></strong>
            <p class="stat-delta" data-delta aria-live="polite"></p>
            <a class="stat-link cm-button cm-button-secondary" href="https://www.npmjs.com/package/@compose-market/sdk">Build with our SDK</a>
          </article>
          </div>
        </section>

        <section class="panel workflow-panel" aria-label="Connect your tools">
        <div class="workflow band cm-glass neon-border" data-rail-target="block">
          <div>
            <p class="cm-kicker">Dashboard &amp; Analytics</p>
            <h2 class="cm-display">TELEMETRY. <em>ON EACH RECEIPT.</em></h2>
            <p class="cm-copy section-rich">Your usage, transparently tracked & differentiated by token type, model, and transaction hash. Productized in <strong class="section-em">accounting-ready receipts</strong>.</p>
            <div class="hero-chip-list" aria-label="Analytics">
              ${heroChip("model", "Model Analytics", "blue")}
              ${heroChip("ttft", "TTFT", "cyan")}
              ${heroChip("receipt", "Receipts", "fuchsia")}
            </div>
            <div class="steps">
              <div class="step"><span class="cm-icon">01</span><span>Track spending, token use and duration <strong class="section-em">of any single call</strong>.</span></div>
              <div class="step"><span class="cm-icon">02</span><span>Filter by <code class="section-token">network</code>, <code class="section-token">model</code> or <code class="section-token">date</code> for fully granular analytics.</span></div>
              <div class="step"><span class="cm-icon">03</span><span>See your receipts, with <strong class="section-em">tokens spent</strong>, <strong class="section-em">model used</strong>, and <strong class="section-em">TX hash</strong>.</span></div>
            </div>
          </div>
          ${dashboardDemo()}
        </div>
        </section>

        <section class="panel partners-panel" aria-label="Partners">
          <div class="partners band cm-glass neon-border cm-partners" data-rail-target="block">
            <div class="cm-partners__backing">
            <div class="cm-partners__copy">
              <span class="cm-partners__label">Backed By</span>
              <h2 class="cm-partners__title">THE LEADERS BUILDING AI</h2>
            </div>
            <div class="cm-partners__badges" data-partner-badges></div>
          </div>
            <div data-partner-marquee></div>
          </div>
        </section>

        <section class="panel final-panel" aria-label="Final call to action">
          <div class="final band cm-glass neon-border" data-rail-target="block">
            <div>
              <p class="cm-kicker">Ready to build?</p>
              <h2 class="cm-display">GET YOUR <em>KEY</em></h2>
              <p class="cm-copy section-rich">Call <span class="section-number">700+</span> SOTA models with one <strong class="section-em">budgeted key</strong> — <strong class="section-em">USDC-native</strong>, usage-based, <span class="section-number">1%</span> platform fee, receipts on every call.</p>
              <div class="hero-chip-list" aria-label="Inference model types">
                ${heroChip("endpoint", "v1/responses", "blue")}
                ${heroChip("x402", "x402", "cyan")}
                ${heroChip("receipt", "Receipts", "fuchsia")}
              </div>
            </div>
            <a class="cm-button cm-button-primary" href="${keys}">See your Keys <span aria-hidden="true">-&gt;</span></a>
          </div>
          ${footerHtml()}
        </section>
  `;
}

export function wire(content: HTMLElement): () => void {
  const stopMetrics = pollMetrics(content);
  const stopPartners = deferPartners(content, content);
  const stopOrganism = organism(content);

  return () => {
    stopMetrics();
    stopPartners();
    stopOrganism();
  };
}
