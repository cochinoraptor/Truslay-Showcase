# Truslay — The Trust Ecosystem for the Agentic World

![Status: Pre-Seed MVP](https://img.shields.io/badge/status-pre--seed%20MVP-blue)

> Truslay is the trust ecosystem that lets AI agents operate and transact safely in the agentic world.

## Introduction

Truslay is not just a firewall. It is an ecosystem that combines **10 Security Shields**, a **Routing Gateway**, and an **Enterprise API** to protect AI agents end to end: actions are routed to the right shield, evaluated under policy and risk controls, and validated through the Enterprise API before they can proceed. The system is **fail-closed by design** — when in doubt, actions are held for review rather than auto-approved.

## The 10 Shields

| Shield | What it protects |
|---|---|
| **HR Shield** | Escanea currículums en busca de inyecciones ocultas. |
| **Finance Shield** | Protege transferencias y pagos de acciones no autorizadas. |
| **Health-PII Shield** | Redacta y protege datos médicos sensibles (PII). |
| **Legal Shield** | Detecta alucinaciones y cláusulas inventadas en contratos. |
| **Cyber Shield** | Bloquea código peligroso y comandos maliciosos. |
| **DevOps Shield** | Evita comandos destructivos en servidores y bases de datos. |
| **E-commerce Shield** | Protege inventario y precios de tiendas online. |
| **Social Media Shield** | Modera contenido tóxico y protege la reputación de marca. |
| **Customer Support Shield** | Protege chats y datos de clientes en el CRM. |
| **Booking Shield** | Protege sistemas de reservas y agendas. |

## WebMCPcss and Agent Navigator

Truslay integrates **Agent Navigator** (the [WebMCPcss](https://github.com/cochinoraptor/WebMCPcss) open-source map, **MIT** license) so agents can navigate the web using a structured, reliable tool/navigation map. Navigation and tool discovery are paired with Truslay’s protection model: **security is validated through the Enterprise API**, ensuring agent actions are evaluated and enforced consistently before execution.

## Security audit (HackenProof)

Truslay maintains an external security review process with **HackenProof**. The **audit of the contracts in Move (Sui)** is currently **in process**.

- Move contracts (audit scope): https://github.com/cochinoraptor/truslay-move-contracts-audit

## The problem

AI agents can already browse, compare, and act on our behalf. But every agent faces the same unresolved question: **who decides whether an action is safe?** Without a separate trust layer, an agent that can spend or operate tools can be tricked into doing harm through prompt injection, roleplay, or context manipulation.

## What Truslay does

Truslay sits between the agent and execution. Each requested action passes through a multi-layer decision pipeline that combines non-negotiable policy rules, semantic decisioning, structural checks, and human approval as the final backstop for anything above a threshold.

## The 8 layers

1. **Human pause** — A global or per-recipient kill switch. While paused, nothing executes.
2. **Credential guard** — Requests for private keys, seed phrases, or keystores are blocked immediately.
3. **Policy engine** — Recipient whitelists, per-transaction limits, and daily budgets. Policy is law.
4. **Approval gate** — Textual claims of approval are rejected; real approval comes from a separate approval queue.
5. **Calibrated decision engine** — A semantic model evaluates intent and returns a verdict with confidence.
6. **Skill/package integrity** — Skills and packages are scanned for injection before entering the pipeline.
7. **Transport security** — Outgoing requests are inspected for exfiltration, sensitive paths, and unauthorized tool calls.
8. **Human approval queue** — Actions above a threshold, or with low confidence, are queued for human review.

## Architecture

```
                    ┌─────────────────────────────┐
                    │        AI AGENT              │
                    │  (browse, compare, operate)  │
                    └─────────────┬───────────────┘
                                  │ action request
                                  ▼
                    ┌─────────────────────────────┐
                    │         TRUSLAY              │
                    │  Gateway · Shields · API     │
                    ├─────────────────────────────┤
                    │  1. Human pause (kill switch)│
                    │  2. Credential guard          │
                    │  3. Policy engine             │
                    │  4. Approval gate             │
                    │  5. Calibrated decision engine│
                    │  6. Skill/package integrity   │
                    │  7. Transport security        │
                    │  8. Human approval queue      │
                    └─────────────┬───────────────┘
                                  │ verdict: allow / review / block
                                  ▼
                    ┌─────────────────────────────┐
                    │     ACTION / EXECUTOR        │
                    │  (payment, tool, workflow)   │
                    └─────────────────────────────┘
```

## Verification highlights

### Tests
- **Firewall tests:** 192/192 passing
- **WebMCPcss tests:** 652/652 passing
- **Move contract tests:** 17/17 passing

### External security audit
- External security audit (DEC-2610): 7/7 in-scope findings remediated
- **HackenProof:** audit of the contracts in **Move (Sui)** in process

### Adversarial validation
- **34 adversarial attacks** in the suite across 5 categories (direct injection, indirect injection, roleplay, context manipulation, sandbox escape); published run: 30.
- **3 vulnerabilities found and resolved** before the public release.
- **Result:** 0 attacks passed all layers in the final run.

## Red-team results (honest summary)

An independent red-team suite of 34 adversarial prompt injection attacks targets the pipeline; the published run below executed 30 of them. Results measured against a calibrated INT4 decision engine on CPU:

| Outcome | Count | Meaning |
|---------|-------|---------|
| Hard block | 9 | The pipeline blocked the action outright |
| Escalated to review | 11 | The action was held for human review (not auto-approved) |
| Structural block | 10 | Blocked before the decision engine (skill integrity, credential guard, etc.) |
| Passed all layers | 0 | No attack succeeded |

**Block rate: 100% (30/30) in the published run.** No attack passed all layers.

### Known limitations (stated honestly)

- The INT4 decision checkpoint was fine-tuned primarily on English-language decision flows. On Spanish payloads it discriminates less well. Production use with non-English agents requires either English normalization or a multilingual checkpoint.
- Confidence values are low (p50 0.44) and uncalibrated for this domain. With a 0.6 confidence threshold, many legitimate actions would be escalated to review. Calibration against a real corpus is required before production deployment.
- The current queue is in-memory and lost on restart. Durable persistence is a production requirement.

## Status

- **Pre-seed.** MVP on Sui Testnet with test assets.
- **Seeking design partners** who want to let their agents operate safely.
- Full source code is private and available upon request under NDA.

## Contact

- **Email:** cochinoraptor@gmail.com
- **Issues:** [Open an issue](https://github.com/cochinoraptor/Truslay-Showcase/issues)
