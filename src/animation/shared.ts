import type { SceneMount, SceneOptions } from "./scene";

export type Mount = {
  destroy: () => void;
};

export type PageOptions = SceneOptions & {
  appBase?: string;
  keys?: string;
  createAgent?: string;
  docsBase?: string;
  docs?: string;
};

export type PageId = "inference" | "manowar" | "terms" | "privacy";
type NavPageId = "inference" | "manowar";

export type PageUrls = {
  appBase: string;
  docsBase: string;
  keys: string;
  createAgent: string;
  docs: string;
};

export type PageModule = {
  title: string;
  description: string;
  render: (urls: PageUrls) => string;
  wire: (content: HTMLElement) => () => void;
};

const navIcons = {
  inference: '<rect width="16" height="16" x="4" y="4" rx="2" /><rect width="6" height="6" x="9" y="9" /><path d="M15 2v2" /><path d="M15 20v2" /><path d="M2 15h2" /><path d="M2 9h2" /><path d="M20 15h2" /><path d="M20 9h2" /><path d="M9 2v2" /><path d="M9 20v2" />',
  manowar: '<path d="M12 8V4H8" /><rect width="16" height="12" x="4" y="8" rx="2" /><path d="M2 14h2" /><path d="M20 14h2" /><path d="M15 13v2" /><path d="M9 13v2" />'
} satisfies Record<NavPageId, string>;

const heroIcons = {
  reasoning: '<path d="M12 3v3" /><path d="M18.36 5.64 16.24 7.76" /><path d="M21 12h-3" /><path d="m18.36 18.36-2.12-2.12" /><path d="M12 21v-3" /><path d="m5.64 18.36 2.12-2.12" /><path d="M3 12h3" /><path d="m5.64 5.64 2.12 2.12" /><circle cx="12" cy="12" r="3.2" />',
  media: '<rect width="16" height="13" x="4" y="5" rx="2" /><path d="m8 15 2.4-2.4a1.5 1.5 0 0 1 2.1 0L16 16" /><circle cx="9" cy="9" r="1" />',
  embeddings: '<path d="M8 3 4 7l4 4" /><path d="m16 3 4 4-4 4" /><path d="M4 17h16" /><path d="M7 21h10" />',
  crypto: '<path d="M12 2 4 6v12l8 4 8-4V6Z" /><path d="M12 22V12" /><path d="m4.5 6.5 7.5 4.5 7.5-4.5" />',
  identity: '<path d="M12 11a2 2 0 0 1 2 2c0 3-1 5-2 7" /><path d="M8.5 13a3.5 3.5 0 0 1 7 0c0 3.5-1 6-2 8" /><path d="M5 13a7 7 0 0 1 14 0c0 2-.3 4-1 6" /><path d="M7 18c.7-1.5 1-3.2 1-5a4 4 0 0 1 8 0" /><path d="M6 7a8 8 0 0 1 12 0" />',
  telemetry: '<path d="M3 12h3l2.2-6 3.8 12 3-9 2 3h4" />',
  tracing: '<circle cx="5" cy="6" r="2" /><circle cx="19" cy="18" r="2" /><path d="M7 6h4a3 3 0 0 1 3 3v6a3 3 0 0 0 3 3" /><path d="m11 3 3 3-3 3" />',
  analytics: '<path d="M4 20V10h4v10" /><path d="M10 20V4h4v16" /><path d="M16 20v-7h4v7" /><path d="M2 20h20" />',
  usdc: '<circle cx="12" cy="12" r="9" /><path d="M16 8.5h-5.5a2.5 2.5 0 0 0 0 5h3a2.5 2.5 0 0 1 0 5H8" /><path d="M12 6v2.5" /><path d="M12 18.5V21" />',
  x402: '<path d="M8 6h8" /><path d="m13 3 3 3-3 3" /><path d="M16 18H8" /><path d="m11 15-3 3 3 3" /><path d="M12 9v6" /><path d="M14.5 10.5h-3a1.5 1.5 0 0 0 0 3h1a1.5 1.5 0 0 1 0 3h-3" />',
  route: '<circle cx="5" cy="12" r="2" /><circle cx="19" cy="5" r="2" /><circle cx="19" cy="19" r="2" /><path d="M7 12h3a4 4 0 0 0 4-4 3 3 0 0 1 3-3" /><path d="M10 12a4 4 0 0 1 4 4 3 3 0 0 0 3 3" />',
  settle: '<circle cx="12" cy="12" r="9" /><path d="m8 12 2.5 2.5L16 9" />',
  receipt: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2Z" /><path d="M9 8h6" /><path d="M9 12h6" /><path d="M9 16h3" />',
  model: '<path d="m12 2 8 4.5v11L12 22l-8-4.5v-11Z" /><path d="m4.5 6.8 7.5 4.3 7.5-4.3" /><path d="M12 11v11" />',
  agent: '<path d="M12 7V3" /><path d="M9 3h6" /><rect width="16" height="12" x="4" y="7" rx="3" /><circle cx="9" cy="13" r="1" /><circle cx="15" cy="13" r="1" /><path d="M9 17h6" /><path d="M2 12v3" /><path d="M22 12v3" />',
  memory: '<path d="M9.5 4.5A3 3 0 0 0 5 7.1a3.5 3.5 0 0 0-1 6.7A3 3 0 0 0 8 18.2 3 3 0 0 0 12 21V6a3 3 0 0 0-2.5-1.5Z" /><path d="M14.5 4.5A3 3 0 0 1 19 7.1a3.5 3.5 0 0 1 1 6.7 3 3 0 0 1-4 4.4A3 3 0 0 1 12 21" /><path d="M8 9a3 3 0 0 0 4 2" /><path d="M16 9a3 3 0 0 1-4 2" /><path d="M8 15a3 3 0 0 1 4 2" /><path d="M16 15a3 3 0 0 0-4 2" />',
  ttft: '<circle cx="12" cy="13" r="8" /><path d="M12 9v4l3 2" /><path d="M9 2h6" /><path d="M12 2v3" /><path d="m19 5 1.5 1.5" /><path d="m5 4 1 2 2 1-2 1-1 2-1-2-2-1 2-1Z" />',
  loop: '<path d="M17 2l3 3-3 3" /><path d="M3 11V9a4 4 0 0 1 4-4h13" /><path d="m7 22-3-3 3-3" /><path d="M21 13v2a4 4 0 0 1-4 4H4" />',
  workflow: '<circle cx="6" cy="5" r="2" /><circle cx="18" cy="12" r="2" /><circle cx="6" cy="19" r="2" /><path d="M8 5h3a3 3 0 0 1 3 3v1a3 3 0 0 0 2 2.8" /><path d="M8 19h3a3 3 0 0 0 3-3v-1a3 3 0 0 1 2-2.8" />',
  swarm: '<path d="M12 5V2H9" /><rect width="10" height="8" x="7" y="5" rx="2" /><path d="M10 9h.01" /><path d="M14 9h.01" /><path d="M5 14v-2H3" /><rect width="7" height="6" x="2" y="14" rx="1.5" /><path d="M19 14v-2h2" /><rect width="7" height="6" x="15" y="14" rx="1.5" />',
  sdk: '<path d="m12 2 9 5-9 5-9-5Z" /><path d="m3 12 9 5 9-5" /><path d="m3 17 9 5 9-5" /><path d="M8 7h8" />',
  api: '<path d="M8 12H3" /><path d="M21 12h-5" /><path d="M8 8v8" /><path d="M16 8v8" /><path d="M8 10h8v4H8z" /><path d="M3 9v6" /><path d="M21 9v6" />',
  endpoint: '<circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="4" /><circle cx="12" cy="12" r="1" /><path d="M12 3v2" /><path d="M21 12h-2" /><path d="M12 21v-2" /><path d="M3 12h2" />',
  factory: '<path d="M3 21V10l6 3V9l6 4V7l6 4v10Z" /><path d="M7 17h2" /><path d="M13 17h2" /><path d="M18 3v6" /><path d="M16 3h4" />',
  composability: '<path d="M9 3h4v3a2 2 0 1 0 4 0V3h4v7h-3a2 2 0 1 0 0 4h3v7h-7v-3a2 2 0 1 0-4 0v3H3v-7h3a2 2 0 1 0 0-4H3V3Z" />',
  composable: '<path d="m8 3 5 3-5 3-5-3Z" /><path d="m3 6v6l5 3 5-3V6" /><path d="m16 9 5 3-5 3-5-3" /><path d="m11 12v6l5 3 5-3v-6" />'
} satisfies Record<string, string>;

export function appUrl(base: string, path: string) {
  return `${base.replace(/\/+$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}

export function heroGlyph(key: keyof typeof heroIcons): string {
  return `<svg class="hero-chip__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${heroIcons[key]}</svg>`;
}

export function heroChip(key: keyof typeof heroIcons, label: string, tone: string): string {
  return `<span class="hero-chip" data-tone="${tone}">${heroGlyph(key)}<span>${label}</span></span>`;
}

function scenePosterHtml(page: PageId): string {
  if (page === "inference") {
    return `<div class="scene-poster scene-poster--inference" data-scene-poster="inference"></div>`;
  }

  if (page === "manowar") {
    return `
          <div class="scene-poster scene-poster--manowar" data-scene-poster="manowar">
            <img class="scene-poster__tentacles" src="/artifacts/tentacles.webp" width="900" height="1180" alt="" decoding="async" fetchpriority="high" draggable="false" crossorigin="anonymous" />
            <img class="scene-poster__head" src="/artifacts/head.webp" width="900" height="330" alt="" decoding="async" fetchpriority="high" draggable="false" crossorigin="anonymous" />
          </div>`;
  }

  // Legal pages render a clean CSS-only backdrop (grid, gradient, scanline)
  // with no 3D scene poster.
  return "";
}

export function backdropHtml(page: PageId = "inference"): string {
  return `
      <div class="backdrop cm-app-shell__backdrop" aria-hidden="true">
        <div class="cm-app-shell__grid bg-grid-pattern"></div>
        <div class="cm-app-shell__gradient"></div>
        <div class="cm-app-shell__scanline"></div>
        <div class="stage" aria-hidden="true">
${scenePosterHtml(page)}
        </div>
        <div class="veil" aria-hidden="true"></div>
      </div>`;
}

export function pagePath(page: PageId): string {
  if (page === "manowar") return "/manowar/";
  if (page === "terms") return "/terms/";
  if (page === "privacy") return "/privacy/";
  return "/";
}

export function pageFromPath(pathname: string): PageId {
  const normalized = pathname.replace(/\/+$/, "");
  if (normalized === "/manowar") return "manowar";
  if (normalized === "/terms") return "terms";
  if (normalized === "/privacy") return "privacy";
  return "inference";
}

function navItem(page: NavPageId, label: string): string {
  return `<a class="cm-app-chrome__navitem" href="${pagePath(page)}" data-page-link="${page}" data-active="false" aria-label="${label}" title="${label}"><span class="cm-app-chrome__navitem-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${navIcons[page]}</svg></span><span class="cm-app-chrome__tooltip" aria-hidden="true">${label}</span></a>`;
}

export function navHtml(): string {
  return `
      <nav class="cm-app-chrome__navdock" aria-label="Primary navigation">
        <div class="cm-app-chrome__navgroup">
          ${navItem("inference", "Inference")}
          ${navItem("manowar", "Manowar")}
        </div>
      </nav>`;
}

export function markActiveNavItem(root: ParentNode, active: PageId) {
  for (const item of root.querySelectorAll<HTMLElement>("[data-page-link]")) {
    const current = item.dataset.pageLink === active;
    item.dataset.active = String(current);

    if (item.classList.contains("cm-app-chrome__navitem")) {
      if (current) {
        item.setAttribute("aria-current", "page");
      } else {
        item.removeAttribute("aria-current");
      }
    }
  }
}

export function footerHtml(): string {
  return `
          <footer class="footer band panel-foot">
            <nav aria-label="Footer links">
              <a href="/" data-page-link="inference" data-active="false">Inference</a>
              <a href="/manowar/" data-page-link="manowar" data-active="false">Manowar</a>
              <a href="/terms/" data-page-link="terms" data-active="false">Terms</a>
              <a href="/privacy/" data-page-link="privacy" data-active="false">Privacy</a>
              <a href="https://docs.compose.market">Docs</a>
              <a href="https://github.com/compose-market">GitHub</a>
              <a href="https://x.com/composex402">X</a>
            </nav>
            <span>COMPOSE.MARKET &copy; 2026</span>
          </footer>`;
}

export function lazyScene(root: HTMLElement, options: SceneOptions): Mount & {
  activate: (page: PageId) => void;
  rebind: () => void;
} {
  let scene: SceneMount | undefined;
  let destroyed = false;
  let active: PageId | undefined;
  let request = 0;

  const poster = (page: PageId) => {
    const shell = root.querySelector<HTMLElement>(".shell");
    const stage = root.querySelector<HTMLElement>(".stage");
    shell?.setAttribute("data-scene", page);

    if (stage) {
      const hasPoster = Boolean(stage.querySelector(`[data-scene-poster="${page}"]`));
      const expectsPoster = page === "inference" || page === "manowar";

      if ((expectsPoster && !hasPoster) || (!expectsPoster && stage.childElementCount > 0)) {
        stage.innerHTML = scenePosterHtml(page);
      }
    }
  };

  return {
    activate(page) {
      if (destroyed) {
        return;
      }

      if (page === active && scene) {
        scene.rebind();
        return;
      }

      const current = ++request;
      active = page;
      scene?.destroy();
      scene = undefined;
      poster(page);

      // Legal pages skip the WebGL scene — the static CSS backdrop suffices.
      if (page === "terms" || page === "privacy") {
        return;
      }

      const loading = page === "inference" ? import("./cube") : import("./scene");
      void loading.then((module) => {
        if (destroyed || current !== request) {
          return;
        }

        scene = module.mountScene(root, options);
      }).catch((error) => {
        console.error(`Unable to mount ${page} scene`, error);
      });
    },
    rebind() {
      scene?.rebind();
    },
    destroy() {
      destroyed = true;
      request += 1;
      scene?.destroy();
    }
  };
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

export function deferUntilNear(target: Element | null, root: Element | null, rootMargin: string, run: () => void) {
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

export function organism(root: ParentNode, forcedReduced = false) {
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
