import "@compose-market/theme/css/tokens";
import "@compose-market/theme/css/dark";
import "@compose-market/theme/css/app";
import "@compose-market/theme/css/effects";
import "@compose-market/theme/css/utilities";
import "../style.css";
import {
  appUrl,
  backdropHtml,
  lazyScene,
  markActiveNavItem,
  navHtml,
  pageFromPath,
  pagePath,
  type PageId,
  type PageModule,
  type PageUrls
} from "../animation/shared";
import * as inference from "./home";
import * as manowar from "./manowar";
import { inject } from "@vercel/analytics";

// Initialize Vercel Web Analytics
inject();

const appRoot = document.querySelector<HTMLElement>("#app");

if (!appRoot) {
  throw new Error("Missing #app root");
}

const root: HTMLElement = appRoot;
const initialPage = pageFromPath(window.location.pathname);

const pages: Record<PageId, PageModule> = { inference, manowar };

const urls: PageUrls = (() => {
  const appBase = "https://app.compose.market";
  const docsBase = "https://docs.compose.market";

  return {
    appBase,
    docsBase,
    keys: appUrl(appBase, "/keys"),
    createAgent: appUrl(appBase, "/create-agent"),
    dashboard: appUrl(appBase, "/dashboard"),
    docs: appUrl(docsBase, "/")
  };
})();

// The shell (backdrop, WebGL scene, nav dock) mounts once and persists across
// page switches — pagination only swaps the scrollable content.
root.innerHTML = `
  <main class="shell cm-app-shell cm-app-shell--luminescent" data-scene="${initialPage}">
    ${backdropHtml(initialPage)}
    ${navHtml()}
    <div class="scroll cm-app-shell__content"></div>
  </main>
`;

const scrollHost = root.querySelector<HTMLElement>(".scroll");

if (!scrollHost) {
  throw new Error("Missing .scroll container");
}

const scroll: HTMLElement = scrollHost;

const scene = lazyScene(root, {});

let active: PageId | undefined;
let stopPage: () => void = () => { };

function render(page: PageId, push = false) {
  if (page === active) {
    return;
  }

  const mod = pages[page];

  stopPage();
  scroll.innerHTML = mod.render(urls);
  stopPage = mod.wire(scroll);
  scene.activate(page);
  active = page;

  document.title = mod.title;
  document
    .querySelector('meta[name="description"]')
    ?.setAttribute("content", mod.description);
  markActiveNavItem(root, page);

  scroll.scrollTo({ top: 0, behavior: "instant" });

  if (push) {
    window.history.pushState({ page }, "", pagePath(page));
  }
}

// Client-side pagination: intercept internal page links so switching tabs never
// reloads the document (the scene and shell stay alive). Modifier clicks and
// external links fall through to default browser behavior.
document.addEventListener("click", (event) => {
  if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
    return;
  }

  const link = (event.target as Element | null)?.closest?.("a[data-page-link]");

  if (!link) {
    return;
  }

  const page = link.getAttribute("data-page-link") as PageId | null;

  if (!page || !pages[page]) {
    return;
  }

  event.preventDefault();

  if (page === active) {
    scroll.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  render(page, true);
});

window.addEventListener("popstate", () => {
  render(pageFromPath(window.location.pathname));
});

render(initialPage);

// Expose teardown for tests and hot-reload.
(window as unknown as { __composeDestroy?: () => void }).__composeDestroy = () => {
  stopPage();
  scene.destroy();
};
