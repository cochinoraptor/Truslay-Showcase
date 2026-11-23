# n8n-nodes-truslay

An [n8n](https://n8n.io) community node that puts the **Truslay firewall** in
front of any workflow step: drag `Truslay → Evaluate Action → Check Security`
between two nodes and the action only continues when Truslay answers `ALLOW`.

This package is completely isolated from the SDK source. It consumes the
published SDK as a plain dependency (`@truslay/sdk@2.1.0`) and never imports
anything from the SDK repository.

```
[ Webhook ] ──▶ [ Truslay · Check Security ] ──▶ [ HTTP Request ]
  POST /order      intent: checkout                  runs only on ALLOW
                   shield: e-commerce
                   on block: Stop Workflow
```

## Installation

### 1. From the n8n UI (recommended)

1. Open your n8n instance and go to **Settings → Community Nodes**.
2. Choose **Install**, enter `n8n-nodes-truslay` and accept the community-node
   warning.
3. Restart n8n if your version asks for it, then search for **Truslay** in the
   node panel.

The package has to be published on npm for this path to work. On self-hosted
instances the community-nodes UI must be enabled
(`N8N_COMMUNITY_PACKAGES_ENABLED=true`, then restart n8n).

### 2. Self-hosted, via npm

```bash
# inside your n8n user folder
mkdir -p ~/.n8n/custom && cd ~/.n8n/custom
npm init -y
npm install n8n-nodes-truslay
```

Point n8n at that folder and restart it:

```bash
export N8N_CUSTOM_EXTENSIONS=/home/node/.n8n/custom
```

With Docker, mount the folder and set the same variable:

```yaml
services:
  n8n:
    image: docker.n8n.io/n8nio/n8n
    environment:
      - N8N_CUSTOM_EXTENSIONS=/home/node/.n8n/custom
    volumes:
      - ./n8n-custom:/home/node/.n8n/custom
```

### 3. From this repository (development)

```bash
cd integrations/n8n-node
npm install
npm run build
```

Then link it into your n8n custom folder:

```bash
cd ~/.n8n/custom
npm link /path/to/Truslay-Showcase/integrations/n8n-node
```

`npm run build` compiles `credentials/`, `nodes/` and `index.ts` into `dist/`,
which is what `package.json#n8n` points at. Rebuild after every change and
restart n8n.

## Credentials

Create a **Truslay API** credential with:

| Field | Meaning |
| --- | --- |
| **Environment** | `Sandbox` audits locally without network; `Live` enforces through the firewall |
| **API Key** | Your Truslay API key — required in live, ignored in sandbox |
| **Firewall URL** | Base URL of your firewall — required in live only |

Live mode is **fail-closed**. If the firewall cannot be reached or does not
return a valid decision, the SDK returns
`BLOCK` with reason `firewall_unavailable` and the node treats it like any
other block. A broken endpoint never lets an action through.

## Using the node

| Field | Values |
| --- | --- |
| **Resource** | `Evaluate Action` |
| **Operation** | `Check Security` |
| **Intent** | `webhook_incoming`, `scraping_request`, `database_write`, `checkout`, `agent_navigation` |
| **Shield** | `e-commerce`, `finance`, `crm`, `automation`, `none` |
| **On Block Action** | `Stop Workflow`, `Output Error Item`, `Continue with Warning` |

The item's JSON is sent to the firewall as the action `payload`, so the policy
sees the real data the next node would act on.

### What happens on each verdict

| Verdict | `Stop Workflow` | `Output Error Item` | `Continue with Warning` |
| --- | --- | --- | --- |
| `ALLOW` | item continues | item continues | item continues |
| `BLOCK` | node throws, run stops | item emitted with `error`, run continues | item emitted with `truslay_warning`, run continues |

Every outgoing item carries the audit fields below, whatever the verdict:

| Field | Example |
| --- | --- |
| `truslay_verdict` | `ALLOW` / `BLOCK` |
| `truslay_reason` | `sandbox_mode`, `firewall_unavailable`, `policy_denied` |
| `truslay_environment` | `sandbox` / `live` |
| `truslay_shield` | `e-commerce` |
| `truslay_latency_ms` | `2` |
| `truslay_audit_id` | present when the backend returns one |

Use an **IF** node on `{{ $json.truslay_verdict }}` when you pick
`Output Error Item` and want two branches (allowed vs blocked).

### Example: Webhook → Truslay → HTTP Request

1. **Webhook** node, `POST`, path `order`. Send
   `{"intent":"checkout","cart_total":120}` and copy the production URL.
2. **Truslay** node next to it: intent `Checkout`, shield `E-Commerce`,
   on block `Stop Workflow`, credentials set to `Sandbox` while you test.
3. **HTTP Request** node after Truslay: `POST https://your-api.example.com/orders`,
   body `{{ $json }}`.
4. Execute the workflow. With sandbox credentials the item arrives at the HTTP
   Request with `truslay_verdict: "ALLOW"` and `truslay_reason: "sandbox_mode"`.
5. Switch the credential to `Live`, point it at your firewall and repeat: a
   denied action now stops at Truslay and the HTTP Request never fires.

## How it uses the SDK (v2.1.0)

```ts
const truslay = new TruslayUniversalClient(
  { mode: 'collaboration', firewallMode: environment, apiKey, firewallUrl },
  'agent', // operatorType is the SECOND POSITIONAL ARGUMENT in v2.1.0
);

const verdict = await truslay.evaluateAction({ intent, payload: item.json }, { shieldId });
```

`operatorType` inside the config object is silently ignored by the SDK, which
would leave the `agent` guards unapplied. The node always passes it as the
second argument, and only adds `apiKey` / `firewallUrl` when they are present,
so sandbox needs no credentials at all.

## Limitations

- The node gates whatever the incoming item represents; it does not inspect or
  modify the action that the next node performs.
- `REVIEW` is handled as a block: the SDK has no approval channel, so an
  approval verdict cannot continue the run.
- The firewall URL must expose the SDK's decision path
  (`POST {Firewall URL}/api/guardian/evaluate`) and accept
  `Authorization: Bearer <API Key>`.
