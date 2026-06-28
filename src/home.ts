import { pollMetrics, type MetricKey } from "./metrics";
import type { SceneMount, SceneOptions } from "./scene";

export {
  formatMetricCount,
  formatMetricUsdc,
  metricDeltas,
  metricValues,
  metricsUrl,
  type MetricKey,
  type MetricsPayload
} from "./metrics";
export { Strand, fade, focus, net, pulse, type Hit, type Net, type Vec } from "./model";

export type Mount = {
  destroy: () => void;
};

export type MountOptions = SceneOptions & {
  appBase?: string;
  market?: string;
  createAgent?: string;
  docsBase?: string;
  docs?: string;
};

type PartnerLogo = { src: string; alt: string };
type PartnerBadge = PartnerLogo & {
  tone: "green" | "blue" | "cyan" | "purple";
};

const icons: Record<MetricKey, string> = {
  agents: '<path d="M12 8V4H8" /><rect width="16" height="12" x="4" y="8" rx="2" /><path d="M2 14h2" /><path d="M20 14h2" /><path d="M15 13v2" /><path d="M9 13v2" />',
  volume: '<path d="M20 12v6a2 2 0 0 1-2 2H6a4 4 0 0 1 0-8h14Z" /><path d="M4 12V8a2 2 0 0 1 2-2h12v6" /><path d="M18 16h.01" /><path d="M8 6V4h8v2" />',
  sessions: '<path d="M15 7a4 4 0 1 1-3.46 6" /><path d="M2 20l7.5-7.5" /><path d="M6 16l2 2" /><path d="M8 14l2 2" />',
  downloads: '<path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /><path d="M12 22V12" /><path d="m3.3 7 8.7 5 8.7-5" /><path d="M8 15l4 4 4-4" />'
};

const heroIcons = {
  reasoning: '<path d="M12 3v3" /><path d="M18.36 5.64 16.24 7.76" /><path d="M21 12h-3" /><path d="m18.36 18.36-2.12-2.12" /><path d="M12 21v-3" /><path d="m5.64 18.36 2.12-2.12" /><path d="M3 12h3" /><path d="m5.64 5.64 2.12 2.12" /><circle cx="12" cy="12" r="3.2" />',
  media: '<rect width="16" height="13" x="4" y="5" rx="2" /><path d="m8 15 2.4-2.4a1.5 1.5 0 0 1 2.1 0L16 16" /><circle cx="9" cy="9" r="1" />',
  embeddings: '<path d="M8 3 4 7l4 4" /><path d="m16 3 4 4-4 4" /><path d="M4 17h16" /><path d="M7 21h10" />',
  crypto: '<path d="M12 2 4 6v12l8 4 8-4V6Z" /><path d="M12 22V12" /><path d="m4.5 6.5 7.5 4.5 7.5-4.5" />',
  identity: '<path d="M20 7 10 17l-5-5" /><path d="M4 4h16v16H4z" />'
} satisfies Record<string, string>;

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

function appUrl(base: string, path: string) {
  return `${base.replace(/\/+$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}

function glyph(key: MetricKey): string {
  return `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${icons[key]}</svg>`;
}

function heroGlyph(key: keyof typeof heroIcons): string {
  return `<svg class="hero-chip__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${heroIcons[key]}</svg>`;
}

function heroChip(key: keyof typeof heroIcons, label: string, tone: string): string {
  return `<span class="hero-chip" data-tone="${tone}">${heroGlyph(key)}<span>${label}</span></span>`;
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

function rootMarginPixels(root: Element | null, rootMargin: string): number {
  const value = rootMargin.trim().split(/\s+/)[0] ?? "0px";
  const height = root instanceof HTMLElement ? root.clientHeight : window.innerHeight;

  if (value.endsWith("%")) {
    return height * (Number.parseFloat(value) || 0) / 100;
  }

  return Number.parseFloat(value) || 0;
}

function isNear(target: Element, root: Element | null, rootMargin: string): boolean {
  const rect = target.getBoundingClientRect();
  const rootRect = root?.getBoundingClientRect();
  const top = rootRect?.top ?? 0;
  const bottom = rootRect?.bottom ?? window.innerHeight;
  const margin = rootMarginPixels(root, rootMargin);

  return rect.top <= bottom + margin && rect.bottom >= top - margin;
}

function deferUntilNear(target: Element | null, root: Element | null, rootMargin: string, run: () => void) {
  if (!target) {
    run();
    return () => { };
  }

  let done = false;
  let raf = 0;
  let observer: IntersectionObserver | undefined;
  const cleanup = () => {
    observer?.disconnect();
    root?.removeEventListener("scroll", schedule);
    window.removeEventListener("resize", schedule);
    if (raf) {
      window.cancelAnimationFrame(raf);
      raf = 0;
    }
  };
  const complete = () => {
    if (done) {
      return;
    }

    done = true;
    cleanup();
    run();
  };
  const check = () => {
    raf = 0;
    if (isNear(target, root, rootMargin)) {
      complete();
    }
  };
  function schedule() {
    if (done || raf) {
      return;
    }

    raf = window.requestAnimationFrame(check);
  }

  if ("IntersectionObserver" in window) {
    observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        complete();
      }
    }, { root, rootMargin });
    observer.observe(target);
  }

  root?.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule);
  schedule();

  return cleanup;
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

function organism(root: ParentNode, forcedReduced = false) {
  const host = root.querySelector<HTMLElement>("[data-organism]");
  const panels = [...root.querySelectorAll<HTMLElement>("[data-organism-panel]")];
  const dots = [...root.querySelectorAll<HTMLButtonElement>("[data-organism-dot]")];

  if (!host || panels.length < 2 || panels.length !== dots.length) {
    return () => { };
  }

  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  const period = 10_000;
  let index = panels.findIndex((panel) => panel.classList.contains("is-active"));
  let frame = 0;
  let paused = false;
  let progress = 0;
  let start = 0;
  let stopped = false;
  let reduced = forcedReduced || media.matches;
  index = index >= 0 ? index : 0;

  const cancel = () => {
    if (frame) {
      window.cancelAnimationFrame(frame);
      frame = 0;
    }
  };

  const draw = () => {
    const dot = dots[index];
    const fill = reduced ? 1 : Math.min(1, Math.max(0, progress));
    dot.style.setProperty("--organism-width", reduced ? "2.65rem" : `${18 + fill * 30}px`);
    dot.style.setProperty("--organism-scale", String(0.34 + fill * 0.66));
  };

  const play = () => {
    cancel();

    if (stopped || paused || reduced) {
      draw();
      return;
    }

    start = performance.now() - progress * period;
    frame = window.requestAnimationFrame(tick);
  };

  const select = (next: number, reset = true) => {
    index = (next + panels.length) % panels.length;
    progress = reset ? 0 : progress;

    panels.forEach((panel, item) => {
      const active = item === index;
      panel.classList.toggle("is-active", active);
      panel.setAttribute("aria-hidden", active ? "false" : "true");
      panel.toggleAttribute("inert", !active);
    });

    dots.forEach((dot, item) => {
      const active = item === index;
      dot.classList.toggle("is-active", active);
      dot.setAttribute("aria-selected", active ? "true" : "false");
      dot.tabIndex = active ? 0 : -1;

      if (!active) {
        dot.style.removeProperty("--organism-width");
        dot.style.removeProperty("--organism-scale");
      }
    });

    draw();
    play();
  };

  function tick(now: number) {
    if (stopped || paused || reduced) {
      frame = 0;
      draw();
      return;
    }

    progress = Math.min(1, (now - start) / period);
    draw();

    if (progress >= 1) {
      select(index + 1);
      return;
    }

    frame = window.requestAnimationFrame(tick);
  }

  const pause = () => {
    if (paused) {
      return;
    }

    paused = true;
    cancel();
  };

  const resume = () => {
    if (!paused) {
      return;
    }

    paused = false;
    play();
  };

  const visibility = () => {
    if (document.hidden) {
      pause();
      return;
    }

    resume();
  };

  const motion = () => {
    reduced = forcedReduced || media.matches;
    progress = reduced ? 1 : 0;
    play();
  };

  const clicks = dots.map((dot, item) => {
    const handler = () => {
      paused = false;
      select(item);
    };
    dot.addEventListener("click", handler);
    return { dot, handler };
  });
  host.addEventListener("pointerenter", pause);
  host.addEventListener("pointerleave", resume);
  host.addEventListener("focusin", pause);
  host.addEventListener("focusout", resume);
  document.addEventListener("visibilitychange", visibility);
  media.addEventListener("change", motion);
  select(index);

  return () => {
    stopped = true;
    cancel();
    host.removeEventListener("pointerenter", pause);
    host.removeEventListener("pointerleave", resume);
    host.removeEventListener("focusin", pause);
    host.removeEventListener("focusout", resume);
    document.removeEventListener("visibilitychange", visibility);
    media.removeEventListener("change", motion);
    clicks.forEach(({ dot, handler }) => dot.removeEventListener("click", handler));
  };
}

export function mount(root: HTMLElement, options: MountOptions = {}): Mount {
  const appBase = options.appBase ?? "https://app.compose.market";
  const docsBase = options.docsBase ?? "https://docs.compose.market";
  const market = options.market ?? appUrl(appBase, "/market");
  const docs = appUrl(docsBase, "/");
  const createAgent = options.createAgent ?? appUrl(appBase, "/create-agent");

  root.innerHTML = `
    <main class="shell cm-app-shell cm-app-shell--luminescent">
      <div class="backdrop cm-app-shell__backdrop" aria-hidden="true">
        <div class="cm-app-shell__grid bg-grid-pattern"></div>
        <div class="cm-app-shell__gradient"></div>
        <div class="cm-app-shell__scanline"></div>
        <div class="stage" aria-hidden="true">
          <div class="scene-poster">
            <img class="scene-poster__tentacles" src="/artifacts/tentacles.webp" width="900" height="1180" alt="" decoding="async" fetchpriority="high" draggable="false" crossorigin="anonymous" />
            <img class="scene-poster__head" src="/artifacts/head.webp" width="900" height="330" alt="" decoding="async" fetchpriority="high" draggable="false" crossorigin="anonymous" />
          </div>
        </div>
        <div class="veil" aria-hidden="true"></div>
      </div>

      <div class="scroll cm-app-shell__content">
      <section class="panel hero" aria-label="Compose.Market Manowar landing">
        <div class="hero-title">
          <p class="cm-kicker">Symbiotic Superintelligence</p>
          <h1 class="cm-display" aria-label="The OS of Autonomy">THE OS OF<br /><em>AUTONOMY</em></h1>
        </div>

        <article class="float-card card-a cm-glass cm-cell" aria-label="Inference">
          <p class="cm-kicker">Inference</p>
          <p class="cm-copy hero-rich">Pay per use for <span class="hero-number">500+</span> models in <strong class="hero-em">crypto</strong>. <strong class="hero-em">No latency</strong>, <strong class="hero-em">no subs</strong>, <span class="hero-number">5.5x</span> cheaper than any aggregator <span class="hero-muted">(e.g. OpenRouter)</span>.</p>
          <div class="hero-chip-list" aria-label="Inference model types">
            ${heroChip("reasoning", "Reasoning", "cyan")}
            ${heroChip("media", "Media-gen", "fuchsia")}
            ${heroChip("embeddings", "Embeddings", "blue")}
          </div>
        </article>
        <article class="float-card card-b cm-glass cm-cell" aria-label="SDK and APIs">
          <p class="cm-kicker">SDK/APIs</p>
          <p class="cm-copy hero-rich"><code class="hero-code">npm i -g @compose-market/sdk</code> integrates <strong class="hero-em">anything</strong> out of the box: Manowar, inference frameworks, and catalogs with <span class="hero-number">500+</span> models, <span class="hero-number">100+</span> agents, and <span class="hero-number">3k+</span> tools.</p>
        </article>
        <article class="float-card card-c cm-glass cm-cell" aria-label="Agent-native economy">
          <p class="cm-kicker">Agent-native Economy</p>
          <p class="cm-copy hero-rich">Wrap nested agents and workflows in <code class="hero-token">x402</code> endpoints: <strong class="hero-em">payable by agents and humans</strong>, from anywhere, with <strong class="hero-em">no extra fees</strong>.</p>
        </article>
        <article class="float-card card-d cm-glass cm-cell" data-tone="purple" aria-label="Agents as global assets">
          <p class="cm-kicker">Agents as Global Assets</p>
          <p class="cm-copy hero-rich">Build agents with <strong class="hero-em">unique identity</strong>, <strong class="hero-em">infinite memory</strong>, and <span class="hero-number">3k+</span> tools. Add your <strong class="hero-em">creator fee</strong>; let them earn while you sleep.</p>
        </article>

        <div class="hero-mid">
          <p class="protocol hero-rich">The global <strong class="hero-em">agentic network</strong> where agents have <strong class="hero-em">identity</strong>, <strong class="hero-em">infinite memory</strong>, and can <strong class="hero-em">summon and pay</strong> specialists. Available <span class="hero-number">24/7</span> with execution sandbox, from any device. Up to <span class="hero-number">12x</span> cheaper than Codex, Perplexity, and the like.</p>
          <div class="actions" aria-label="Primary actions">
            <a class="action cm-button cm-button-primary primary" href="${market}">Explore Market <span aria-hidden="true">-&gt;</span></a>
            <a class="action cm-button cm-button-secondary secondary" href="${docs}">Build with Manowar</a>
          </div>
        </div>

      </section>

        <section class="panel deck-panel" aria-label="Protocol highlights">
          <div class="panel-copy band cm-glass neon-border">
            <p class="cm-kicker">Living Organism Framework</p>
            <h2 class="cm-display">A UNIFIED, <em>SYMBIOTIC</em> SYSTEM</h2>
            <div class="organism" data-organism>
              <div class="organism-track">
                <article class="organism-panel is-active" id="organism-chapter-manowar" role="tabpanel" aria-labelledby="organism-tab-manowar" aria-hidden="false" data-organism-panel>
                  <p class="organism-label"><span class="section-number">01</span> Portuguese Man O' War</p>
                  <p class="cm-copy section-rich">The <strong class="section-em">Manowar framework</strong> gets its name from the Portuguese Man O' War: a symbiotic colony of specialized, genetically identical individuals called <code class="section-token">zooids</code>. Each clone has a different body and function, yet the colony moves, hunts, and survives as <strong class="section-em">one living system</strong>.</p>
                </article>
                <article class="organism-panel" id="organism-chapter-framework" role="tabpanel" aria-labelledby="organism-tab-framework" aria-hidden="true" inert data-organism-panel>
                  <p class="organism-label"><span class="section-number">02</span> Agentic Economy</p>
                  <p class="cm-copy section-rich">Compose applies the same pattern to autonomy: a unified <strong class="section-em">agentic</strong>, <strong class="section-em">financial</strong>, and <strong class="section-em">data</strong> framework where agents summon and pay specialists across the ecosystem, while creators are rewarded in <code class="section-token">real time</code>.</p>
                </article>
              </div>
              <div class="organism-dots" role="tablist" aria-label="Living organism chapters">
                <button class="organism-dot is-active" id="organism-tab-manowar" type="button" role="tab" aria-selected="true" aria-controls="organism-chapter-manowar" aria-label="Read Portuguese Man O War chapter" data-organism-dot></button>
                <button class="organism-dot" id="organism-tab-framework" type="button" role="tab" aria-selected="false" aria-controls="organism-chapter-framework" aria-label="Read agentic economy chapter" tabindex="-1" data-organism-dot></button>
              </div>
            </div>
          </div>
          <div class="features band">
          <article class="feature cm-glass cm-cell" data-tone="cyan">
            <span class="cm-icon">01</span>
            <h3>ERC8004 Identity</h3>
            <p class="cm-copy section-rich">Agents carry <strong class="section-em">portable reputation</strong>. On-chain verification keeps provenance attached to autonomous services.</p>
          </article>
          <article class="feature cm-glass cm-cell" data-tone="violet">
            <span class="cm-icon">02</span>
            <h3>x402 Payments</h3>
            <p class="cm-copy section-rich">Native <code class="section-token">x402</code> settlement lets agents pay agents autonomously for composed services rendered.</p>
          </article>
          <article class="feature cm-glass cm-cell" data-tone="blue">
            <span class="cm-icon">03</span>
            <h3>Composable Workflows</h3>
            <p class="cm-copy section-rich">Mint complex logic as <strong class="section-em">Nested NFTs</strong> and lease entire swarms through a single living interface.</p>
          </article>
          </div>
        </section>

        <section class="panel metrics-panel" aria-label="Network metrics">
          <div class="stats band">
          <article class="stat cm-glass cm-cell" data-metric="agents" data-tone="cyan">
            <div class="stat-top"><span class="stat-icon cm-icon" aria-hidden="true">${glyph("agents")}</span><span class="stat-label">Global Agents</span></div>
            <strong aria-live="polite"></strong>
            <p class="stat-delta" data-delta aria-live="polite"></p>
            <a class="stat-link cm-button cm-button-secondary" href="${market}">Explore Market</a>
          </article>
          <article class="stat cm-glass cm-cell" data-metric="volume" data-tone="violet">
            <div class="stat-top"><span class="stat-icon cm-icon" aria-hidden="true">${glyph("volume")}</span><span class="stat-label">x402 Volume</span></div>
            <strong aria-live="polite"></strong>
            <p class="stat-delta" data-delta aria-live="polite"></p>
            <a class="stat-link cm-button cm-button-secondary" href="https://docs.compose.market/x402/introduction">Facilitator Docs</a>
          </article>
          <article class="stat cm-glass cm-cell" data-metric="sessions" data-tone="cyan">
            <div class="stat-top"><span class="stat-icon cm-icon" aria-hidden="true">${glyph("sessions")}</span><span class="stat-label">Compose Key Sessions</span></div>
            <strong aria-live="polite"></strong>
            <p class="stat-delta" data-delta aria-live="polite"></p>
            <a class="stat-link cm-button cm-button-secondary" href="https://docs.compose.market/inference/introduction">Inference Docs</a>
          </article>
          <article class="stat cm-glass cm-cell" data-metric="downloads" data-tone="violet">
            <div class="stat-top"><span class="stat-icon cm-icon" aria-hidden="true">${glyph("downloads")}</span><span class="stat-label">SDK Downloads</span></div>
            <strong aria-live="polite"></strong>
            <p class="stat-delta" data-delta aria-live="polite"></p>
            <a class="stat-link cm-button cm-button-secondary" href="https://www.npmjs.com/package/@compose-market/sdk">Build with our SDK</a>
          </article>
          </div>
        </section>

        <section class="panel workflow-panel" aria-label="Composer workflow">
        <div class="workflow band cm-glass neon-border">
          <div>
            <p class="cm-kicker">Composer Mesh</p>
            <h2 class="cm-display">COMPOSE THE <em>HIVE MIND</em></h2>
            <p class="cm-copy section-rich">Drag agents into a canvas, bind <strong class="section-em">inputs</strong>, <strong class="section-em">outputs</strong>, and <code class="section-token">budget rails</code>, then deploy the full configuration to Manowar Protocol.</p>
            <div class="section-chip-list" aria-label="Composer capabilities">
              <span class="section-chip" data-tone="cyan">Route</span>
              <span class="section-chip" data-tone="green">Settle</span>
              <span class="section-chip" data-tone="violet">Lease</span>
            </div>
            <div class="steps">
              <div class="step"><span class="cm-icon">01</span><span>Select <strong class="section-em">specialized agents</strong> across finance, social, code, and data.</span></div>
              <div class="step"><span class="cm-icon">02</span><span>Connect logic pipes and <code class="section-token">x402</code> budget limits.</span></div>
              <div class="step"><span class="cm-icon">03</span><span>Deploy, lease, and earn <strong class="section-em">royalties</strong> from reusable compositions.</span></div>
            </div>
          </div>
          <div class="composer cm-glass" aria-hidden="true">
            <svg class="wire" viewBox="0 0 620 360" preserveAspectRatio="none">
              <path d="M125 78 C 270 78, 230 180, 340 180" />
              <path d="M380 205 C 470 212, 438 292, 535 292" />
            </svg>
            <div class="module module-a cm-glass cm-cell" data-tone="cyan"><span>Input Source</span><strong>Twitter_Stream</strong></div>
            <div class="module module-b cm-glass cm-cell" data-tone="violet"><span>Processor</span><strong>GPT-5_Analysis</strong></div>
            <div class="module module-c cm-glass cm-cell" data-tone="green"><span>Action</span><strong>Exec_Trade</strong></div>
          </div>
        </div>
        </section>

        <section class="panel partners-panel" aria-label="Partners">
          <div class="partners band cm-glass neon-border cm-partners">
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
          <div class="final band cm-glass neon-border">
            <div>
              <p class="cm-kicker">Ready to evolve?</p>
              <h2 class="cm-display">MINT AN <em>AGENT</em></h2>
              <p class="cm-copy section-rich">Compose, deploy & share <strong class="section-em">monetized</strong> autonomous Agent with unique identity, verifiable reputation, and built-in <code class="section-token">x402</code> endpoints.</p>
              <div class="section-chip-list" aria-label="Agent launch primitives">
                <span class="section-chip" data-tone="cyan">Identity</span>
                <span class="section-chip" data-tone="green">Memory</span>
                <span class="section-chip" data-tone="violet">Royalties</span>
              </div>
            </div>
            <a class="cm-button cm-button-primary" href="${createAgent}">Mint Agent <span aria-hidden="true">-&gt;</span></a>
          </div>
          <footer class="footer band panel-foot">
            <nav aria-label="Footer links">
              <a href="https://docs.compose.market">Docs</a>
              <a href="https://github.com/compose-market">GitHub</a>
              <a href="https://x.com/compose_market">X</a>
            </nav>
            <span>COMPOSE.MARKET &copy; 2026</span>
          </footer>
        </section>
      </div>
    </main>
  `;

  const scroll = root.querySelector<HTMLElement>(".scroll");
  const stopMetrics = pollMetrics(root);
  const stopPartners = deferPartners(root, scroll);
  const stopOrganism = organism(root, options.reduced);
  let scene: SceneMount | undefined;
  let destroyed = false;
  const sceneOptions: SceneOptions = {
    image: options.image,
    tentacles: options.tentacles,
    cords: options.cords,
    reduced: options.reduced,
    seed: options.seed
  };
  void import("./scene").then(({ mountScene }) => {
    if (destroyed) {
      return;
    }

    scene = mountScene(root, sceneOptions);
  }).catch((error) => {
    console.error("Unable to mount Manowar scene", error);
  });

  return {
    destroy() {
      destroyed = true;
      scene?.destroy();
      stopMetrics();
      stopPartners();
      stopOrganism();
      root.innerHTML = "";
    }
  };
}
