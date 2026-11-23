# Autonomous purchasing agent — recorded demo

A Puppeteer agent buys a product end to end in the sample storefront
(`http://localhost:4173`, Vite preview), with every critical action evaluated by
`@truslay/sdk` 2.1.0 before it runs. The whole run was recorded and every step
was captured, so the result is auditable instead of claimed.

| File                       | What it is                                                       |
| -------------------------- | ---------------------------------------------------------------- |
| `agent.js`                 | The agent: catalog → cart → checkout → form → order, SDK-gated   |
| `demo-agente-truslay.mp4`  | Recording of the run — 1:03.4, 1280×900, H.264, 30 fps (~6.3 MB) |
| `block-evidence.mp4`       | Fail-closed proof — 0:09.9, 1280×900, H.264, 30 fps (~1.9 MB)   |
| `block-evidence.js`        | Recorder for the `BLOCK / firewall_unavailable` path               |
| `01-home.png`              | Catalog loaded (12 product cards)                                |
| `02-added-to-cart.png`     | "Auriculares Pro X1" added: badge and confirmation toast         |
| `03-checkout-modal.png`    | Checkout modal with the four fields                              |
| `04-form-filled.png`       | Name, email, address and card filled with real typing            |
| `05-purchase-complete.png` | Confirmation modal with the generated `ORD-…`                    |

## The live SDK console in the recording

The video shows the SDK's evaluation, not just the page. `agent.js` injects a
fixed console panel into every document before paint — `pointer-events: none`, so
it never swallows the agent's clicks — and mirrors two things into it:

- every `console` message the storefront emits, and
- each `evaluateAction()` call with its verdict line
  (`ALLOW · sandbox_mode · 0ms`) plus a floating verdict badge.

Everything the panel shows is also printed in the Node terminal, so a reviewer
can diff the video against the process output.

## What the run proves

Five intents are declared to the SDK before they execute — `read_catalog`,
`add_to_cart`, `open_checkout`, `fill_checkout_form`, `submit_order` — and all
five return `ALLOW` in `sandbox` mode. Sandbox is honest about itself: it logs
and audits, it does not enforce over the network, so this run demonstrates the
integration and the verdict pipeline, not a blocked attack — that branch has its
own recording in [The BLOCK path, recorded](#the-block-path-recorded).

The agent verifies the purchase instead of assuming it: it reads the order ID
from the confirmation modal **and** the orders stored in
`localStorage.techgadgets_orders`, and both must match
(`ORD-1795274361227-myqd68x5q` in the recorded run). The cart is empty
afterwards and the page reported zero JavaScript errors.

Two details are deliberate:

- **The product is found by visible text**, not by `:nth-child` or a positional
  selector, so the agent survives catalog reordering — the same fragility that
  WebMCPcss and Truslay address declaratively.
- **The recording starts before `page.goto`** and stops in `finally` before the
  browser closes, so the video includes the site load and is always finalized.

The agent is written fail-closed even though sandbox never trips it:
`authorize()` aborts on anything other than `ALLOW` and saves
`blocked-<intent>.png`.

## The BLOCK path, recorded

A fail-closed branch that never fires is a claim, so
[`block-evidence.js`](block-evidence.js) exercises it on camera: same
`collaboration` client and operator, but `firewallMode: 'live'` and no
`firewallUrl` (nor `apiKey`). The guardian cannot build the decision call, so
`evaluateAction('add_to_cart')` returns `BLOCK · firewall_unavailable` in ~0 ms.
The red badge lands over the page, the console shows the abort, and the cart
count is read back from the DOM as **0**: the product was never added.

[`block-evidence.mp4`](block-evidence.mp4) is that run (0:09.9, 1280×900). The
script exits non-zero if the verdict is not `BLOCK` or if the cart is not empty,
so a stale recording cannot pass as evidence. It needs no credentials and runs
headless — the same `npm install --legacy-peer-deps` covers it:

```bash
node block-evidence.js   # needs the storefront on :4173
```

## Client configuration

```js
const truslay = new TruslayUniversalClient(
  {
    mode: 'collaboration',
    firewallMode: 'sandbox',
    shieldId: 'e-commerce',
    timeoutMs: 150,
  },
  'agent', // ← operatorType is the SECOND positional argument
);
```

`operatorType` inside the config object is silently ignored — the runtime falls
back to `'universal'`. See
[../docs/api-corrections.md](../docs/api-corrections.md).

## Run it

```bash
npm install --legacy-peer-deps   # peer pin: recorder expects puppeteer 19
node agent.js                    # needs the storefront on :4173
```

`--legacy-peer-deps` is required because `puppeteer-screen-recorder` declares
`puppeteer@19` while this demo uses Puppeteer 25; the recorder only relies on
stable CDP (`Page.startScreencast`). No system ffmpeg is needed:
`@ffmpeg-installer/ffmpeg` ships a static binary that `agent.js` passes as
`ffmpeg_Path`.

Full walkthrough, configuration table, expected console output and known issues
(Spanish): [docs/demo-agent.md](https://github.com/cochinoraptor/truslay-webmcp-navigator/blob/main/docs/demo-agent.md).

## Where Truslay fits

The agent still sees a normal website and drives it with its own heuristics: the
product is found by visible text, the form is typed field by field. What changes
is **who decides whether an action is allowed**. Here that decision comes from
`evaluateAction()` through the `collaboration` client. With Agent Navigator the
same intent (`addToCart`, `checkout`) is declared by the navigation map, so the
agent does not have to guess the DOM at all.
