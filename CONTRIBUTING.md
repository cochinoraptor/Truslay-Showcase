# Contributing to Truslay

Thanks for your interest in Truslay. This document covers how to report issues, submit changes, and run the project locally.

## Code of conduct

Be respectful and constructive. This project is a security-sensitive agentic payment firewall; keep discussions technical and evidence-based.

## Reporting issues

- Use the GitHub issue tracker.
- Include: what you expected, what happened, steps to reproduce, and environment (OS, Node version, Sui CLI version, Truslay Decision Engine version if relevant).
- For security issues, do **not** open a public issue. Follow the project's security disclosure process if one exists; otherwise contact the maintainers privately.

## Submitting changes

1. Fork the repo and create a feature branch.
2. Make your change. Keep it focused: one concern per PR.
3. Add or update tests if the change affects behavior.
4. Run the checks below and make sure they pass.
5. Open a pull request with a clear title and description.

## Development setup

See [SETUP.md](SETUP.md) for the full environment.

Quick start:

```bash
# Decision Engine (Truslay)
# Note: The internal command remains `laya-serve` for compatibility.
pip install --user "laya[serve]"
laya-serve --host 127.0.0.1 --port 8000 &

# Firewall
cd firewall && npm install && npm test && npm run build

# Trust Console
cd trust-console && npm install && npm run dev
