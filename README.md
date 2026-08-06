# 🧪 Codex Experiment Gallery

**Eine Sammlung moderner AI-Developer-Tools in einer Oberfläche.**

Statt einer großen Anwendung: **20 kleine AI-Experimente**, die jeweils einen konkreten Developer-Workflow lösen. Die Portfolio-Zentrale für AI-Engineering.

## ✨ Features (20 Experimente)

| # | Tool | # | Tool |
|---|---|---|---|
| 1 | 🛠 Fix my SQL | 11 | 📄 OpenAPI → SDK |
| 2 | 🧪 Generate Unit Tests | 12 | 🏗 Architecture Review |
| 3 | 📖 Explain Stacktrace | 13 | ⚡️ Performance Suggestions |
| 4 | ♿️ Accessibility Audit | 14 | 🧠 Explain Regex |
| 5 | 🔒 Security Review | 15 | 🔄 Convert JS → TypeScript |
| 6 | 🎨 Screenshot → React Component | 16 | 📦 Dockerfile Generator |
| 7 | 🧹 Refactor Function | 17 | ✍️ Commit Message Generator |
| 8 | 📚 README Generator | 18 | 📊 Dependency Analyzer |
| 9 | 🔍 Code Search | 19 | 🧮 Complexity Analyzer |
| 10 | 🐛 Bug Hunter | 20 | 🧾 Changelog Generator |

## 🛠 Tech Stack

| Layer | Technologie |
|---|---|
| Frontend | Next.js |
| AI | OpenAI Responses API |
| Editor | Monaco Editor |
| UI | shadcn/ui |
| Styling | Tailwind CSS |
| Input | File Upload + Tool Calling |

## 🚀 Warum das beeindruckt

Statt einer Demo sieht man sofort: **viele AI-Anwendungsfälle, gutes UI/UX, verschiedene Prompting-Strategien, Structured Outputs, Tool Calling, moderne Developer Experience**.
Wirkt wie ein kleines OpenAI Codex Cookbook zum Anfassen — die perfekte Portfolio-Zentrale.

## 🧱 Struktur (geplant)

```
codex-experiment-gallery/
├── app/
│   ├── page.tsx          # Gallery-Übersicht (Kacheln)
│   └── experiments/
│       ├── fix-my-sql/
│       ├── generate-tests/
│       ├── explain-stacktrace/
│       ├── security-review/
│       └── ... (20 total)
├── components/
│   └── ui/               # shadcn/ui
├── lib/
│   ├── openai.ts         # Responses API Client
│   └── prompts/          # Prompting-Strategien
└── public/
```

## 📦 Setup (kommt)

```bash
npm install
# .env: OPENAI_API_KEY
npm run dev
```

## 📌 Status

- [x] Repo angelegt (Idea-Scoping)
- [ ] Base-UI (Next.js + shadcn/ui + Monaco)
- [ ] OpenAI Responses API Integration
- [ ] Experiment 1–5
- [ ] Experiment 6–10
- [ ] Experiment 11–15
- [ ] Experiment 16–20
- [ ] Deploy + Portfolio-Link
