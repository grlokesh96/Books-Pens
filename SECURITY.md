# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| `main`   | ✅ |
| < `main` | ❌ |

Security fixes are applied to `main` and released as soon as the fix is verified.

---

## Reporting a Vulnerability

**Please do not open a public issue, pull request, or discussion for security vulnerabilities.**

If you discover a vulnerability in Books-Pens, please report it privately through GitHub's **Security** tab:

1. Go to <https://github.com/grlokesh96/Books-Pens/security/advisories/new>.
2. Click **Report a vulnerability**.
3. Fill in the affected version, description, impact, and steps to reproduce.

If GitHub's private advisory reporting is unavailable, contact the repository owner through their GitHub profile and request a private channel.

Please do not include the vulnerability details in a public issue, issue comment, or pull request description.

### What to include

- Type of issue (e.g. XSS, injection, broken access control, secret exposure)
- Affected file(s) or component
- Steps to reproduce, including proof-of-concept code if available
- Impact: what an attacker could achieve
- Any known mitigations or workarounds

---

## What to Expect

| Stage | Target |
|-------|--------|
| Acknowledgement | Within 72 hours |
| Triage and severity assessment | Within 7 days |
| Remediation plan | Announced after triage |
| Fix release | As soon as a fix is ready and reviewed |

You will be kept informed at each stage, and you will be credited in the advisory (unless you prefer to remain anonymous). Please do not publicly disclose the issue until a fix has been released.

---

## Scope

This policy covers the code in this repository, including:

- The React/TypeScript frontend in `src/`
- The `Dockerfile` and `docker-compose.yml` container definitions
- The GitHub Actions workflow in `.github/workflows/cicd.yaml`

### Out of scope

- Vulnerabilities in third-party dependencies — please report those to the upstream maintainer first (Dependabot alerts are enabled for this repository).
- Issues found through automated scanners without a demonstrated impact against this project.
- Missing hardening headers on the demo deployment with no exploitable path.
- Denial of service through deliberate resource exhaustion of the maintainer's own infrastructure.
- Reports without enough detail to reproduce.

---

## Security Measures in Place

The repository already runs the following automated checks on every push and pull request via `.github/workflows/cicd.yaml`:

| Stage | Tool | Purpose |
|-------|------|---------|
| Secret scanning | Gitleaks | Detects committed credentials and API keys. |
| Static analysis (SAST) | Semgrep | Finds insecure coding patterns in source. |
| Dependency scanning | Trivy (filesystem) | Flags known CVEs in `node_modules`. |
| Image scanning | Trivy (image) | Flags known CVEs in the built container image. |
| Dynamic analysis (DAST) | OWASP ZAP baseline | Tests the running app for common web vulnerabilities. |
| SBOM generation | Syft (CycloneDX) | Produces a bill of materials for each build. |
| SBOM scanning | Grype | Matches the SBOM against vulnerability databases. |

Findings from Semgrep, Trivy, and ZAP are published to the repository's **Security** tab.

---

## Handling Credentials

- Real secrets must never be committed. `.env.local` and `.env` are ignored by `.gitignore`.
- Store development secrets in `.env.local`; reference placeholder values in `.env.example`.
- Use GitHub **Actions secrets** (for example `DOCKERHUB_USERNAME`, `DOCKERHUB_PASSWORD`, `SLACK_WEBHOOK_URL`) for CI credentials — never hard-code them in workflow files.
- If a secret is ever committed, treat it as compromised: rotate it immediately, then open a pull request removing it. Removing the secret in a later commit does not undo the exposure.

---

## Responsible Disclosure

We appreciate your help keeping Books-Pens secure. Report vulnerabilities responsibly, give us a reasonable window to fix them, and do not use the vulnerability to access or modify user data, degrade the service, or harm third parties.
