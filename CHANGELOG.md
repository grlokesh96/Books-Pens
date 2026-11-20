# Changelog

All notable changes to **Books-Pens** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added
- Community health files: `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, and `CHANGELOG.md`.

---

## [0.2.0] - 2026-11-20

### Added
- Dark mode toggle with a persisted theme preference (`src/hooks/useTheme.ts`, `src/components/ThemeToggle.tsx`).
- Full DevSecOps CI/CD pipeline (`.github/workflows/cicd.yaml`) covering secret scanning, linting, SAST, dependency scanning, image build, image scanning, DAST, SBOM generation, SBOM vulnerability scanning, Docker Hub publish, and Slack notification.

### Changed
- Removed the Kubernetes manifests from the repository; deployment is now container-based (Dockerfile + Docker Compose).

---

## [0.1.0] - 2026-10-01

### Added
- Initial storefront for books and pens built with React 19, TypeScript, Vite, and Tailwind CSS v4.
- Product browsing with search, category filtering, sorting, and rating display.
- Shopping cart with quantity management and coupon support.
- Wishlist, product reviews, and order history.
- Checkout flow with shipping and billing address capture.
- Admin dashboard for product, order, coupon, and customer management.
- Contact and About pages.
- Multi-stage Dockerfile (dependencies → build → production runner) and a Docker Compose setup for local development.

---

[Unreleased]: https://github.com/grlokesh96/Books-Pens/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/grlokesh96/Books-Pens/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/grlokesh96/Books-Pens/releases/tag/v0.1.0
