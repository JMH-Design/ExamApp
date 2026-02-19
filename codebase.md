# Exam App — Technology Stack

> **Note:** This file is the single source of truth for the app's technology stack. It should be updated whenever dependencies, config, or architecture changes.

---

## Core Framework & Runtime

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 16.1.6 | React framework, App Router, API routes, server components |
| **React** | 19.2.3 | UI library |
| **React DOM** | 19.2.3 | React DOM renderer |
| **TypeScript** | ^5 | Static typing |

---

## Styling & UI

| Technology | Version | Purpose |
|------------|---------|---------|
| **Tailwind CSS** | ^4 | Utility-first CSS |
| **@tailwindcss/postcss** | ^4 | PostCSS plugin for Tailwind v4 |
| **Radix UI** | — | Accessible primitives |
| **@radix-ui/react-progress** | ^1.1.8 | Progress bar component |
| **@radix-ui/react-select** | ^2.2.6 | Select/dropdown component |
| **Lucide React** | ^0.574.0 | Icon library |
| **Google Fonts** (via `next/font`) | — | Instrument Serif, Open Sans, JetBrains Mono |

---

## External APIs & Services

| Service | Purpose |
|---------|---------|
| **Perplexity API** | AI-powered textbook search, topic extraction (model: `sonar`) |
| **Google Books API** | Textbook metadata and cover images |
| **Open Library API** | Fallback textbook search and covers |

---

## Data & Storage

| Technology | Purpose |
|------------|---------|
| **localStorage** | Client-side onboarding state (`exam-app-onboarding`) |
| **JSON files** | Static data: `data/programs.json`, `data/schools.json` |

---

## Build & Tooling

| Technology | Version | Purpose |
|------------|---------|---------|
| **PostCSS** | — | CSS processing (Tailwind) |
| **ESLint** | ^9 | Linting |
| **eslint-config-next** | 16.1.6 | Next.js ESLint rules (core-web-vitals, TypeScript) |
| **@types/node** | ^20 | Node.js type definitions |
| **@types/react** | ^19 | React type definitions |
| **@types/react-dom** | ^19 | React DOM type definitions |

---

## Project Structure

```
app/                    # Next.js App Router
├── api/                # API routes
│   ├── courses/search/
│   └── textbooks/      # search, search-direct, recommendations, topics
├── home/
├── onboarding/         # Multi-step onboarding flow
└── layout.tsx, globals.css

components/onboarding/  # Onboarding step components
context/                # React context (OnboardingContext)
lib/                    # Utilities & API clients
├── google-books.ts
├── open-library.ts
├── perplexity.ts
└── storage.ts

data/                   # Static JSON data
```

---

## Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `PERPLEXITY_API_KEY` | Yes | Perplexity API authentication |
| `GOOGLE_BOOKS_API_KEY` | No | Google Books API (optional; covers show "No cover" without it) |

---

## Config Files

- `next.config.ts` — Next.js config (image domains: books.google.com, encrypted-tbn0.gstatic.com)
- `tsconfig.json` — TypeScript (ES2017, path alias `@/*`)
- `postcss.config.mjs` — PostCSS + Tailwind
- `eslint.config.mjs` — ESLint flat config
