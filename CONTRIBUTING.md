# Contributing to Books-Pens

Thanks for taking the time to contribute! This document explains how to set up the project, run it locally, and submit changes.

- **Bugs and feature requests:** open an [Issue](https://github.com/grlokesh96/Books-Pens/issues).
- **Security vulnerabilities:** do **not** open a public issue — follow [SECURITY.md](SECURITY.md).
- **Code of conduct:** everyone participating is expected to follow [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Available Scripts](#available-scripts)
- [Branching Strategy](#branching-strategy)
- [Making a Change](#making-a-change)
- [Commit Message Guidelines](#commit-message-guidelines)
- [Pull Requests](#pull-requests)
- [CI/CD Pipeline](#cicd-pipeline)
- [Code Style](#code-style)
- [Reporting Bugs](#reporting-bugs)

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| UI | React 19, TypeScript 5.8 |
| Build | Vite 6 |
| Styling | Tailwind CSS v4, `lucide-react` icons, `motion` (animations) |
| Runtime | Node.js 22+ (Docker images use Node 24 Alpine) |
| Containerization | Docker, Docker Compose |
| CI/CD | GitHub Actions (DevSecOps pipeline) |

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 22 or newer
- [npm](https://docs.npmjs.com/get-started/downloading-and-installing-node-js/) 10 or newer
- [Docker](https://docs.docker.com/get-docker/) — optional, for containerized development

### Fork and clone

```bash
# Fork the repository on GitHub first, then:
git clone https://github.com/<your-username>/Books-Pens.git
cd Books-Pens
git remote add upstream https://github.com/grlokesh96/Books-Pens.git
```

### Install dependencies

```bash
npm ci
```

Use `npm ci` in CI and for reproducible installs; use `npm install` when adding or updating dependencies.

### Configure environment variables

Copy the example file and fill in your values:

```bash
cp .env.example .env.local
```

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | Yes | Key used for Gemini AI API calls. |
| `APP_URL` | No | Public URL where the app is hosted. |
| `DISABLE_HMR` | No | Set to `true` to disable Vite HMR and file watching. |

> **Never commit `.env.local` or real API keys.** They are already covered by `.gitignore`, and the CI pipeline runs a Gitleaks secret scan on every push and pull request.

### Run the development server

```bash
npm run dev
```

The app is served at <http://localhost:3000>.

---

## Project Structure

```text
Books-Pens/
├── src/
│   ├── App.tsx              # Root application shell and page routing
│   ├── main.tsx             # React entry point
│   ├── index.css            # Tailwind entry and global styles
│   ├── types.ts             # Shared TypeScript interfaces (Book, Pen, Order, ...)
│   ├── components/
│   │   ├── Navbar.tsx       # Top navigation and search
│   │   ├── Hero.tsx         # Landing hero section
│   │   ├── ProductCard.tsx  # Book/pen product tile
│   │   ├── Cart.tsx         # Cart drawer
│   │   ├── Checkout.tsx     # Checkout and address flow
│   │   ├── AdminDashboard.tsx
│   │   ├── ContactAbout.tsx
│   │   └── ThemeToggle.tsx
│   ├── data/
│   │   └── initialData.ts   # Seed catalogue, coupons, reviews
│   └── hooks/
│       └── useTheme.ts      # Dark/light theme with persistence
├── .github/workflows/cicd.yaml   # DevSecOps pipeline
├── Dockerfile               # Multi-stage production image
├── docker-compose.yml       # Local container development
└── vite.config.ts
```

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the Vite dev server on port 3000, bound to `0.0.0.0`. |
| `npm run build` | Type-check and produce a production build in `dist/`. |
| `npm run preview` | Serve the production build locally. |
| `npm run lint` | Run TypeScript type checking (`tsc --noEmit`). |
| `npm run clean` | Remove `dist/` and `server.js`. |

---

## Branching Strategy

- `main` — the default branch. Always deployable.
- `feature/<short-description>` — new functionality.
- `fix/<short-description>` — bug fixes.
- `chore/<short-description>` — tooling, dependencies, or documentation.
- `docs/<short-description>` — documentation-only changes.

Keep branches short-lived and rebased on `main` before opening a pull request.

---

## Making a Change

```bash
git checkout -b feature/add-product-filter
# ... make your changes ...
git add <files-you-changed>
git commit
git push -u origin feature/add-product-filter
```

Guidelines:

- One logical change per pull request.
- Do not commit build output (`dist/`), dependency directories (`node_modules/`), or environment files.
- Keep unrelated refactors out of feature branches.

---

## Commit Message Guidelines

Follow the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) format:

```text
<type>(<optional scope>): <subject>
```

Common types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`.

```text
feat(cart): apply coupon discounts to the cart total
fix(theme): respect system preference on first load
docs(readme): document the local Docker workflow
```

---

## Pull Requests

1. Push your branch and open a pull request against `main`.
2. Fill in the description: **what** changed, **why**, and **how** it was verified.
3. Link any related issue (e.g. `Closes #42`).
4. Request a review and resolve CI failures before merging.

The CI pipeline runs on every pull request and must pass before merge. Documentation-only changes (`.md` files) are skipped by the security stages, which is why they can be merged independently.

---

## CI/CD Pipeline

`.github/workflows/cicd.yaml` runs the following stages in order:

| # | Stage | Tool |
|---|-------|------|
| 1 | Secret scanning | Gitleaks |
| 2 | Linting | ESLint / `tsc --noEmit` |
| 3 | Static analysis (SAST) | Semgrep |
| 4 | Dependency scanning (SCA) | Trivy (filesystem) |
| 5 | Image build | Docker Buildx |
| 6 | Image scanning | Trivy (image) |
| 7 | Dynamic analysis (DAST) | OWASP ZAP baseline |
| 8 | SBOM generation | Syft (CycloneDX) |
| 9 | SBOM vulnerability scanning | Grype |
| 10 | Publish | Docker Hub |
| 11 | Notification | Slack |

You can also trigger the pipeline manually from the **Actions** tab using **Run workflow** with `scan-only`, `test`, or `deploy`.

---

## Code Style

- TypeScript strictness is enforced — `npm run lint` must pass.
- Use Tailwind utility classes for styling; avoid one-off CSS files.
- Use `lucide-react` icons rather than adding a new icon dependency.
- Prefer descriptive variable names and `camelCase` for functions and values; `PascalCase` for components.
- Add or update types in `src/types.ts` rather than declaring ad-hoc shapes inline.
- Use `motion` for animations already present in the codebase.

---

## Reporting Bugs

Open an issue with:

- A clear, descriptive title.
- Steps to reproduce.
- Expected vs. actual behavior.
- Relevant screenshots or console output.
- Your environment (OS, Node version, browser).

---

## Need Help?

Open a [discussion or issue](https://github.com/grlokesh96/Books-Pens/issues) — contributions of every size are welcome.
