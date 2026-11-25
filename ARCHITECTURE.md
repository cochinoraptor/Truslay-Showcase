# Architecture

Truslay is a deterministic execution pipeline that sits between an AI agent and the actions it wants to perform. It is not a wrapper and not a text filter: it evaluates intent against a policy graph and blocks the tool call at system level when the verdict is not ALLOW. This document describes the high-level architecture — the layers, the flow, and the design principles — without exposing implementation details.

## Ecosystem flow: Gateway → Shield → Enterprise API

At the ecosystem level, each agent action is routed, evaluated by the appropriate shield, and validated through the Enterprise API (including identity validation on Sui) before execution:

```
                         ┌─────────────────────────────┐
                         │          AI AGENT            │
                         │   (intent / action request)  │
                         └─────────────┬───────────────┘
                                       │
                                       ▼
                         ┌─────────────────────────────┐
                         │      ROUTING GATEWAY         │
                         │  resolve shield by context   │
                         │  (hr, finance, devops, ...)  │
                         └─────────────┬───────────────┘
                                       │
                                       ▼
                         ┌─────────────────────────────┐
                         │    CORRESPONDING SHIELD      │
                         │  domain-specific evaluation  │
                         │  verdict: allow/review/block │
                         └─────────────┬───────────────┘
                                       │
                                       ▼
                         ┌─────────────────────────────┐
                         │       ENTERPRISE API         │
                         │  policy + decision validation│
                         │  identity validation on Sui  │
                         │      (Move contracts)        │
                         └─────────────┬───────────────┘
                                       │
                                       ▼
                         ┌─────────────────────────────┐
                         │      ACTION / EXECUTOR       │
                         │   execute only if approved   │
                         └─────────────────────────────┘
```

## Design principles

Three principles drive every layer in the pipeline:

1. **Fail-closed.** When anything is uncertain — a network error, a low-confidence verdict, a missing approval — the default is to hold the action, not to allow it. Nothing executes without an explicit green light.
2. **Policy over model.** Hard rules (recipients, limits, budgets) are enforced independently of any model. The model advises; the policy decides.
3. **Defense in depth.** No single layer is the sole defense. Each layer catches a different class of risk, and a block at any layer stops the action.

## The flow

```
Agent action ──► Truslay pipeline ──► Verdict: allow / review / block
                                              │
                    ┌───────────────────────┼───────────────────────┐
                    │                       │                       │
                 ALLOW                    REVIEW                  BLOCK
                    │                       │                       │
                    ▼                       ▼                       ▼
              execute              queue for human        reject / log
```

Every action passes through all layers in order. Each layer can veto the action. The final verdict — allow, review, or block — is recorded with the reason and the confidence, for audit.

## The 8 deterministic layers

The pipeline is split between the **SDK** (the sovereign edge, Layers 1–6) and
the **Firewall** (the trust core, Layers 7–8). Truslay is not a wrapper and not a
text filter: layers 1–5 decide and enforce *before* the tool is invoked, layer 6
records the sealed decision locally, and layers 7–8 make that decision
third-party verifiable at fleet scale.

| # | Layer | What it does | Runs in |
| --- | --- | --- | --- |
| 01 | **Signal** | Intercepts the intent before any tool call; normalizes action, actor and payload into a contract. | SDK |
| 02 | **Lattice** | Evaluates the intent against the versioned policy graph: limits, budgets, whitelists, roles, dual approval. | SDK |
| 03 | **Shield** | Applies domain policy packs (finance, HR, health-PII, legal, cyber, DevOps, commerce, support, booking). | SDK |
| 04 | **Gate** | Enforces the verdict at system level: the tool call is blocked, fail-closed. | SDK |
| 05 | **Seal** | Signs the decision locally with ed25519 so it cannot be altered afterwards. | SDK |
| 06 | **Ledger** | Appends the sealed decision to a local hash chain, available offline. | SDK |
| 07 | **Anchor** | Anchors ledger hashes to the **Sui** blockchain for immutable audit (SOX/GDPR). | Firewall |
| 08 | **Prism** | Fleet observability: dashboards, policy analytics, human audit and evidence export. | Firewall |

The edge never depends on a network round trip to protect the agent. The core
never decides whether a tool runs; it governs policy, proves integrity and gives
humans the audit interface.

## What Truslay is not

- It is not a wrapper or a text filter. It does not "clean" prompts; it decides
  whether an action is allowed and blocks execution at system level.
- It is not a replacement for the agent. The agent still decides what to do;
  Truslay decides whether to let it execute.
- It is not a payment processor. It sits in front of one.
- It is not a silver bullet. The layers reduce risk, but a determined adversary
  and a poorly written policy can still cause problems. The honest summary of
  what the current MVP does and does not protect is in [SECURITY.md](SECURITY.md).

## Extensibility

The pipeline is designed to be extended. New layers can be inserted, thresholds can be tuned, and the decision engine can be swapped or upgraded without rewriting the rest of the system. The interface between layers is a verdict with a reason and a confidence — simple, auditable, and versionable.
