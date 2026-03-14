# BioTools Explorer

A live, searchable dashboard for discovering and comparing bioinformatics tools. Search by name to instantly aggregate metadata from GitHub, Docker Hub, and scholarly literature (Europe PMC / PubMed) — all in one view.

**Live demo:** 
- [biotools-explorer perplexity computer](https://www.perplexity.ai/computer/a/biotools-explorer-ZmffO2joRxKy.rzvroNtAQ)
- [biotools-explorer render.com](https://biotools-explorer.onrender.com/#/)

---

## Table of Contents

- [Features](#features)
- [Screenshots](#screenshots)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Running in Development](#running-in-development)
- [Building for Production](#building-for-production)
- [Project Structure](#project-structure)
- [API Reference](#api-reference)
- [External APIs Used](#external-apis-used)
- [Usage Guide](#usage-guide)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)
- [License](#license)
- [Author](#author)

---

## Features

- **Tool search** — Type any bioinformatics tool name (e.g. STAR, HISAT2, Seurat, Samtools, BWA, DESeq2) to fetch live data.
- **GitHub metadata** — Stars, forks, open/closed issues, latest version, release notes, creation date, last update, language, license, topics, and homepage link.
- **Docker Hub images** — Container name, namespace, pull count, star count, latest tag, last update date, with direct links to Docker Hub.
- **Publications** — Scholarly references from Europe PMC (covers PubMed, PMC, and preprints) with title, authors, year, journal, DOI/PMID links, and auto-classified usage summaries (alignment, benchmarking, pipeline, single-cell, etc.).
- **Side-by-side comparison** — Compare 2+ tools in a sortable/filterable table. Sort by stars, recency, open issues, publication count, or Docker availability. Filter by "has Docker" or "has publications."
- **Dark / Light mode** — System-aware theme with manual toggle.
- **Responsive** — Works on mobile, tablet, and desktop.
- **No database required** — All data is fetched live from public APIs. No sign-up or API keys needed.

---

## Screenshots

### Empty State (Light Mode)
The landing page shows suggested tools (STAR, HISAT2, Seurat, Samtools, BWA, DESeq2) for one-click searching.

### Explore View (Dark Mode)
Search results display repository cards, Docker images, and publications in separate sections per tool.

### Comparison View
A data table comparing multiple tools side-by-side on all dimensions, plus a Docker comparison section.

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│                    Browser                       │
│  React 18 + Tailwind CSS + shadcn/ui + Recharts │
│  Hash routing (wouter) · TanStack React Query   │
└────────────────────┬────────────────────────────┘
                     │ HTTP (fetch)
┌────────────────────▼────────────────────────────┐
│              Express 5 Server                    │
│         GET /api/search?q=<tool_name>            │
│                                                  │
│  Parallel fan-out to:                            │
│   ├── GitHub REST API (repos, releases, tags,    │
│   │   closed-issues search)                      │
│   ├── Docker Hub v2 API (search, tags)           │
│   └── Europe PMC REST API (literature search)    │
└──────────────────────────────────────────────────┘
```

The server acts as a lightweight proxy/aggregator — it makes parallel requests to three public APIs, normalizes the responses, and returns a unified JSON payload to the frontend. No database, no authentication, no persistent state.

---

## Prerequisites

| Requirement | Minimum Version | Check Command        |
|-------------|-----------------|----------------------|
| Node.js     | 18.x or higher  | `node --version`     |
| npm         | 9.x or higher   | `npm --version`      |
| Git         | 2.x             | `git --version`      |

> **Note:** This project uses Node.js `fetch()` (available from Node 18+). No Python or other runtimes are required.

---

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/bhagesh-h/biotools-dashboard.git
cd biotools-dashboard
```

### 2. Install dependencies

```bash
npm install
```

This installs all dependencies listed in `package.json` — both runtime and development. There is no separate `requirements.txt` because this is a JavaScript/TypeScript project managed entirely by npm.

---

## Running in Development

```bash
npm run dev
```

This starts a single process that serves both the **Express backend** (API routes) and the **Vite frontend** (React with hot module replacement) on the same port.

- Open **http://localhost:5000** in your browser.
- Frontend changes hot-reload automatically.
- Backend changes require restarting the command.

---

## Building for Production

### Build

```bash
npm run build
```

This compiles:
- **Frontend** → `dist/public/` (static HTML/CSS/JS bundle via Vite)
- **Backend** → `dist/index.cjs` (bundled Express server via esbuild)

### Run production server

```bash
npm start
```

Or explicitly:

```bash
NODE_ENV=production node dist/index.cjs
```

The production server serves the static frontend and the API on port **5000**.

---

## Project Structure

```
biotools-dashboard/
├── client/                     # Frontend (React + Vite)
│   ├── index.html              # HTML entry point
│   └── src/
│       ├── App.tsx             # Root component, routing
│       ├── main.tsx            # React DOM mount
│       ├── index.css           # Tailwind config + custom theme (light/dark)
│       ├── pages/
│       │   ├── dashboard.tsx   # Main dashboard page
│       │   └── not-found.tsx   # 404 page
│       ├── components/
│       │   ├── search-header.tsx       # Search bar + tool badges
│       │   ├── empty-state.tsx         # Landing state with suggestions
│       │   ├── tool-results.tsx        # Repo/Docker/Publication cards
│       │   ├── tool-results-wrapper.tsx# Per-tool query wrapper
│       │   ├── comparison-view.tsx     # Side-by-side comparison table
│       │   ├── theme-provider.tsx      # Dark/light mode context
│       │   ├── PerplexityAttribution.tsx # Footer with branding
│       │   └── ui/                     # shadcn/ui components
│       ├── hooks/
│       │   ├── use-tool-search.ts      # TanStack Query hook for API
│       │   ├── use-toast.ts            # Toast notifications
│       │   └── use-mobile.tsx          # Responsive breakpoint
│       └── lib/
│           ├── queryClient.ts          # TanStack Query setup
│           └── utils.ts                # cn() utility
├── server/                     # Backend (Express 5)
│   ├── index.ts                # Server bootstrap
│   ├── routes.ts               # API routes + GitHub/Docker/PMC logic
│   ├── storage.ts              # Storage interface (unused — no DB)
│   ├── vite.ts                 # Vite dev middleware
│   └── static.ts               # Static file serving (production)
├── shared/
│   └── schema.ts               # Zod schemas + TypeScript types
├── script/
│   └── build.ts                # Build script (Vite + esbuild)
├── package.json                # Dependencies and scripts
├── tsconfig.json               # TypeScript config
├── tailwind.config.ts          # Tailwind CSS config
├── vite.config.ts              # Vite config
├── postcss.config.js           # PostCSS config
├── drizzle.config.ts           # Drizzle ORM config (unused)
├── components.json             # shadcn/ui config
├── requirements.txt            # Dependency reference (points to npm)
└── .gitignore
```

---

## API Reference

### `GET /api/search?q=<tool_name>`

Searches GitHub, Docker Hub, and Europe PMC in parallel for the given tool name.

**Query parameters:**

| Param | Type   | Required | Description                   |
|-------|--------|----------|-------------------------------|
| `q`   | string | Yes      | Tool name to search (e.g. "STAR", "samtools") |

**Response** (`200 OK`):

```json
{
  "searchQuery": "STAR",
  "github": [
    {
      "name": "STAR",
      "fullName": "alexdobin/STAR",
      "description": "RNA-seq aligner",
      "url": "https://github.com/alexdobin/STAR",
      "homepage": "https://github.com/alexdobin/STAR",
      "stars": 1850,
      "forks": 520,
      "openIssues": 45,
      "closedIssues": 890,
      "latestVersion": "2.7.11b",
      "latestReleaseDate": "2024-01-15T...",
      "latestReleaseNotes": "Bug fixes...",
      "firstReleaseDate": "2015-03-01T...",
      "createdAt": "2013-05-01T...",
      "updatedAt": "2024-12-01T...",
      "language": "C++",
      "license": "MIT",
      "topics": ["rna-seq", "aligner", "bioinformatics"]
    }
  ],
  "docker": [
    {
      "name": "star",
      "namespace": "alexdobin",
      "description": "Docker image for STAR aligner",
      "url": "https://hub.docker.com/r/alexdobin/star",
      "starCount": 2,
      "pullCount": 30987,
      "lastUpdated": "2024-06-01T...",
      "latestTag": "latest"
    }
  ],
  "publications": [
    {
      "title": "STAR: ultrafast universal RNA-seq aligner.",
      "authors": "Dobin A, Davis CA, ...",
      "year": "2013",
      "journal": "Bioinformatics",
      "doi": "10.1093/bioinformatics/bts635",
      "pmid": "23104886",
      "url": "https://doi.org/10.1093/bioinformatics/bts635",
      "usageSummary": "Sequence alignment / read mapping",
      "source": "PubMed"
    }
  ],
  "fetchedAt": "2026-03-14T06:13:00.000Z"
}
```

**Error responses:**
- `400` — Missing or empty `q` parameter.
- `500` — Server-side error during API fetching.

---

## External APIs Used

All APIs are **public and require no authentication** for basic usage.

| API                | Purpose                              | Rate Limits                          |
|--------------------|--------------------------------------|--------------------------------------|
| [GitHub REST API](https://docs.github.com/en/rest)    | Repository search, releases, tags, issues | 60 req/hour unauthenticated; 5,000/hour with token |
| [Docker Hub API v2](https://docs.docker.com/docker-hub/api/) | Image search, tag listing            | Varies; generally generous for reads |
| [Europe PMC REST API](https://europepmc.org/RestfulWebService) | Literature search (covers PubMed, PMC) | No hard limit; be respectful         |

### Optional: Add a GitHub token for higher rate limits

If you hit GitHub's 60-requests-per-hour limit, add a personal access token:

```bash
# In your terminal before starting the server:
export GITHUB_TOKEN=ghp_your_token_here
```

Then update `server/routes.ts` to include the token in the `Authorization` header:

```typescript
headers: {
  Accept: "application/vnd.github.v3+json",
  "User-Agent": "BioTools-Dashboard",
  "Authorization": `Bearer ${process.env.GITHUB_TOKEN}`,
},
```

---

## Usage Guide

### Searching for a tool

1. Type a tool name (e.g. `STAR`, `HISAT2`, `Seurat`) in the search bar at the top.
2. Press **Enter** or click **Search**.
3. The dashboard fetches data from all three sources in parallel and displays results.

Alternatively, click any of the **suggestion buttons** on the landing page (STAR, HISAT2, Seurat, Samtools, BWA, DESeq2) for one-click searching.

### Adding multiple tools

Search for additional tools — each is added as a **badge** below the search bar. You can search for as many tools as you want.

### Exploring results

For each tool, the **Explore** tab shows three sections:

- **Repositories** — Cards showing the top GitHub matches. Each card includes:
  - Stars, forks, open issues, closed issues
  - Latest version tag with relative timestamp
  - Last update and creation dates
  - Language, license, and website badges
  - Expandable release notes (click "Release notes")

- **Docker Images** — Cards for Docker Hub matches, showing pull count, star count, latest tag, and direct links.

- **Publications** — Compact cards for each scholarly paper, showing:
  - Title (linked to DOI/PubMed)
  - Authors and year
  - Journal/source badge
  - Auto-classified usage type (e.g. "Sequence alignment / read mapping", "Benchmarking / comparative analysis", "Single-cell analysis", "Part of an analysis pipeline")
  - Click "Show all X publications" to expand the full list.

### Comparing tools side-by-side

When **2 or more tools** are loaded, a **Compare** tab appears. It shows:

- A **sortable table** with columns: Tool, Repository, Stars, Forks, Version, Last Update, Created, Open Issues, Closed Issues, Docker availability, Publication count, and Language.
- **Sort dropdown** — Sort by: Most stars, Recently updated, Most open issues, Most publications, Docker available.
- **Filter buttons** — Toggle "Has Docker" and "Has Publications" to narrow results.
- The highest-starred tool and most recently updated tool are highlighted.
- A **Docker Comparison** section below the table shows Docker image details for tools that have container images.

### Removing a tool

Click the **×** on any tool badge in the header, or click **Remove** in the tool's result section.

### Dark / Light mode

Click the **sun/moon icon** in the top-right corner of the header. The theme defaults to your system preference.

---

## Configuration

### Environment Variables

| Variable        | Default | Description                                         |
|-----------------|---------|-----------------------------------------------------|
| `NODE_ENV`      | —       | Set to `production` for production builds            |
| `PORT`          | `5000`  | Server port (optional; defaults to 5000)             |
| `GITHUB_TOKEN`  | —       | Optional GitHub personal access token for higher rate limits |

### Customization

- **Add more suggestion buttons** — Edit `client/src/components/empty-state.tsx`, update the `suggestions` array.
- **Change theme colors** — Edit `client/src/index.css`. The `--primary` variable controls the accent color (currently teal `174 72% 32%`).
- **Increase API results** — In `server/routes.ts`, change `per_page=5` (GitHub), `page_size=5` (Docker), or `pageSize=8` (Europe PMC) to higher values.

---

## Troubleshooting

### "GitHub API rate limit exceeded"
The unauthenticated GitHub API allows 60 requests/hour. Each tool search makes ~3-6 requests (search + releases/tags + closed issues per repo). Solutions:
1. Wait for the rate limit to reset (shown in the `X-RateLimit-Reset` response header).
2. Add a `GITHUB_TOKEN` environment variable (see [Configuration](#configuration)).

### "Module not found" or "Cannot find module" errors
Run `npm install` again. If the error persists, delete `node_modules` and `package-lock.json`, then reinstall:
```bash
rm -rf node_modules package-lock.json
npm install
```

### Port 5000 already in use
```bash
# Find and kill the process using port 5000:
lsof -i :5000
kill -9 <PID>
```
Or set a different port: `PORT=3000 npm run dev`

### Docker/publications not showing for a tool
Some tools may not have Docker images or indexed publications. The sections only appear when results are found.

---

## Available npm Scripts

| Command           | Description                                            |
|-------------------|--------------------------------------------------------|
| `npm run dev`     | Start development server (Vite HMR + Express)          |
| `npm run build`   | Build production frontend + backend bundles             |
| `npm start`       | Run the production server from `dist/`                  |
| `npm run check`   | Run TypeScript type checking                            |

---

## Author

- [Bhagesh Hunakunti](https://www.linkedin.com/in/bhagesh-hunakunti/)
