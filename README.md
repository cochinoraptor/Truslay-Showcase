# Truslay — The Trust Ecosystem for the Agentic World

![Status: Pre-Seed MVP](https://img.shields.io/badge/status-pre--seed%20MVP-blue)

> Truslay is the trust ecosystem that lets AI agents operate and transact safely in the agentic world.

**The engine lives in its own repository.** [`Truslay-SDK`](https://github.com/cochinoraptor/Truslay-SDK) ships the local-first SDK, its license and its integrations (n8n, Pipedream, Make). This showcase repository documents the architecture, the threat model and the recorded demo. Start there if you want to run the enforcement inside your own code.

## The New Wave of AI Bots is Here. Protect Your Business.

**You don't need to use AI to be attacked by it.** 

Today, any website, app, or online portal can be targeted by the new wave of automated AI bots. Competitors steal your prices, fraudsters create fake accounts, and automated systems extract your data 24/7. 

Truslay is the security layer that protects your infrastructure from these new AI threats — and helps your own systems work better.

### 🛡️ 1. Protect Your Business (Even if you don't use AI)
*For any company that wants to stop malicious bots.*

Install Truslay to shield your website or app from unauthorized AI bots. Truslay acts as an intelligent security guard that:
- Stops bots that browse your site at superhuman speeds (BehavioralGuard).
- Sets invisible traps to catch automated scrapers (Honeypots).
- Blocks fake account creation, price stealing, and data theft.
- Works instantly with any stack: a marketing site, a storefront, or a custom application.

### 🤝 2. Empower Your Own AI (When you are ready)
*For tech teams building their own automated systems.*

If your company uses AI bots to do work for you, Truslay gives them a secure digital identity and the ability to navigate websites without breaking. If a website changes its design, your bots automatically adapt and keep working.

---

## Real-World Examples: How Truslay Protects Your Business

Every industry is facing the new wave of AI bots. Here is how Truslay stops them.

### 🛒 E-commerce & Retail
**The Problem:** Competitors use AI bots to monitor and steal your prices and stock levels in real time, undercutting your business.
**The Truslay Solution:** Truslay detects bots that browse your store too fast and blocks them. Your pricing strategy stays private.

### 🏦 Banking & Fintech
**The Problem:** Fraudsters use automated bots to create thousands of fake accounts for money laundering and scams, risking your compliance and reputation.
**The Truslay Solution:** Truslay evaluates every new account and login. Bots are blocked instantly; real human customers get in without friction.

### 🎟️ Ticketing & Events
**The Problem:** Scalper bots buy all your event tickets in seconds to resell them at higher prices, making your real customers angry.
**The Truslay Solution:** Truslay detects inhuman buying speeds and stops the bots. Your real fans get the tickets, and your brand stays trusted.

### 📰 Content & Media Platforms
**The Problem:** AI companies use bots to scrape your articles, images, and videos without permission to train their own competing products.
**The Truslay Solution:** Truslay identifies unauthorized bulk downloading and blocks it. Your intellectual property and revenue stay safe.

### ✈️ Airlines & Hospitality
**The Problem:** Competitors and travel aggregators use bots to spy on your dynamic pricing and undercut your margins.
**The Truslay Solution:** Truslay detects and blocks automated price-monitoring bots. Your pricing strategy and profits stay healthy.

---

## One Simple Integration. Instant Protection.

Add Truslay to your project with one command:

```bash
npm install @truslay/sdk
```

## 🌐 Ecosystem Integrations

Truslay ships as native integration code, not only as an API. Each integration is an isolated project that consumes the published `@truslay/sdk@2.1.0`:

| Platform | What ships today | Status |
| --- | --- | --- |
| **n8n** | `n8n-nodes-truslay@0.1.1` — community node with a custom UI logo | Published on npm |
| **Pipedream** | `truslay` — native Pipedream App with its own logo (slug `truslay`) and the `Evaluate Action` action in the app selector | App + action ready — pending app registration in Pipedream |
| **Make** | `Evaluate Action` module with visual parameters and execute logic | Structure ready for the Make Custom Apps editor |
| **Zapier** | — | Coming soon |

Every one of them asks the same question before the platform performs the action:

```ts
const truslay = new TruslayUniversalClient(
  { mode: 'collaboration', firewallMode: 'sandbox' },
  'agent', // operatorType is the SECOND POSITIONAL ARGUMENT (v2.1.0)
);

const { verdict, reason } = await truslay.evaluateAction({ intent, target });
```

`ALLOW` lets the action run; anything else is blocked, and `live` mode is fail-closed: an unreachable firewall returns `BLOCK` instead of letting the action through.

Source: [Truslay-SDK → integrations](https://github.com/cochinoraptor/Truslay-SDK/tree/main/integrations).

## Modular by Design

You don't need the entire ecosystem to get value. Truslay is built as
independent, composable products:

- **SDK (`@truslay/sdk`)** — *The Sovereign Edge*: the local-first enforcer that
  runs Layers 1–6 (Signal, Lattice, Shield, Gate, Seal, local Ledger) inside
  your runtime in under 1 ms. It physically blocks the tool call, fail-closed,
  without needing the network.
- **Firewall** — *The Trust Core*: Layers 7–8 (Anchor on a decentralized ledger, Prism dashboards).
  The policy brain and immutable notary for the fleet — not a proxy that traffic
  passes through.
- **Agent Navigator** — the navigation map that tells agents how to navigate a
  site.
- **Enterprise API** — fleet policy management, API keys, quotas and audit
  export on top of the same deterministic pipeline.

Combine them for the complete trust layer: Agent Navigator asks the SDK for
permission before executing any web action, and the Firewall anchors the sealed
decision for audit.

See [docs/interaction-scenarios.md](docs/interaction-scenarios.md) for the three interaction workflows (diagrams): local Defense, authorized Collaboration, and high-risk Human-in-the-Loop approval.

## Introduction

Truslay is a deterministic execution pipeline for AI agents. It combines the **SDK** (the sovereign edge: Layers 1–6) with the **Firewall** (the trust core: Layers 7–8), plus 10 domain Shield packs, a Routing Gateway and an Enterprise API. Actions are intercepted, evaluated against the policy graph, and blocked at system level before they execute. The system is **fail-closed by design** — when in doubt, the action is blocked rather than auto-approved.

## Shield domain packs (Layer 03)

Layer 03 (**Shield**) applies these domain-specific policy packs inside the SDK, locally:

| Shield pack | What it protects |
|---|---|
| **HR Shield** | Scans résumés for hidden injections. |
| **Finance Shield** | Protects transfers and payments from unauthorized actions. |
| **Health-PII Shield** | Redacts and protects sensitive medical data (PII). |
| **Legal Shield** | Detects hallucinations and invented clauses in contracts. |
| **Cyber Shield** | Blocks dangerous code and malicious commands. |
| **DevOps Shield** | Prevents destructive commands on servers and databases. |
| **E-commerce Shield** | Protects inventory and pricing for online stores. |
| **Social Media Shield** | Moderates toxic content and protects brand reputation. |
| **Customer Support Shield** | Protects chats and customer data in the CRM. |
| **Booking Shield** | Protects booking systems and calendars. |

## Agent Navigator

Truslay integrates **Agent Navigator** (the [open-source navigation map](https://github.com/cochinoraptor/WebMCPcss), **MIT** license) so agents can navigate the web using a structured, reliable tool/navigation map. Navigation and tool discovery are paired with Truslay’s protection model: **security is validated through the Enterprise API**, ensuring agent actions are evaluated and enforced consistently before execution.

## Demo: an autonomous agent buying something — supervised by Truslay

A recorded, end-to-end run in [`demo-agente/`](demo-agente/): an autonomous browser agent
opens the storefront, finds "Auriculares Pro X1" by its visible text, adds it to
the cart, fills the checkout form with real typing and places the order — then
verifies the `ORD-…` in the confirmation modal against `localStorage`.

- [Video (1:03, 1280×900)](demo-agente/demo-agente-truslay.mp4) — the recording
  carries a **live console overlay of the SDK**: every `evaluateAction()` call and
  its verdict appear inside the video frame, next to the page being automated.
- [Block evidence (0:10, 1280×900)](demo-agente/block-evidence.mp4) — the same
  client in `firewallMode: 'live'` with no reachable firewall: the SDK answers
  `BLOCK · firewall_unavailable` and the action never runs.
- [One screenshot per step](demo-agente/) — `01-home` … `05-purchase-complete`
- [Agent code](demo-agente/agent.js) + [run notes](demo-agente/README.md)

Every critical intent (`read_catalog`, `add_to_cart`, `open_checkout`,
`fill_checkout_form`, `submit_order`) is declared to `@truslay/sdk` **2.1.0**
before it executes and waits for the verdict. The recorded run uses the
`collaboration` client with `firewallMode: 'sandbox'` and operator `agent`, so all
five intents return `ALLOW · sandbox_mode` — the evaluation is visible, while
sandbox mode audits instead of enforcing over the network. The agent is written
fail-closed: any verdict other than `ALLOW` stops the run and saves a
`blocked-<intent>.png` capture.

That fail-closed branch is recorded, not just claimed:
[`block-evidence.mp4`](demo-agente/block-evidence.mp4) (0:10) builds the same
`collaboration` client with `firewallMode: 'live'` and **no** `firewallUrl`, so
the guardian cannot reach a decision endpoint. `evaluateAction('add_to_cart')`
returns `BLOCK · firewall_unavailable`, the red verdict badge lands in the video
and the cart stays at **0** — the product is never added. Live mode is
fail-closed on purpose: an unreachable firewall blocks the action instead of
letting it through, and the agent has no fallback path.

The operator is the **second positional argument** of the constructor
(`new TruslayUniversalClient(config, 'agent')`); an `operatorType` key inside the
config object is silently ignored — see
[docs/api-corrections.md](docs/api-corrections.md).

## Security audit (HackenProof)

Truslay maintains an external security review process with **HackenProof**. The **audit of the on-chain contracts** is currently **in process**.

- On-chain contracts (audit scope): https://github.com/cochinoraptor/truslay-move-contracts-audit

## The problem

AI agents can already browse, compare, and act on our behalf. But every agent faces the same unresolved question: **who decides whether an action is safe?** Without a separate trust layer, an agent that can spend or operate tools can be tricked into doing harm through prompt injection, roleplay, or context manipulation.

## What Truslay does

Truslay is not a wrapper and not a text filter. It is a deterministic execution
engine for AI agents: it intercepts the intent, evaluates it against a policy
graph (Lattice), and blocks the tool call at system level (Gate) before the
action can happen. Text never gets "cleaned" — decisions get enforced.

## Technical Architecture

The trust path has five stages, and none of them is a text filter:

```text
Agent  →  SDK (Edge)  →  Firewall (Core)  →  Immutable Ledger  →  Audit
```

1. **Agent.** It decides what it wants to do: pay, deploy, delete, read a
   mailbox, call a tool.
2. **SDK (Edge).** The local library intercepts the intent before the tool runs,
   evaluates the deterministic policy graph in <1 ms and returns a verdict. A
   block physically stops the call, fail-closed: no network, no model and no
   exception path can approve it.
3. **Firewall (Core).** Approved and blocked decisions arrive as signed hashes.
   The Core applies fleet-wide policy, aggregates the decisions of every agent
   and prepares the anchoring batch.
4. **Immutable Ledger.** Decisions are hash-linked into an append-only record,
   and the root of that record is anchored on a decentralized network. Anyone
   can verify that a decision existed and was not altered afterwards.
5. **Audit.** A human can replay any decision line by line, export the evidence
   and prove compliance to an external auditor.

The separation matters: latency-critical enforcement never waits for a network
round trip, while the audit trail is not something the agent (or its operator)
can edit.

## Architecture: The SDK and The Firewall

Truslay ships as two complementary halves: an **Edge** that enforces inside your
process, and a **Core** that governs and notarizes the fleet.

### The SDK (`@truslay/sdk`) — "The Sovereign Edge"

- **What it does:** the local-first, zero-dependency execution engine. It is the
  **enforcer** that lives inside your application's runtime.
- **Coverage:** Layers 1–5 (Signal, Lattice, Shield, Gate, Seal) plus Layer 6
  (local Ledger) in **<1 ms**.
- **Scope:** intent interception, policy-graph evaluation, physical tool-call
  blocking (fail-closed) and local cryptographic signing. It does not need the
  internet to protect the agent.

### The Truslay Firewall — "The Trust Core"

- **What it does:** the holistic security architecture and governance system. It
  is not "a server traffic passes through": it is the policy brain and the
  immutable notary.
- **Coverage:** Layers 7–8 (Anchor and Prism). It anchors Ledger hashes to the
  **decentralized ledger** for immutable audit (SOX/GDPR) and provides the team
  observability dashboard.
- **Scope:** fleet-wide cryptographic truth, macro policy management and the
  human audit interface.

### The synergy

The SDK (Edge) intercepts the agent's action and evaluates it locally in
milliseconds. If it is safe, it seals it (Seal) and executes. If it is complex
or requires external audit, the SDK pushes the hash to the Firewall (Core),
which anchors it on the decentralized ledger (Anchor) and makes it visible in the dashboard (Prism).

> **The SDK is the sovereign guardian inside your code; the Firewall is the
> immutable vault on the network. Together they form the only deterministic
> trust layer for autonomous agents.**

## The 8 layers

| # | Layer | What it does | Runs in |
| --- | --- | --- | --- |
| 01 | **Signal** | Intercepts the intent before any tool call; normalizes action, actor and payload. | SDK |
| 02 | **Lattice** | Evaluates the intent against the policy graph: limits, whitelists, roles, dual approval. | SDK |
| 03 | **Shield** | Applies domain packs (finance, HR, health-PII, legal, cyber, DevOps, commerce, support, booking). | SDK |
| 04 | **Gate** | Enforces the verdict at system level: the tool call is blocked, fail-closed. | SDK |
| 05 | **Seal** | Signs the decision locally with a cryptographic signature so the verdict cannot be altered. | SDK |
| 06 | **Ledger** | Records the sealed decision in an append-only local ledger, available offline. | SDK |
| 07 | **Anchor** | Anchors ledger roots on a **decentralized network** for immutable, verifiable audit (SOX/GDPR). | Firewall |
| 08 | **Prism** | Fleet observability: dashboards, policy analytics, human audit and evidence export. | Firewall |

## Architecture

```
                    ┌─────────────────────────────┐
                    │        AI AGENT              │
                    │  (browse, compare, operate)  │
                    └─────────────┬───────────────┘
                                  │ intent + payload
                                  ▼
        ┌───────────────────────────────────────────────┐
        │  SDK — THE SOVEREIGN EDGE  (<1 ms, offline)   │
        │  01 Signal   02 Lattice   03 Shield           │
        │  04 Gate     05 Seal      06 Ledger (local)   │
        └─────────────┬─────────────────────────────────┘
                      │ blocked (fail-closed) ──► action never runs
                      │ sealed hash
                      ▼
        ┌───────────────────────────────────────────────┐
        │  FIREWALL — THE TRUST CORE                    │
        │  07 Anchor (immutable)                        │
        │  08 Prism (dashboards, human audit)           │
        └─────────────┬─────────────────────────────────┘
                      │ attestation
                      ▼
        ┌─────────────────────────────┐
        │     ACTION / EXECUTOR        │
        │  (payment, tool, workflow)   │
        └─────────────────────────────┘
```

## 💰 Pricing & Access

- **1,000 evaluations free**, no credit card required.
- **Public plans from $19.99/month** up to **$5,999.99/month** for enterprise
  fleets with on-chain anchoring, SSO and audit export.
- Plans and limits: **<https://truslay.com/pricing>**

## License

**SEE LICENSE IN [LICENSE.md](LICENSE.md)** in the
[Truslay-SDK](https://github.com/cochinoraptor/Truslay-SDK) repository. Truslay
is proprietary software, licensed — not sold. This showcase repository's own
code is covered by its [LICENSE](LICENSE) file.

---

## Verification highlights

### Tests
- **Firewall tests:** 192/192 passing
- **Navigator tests:** 652/652 passing
- **On-chain contract tests:** 17/17 passing

### External security audit
- External security audit (DEC-2610): 7/7 in-scope findings remediated
- **HackenProof:** audit of the on-chain contracts in process

### Adversarial validation
- **34 adversarial attacks** in the suite across 5 categories (direct injection, indirect injection, roleplay, context manipulation, sandbox escape); published run: 30.
- **3 vulnerabilities found and resolved** before the public release.
- **Result:** 0 attacks passed all layers in the final run.

## Red-team results (honest summary)

An independent red-team suite of 34 adversarial prompt injection attacks targets the pipeline; the published run below executed 30 of them. Results measured against a calibrated local decision engine:

| Outcome | Count | Meaning |
|---------|-------|---------|
| Hard block | 9 | The pipeline blocked the action outright |
| Escalated to review | 11 | The action was held for human review (not auto-approved) |
| Structural block | 10 | Blocked before the decision engine (skill integrity, credential guard, etc.) |
| Passed all layers | 0 | No attack succeeded |

**Block rate: 100% (30/30) in the published run.** No attack passed all layers.

### Known limitations (stated honestly)

- The decision model was fine-tuned primarily on English-language decision flows. On Spanish payloads it discriminates less well. Production use with non-English agents requires either English normalization or a multilingual checkpoint.
- Confidence values are low (p50 0.44) and uncalibrated for this domain. With a 0.6 confidence threshold, many legitimate actions would be escalated to review. Calibration against a real corpus is required before production deployment.
- The current queue is in-memory and lost on restart. Durable persistence is a production requirement.

## Status

- **Pre-seed.** MVP on a public test network with test assets.
- **Seeking design partners** who want to let their agents operate safely.
- Full source code is private and available upon request under NDA.

## Contact

- **Email:** cochinoraptor@gmail.com
- **Issues:** [Open an issue](https://github.com/cochinoraptor/Truslay-Showcase/issues)

---

⚠️ **Note: Truslay is not affiliated with "Trustly" or "TrustLayer".** Truslay is an independent deterministic execution and audit layer for AI agents; any similarity in name is coincidental.
