# Codex Experiment Gallery

A live gallery of small, inspectable AI developer workflows.

**Full provider demo (VPS):** https://hermes-vps.tail309730.ts.net/

**Vercel deployment:** https://codex-experiment-gallery.vercel.app/

The VPS demo is the canonical provider target with the production environment isolated on the server. The Vercel deployment is a UI-only mirror until its server-side `OPENAI_API_KEY` is deliberately configured.

This is not a collection of prompt cards. Each experiment has a typed input contract, a server-side runner, a schema-constrained result, an example, and a renderer that matches the result shape.

## The collection

- **Explain a stacktrace** — structured diagnosis with fix and verification steps.
- **Fix my SQL** — dialect-aware query rewrite with assumptions and findings.
- **Refactor a function** — conservative code transformation with trade-offs.
- **Generate unit tests** — test matrix plus executable test code.
- **Security review** — evidence-bound findings with severity and remediation.
- **Accessibility audit** — semantic and interaction review with actionable findings.
- **OpenAPI → SDK slice** — contract-to-files generation for TypeScript, Python, or Go.
- **README from a repo brief** — evidence-bound Markdown generation.
- **Dependency risk map** — structured review plus server-side npm registry tool calling.
- **Screenshot → React** — vision input producing a component and CSS starting point.

## Capability matrix

- **Structured Outputs:** all experiments return Zod-validated result objects.
- **Code generation:** refactors, tests, SDK files, README content, and React/CSS.
- **File input:** screenshot uploads accept only PNG, JPEG, or WebP with a 1 MB limit.
- **Vision:** screenshot-to-React uses an image input on the Responses API.
- **Function calling:** dependency risk map can look up current npm metadata for packages in the submitted manifest.
- **Purpose-built rendering:** diagnoses, findings, code, files, Markdown, dependencies, and raw structured JSON each have a distinct result view.

## Architecture

```text
Next.js App Router
  ├─ static gallery + generated experiment workspaces
  ├─ typed experiment registry
  └─ purpose-built result renderers
          ↓
POST /api/experiments/[slug]
  ├─ request-size and rate-limit guard
  ├─ Zod input validation
  ├─ file type/size validation
  └─ experiment runner
          ↓
OpenAI Responses API adapter
  ├─ structured parse with zodTextFormat
  ├─ image input for vision
  └─ function calling for npm metadata
```

There is no database in V1. Examples and registry definitions are versioned source code. The in-session run history is intentionally ephemeral and contains timestamps only; submitted inputs are not persisted.

## Local setup

Requirements: Node.js 22.x and npm.

```bash
npm install
cp .env.example .env.local
# Add OPENAI_API_KEY to .env.local. Never commit it.
npm run dev
```

Open `http://localhost:3000`.

Environment variables:

- `OPENAI_API_KEY` — server-only provider credential; never exposed to client code.
- `OPENAI_MODEL` — optional model override; defaults to `gpt-5.6-luna`.
- `MAX_REQUEST_BYTES` — optional request ceiling; defaults to 1,500,000 bytes.

## Quality checks

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run browser:smoke
npm run browser:interaction
```

The browser smoke check runs the gallery and workspace at desktop and iPhone 13 viewports, verifies the ten cards, the primary Run action, the textarea, and horizontal overflow. The interaction check additionally covers search/filter state, category `aria-pressed` state, mobile touch-target heights, the truthful empty result state, and console/request failures.

Provider smoke checks are intentionally not part of the default test suite because they incur model cost. The route is exercised manually with representative structured, tool-calling, and vision requests before deployment.

## Security model

- The provider key is read only in the Node.js route handler.
- The browser submits a `FormData` request; it never receives a key or Hermes authentication state.
- User code and uploaded images are treated as untrusted evidence and are never executed.
- File MIME types and size are checked server-side; file names are not trusted.
- Input schemas enforce field-specific size limits before a provider call.
- Requests are rate-limited in-memory for the public demo and provider calls have a timeout.
- Structured output is parsed and validated again with the experiment's Zod schema.
- API errors are mapped to safe messages; stack traces and provider details stay server-side.
- Prompt-injection language inside code, logs, documents, or screenshots is explicitly treated as data, not instructions.

## Why this shape

The product deliberately favors ten different, reliable workflows over twenty lightly renamed prompt wrappers. The registry keeps UI metadata, examples, input contracts, output contracts, and runner strategy in one typed place without introducing a generic framework. Vercel is the deployment target because the application is a small Next.js server/client boundary and needs no VPS or database changes.

## License

Private portfolio project by `igoingtodevx`.
