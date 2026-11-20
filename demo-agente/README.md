# Autonomous purchasing agent — recorded demo

A Puppeteer agent buys a product end to end in the sample storefront
(`http://localhost:4173`, Vite preview). The whole run was recorded and every
step was captured, so the result is auditable instead of claimed.

| File                        | What it is                                                        |
| --------------------------- | ----------------------------------------------------------------- |
| `agent.js`                  | The agent: catalog → add to cart → checkout → form → order        |
| `demo-agente-truslay.mp4`   | Recording of the run — 56.13 s, 1280×900, H.264, 30 fps (~5 MB)   |
| `01-home.png`               | Catalog loaded (12 product cards)                                 |
| `02-added-to-cart.png`      | "Auriculares Pro X1" added: badge and confirmation toast          |
| `03-checkout-modal.png`     | Checkout modal with the four fields                               |
| `04-form-filled.png`        | Name, email, address and card filled with real typing             |
| `05-purchase-complete.png`  | Confirmation modal with the generated `ORD-…`                     |

## What the run proves

The agent verifies the purchase instead of assuming it: it reads the order ID
from the confirmation modal **and** the orders stored in
`localStorage.techgadgets_orders`, and both must match
(`ORD-1795188331892-atp2wslvr` in the recorded run). The cart is empty
afterwards and the page reported zero JavaScript errors.

Two details are deliberate:

- **The product is found by visible text**, not by `:nth-child` or a positional
  selector, so the agent survives catalog reordering — the same fragility that
  WebMCPcss and Truslay address declaratively.
- **The recording starts before `page.goto`** and stops in `finally` before the
  browser closes, so the video includes the site load and is always finalized.

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

This demo is the unprotected baseline: an agent driving a real DOM with
heuristics of its own. In the Truslay model the same intent (`addToCart`,
`checkout`) is described by the Agent Navigator map, and the action is evaluated
by the firewall — routing, policy and verdicts — before it executes. The agent
still sees a normal website; what changes is who decides whether the action is
allowed.
