#!/usr/bin/env node
/**
 * block-evidence.js — Evidencia de la ruta BLOCK del SDK 2.1.0 (fail-closed).
 *
 * El demo principal (`agent.js`) corre en `firewallMode: 'sandbox'`: el SDK
 * evalúa y audita, pero por diseño no bloquea por red, así que la rama
 * fail-closed nunca se ejecuta. Este script la ejercita:
 *
 *   - `firewallMode: 'live'` y sin `firewallUrl` ni `apiKey`, es decir, un
 *     despliegue live mal configurado (o con el firewall caído).
 *   - El guardián no puede construir la llamada de red, `evaluateAction()`
 *     devuelve `BLOCK / firewall_unavailable` y el agente NO ejecuta la acción.
 *
 * La grabación (~10 s) muestra el veredicto en la consola superpuesta y el
 * carrito que queda en 0: la acción bloqueada no se ejecutó.
 *
 * Uso:  node block-evidence.js     (requiere la tienda en :4173)
 */

'use strict';

const fs = require('fs');
const path = require('path');

// La grabación y las rutas relativas se resuelven junto al script.
process.chdir(__dirname);

const puppeteer = require('puppeteer');
const { PuppeteerScreenRecorder } = require('puppeteer-screen-recorder');
const { TruslayUniversalClient } = require('@truslay/sdk');

const SITE_URL = process.env.SITE_URL || 'http://localhost:4173';
const PRODUCT_NAME = 'Auriculares Pro X1';
const VIDEO_FILE = 'block-evidence.mp4';

const RECORDER_CONFIG = {
  followNewTab: false,
  fps: 30,
  videoFrame: { width: 1280, height: 900 },
  videoCrf: 20,
  videoCodec: 'libx264',
  videoPreset: 'ultrafast',
  autopad: { color: 'black' },
  ffmpeg_Path: require('@ffmpeg-installer/ffmpeg').path,
};

// ---------------------------------------------------------------------------
// SDK Truslay 2.1.0 — transporte LIVE sin endpoint alcanzable.
//
// `operatorType` es el SEGUNDO argumento posicional del constructor.
// En `live` el SDK es fail-closed: si no puede consultar el firewall, bloquea.
// ---------------------------------------------------------------------------
const truslay = new TruslayUniversalClient(
  {
    mode: 'collaboration',
    firewallMode: 'live', // enforcement real; sin firewallUrl/apiKey no hay endpoint
    shieldId: 'e-commerce',
    timeoutMs: 150,
  },
  'agent',
);

// ---------------------------------------------------------------------------
// Consola superpuesta (misma idea que agent.js, en rojo: modo live)
// ---------------------------------------------------------------------------
function consoleOverlayBootstrap() {
  const PANEL_ID = 'truslay-console';
  const MAX_LINES = 7;
  const COLORS = {
    info: '#e2e8f0',
    sdk: '#f87171',
    allow: '#22c55e',
    block: '#ef4444',
    page: '#94a3b8',
  };

  const state = { queue: [], lines: [] };

  function stamp() {
    const d = new Date();
    return [d.getHours(), d.getMinutes(), d.getSeconds()]
      .map((n) => String(n).padStart(2, '0'))
      .join(':');
  }

  function render() {
    const body = document.getElementById('truslay-console-log');
    if (!body) return;
    body.textContent = '';
    for (const line of state.lines) {
      const row = document.createElement('div');
      row.style.color = COLORS[line.level] || COLORS.info;
      row.style.whiteSpace = 'pre';
      row.style.overflow = 'hidden';
      row.style.textOverflow = 'ellipsis';
      row.textContent = `[${line.time}] ${line.text}`;
      body.appendChild(row);
    }
  }

  function push(level, text) {
    state.lines.push({ level, text, time: stamp() });
    if (state.lines.length > MAX_LINES) state.lines.shift();
    render();
  }

  function mount() {
    if (document.getElementById(PANEL_ID) || !document.body) return;

    const panel = document.createElement('div');
    panel.id = PANEL_ID;
    Object.assign(panel.style, {
      position: 'fixed',
      left: '0',
      right: '0',
      bottom: '0',
      zIndex: '2147483000',
      background: 'rgba(10, 4, 6, 0.95)',
      borderTop: '2px solid #ef4444',
      boxShadow: '0 -6px 18px rgba(0,0,0,0.5)',
      font: '12px/1.4 "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace',
      color: '#e2e8f0',
      pointerEvents: 'none',
      padding: '6px 12px 10px',
      boxSizing: 'border-box',
    });

    const header = document.createElement('div');
    Object.assign(header.style, {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginBottom: '4px',
      fontSize: '11px',
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      color: '#f87171',
    });
    header.innerHTML =
      '<span style="width:8px;height:8px;border-radius:50%;background:#ef4444;' +
      'box-shadow:0 0 8px #ef4444;display:inline-block"></span>' +
      '<span>Truslay SDK 2.1.0 · firewall live (fail-closed)</span>' +
      '<span style="margin-left:auto;color:#94a3b8">' +
      'mode: collaboration · firewall: live · operator: agent</span>';

    const body = document.createElement('div');
    body.id = 'truslay-console-log';

    panel.appendChild(header);
    panel.appendChild(body);
    document.body.appendChild(panel);
    render();
  }

  window.__truslayConsole = {
    log(level, text) {
      if (!document.getElementById('truslay-console')) {
        state.queue.push({ level, text });
        mount();
        state.queue.forEach((item) => push(item.level, item.text));
        state.queue = [];
        return;
      }
      push(level, text);
    },
    verdict(value, intent) {
      const badge = document.createElement('div');
      const color = COLORS[value.toLowerCase()] || COLORS.info;
      Object.assign(badge.style, {
        position: 'fixed',
        bottom: '190px',
        right: '14px',
        zIndex: '2147483100',
        padding: '8px 14px',
        borderRadius: '8px',
        background: 'rgba(10, 4, 6, 0.94)',
        border: `2px solid ${color}`,
        color,
        font: '600 14px "SFMono-Regular", Consolas, monospace',
        letterSpacing: '0.05em',
        pointerEvents: 'none',
        transition: 'opacity 200ms ease',
      });
      badge.textContent = `TRUSLAY · ${value} · ${intent}`;
      document.body.appendChild(badge);
      // Se queda visible: es el veredicto que el video debe mostrar.
      return badge;
    },
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount, { once: true });
  } else {
    mount();
  }
}

const waitForTimeout = (ms = 400) => new Promise((resolve) => setTimeout(resolve, ms));

async function uiLog(page, level, text) {
  try {
    await page.evaluate(
      (lvl, msg) => window.__truslayConsole && window.__truslayConsole.log(lvl, msg),
      level,
      text,
    );
  } catch {
    /* si la página está navegando, la línea se pierde: no es crítico */
  }
}

// ---------------------------------------------------------------------------
// Flujo: una sola acción crítica, bloqueada, y la página intacta.
// ---------------------------------------------------------------------------
(async () => {
  let browser;
  let recorder;
  const startedAt = Date.now();

  try {
    console.log(
      `🛡️  Truslay → mode=${truslay.mode}, operator=${truslay.operatorType}, status=${truslay.status}`,
    );

    // Headless: la superficie de captura queda clavada al viewport emulado, así
    // que la consola superpuesta (fixed al borde inferior) siempre entra en el
    // frame. En headful, Windows puede reducir la ventana y la superficie se
    // reescala a mitad de la grabación, recortando justo el veredicto.
    browser = await puppeteer.launch({
      headless: true,
      defaultViewport: { width: 1280, height: 900 },
    });

    const page = await browser.newPage();
    page.setDefaultTimeout(20000);
    await page.evaluateOnNewDocument(consoleOverlayBootstrap);

    recorder = new PuppeteerScreenRecorder(page, RECORDER_CONFIG);
    console.log(`🎥 Iniciando grabación → ${VIDEO_FILE}`);
    await recorder.start(VIDEO_FILE);

    console.log(`🌐 Navegando a ${SITE_URL} …`);
    await page.goto(SITE_URL, { waitUntil: 'networkidle2' });
    await waitForTimeout(900); // el catálogo se pinta

    await uiLog(page, 'sdk', `SDK 2.1.0 · firewallMode=live · status=${truslay.status}`);
    await uiLog(page, 'info', 'Firewall live sin endpoint configurado: fail-closed.');
    await waitForTimeout(900);

    const intent = {
      intent: 'add_to_cart',
      target: SITE_URL,
      payload: { product: PRODUCT_NAME, quantity: 1 },
    };

    console.log(`🛡️  evaluateAction(${intent.intent})…`);
    await uiLog(page, 'sdk', "▸ evaluateAction('add_to_cart')");

    const verdict = await truslay.evaluateAction(intent);
    console.log(`   ↳ ${verdict.verdict} · ${verdict.reason} · ${verdict.latencyMs}ms`);

    const line = `${verdict.verdict} · ${verdict.reason ?? 'sin_razon'} · ${verdict.latencyMs ?? 0}ms`;
    await uiLog(page, 'block', `◀ ${line}`);
    await page
      .evaluate(
        (value, name) => window.__truslayConsole && window.__truslayConsole.verdict(value, name),
        verdict.verdict,
        intent.intent,
      )
      .catch(() => {});
    await waitForTimeout(900);

    // Fail-closed: la acción NO se ejecuta. Se comprueba en el DOM, no se asume.
    const cartCount = await page.evaluate(() => {
      const badge = document.getElementById('cart-count');
      return badge ? Number(badge.textContent.trim() || 0) : 0;
    });
    console.log(`🛒 Carrito tras el bloqueo: ${cartCount} artículos`);
    await uiLog(page, 'block', `✖ Acción no ejecutada · carrito: ${cartCount} artículos`);
    await uiLog(page, 'info', 'El agente obedece el veredicto: no hay fallback.');

    if (verdict.verdict !== 'BLOCK') {
      throw new Error(
        `Se esperaba BLOCK y llegó ${verdict.verdict} · ${verdict.reason ?? 'sin razón'}`,
      );
    }
    if (cartCount !== 0) {
      throw new Error(`La acción bloqueada se ejecutó igualmente (carrito: ${cartCount})`);
    }

    // Pausa final para que el veredicto quede legible en la grabación.
    console.log('⏳ Manteniendo el veredicto en pantalla…');
    await waitForTimeout(5450);

    const seconds = ((Date.now() - startedAt) / 1000).toFixed(1);
    console.log(`🏁 Evidencia completa · ${seconds}s · ${verdict.verdict} / ${verdict.reason}`);
  } catch (error) {
    console.error(`❌ Falló la evidencia: ${error.message}`);
    console.error(error.stack);
    process.exitCode = 1;
  } finally {
    if (recorder) {
      try {
        await recorder.stop();
        const videoPath = path.resolve(VIDEO_FILE);
        const sizeMb = (fs.statSync(videoPath).size / (1024 * 1024)).toFixed(2);
        console.log(`🎬 Video guardado: ${videoPath} (${sizeMb} MB)`);
      } catch (error) {
        console.error(`❌ No se pudo cerrar el video: ${error.message}`);
        process.exitCode = 1;
      }
    }
    if (browser) {
      await browser.close();
      console.log('🔒 Navegador cerrado.');
    }
  }
})();
