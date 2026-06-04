import { DOCS_URL } from "../config";
import { messaging } from "../content/messaging.generated";

type Cell = {
  v: string;
  tone?: "yes" | "no" | "partial" | "neutral";
  ref?: string;
};
type VendorKey =
  (typeof messaging.authored.positioning.comparison.agentRows)[number]["key"];
type Row = { label: string; cells: Record<VendorKey, Cell> };

const COMPARISON_URL = `${DOCS_URL}/comparison`;

// Keep in sync with the Callout "Reviewed ..." date at the top of
// obs-unified-docs/content/docs/comparison.mdx. That doc is the source of
// truth for when the comparison was last verified.
const LAST_REVIEWED = "2026-05-31";

const ROWS: Row[] = messaging.authored.positioning.comparison.axes.map((axis) => ({
  label: axis.label,
  cells: axis.cells as Record<VendorKey, Cell>,
}));

// Assign a footnote number to every distinct ref id in the order they appear
// in manifest-backed rows, so the landing-page superscripts are stable.
function buildRefIndex(): Map<string, number> {
  const idx = new Map<string, number>();
  let n = 0;
  const vendorKeys = messaging.authored.positioning.comparison.agentRows.map(
    (agent) => agent.key,
  );
  for (const r of ROWS) {
    for (const key of vendorKeys) {
      const ref = r.cells[key]?.ref;
      if (ref && !idx.has(ref)) idx.set(ref, ++n);
    }
  }
  return idx;
}

function refMarker(refId: string | undefined, refIndex: Map<string, number>): string {
  if (!refId) return "";
  const n = refIndex.get(refId);
  if (!n) return "";
  return ` <sup class="cmp-ref"><a href="${COMPARISON_URL}#src-${refId}" rel="noopener" aria-label="Source ${n} - opens documentation">[${n}]</a></sup>`;
}

function cell(c: Cell, refIndex: Map<string, number>): string {
  const tone = c.tone ?? "neutral";
  return `<td class="cmp-cell cmp-${tone}">${c.v}${refMarker(c.ref, refIndex)}</td>`;
}

function row(r: Row, refIndex: Map<string, number>): string {
  const cells = messaging.authored.positioning.comparison.agentRows
    .map((agent) => cell(r.cells[agent.key], refIndex))
    .join("");
  return `
<tr>
  <th scope="row" class="cmp-row-label">${r.label}</th>
  ${cells}
</tr>`;
}

export function renderCompare(): string {
  const refIndex = buildRefIndex();
  const { comparison } = messaging.authored.positioning;
  const headers = comparison.agentRows
    .map((agent) => {
      const isUs = agent.key === "obs";
      const className = isUs ? "cmp-head cmp-head-us" : "cmp-head";
      return `<th scope="col" class="${className}">${agent.name}</th>`;
    })
    .join("");

  return `
<section id="compare" class="compare" aria-labelledby="compare-title">
  <div class="container">
    <header class="section-header">
      <p class="eyebrow">How it compares <span class="cmp-asof">- snapshot as of May 2026</span></p>
      <h2 id="compare-title">${comparison.headline}</h2>
      <p class="section-lead">
        Most teams glue an APM, a product-analytics tool, an error/session tool, and now an LLM-observability tool together.
        Observability Unified brings those workflows under one identity chain and one dashboard, so humans and agents can traverse from user action to backend trace, logs, replay, AI cost, and CPU profile while keeping the data plane in your infrastructure.
      </p>
    </header>
    <div class="cmp-scroll" role="region" aria-label="Comparison table" tabindex="0">
      <table class="cmp-table">
        <thead>
          <tr>
            <th scope="col" class="cmp-corner">Capability</th>
            ${headers}
          </tr>
        </thead>
        <tbody>
          ${ROWS.map((r) => row(r, refIndex)).join("")}
        </tbody>
      </table>
    </div>
    <p class="cmp-footnote muted small">
      Numbered superscripts link to the underlying comparison source.
      Full methodology, vendor profiles, and quoted citations live in
      <a href="${COMPARISON_URL}" rel="noopener">the comparison research doc</a>
      (last reviewed ${LAST_REVIEWED} · re-reviewed quarterly).
    </p>
  </div>
</section>
`;
}
