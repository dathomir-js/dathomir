type IslandsDirectivePreview = {
  title: string;
  mode: "csr" | "ssr";
  source: string;
  output?: string;
  error?: string;
};

function isPreviewMode(value: unknown): value is IslandsDirectivePreview["mode"] {
  return value === "csr" || value === "ssr";
}

function isIslandsDirectivePreview(
  value: unknown,
): value is IslandsDirectivePreview {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.title === "string" &&
    isPreviewMode(candidate.mode) &&
    typeof candidate.source === "string" &&
    (candidate.output === undefined || typeof candidate.output === "string") &&
    (candidate.error === undefined || typeof candidate.error === "string")
  );
}

function parsePreviewPayload(
  pagePayloadJson: string,
): IslandsDirectivePreview[] {
  if (pagePayloadJson === "") {
    return [];
  }

  try {
    const payload = JSON.parse(pagePayloadJson);
    return Array.isArray(payload)
      ? payload.filter(isIslandsDirectivePreview)
      : [];
  } catch {
    return [];
  }
}

function IslandsDirectivePage(props: { pagePayloadJson: string }) {
  const previews = parsePreviewPayload(props.pagePayloadJson);

  return (
    <>
      <section>
        <h2>Transformer contract before runtime strategy execution</h2>
        <p>
          This route does not hydrate islands yet. It shows the Phase 0 transformer
          contract that normalizes <code>client:*</code> directives into reserved
          metadata for the next runtime pillar.
        </p>
      </section>

      <section>
        <h2>Contract preview snapshots</h2>
        <p>
          This page currently renders server-provided preview snapshots for the
          transformer contract. Runtime strategy execution is still the next pillar.
        </p>

        <div class="route-grid">
          {previews.map((preview) => (
            <article class="route-card">
              <h3>{preview.title}</h3>
              <p>
                Mode: <strong>{preview.mode.toUpperCase()}</strong>
              </p>
              <p>
                Source: <code>{preview.source}</code>
              </p>
              {preview.output === undefined ? (
                <>
                  <p>Expected failure:</p>
                  <pre class="ssr-markup-code">{preview.error ?? "No error captured."}</pre>
                </>
              ) : (
                <>
                  <p>Transformed output:</p>
                  <pre class="ssr-markup-code">{preview.output}</pre>
                </>
              )}
            </article>
          ))}
        </div>
      </section>

      <section>
        <h2>What to verify</h2>
        <p>
          Valid component directives should compile to <code>data-dh-island</code>
          and, when needed, <code>data-dh-island-value</code>.
        </p>
        <p>
          Invalid forms such as bare <code>client:media</code> should fail during
          transform instead of reaching runtime.
        </p>
      </section>
    </>
  );
}

export { IslandsDirectivePage };
