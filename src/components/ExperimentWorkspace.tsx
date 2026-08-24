"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import type { FormEvent, DragEvent, ChangeEvent } from "react";
import type { PublicExperiment } from "@/lib/experiments/types";

const capabilityLabels: Record<string, string> = {
  "structured-output": "Output · schema",
  "code-generation": "Output · code",
  "file-input": "Input · file",
  vision: "Input · image",
  "tool-calling": "Lookup · registry",
  markdown: "Output · Markdown",
};

const categoryLabels: Record<string, string> = {
  debug: "Debug & diagnose",
  transform: "Transform code",
  review: "Review & harden",
  generate: "Generate artifacts",
  multimodal: "Multimodal",
};

type RunMeta = { durationMs?: number; model?: string; capabilities?: string[] };
type RunHistoryItem = { at: string; durationMs?: number };
type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function textValue(value: unknown): string {
  return typeof value === "string" ? value : String(value ?? "");
}

function copyableResult(result: unknown): string {
  return JSON.stringify(result, null, 2);
}

function CopyButton({ value, label = "Copy" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }
  return <button type="button" className="copy-button" onClick={copy}>{copied ? "Copied" : label}</button>;
}

function CodePanel({ title, code }: { title: string; code: string }) {
  return (
    <section className="code-panel">
      <div className="code-panel-head"><span>{title}</span><CopyButton value={code} label="Copy code" /></div>
      <pre><code>{code}</code></pre>
    </section>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  return <span className={`severity severity-${severity}`}>{severity}</span>;
}

function ResultRenderer({ renderer, result }: { renderer: PublicExperiment["renderer"]; result: unknown }) {
  const record = isRecord(result) ? result : {};
  const [selectedFile, setSelectedFile] = useState(0);

  if (renderer === "diagnosis") {
    const steps = Array.isArray(record.steps) ? record.steps : [];
    const verification = Array.isArray(record.verification) ? record.verification : [];
    return (
      <div className="result-stack">
        <div className="result-callout"><span className="result-label">Diagnosis</span><h3>{textValue(record.summary)}</h3><p>{textValue(record.rootCause)}</p><SeverityBadge severity={textValue(record.severity)} /></div>
        <div className="result-columns">
          <section className="result-section"><span className="result-label">Fix path</span><ol className="step-list">{steps.map((step, index) => <li key={`${index}-${textValue(step)}`}><span>{String(index + 1).padStart(2, "0")}</span>{textValue(step)}</li>)}</ol></section>
          <section className="result-section"><span className="result-label">Verify it</span><ul className="check-list">{verification.map((item) => <li key={textValue(item)}>{textValue(item)}</li>)}</ul><div className="confidence"><span>Confidence</span><strong>{Math.round(Number(record.confidence ?? 0) * 100)}%</strong></div></section>
        </div>
      </div>
    );
  }

  if (renderer === "findings") {
    const findings = Array.isArray(record.findings) ? record.findings.filter(isRecord) : [];
    const passes = Array.isArray(record.passes) ? record.passes : [];
    const score = Math.max(0, Math.min(100, Number(record.score ?? 0)));
    return (
      <div className="result-stack">
        <div className="score-row"><div><span className="result-label">Review summary</span><p className="result-summary">{textValue(record.summary)}</p></div><div className="score-block"><strong>{score}</strong><span>/100</span><small>signal score</small></div></div>
        {findings.length > 0 && <div className="finding-list">{findings.map((finding) => <article className="finding" key={textValue(finding.id) || textValue(finding.title)}><div className="finding-head"><SeverityBadge severity={textValue(finding.severity)} /><h3>{textValue(finding.title)}</h3></div><p className="finding-evidence"><b>Evidence</b> {textValue(finding.evidence)}</p><p><b>Remediation</b> {textValue(finding.recommendation)}</p></article>)}</div>}
        {passes.length > 0 && <section className="passes"><span className="result-label">Good signals</span>{passes.map((pass) => <span key={textValue(pass)} className="pass-item">✓ {textValue(pass)}</span>)}</section>}
      </div>
    );
  }

  if (renderer === "files") {
    const files = Array.isArray(record.files) ? record.files.filter(isRecord) : [];
    const active = files[selectedFile] ?? {};
    return (
      <div className="result-stack"><div className="result-copy-row"><div><span className="result-label">Generated file set</span><p className="result-summary">A small, reviewable SDK slice — each file stays separately copyable.</p></div><CopyButton value={files.map((file) => `// ${textValue(file.path)}\n${textValue(file.content)}`).join("\n\n")} label="Copy all" /></div>
        <div className="file-result"><nav className="file-tabs" aria-label="Generated files">{files.map((file, index) => <button className={selectedFile === index ? "is-selected" : ""} key={textValue(file.path)} type="button" onClick={() => setSelectedFile(index)}>{textValue(file.path)}</button>)}</nav><CodePanel title={textValue(active.path)} code={textValue(active.content)} /><p className="file-description">{textValue(active.description)}</p></div>
        <ResultBullets title="Install notes" values={Array.isArray(record.installNotes) ? record.installNotes : []} />
        <ResultBullets title="Assumptions" values={Array.isArray(record.assumptions) ? record.assumptions : []} />
      </div>
    );
  }

  if (renderer === "markdown") {
    return <div className="result-stack"><div className="result-copy-row"><div><span className="result-label">README draft</span><p className="result-summary">Evidence-bound markdown, ready for a human review pass.</p></div><CopyButton value={textValue(record.markdown)} label="Copy markdown" /></div><pre className="markdown-output"><code>{textValue(record.markdown)}</code></pre><ResultBullets title="Sections inferred" values={Array.isArray(record.sections) ? record.sections : []} /></div>;
  }

  if (renderer === "dependencies") {
    const packages = Array.isArray(record.packages) ? record.packages.filter(isRecord) : [];
    return <div className="result-stack"><div className="result-callout"><span className="result-label">Registry-backed read</span><h3>{textValue(record.summary)}</h3><p>Package metadata was fetched server-side through a function tool; the browser never receives provider credentials.</p></div><div className="dependency-list">{packages.map((pkg) => <article className="dependency-row" key={textValue(pkg.name)}><div><strong>{textValue(pkg.name)}</strong><span>{textValue(pkg.requested)} → {textValue(pkg.latest)}</span></div><SeverityBadge severity={textValue(pkg.risk)} /><p>{textValue(pkg.reason)}</p><small>{textValue(pkg.recommendation)}</small></article>)}</div><ResultBullets title="Next steps" values={Array.isArray(record.nextSteps) ? record.nextSteps : []} /></div>;
  }

  if (textValue(record.componentCode)) {
    return <div className="result-stack"><div className="result-callout"><span className="result-label">Vision output</span><h3>Component starting point</h3><p>Review layout assumptions before treating generated code as production-ready.</p></div><CodePanel title="Component.tsx" code={textValue(record.componentCode)} /><CodePanel title="Component.css" code={textValue(record.stylesCode)} /><ResultBullets title="Notes" values={Array.isArray(record.notes) ? record.notes : []} /><ResultBullets title="Accessibility checks" values={Array.isArray(record.accessibility) ? record.accessibility : []} /></div>;
  }

  const code = textValue(record.refactoredCode || record.rewrittenQuery || record.testCode);
  if (code) return <div className="result-stack"><CodePanel title="Generated output" code={code} /><ResultBullets title="Changes / test cases" values={Array.isArray(record.changes) ? record.changes : Array.isArray(record.cases) ? record.cases : []} /><ResultBullets title="Tradeoffs and notes" values={Array.isArray(record.tradeoffs) ? record.tradeoffs : [record.notes]} /></div>;
  return <pre className="raw-output"><code>{JSON.stringify(result, null, 2)}</code></pre>;
}

function ResultBullets({ title, values }: { title: string; values: unknown[] }) {
  const safe = values.map(textValue).filter(Boolean);
  if (!safe.length) return null;
  return <section className="result-section"><span className="result-label">{title}</span><ul className="check-list">{safe.map((value) => <li key={value}>{value}</li>)}</ul></section>;
}

export function ExperimentWorkspace({ experiment }: { experiment: PublicExperiment }) {
  const initialValues = useMemo(() => ({ ...(experiment.examples[0]?.values ?? {}) }), [experiment.examples]);
  const [values, setValues] = useState<Record<string, string>>(initialValues);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<unknown>(null);
  const [meta, setMeta] = useState<RunMeta | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [history, setHistory] = useState<RunHistoryItem[]>([]);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  function updateValue(id: string, value: string) {
    setValues((current) => ({ ...current, [id]: value }));
  }

  function applyExample() {
    const example = experiment.examples[0];
    if (!example) return;
    setValues((current) => ({ ...current, ...example.values }));
    setResult(null);
    setMeta(null);
    setError(null);
  }

  function setIncomingFile(nextFile: File | undefined) {
    if (!nextFile) return;
    setFile(nextFile);
    setError(null);
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    const nextFile = event.dataTransfer.files[0];
    if (nextFile && fileInputRef.current) {
      fileInputRef.current.files = event.dataTransfer.files;
    }
    setIncomingFile(nextFile);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRunning(true);
    setError(null);
    setResult(null);
    setMeta(null);
    try {
      const form = new FormData();
      form.append("payload", JSON.stringify(values));
      if (file) form.append("file", file);
      const response = await fetch(`/api/experiments/${experiment.slug}`, { method: "POST", body: form });
      const data = await response.json() as { ok?: boolean; result?: unknown; error?: { message?: string }; meta?: RunMeta };
      if (!response.ok || !data.ok) throw new Error(data.error?.message || "The run could not be completed.");
      setResult(data.result ?? null);
      setMeta(data.meta ?? null);
      setHistory((current) => [{ at: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), durationMs: data.meta?.durationMs }, ...current].slice(0, 4));
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : "The run could not be completed.");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="site-frame workspace-frame">
      <header className="topbar">
        <Link className="wordmark" href="/" aria-label="Back to experiment gallery"><span className="wordmark-mark" aria-hidden="true">×</span><span>CODEX <b>EXPERIMENTS</b></span></Link>
        <Link className="back-link" href="/">← Back to gallery</Link>
      </header>
      <main className="workspace-main">
        <div className="workspace-heading">
          <div><p className="eyebrow"><span className="eyebrow-line" /> {categoryLabels[experiment.category]} · experiment {experiment.number}</p><h1>{experiment.title}</h1><p className="workspace-description">{experiment.description}</p></div>
          <div className="capability-stack">{experiment.capabilities.map((capability) => <span key={capability}>{capabilityLabels[capability] ?? capability}</span>)}</div>
        </div>
        <div className="workspace-layout">
          <section className="input-pane" aria-labelledby="input-title">
            <div className="pane-header"><div><span className="pane-index">01</span><h2 id="input-title">Input</h2></div><div className="pane-actions"><button className="example-button" type="button" onClick={applyExample}>Load example <span>↥</span></button><button className="run-button header-run-button" type="submit" form="experiment-run-form" disabled={running}>{running ? <><span className="spinner" aria-hidden="true" /> Running…</> : <>Run <span aria-hidden="true">→</span></>}</button></div></div>
            <form id="experiment-run-form" onSubmit={submit}>
              <div className="field-stack">
                {experiment.inputFields.map((field) => {
                  const value = values[field.id] ?? "";
                  if (field.type === "file") return <div className={`file-drop ${dragging ? "is-dragging" : ""}`} key={field.id} onDragEnter={(event) => { event.preventDefault(); setDragging(true); }} onDragOver={(event) => event.preventDefault()} onDragLeave={() => setDragging(false)} onDrop={onDrop}><label htmlFor={`field-${field.id}`} className="file-drop-label"><span className="file-glyph">↑</span><strong>{file ? file.name : "Drop a screenshot here"}</strong><span>{file ? `${Math.round(file.size / 1024)} KB · ${file.type}` : "or choose a PNG, JPEG, or WebP"}</span></label><input ref={fileInputRef} id={`field-${field.id}`} type="file" accept={field.accept} required={field.required} aria-required={field.required} onChange={(event: ChangeEvent<HTMLInputElement>) => setIncomingFile(event.target.files?.[0])} /></div>;
                  return <label className={`field field-${field.type}`} htmlFor={`field-${field.id}`} key={field.id}><span className="field-label">{field.label}{field.required && <b aria-hidden="true">*</b>}</span>{field.description && <span className="field-description">{field.description}</span>}{field.type === "select" ? <select id={`field-${field.id}`} value={value} required={field.required} aria-required={field.required} onChange={(event) => updateValue(field.id, event.target.value)}>{field.options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select> : field.type === "text" ? <input id={`field-${field.id}`} value={value} required={field.required} aria-required={field.required} maxLength={field.maxLength} placeholder={field.placeholder} onChange={(event) => updateValue(field.id, event.target.value)} /> : <textarea id={`field-${field.id}`} value={value} required={field.required} aria-required={field.required} maxLength={field.maxLength} rows={field.rows ?? 8} placeholder={field.placeholder} onChange={(event) => updateValue(field.id, event.target.value)} spellCheck={false} />}</label>;
                })}
              </div>
              <div className="run-row"><span className="run-hint">Server-side run · inputs are not saved</span><button className="run-button input-run-button" type="submit" disabled={running}>{running ? <><span className="spinner" aria-hidden="true" /> Running…</> : <>Run experiment <span aria-hidden="true">→</span></>}</button></div>
              {error && <div className="error-message" role="alert"><strong>Run blocked</strong><span>{error}</span></div>}
            </form>
            <div className="input-notice"><span aria-hidden="true">i</span><p>Inputs are untrusted evidence. The runner validates shape and limits before sending anything to the provider.</p></div>
          </section>
          <section className="result-pane" aria-labelledby="result-title">
            <div className="pane-header"><div><span className="pane-index">02</span><h2 id="result-title">Result</h2></div>{result !== null && <CopyButton value={copyableResult(result)} label="Copy JSON" />}</div>
            <div className="result-content" aria-live="polite">
              {running && <div className="loading-state"><span className="loading-line" /><span className="loading-line short" /><span className="loading-line" /><p>Calling the structured runner…</p></div>}
              {!running && !result && !error && <div className="result-empty"><span className="result-empty-mark">↳</span><h3>No result yet</h3><p>Your current input is ready. Run the experiment to generate a validated, purpose-built view.</p></div>}
              {!running && result !== null && <><ResultRenderer renderer={experiment.renderer} result={result} />{meta && <div className="result-meta"><span>{meta.model}</span><span>{meta.durationMs ? `${(meta.durationMs / 1000).toFixed(1)}s` : "completed"}</span><span>validated output</span></div>}</>}
            </div>
          </section>
        </div>
        <section className="workspace-footer-row"><div><span className="result-label">Model requirements</span><p>{experiment.modelRequirements}</p></div><div><span className="result-label">Run history</span><div className="history-list">{history.length ? history.map((item, index) => <span key={`${item.at}-${index}`}>{item.at} · {item.durationMs ? `${(item.durationMs / 1000).toFixed(1)}s` : "done"}</span>) : <span>No runs this session.</span>}</div></div></section>
      </main>
    </div>
  );
}
