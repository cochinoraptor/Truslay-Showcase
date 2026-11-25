# PITCH — Truslay

## The problem

AI agents already browse and buy on our behalf, but **nobody gives them a card**:
agentic payment demands either blind trust (unacceptable) or human approval of every
click (unusable). The result: pilots blocked by risk and compliance at the companies
that most need to automate payments and subscriptions.

## The solution

**Truslay** is a deterministic execution and audit pipeline for agents' *actions*:
it decides before the tool runs, and proves the decision afterwards.

- **Sovereign edge (SDK, Layers 1–6):** Signal intercepts the intent, Lattice
  evaluates it against a versioned policy graph, Shield applies the domain rules,
  Gate blocks the tool call (fail-closed) and Seal signs the decision with ed25519
  — all locally, in under 1 ms, with no network dependency.
- **Immutable trust core (Firewall, Layers 7–8):** Anchor writes ledger hashes to
  **Sui** for third-party-verifiable audit (SOX/GDPR), and Prism gives the team
  dashboards, exception queues and evidence export.
- **Deterministic, not generative:** policies are a graph, not a prompt. The same
  intent and the same policy version produce the same verdict, explicable node by
  node. The model does not get to negotiate with the Gate.
- **Human-in-the-loop by exception:** only the doubtful reaches the approval
  queue; routine actions flow within limits.
- **Public freemium:** 1,000 evaluations free; public plans from $19.99/month up
  to $5,999.99/month. No "contact us for pricing" black box.

## Ecosystem vision (Shields + Gateway + Enterprise API)

Truslay is evolving from a deterministic execution pipeline into a **Trust Ecosystem for the Agentic World**:

- **Shield domain packs (Layer 03):** domain-specific protections (HR, Finance, Health-PII, Legal, Cyber, DevOps, E-commerce, Social Media, Customer Support, Booking) that detect and block risks tailored to each context.
- **Routing Gateway:** routes each agent action/request to the appropriate Shield and orchestrates evaluation across the security layer.
- **Enterprise API:** the unified interface for integrating, validating and enforcing decisions at scale — connecting navigation, shield verdicts and identity/policy checks so organizations can adopt agentic workflows with control and auditability.

Together, **Shields + Gateway + Enterprise API** turn Truslay into a composable security and trust platform: agents can navigate and act, while every sensitive step is evaluated, routed and validated before execution.

## Why now

1. Agentic identity standards (ERC-8004) are being born: the trust layer is being
   defined NOW.
2. Sui allows spend policies as on-chain objects + native sponsorship: the agentic
   payment stack exists and nobody has productized it with a calibrated decision
   firewall in front.
3. The market wants control: every news story of an agent that spends badly is a
   customer.

## Initial market

- **Agencies and agent operators** (browser automation) that need to sign enterprise
  customers: the firewall is their compliance.
- **SaaS with support/ops agents** that pay subscriptions or invoices.


## Stack (no proprietary secrets)

| Layer | Technology |
|---|---|
| Web tools / navigation | WebMCPcss (declarative, self-repairing) · Agent Navigator (open-source map) |
| Decision | Decision Engine Model (typed-decisions checkpoint), served locally |
| Chain / identity | Sui (Move): SpendingPolicy, AgentIdentity, MockUSDC — contracts audit in process (HackenProof) |
| Service | TypeScript + Express + @mysten/sui SDK |
| UI | React + Vite + @mysten/dapp-kit |

Defensible differentiators: the firewall's own dataset and thresholds (fine-tuning
Decision Engine with real decisions), auditable policy contracts, and the WebMCPcss → action
catalog → decision → payment integration, end to end.

## Validated cases in the MVP

- ✅ Legitimate subscription within limits: `safe` decision with calibrated confidence;
  dropping below threshold goes to human review and is approved 1-click.
- ✅ Fraud attempt ("urgent transfer to new wallet, expires in 10 minutes"):
  **blocked** by Decision Engine (`blocked`, risk 75/100).
- ✅ Limits: exceeding maxPerTx or the daily blocks; daily rollover works on-chain
  (17/17 Move tests).
- ✅ Fail-closed: with Decision Engine down, nothing executes automatically.

## Roadmap to production

1. **Q1**: live deploy with real USDC on Testnet, hot-potato receipts in Move,
   persistent queue, session auth.
2. **Q2**: Decision Engine fine-tuning with partner data (refund, chargeback, providers),
   multi-agent dashboard, external re-audit (DEC-2610 done: 7/7 in-scope findings remediated).
3. **Q3**: Mainnet with governance multi-sig, SDK for agent operators, wallet
   listing with sponsorship.
4. **Q4**: interoperable spend policy standard (proposal to ERC-8004 as a payment
   extension).

## What we ask for

Design partners with real decision volume to tune the thresholds (data flywheel),
and Sui ecosystem support (grant) to take the security layer to Mainnet with audit.
