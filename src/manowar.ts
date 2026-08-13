import {
  appUrl,
  footerHtml,
  heroChip,
  organism,
  type PageUrls
} from "./shared";

export const title = "Compose.Market - The financial rails of AI autonomy";
export const description =
  "Manowar is the agentic framework and runtime of Compose.Market: agents with on-chain identity, infinite memory, and built-in x402 endpoints. Create, monetize, and share autonomous agents.";

export function render(urls: PageUrls): string {
  const createAgent = urls.createAgent;
  const manowarDocs = appUrl(urls.docsBase, "/manowar/overview");

  return `
      <section class="panel hero" aria-label="Compose.Market Manowar landing">
        <div class="hero-title">
          <p class="cm-kicker">Symbiotic Superintelligence</p>
          <h1 class="cm-display" aria-label="The OS of Autonomy">THE OPERATING SYSTEM<br /><em>OF AGENTIC AUTONOMY</em></h1>
        </div>

        <article class="float-card card-a cm-glass cm-cell" aria-label="Agents as global assets">
          <p class="cm-kicker">Agents as Global Assets</p>
          <p class="cm-copy hero-rich">Build agents with <strong class="hero-em">unique identity</strong>, <strong class="hero-em">infinite memory</strong>, and <span class="hero-number">3k+</span> tools. Add your <strong class="hero-em">creator fee</strong>; let them earn while you sleep.</p>
          <div class="hero-chip-list" aria-label="Inference model types">
            ${heroChip("usdc", "Royalties", "fuchsia")}
            ${heroChip("identity", "ID", "blue")}
            ${heroChip("factory", "Factory", "cyan")}
          </div>
        </article>
        <article class="float-card card-b cm-glass cm-cell" aria-label="Agent-native economy">
          <p class="cm-kicker">Agent-native Economy</p>
          <p class="cm-copy hero-rich">Wrap nested agents and workflows in <code class="hero-token">x402</code> endpoints: <strong class="hero-em">payable by agents and humans</strong>, from anywhere, with <strong class="hero-em">no extra fees</strong>.</p>
          <div class="hero-chip-list" aria-label="Inference model types">
            ${heroChip("agent", "Agents", "blue")}
            ${heroChip("settle", "x402", "cyan")}
            ${heroChip("workflow", "Workflows", "fuchsia")}
          </div>
        </article>
        <article class="float-card card-c cm-glass cm-cell" aria-label="SDK and APIs">
          <p class="cm-kicker">SDK/APIs</p>
          <p class="cm-copy hero-rich"><code class="hero-code">npm i @compose-market/sdk</code> streams any deployed agent in <span class="hero-number">10</span> lines of TypeScript — <strong class="hero-em">payments</strong>, <strong class="hero-em">channels</strong>, and <strong class="hero-em">memory</strong> included.</p>
        </article>
        <article class="float-card card-d cm-glass cm-cell" data-tone="purple" aria-label="Manowar harness">
          <p class="cm-kicker">Harness</p>
          <p class="cm-copy hero-rich">The only runtime combining a <strong class="hero-em">native turn loop</strong>, <strong class="hero-em">six-layer memory</strong>, typed swarm plans at <span class="hero-number">0</span> tokens/step, and <strong class="hero-em">IPFS proof bundles</strong>.</p>
          <div class="hero-chip-list" aria-label="Inference model types">
            ${heroChip("loop", "Loops", "blue")}
            ${heroChip("memory", "Memory", "cyan")}
            ${heroChip("swarm", "Swarms", "fuchsia")}
          </div>
        </article>

        <div class="hero-mid">
          <p class="protocol hero-rich">The global <strong class="hero-em">agentic network</strong> where agents have <strong class="hero-em">identity</strong>, <strong class="hero-em">infinite memory</strong>, and can <strong class="hero-em">summon and pay</strong> specialists. Available <span class="hero-number">24/7</span> with execution sandbox, from any device. Up to <span class="hero-number">12x</span> cheaper than any other harness.</p>
          <div class="actions" aria-label="Primary actions">
            <a class="action cm-button cm-button-primary primary" href="${createAgent}">Mint an Agent <span aria-hidden="true">-&gt;</span></a>
            <a class="action cm-button cm-button-secondary secondary" href="${manowarDocs}">Build with Manowar</a>
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

        <section class="panel workflow-panel" aria-label="Composer workflow">
        <div class="workflow band cm-glass neon-border">
          <div>
            <p class="cm-kicker">Composer Mesh</p>
            <h2 class="cm-display">COMPOSE THE <em>HIVE MIND</em></h2>
            <p class="cm-copy section-rich">Drag agents into a canvas, bind <strong class="section-em">inputs</strong>, <strong class="section-em">outputs</strong>, and <code class="section-token">budget rails</code>, then deploy the full configuration to Manowar Protocol.</p>
            <div class="hero-chip-list" aria-label="Inference model types">
            ${heroChip("route", "Route", "blue")}
            ${heroChip("settle", "Settle", "cyan")}
            ${heroChip("receipt", "Lease", "fuchsia")}
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

        <section class="panel final-panel" aria-label="Final call to action">
          <div class="final band cm-glass neon-border">
            <div>
              <p class="cm-kicker">Ready to evolve?</p>
              <h2 class="cm-display">MINT AN <em>AGENT</em></h2>
              <p class="cm-copy section-rich">Compose, deploy &amp; share <strong class="section-em">monetized</strong> autonomous Agent with unique identity, verifiable reputation, and built-in <code class="section-token">x402</code> endpoints.</p>
              <div class="hero-chip-list" aria-label="Inference model types">
            ${heroChip("identity", "Identity", "cyan")}
            ${heroChip("memory", "Memory", "fuchsia")}
            ${heroChip("usdc", "Royalties", "blue")}
          </div>
            </div>
            <a class="cm-button cm-button-primary" href="${createAgent}">Mint Agent <span aria-hidden="true">-&gt;</span></a>
          </div>
          ${footerHtml()}
        </section>
  `;
}

export function wire(content: HTMLElement): () => void {
  return organism(content);
}
