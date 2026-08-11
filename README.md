# Codex Experiment Gallery

A live gallery of **ten** small, inspectable AI developer workflows. Each experiment has a typed input contract, a server-side runner, a schema-constrained result, an example, and a renderer matched to that result shape.

## Verified public deployment

- https://codex-experiment-gallery.vercel.app/ — verified anonymously with HTTP 200 during this audit.

The public Vercel deployment is a UI/server boundary deployment, but provider-backed runs require the deployment's server environment to contain an `OPENAI_API_KEY`. No provider credential is included in this repository or README.

## The ten implemented experiments

1. Explain a stacktrace — structured diagnosis with fix and verification steps.
2. Fix my SQL — dialect-aware query rewrite with assumptions and findings.
3. Refactor a function — conservative code transformation with trade-offs.
4. Generate unit tests — test matrix plus executable test code.
5. Security review — evidence-bound findings with severity and remediation.
6. Accessibility audit — semantic and interaction review with actionable findings.
7. OpenAPI → SDK slice — contract-to-files generation for TypeScript, Python, or Go.
8. README from a repo brief — evidence-bound Markdown generation.
9. Dependency risk map — structured review plus server-side npm registry tool calling.
10. Screenshot → React — image input producing a component and CSS starting point.

The registry contains ten slugs. The old project description said twenty; that number is not true of the current implementation.

## Implemented scope

- Next.js App Router gallery and generated experiment workspaces
- Zod-validated input and output contracts
- OpenAI Responses API adapter with structured parsing, image input for vision, and function calling for npm metadata
- Request-size and in-memory rate-limit guards, server-side file MIME/size checks, provider timeout, and safe API error mapping
- Purpose-built renderers for diagnoses, findings, code, files, Markdown, dependency data, and structured JSON
- Ephemeral in-session run history; submitted inputs are not persisted and there is no database in V1

User code, logs, documents, and screenshots are treated as untrusted evidence and are not executed. Prompt-injection text in those inputs is data, not an instruction to the application.

## Stack

- Node.js 22.x and npm
- Next.js 16.3, React 19.2, and TypeScript
- OpenAI Node SDK 7.4, Zod 4.4, and YAML 2.8
- Vitest for unit tests and Playwright for browser checks

## Local setup

```bash
npm install
cp .env.example .env.local
# Set OPENAI_API_KEY in .env.local; never commit it.
npm run dev
```

Open `http://localhost:3000`.

Environment variables:

- `OPENAI_API_KEY` — server-only provider credential.
- `OPENAI_MODEL` — optional model override; the current source defaults to `gpt-5.6-luna`.
- `MAX_REQUEST_BYTES` — optional request ceiling; the current source defaults to 1,500,000 bytes.

## Quality checks

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run browser:smoke
npm run browser:interaction
```

Provider smoke checks are intentionally outside the default suite because they incur model cost. Exercise representative structured, tool-calling, and vision requests separately when provider credentials and budget are available.

## Status and boundaries

**Implemented portfolio/demo application.** The ten workflows and their UI/rendering contracts are present. A provider-backed production service still depends on deployment secrets, rate-limit capacity, model availability, and operational monitoring. There is no authentication, billing, database, or durable user history in V1.

## Planned / out of scope in V1

Authentication, billing, durable run history, a database, and production-grade distributed rate limiting are not part of the current implementation. Provider-backed production operation still needs deployment secret management, observability, abuse controls, and cost monitoring.

## License

Private portfolio project by `igoingtodevx`.
