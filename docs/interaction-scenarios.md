## 🔄 System Interaction Scenarios

Truslay dynamically adapts its architecture based on your needs. Below are the visual workflows of how our SDK and Cloud Firewall interact across our three primary deployment modes.

### 🟢 Scenario 1: Defense Mode (Companies WITHOUT AI Agents)

*Zero-latency, 100% local evaluation. The Firewall only receives anonymized telemetry for the dashboard.*

```mermaid
sequenceDiagram
    participant User as User / External Bot
    participant SDK as Truslay SDK (Local Browser)
    participant Server as Client Web Server
    participant Dashboard as Truslay Dashboard (Cloud)

    User->>SDK: Action Triggered (e.g., "Add to Cart")
    SDK->>SDK: Local Evaluation (Honeypot, Behavioral, Fingerprint)

    alt Malicious Bot Detected
        SDK--xUser: BLOCK Action Locally (0ms)
        SDK-.->Dashboard: Async Telemetry (Anonymized Hash)
    else Legitimate Human
        SDK->>Server: ALLOW Action (Proceeds normally)
        SDK-.->Dashboard: Async Telemetry (Anonymized Hash)
    end
```

### 🔵 Scenario 2: Collaboration Mode (Companies WITH AI Agents)

*The SDK attaches a cryptographic workload identity and defers the decision to the Cloud Firewall.*

```mermaid
sequenceDiagram
    participant Agent as Internal AI Agent
    participant SDK as Truslay SDK (Local)
    participant FW as Truslay Cloud Firewall (Laya INT4)
    participant Target as External System (e.g., CRM)

    Agent->>SDK: Intends Action (e.g., "Send Email")
    SDK->>SDK: Attach SPIFFE Identity (JWT-SVID) & Local Rate Limit Check
    SDK->>FW: Forward Request with Identity
    FW->>FW: Validate SVID & Apply Shield Rules (e.g., CRM Shield)

    alt Authorized & Compliant
        FW-->>SDK: Verdict: ALLOW
        SDK->>Target: Execute Action
    else Unauthorized / Violation
        FW-->>SDK: Verdict: BLOCK
        SDK--xAgent: Action Denied
    end
```

### 🟣 Scenario 3: High-Risk Collaboration (Human-in-the-Loop)

*Critical actions in regulated industries pause for human approval with auditable evidence.*

```mermaid
sequenceDiagram
    participant Agent as Enterprise AI Agent
    participant SDK as Truslay SDK (Local)
    participant FW as Dedicated Truslay Firewall (SPIRE + Banking Shield)
    participant Human as Compliance Officer (Dashboard)
    participant Target as Core Banking System

    Agent->>SDK: High-Risk Action (e.g., "Freeze Account")
    SDK->>FW: Forward Request with Advanced Cryptographic Identity
    FW->>FW: Evaluate via Banking Shield

    alt Requires Human Approval (HITL)
        FW->>Human: PAUSE Action & Send Alert + PDF Audit Evidence
        Human->>FW: Manual Review & Click "Approve"
        FW-->>SDK: Verdict: ALLOW (Post-Approval)
        SDK->>Target: Execute Action
    else Auto-Approved (Low Risk)
        FW-->>SDK: Verdict: ALLOW
        SDK->>Target: Execute Action
    end
```

## Which mode do I need?

| Your situation | Mode | Network requirement |
| --- | --- | --- |
| You want to stop external bots and scrapers on your own site | Defense | None — 100% local |
| You run AI agents that act on third-party systems | Collaboration | Cloud Firewall + JWT-SVID |
| You need human approval for high-risk agent actions | Collaboration (HITL) | Cloud Firewall + SPIRE + Dashboard |

Defense and Collaboration are independent products: you can ship Defense today
and enable Collaboration later without changing how your site works.
