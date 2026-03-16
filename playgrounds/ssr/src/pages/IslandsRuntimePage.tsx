import { css, defineComponent } from "@dathomir/components";
import { onCleanup, signal } from "@dathomir/core";

const islandCardStyles = css`
  :host {
    display: block;
  }

  article {
    display: grid;
    gap: 12px;
    padding: 20px;
    border: 1px solid rgba(33, 71, 60, 0.14);
    border-radius: 20px;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(239, 246, 241, 0.82));
    box-shadow: 0 16px 36px rgba(23, 49, 39, 0.08);
  }

  h3,
  p {
    margin: 0;
  }

  .strategy-meta {
    display: inline-flex;
    width: fit-content;
    align-items: center;
    gap: 8px;
    padding: 6px 10px;
    border-radius: 999px;
    background: rgba(33, 71, 60, 0.1);
    color: #21473c;
    font-size: 0.78rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  [data-role="status"] {
    color: #21473c;
    font-weight: 700;
  }

  .is-waiting {
    color: #8c5a18;
  }

  .is-ready {
    color: #0f5b3a;
  }

  .demo-button {
    justify-self: start;
  }

  .demo-count {
    font-weight: 700;
  }
`;

const PlaygroundHydrationIsland = defineComponent(
  "playground-hydration-island",
  ({ props }) => {
    return (
      <article>
        <p class="strategy-meta">{props.strategyLabel.value}</p>
        <h3>{props.title.value}</h3>
        <p>{props.description.value}</p>
        <p data-role="status" class="is-waiting">
          Waiting for hydration.
        </p>
        <button class="demo-button" type="button">
          Demo action
        </button>
        <p>
          Click count after hydration: <span class="demo-count" data-role="count">0</span>
        </p>
      </article>
    );
  },
  {
    styles: [islandCardStyles],
    hydrate: ({ host }) => {
      const shadowRoot = host.shadowRoot;
      if (shadowRoot === null) {
        return;
      }

      const strategy = host.getAttribute("data-dh-island") ?? "unknown";
      const status = shadowRoot.querySelector('[data-role="status"]');
      const countNode = shadowRoot.querySelector('[data-role="count"]');
      const button = shadowRoot.querySelector("button");

      host.setAttribute("data-hydrated", "true");
      host.setAttribute("data-hydrated-strategy", strategy);

      if (status instanceof HTMLElement) {
        status.textContent = `Hydrated on client via ${strategy}.`;
        status.className = "is-ready";
      }

      if (!(button instanceof HTMLButtonElement) || !(countNode instanceof HTMLElement)) {
        return;
      }

      let clickCount = 0;
      const onClick = () => {
        clickCount += 1;
        countNode.textContent = String(clickCount);
      };

      button.addEventListener("click", onClick);
      onCleanup(() => {
        button.removeEventListener("click", onClick);
      });
    },
    props: {
      title: { type: String, default: "Hydration island" },
      description: { type: String, default: "Strategy demo" },
      strategyLabel: { type: String, default: "client:load" },
      islandStrategy: {
        type: String,
        default: "load",
        attribute: "data-dh-island",
      },
      islandValue: {
        type: String,
        default: "",
        attribute: "data-dh-island-value",
      },
    },
  },
);

const colocatedCardStyles = css`
  :host {
    display: block;
  }

  article {
    display: grid;
    gap: 12px;
    padding: 20px;
    border: 1px solid rgba(33, 71, 60, 0.14);
    border-radius: 20px;
    background: linear-gradient(180deg, rgba(245, 251, 247, 0.96), rgba(233, 243, 236, 0.92));
  }

  h3,
  p {
    margin: 0;
  }

  .syntax-chip {
    display: inline-flex;
    width: fit-content;
    padding: 6px 10px;
    border-radius: 999px;
    background: rgba(18, 89, 58, 0.1);
    color: #12593a;
    font-size: 0.78rem;
    font-weight: 700;
  }

  .count {
    font-weight: 700;
  }
`;

const PlaygroundColocatedLoadCard = defineComponent(
  "playground-colocated-load-card",
  ({ client }) => {
    const count = signal(0);

    return (
      <article>
        <p class="syntax-chip">load:onClick</p>
        <h3>Colocated load click</h3>
        <p>
          The button keeps its click behavior next to the element markup. The host waits for
          the load strategy, rerenders, and then the click handler increments the counter.
        </p>
        <p>Active strategy in setup: {client.strategy ?? "none"}</p>
        <button
          class="demo-button"
          type="button"
          load:onClick={() => {
            count.set(count.value + 1);
          }}
        >
          Increment after load
        </button>
        <p>
          Count after hydration: <span class="count">{count.value}</span>
        </p>
      </article>
    );
  },
  {
    styles: [colocatedCardStyles],
  },
);

const PlaygroundColocatedInteractionCard = defineComponent(
  "playground-colocated-interaction-card",
  ({ client }) => {
    const count = signal(0);

    return (
      <article>
        <p class="syntax-chip">interaction:onClick</p>
        <h3>Colocated interaction click</h3>
        <p>
          The first click triggers hydration and is replayed onto the rerendered button, so the
          counter should jump to <strong>1</strong> immediately.
        </p>
        <p>
          This replay starts once the client boot script has wired <code>hydrateIslands()</code>.
        </p>
        <p>Active strategy in setup: {client.strategy ?? "none"}</p>
        <button
          class="demo-button"
          type="button"
          interaction:onClick={() => {
            count.set(count.value + 1);
          }}
        >
          Click to hydrate and increment
        </button>
        <p>
          Count after hydration: <span class="count">{count.value}</span>
        </p>
      </article>
    );
  },
  {
    styles: [colocatedCardStyles],
  },
);

function IslandsRuntimePage() {
  return (
    <>
      <section>
        <h2>Colocated click MVP</h2>
        <p>
          These two cards use the new HTML-element syntax directly inside the render function.
          The strategy and click behavior stay in one place instead of splitting into manual
          <code>hydrate</code> code.
        </p>
        <div class="route-grid">
          <PlaygroundColocatedLoadCard />
          <PlaygroundColocatedInteractionCard />
        </div>
      </section>

      <section>
        <h2>Deferred hydration strategies</h2>
        <p>
          This page keeps the server-rendered DSD in place and lets <code>hydrateIslands()</code>
          decide when each custom element should attach client behavior.
        </p>
        <p>
          Each card starts as plain SSR markup. When its strategy fires, the host receives
          <code>data-hydrated="true"</code> and the button inside the Shadow DOM becomes interactive.
        </p>
      </section>

      <section>
        <h2>Immediate and queued strategies</h2>
        <div class="route-grid">
          <PlaygroundHydrationIsland
            islandStrategy="load"
            title="Load strategy"
            strategyLabel="client:load"
            description="Waits for the browser load event before hydrating the island."
          />
          <PlaygroundHydrationIsland
            islandStrategy="idle"
            title="Idle strategy"
            strategyLabel="client:idle"
            description="Hydrates when requestIdleCallback (or the timeout fallback) gets a turn."
          />
          <PlaygroundHydrationIsland
            islandStrategy="interaction"
            title="Interaction strategy"
            strategyLabel="client:interaction"
            description="Hydrates only after the first click on the host element."
          />
        </div>
      </section>

      <section>
        <h2>Viewport and media driven strategies</h2>
        <p>
          Resize below <code>720px</code> to trigger the media-based island. Scroll near the
          bottom spacer to let the visible island enter the viewport.
        </p>
        <div class="route-grid">
          <PlaygroundHydrationIsland
            islandStrategy="media"
            islandValue="(max-width: 720px)"
            title="Media strategy"
            strategyLabel="client:media"
            description="Hydrates once the page matches the configured media query."
          />
        </div>
        <div style="height: 52vh" aria-hidden="true" />
        <div class="route-grid">
          <PlaygroundHydrationIsland
            islandStrategy="visible"
            title="Visible strategy"
            strategyLabel="client:visible"
            description="Hydrates after IntersectionObserver reports that the island is on screen."
          />
        </div>
      </section>

      <section>
        <h2>What to verify</h2>
        <p>
          On first paint, every card should render SSR markup first. The colocated cards stay in
          plain SSR mode until their strategy rerenders the host setup.
        </p>
        <p>
          The legacy runtime islands expose <code>data-hydrated="true"</code> after their strategy
          fires. The colocated cards instead reveal their active strategy in setup and start
          incrementing their colocated click counters.
        </p>
      </section>
    </>
  );
}

export { IslandsRuntimePage };
