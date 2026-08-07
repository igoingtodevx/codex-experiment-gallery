"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { CategoryId, PublicExperiment } from "@/lib/experiments/types";
import { categoryIds, categoryLabels } from "@/lib/experiments/types";

const capabilityLabels: Record<string, string> = {
  "structured-output": "Output · schema",
  "code-generation": "Output · code",
  "file-input": "Input · file",
  vision: "Input · image",
  "tool-calling": "Lookup · registry",
  markdown: "Output · Markdown",
};

const categoryIntro: Record<CategoryId, string> = {
  debug: "Make failures legible.",
  transform: "Change code without losing the why.",
  review: "Find risk before it ships.",
  generate: "Produce artifacts you can inspect.",
  multimodal: "Use pixels as input, not decoration.",
};

export function GalleryApp({ experiments }: { experiments: readonly PublicExperiment[] }) {
  const [activeCategory, setActiveCategory] = useState<CategoryId | "all">("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const normalized = query.toLowerCase().trim();
    return experiments.filter((experiment) => {
      const categoryMatch = activeCategory === "all" || experiment.category === activeCategory;
      const searchMatch = !normalized || [experiment.title, experiment.description, experiment.category, ...experiment.capabilities]
        .join(" ")
        .toLowerCase()
        .includes(normalized);
      return categoryMatch && searchMatch;
    });
  }, [activeCategory, experiments, query]);

  return (
    <div className="site-frame">
      <header className="topbar">
        <Link className="wordmark" href="/" aria-label="Codex Experiment Gallery home">
          <span className="wordmark-mark" aria-hidden="true">×</span>
          <span>CODEX <b>EXPERIMENTS</b></span>
        </Link>
        <div className="topbar-meta">
          <span className="status-dot" aria-hidden="true" />
          <span>server runner</span>
          <span className="topbar-separator">/</span>
          <span>v0.1</span>
        </div>
      </header>

      <div className="app-layout">
        <aside className="catalog-rail" aria-label="Experiment catalog filters">
          <div className="rail-caption">Catalog</div>
          <nav className="category-nav">
            <button className={`category-link ${activeCategory === "all" ? "is-active" : ""}`} onClick={() => setActiveCategory("all")} type="button" aria-pressed={activeCategory === "all"}>
              <span>All experiments</span><span className="category-count">{experiments.length.toString().padStart(2, "0")}</span>
            </button>
            {categoryIds.map((category) => {
              const count = experiments.filter((experiment) => experiment.category === category).length;
              return (
                <button key={category} className={`category-link ${activeCategory === category ? "is-active" : ""}`} onClick={() => setActiveCategory(category)} type="button" aria-pressed={activeCategory === category}>
                  <span>{categoryLabels[category]}</span><span className="category-count">{count.toString().padStart(2, "0")}</span>
                </button>
              );
            })}
          </nav>
          <span className="category-scroll-hint" aria-hidden="true">Swipe categories →</span>
          <div className="rail-footer">
            <p>Small workflows. Real patterns.</p>
            <p className="muted">Each experiment is a typed server run, not a static prompt card.</p>
          </div>
        </aside>

        <main className="catalog-main">
          <section className="catalog-intro" aria-labelledby="catalog-title">
            <div>
              <p className="eyebrow"><span className="eyebrow-line" /> AI developer workflow lab</p>
              <h1 id="catalog-title">A gallery of <em>inspectable</em><br />AI engineering patterns.</h1>
              <p className="intro-copy">Ten focused experiments. One consistent workspace. Try the input, inspect the structured result, and see where the engineering lives.</p>
            </div>
            <div className="intro-stamp" aria-label="Gallery facts">
              <span className="stamp-number">{experiments.length.toString().padStart(2, "0")}</span>
              <span className="stamp-label">experiments<br />in the gallery</span>
            </div>
          </section>

          <section className="catalog-toolbar" aria-label="Search experiments">
            <label className="search-box">
              <span className="search-glyph" aria-hidden="true">⌕</span>
              <span className="sr-only">Search experiments</span>
              <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by workflow, capability, or problem…" />
              <kbd>/</kbd>
            </label>
            <span className="result-count">{filtered.length === experiments.length ? `${experiments.length} workflows` : `${filtered.length} shown`}</span>
          </section>

          <div className="active-category-note">
            <div>
              <span className="section-kicker">{activeCategory === "all" ? "The collection" : categoryLabels[activeCategory]}</span>
              <span className="section-note">{activeCategory === "all" ? "Choose a workflow and run it with the example data." : categoryIntro[activeCategory]}</span>
            </div>
            <span className="section-rule" aria-hidden="true" />
          </div>

          <section className="experiment-grid" aria-live="polite">
            {filtered.map((experiment) => (
              <Link className={`experiment-card accent-${experiment.accent}`} href={`/experiments/${experiment.slug}`} key={experiment.slug}>
                <div className="card-topline">
                  <span className="card-number">{experiment.number}</span>
                  <span className="card-category">{categoryLabels[experiment.category]}</span>
                </div>
                <div className="card-body">
                  <h2>{experiment.title}</h2>
                  <p>{experiment.description}</p>
                </div>
                <div className="card-footer">
                  <div className="capability-list">
                    {experiment.capabilities.slice(0, 3).map((capability) => <span key={capability}>{capabilityLabels[capability] ?? capability}</span>)}
                  </div>
                  <span className="try-label">Open workspace →</span>
                </div>
              </Link>
            ))}
          </section>

          {filtered.length === 0 && (
            <div className="empty-state">
              <span className="empty-mark">∅</span>
              <h2>No matching experiments</h2>
              <p>Try a broader search or clear the category filter.</p>
              <button type="button" onClick={() => { setActiveCategory("all"); setQuery(""); }}>Reset catalog</button>
            </div>
          )}

          <footer className="catalog-footer">
            <span>Codex Experiment Gallery</span>
            <span>Built as a portfolio experiment · inputs stay in your browser until you run them</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
