#!/usr/bin/env node
/**
 * agent.js — Agente autónomo de compra supervisado por Truslay SDK 2.1.0.
 *
 * Recorre la tienda que corre en modo preview (http://localhost:4173):
 *   abre el sitio → lee el catálogo → añade "Auriculares Pro X1" → abre el
 *   carrito → abre el checkout → rellena el formulario → envía el pedido.
 *
 * Cada acción crítica pasa ANTES por `truslay.evaluateAction()`. El veredicto
 * se escribe a la vez en la terminal de Node y en una consola superpuesta al
 * DOM, de modo que la grabación muestra la evaluación del SDK en tiempo real
 * (panorámica + consola en el mismo frame de video).
 *
 * Si el SDK no devuelve ALLOW, el agente NO ejecuta la acción (fail-closed):
 * guarda una captura `blocked-<intent>.png` y aborta el flujo.
 *
 * Uso:  node agent.js
 */

'use strict';

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const { PuppeteerScreenRecorder } = require('puppeteer-screen-recorder');
const { TruslayUniversalClient } = require('@truslay/sdk');

// ---------------------------------------------------------------------------
// Configuración del escenario
// ---------------------------------------------------------------------------
const SITE_URL = process.env.SITE_URL || 'http://localhost:4173';
const PRODUCT_NAME = 'Auriculares Pro X1';
const OUTPUT_DIR = __dirname; // capturas y video se guardan junto al script
const VIDEO_FILE = 'demo-agente-truslay.mp4';

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

const CUSTOMER = {
  name: 'Agente Truslay',
  email: 'agent@truslay.com',
  address: 'Av. Siempre Viva 742, Bogotá',
  card: '4242 4242 4242 4242',
};

// ---------------------------------------------------------------------------
// SDK Truslay 2.1.0
//
// `operatorType` NO forma parte del objeto de configuración: es el segundo
// argumento posicional del constructor (`config, operatorType`). Pasarlo dentro
// del objeto lo deja en 'universal' de forma silenciosa, así que va aparte.
// ---------------------------------------------------------------------------
const truslay = new TruslayUniversalClient(
  {
    mode: 'collaboration', // producto: añade firewall + identidad de workload
    firewallMode: 'sandbox', // transporte sin red: evalúa y audita, no bloquea por red
    shieldId: 'e-commerce',
    timeoutMs: 150,
  },
  'agent', // operador: activa scraping-guard y behavioral-guard
);

/** Veredictos de la sesión, para el resumen final. */
const verdictHistory = [];

// ---------------------------------------------------------------------------
// Consola superpuesta: se inyecta en cada documento antes de que exista el DOM
// y pinta los mensajes que Node le reenvía, de modo que la grabación los captura.
// ---------------------------------------------------------------------------
function consoleOverlayBootstrap() {
  const PANEL_ID = 'truslay-console';
  const MAX_LINES = 8;
  const COLORS = {
    info: '#e2e8f0',
    sdk: '#2dd4bf',
    allow: '#22c55e',
    block: '#ef4444',
    review: '#f59e0b',
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
      background: 'rgba(6, 9, 15, 0.94)',
      borderTop: '2px solid #2dd4bf',
      boxShadow: '0 -6px 18px rgba(0,0,0,0.45)',
      font: '12px/1.4 "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace',
      color: '#e2e8f0',
      pointerEvents: 'none', // nunca intercepta clics del agente
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
      color: '#2dd4bf',
    });
    header.innerHTML =
      '<span style="width:8px;height:8px;border-radius:50%;background:#22c55e;' +
      'box-shadow:0 0 8px #22c55e;display:inline-block"></span>' +
      '<span>Truslay SDK 2.1.0 · consola en vivo</span>' +
      '<span style="margin-left:auto;color:#94a3b8">' +
      'mode: collaboration · firewall: sandbox · operator: agent</span>';

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
        bottom: '190px', // justo encima del panel para no chocar con los toasts del sitio
        right: '14px',
        zIndex: '2147483100',
        padding: '8px 14px',
        borderRadius: '8px',
        background: 'rgba(6, 9, 15, 0.92)',
        border: `2px solid ${color}`,
        color,
        font: '600 14px "SFMono-Regular", Consolas, monospace',
        letterSpacing: '0.05em',
        pointerEvents: 'none',
        transition: 'opacity 200ms ease',
      });
      badge.textContent = `TRUSLAY · ${value} · ${intent}`;
      document.body.appendChild(badge);
      setTimeout(() => {
        badge.style.opacity = '0';
        setTimeout(() => badge.remove(), 250);
      }, 2200);
    },
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount, { once: true });
  } else {
    mount();
  }
}

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------

const waitForTimeout = (ms = 400) => new Promise((resolve) => setTimeout(resolve, ms));

/** Guarda una captura de pantalla dentro de la carpeta del proyecto. */
async function screenshot(page, fileName) {
  await page.screenshot({ path: path.join(OUTPUT_DIR, fileName) });
  console.log(`📸 Captura guardada: ${fileName}`);
}

/** Escribe una línea en la consola superpuesta (la que sale en el video). */
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

/**
 * Pide autorización al SDK y publica el veredicto en terminal + video.
 * Fail-closed: cualquier veredicto distinto de ALLOW detiene el flujo.
 */
async function authorize(page, action) {
  console.log(`🛡️  evaluateAction(${action.intent})…`);
  await uiLog(page, 'sdk', `▸ evaluateAction('${action.intent}')`);

  const verdict = await truslay.evaluateAction(action);
  verdictHistory.push({ intent: action.intent, ...verdict });

  const level = verdict.verdict === 'ALLOW' ? 'allow' : verdict.verdict === 'REVIEW' ? 'review' : 'block';
  const line = `${verdict.verdict} · ${verdict.reason ?? 'sin_razon'} · ${verdict.latencyMs ?? 0}ms`;
  console.log(`   ↳ ${line}`);
  await uiLog(page, level, `◀ ${line}`);
  await page
    .evaluate(
      (value, intent) =>
        window.__truslayConsole && window.__truslayConsole.verdict(value, intent),
      verdict.verdict,
      action.intent,
    )
    .catch(() => {});

  if (verdict.verdict !== 'ALLOW') {
    await uiLog(page, 'block', `✖ ABORTADO: ${action.intent} no fue autorizado`);
    await screenshot(page, `blocked-${action.intent}.png`).catch(() => {});
    throw new Error(
      `Truslay bloqueó "${action.intent}" (${verdict.reason ?? 'sin razón'}) — fail-closed`,
    );
  }

  return verdict;
}

/**
 * Localiza una tarjeta de producto por su TEXTO visible (nada de selectores
 * frágiles tipo nth-child) y devuelve el botón "Agregar al Carrito" de esa
 * tarjeta. Lanza un error claro si el producto no existe.
 */
async function findAddButtonByText(page, productName) {
  const cardHandle = await page.evaluateHandle((name) => {
    const cards = Array.from(document.querySelectorAll('.product-card'));
    const match = cards.find((card) => card.innerText.toLowerCase().includes(name.toLowerCase()));
    return match || null;
  }, productName);

  const card = cardHandle.asElement();
  if (!card) {
    throw new Error(
      `No se encontró el producto "${productName}" en el catálogo. ¿Está la página cargada?`,
    );
  }

  const addButton = await card.$('.add-to-cart-btn');
  if (!addButton) {
    throw new Error(`La tarjeta de "${productName}" no tiene botón .add-to-cart-btn.`);
  }

  return addButton;
}

/** Rellena un campo del checkout como lo haría una persona (clic + tecleo). */
async function fillField(page, fieldName, value) {
  const selector = `#checkout-form input[name="${fieldName}"]`;
  await page.waitForSelector(selector, { visible: true });
  await page.click(selector, { clickCount: 3 }); // selecciona el contenido previo
  await page.type(selector, value, { delay: 30 });
}

// ---------------------------------------------------------------------------
// Flujo principal
// ---------------------------------------------------------------------------
(async () => {
  let browser;
  let recorder;

  try {
    console.log(`🛡️  Truslay listo → mode=${truslay.mode}, operator=${truslay.operatorType}`);

    // 1) Navegador visible y ralentizado para poder seguir la automatización.
    console.log('🚀 Lanzando el navegador en modo visible…');
    browser = await puppeteer.launch({
      headless: false,
      slowMo: 80,
      defaultViewport: { width: 1280, height: 900 },
    });

    const page = await browser.newPage();
    page.setDefaultTimeout(20000);

    // La consola superpuesta se instala en cada documento antes de que se pinte.
    await page.evaluateOnNewDocument(consoleOverlayBootstrap);

    // Todo lo que la página escriba en consola se replica dentro del video.
    page.on('console', async (msg) => {
      let text = msg.text();
      // Los objetos del sitio llegan como "[object Object]": los serializamos
      // para que la consola del video muestre el contenido real.
      if (text.includes('[object Object]')) {
        try {
          const parts = await Promise.all(msg.args().map((arg) => arg.jsonValue()));
          const rendered = parts
            .map((value) => (value !== null && typeof value === 'object' ? JSON.stringify(value) : String(value)))
            .join(' ');
          if (rendered) text = rendered;
        } catch {
          /* si el valor ya no existe (página navegando), se usa el texto original */
        }
      }
      if (!text || text.length > 220) return;
      uiLog(page, 'page', `⌁ ${text}`);
    });
    page.on('pageerror', (error) => {
      console.log(`⚠️  Error en la página: ${error.message}`);
      uiLog(page, 'block', `✖ pageerror: ${error.message}`);
    });

    // La grabación arranca ANTES de navegar, para capturar la carga del sitio.
    recorder = new PuppeteerScreenRecorder(page, RECORDER_CONFIG);
    console.log(`🎥 Iniciando grabación → ${VIDEO_FILE}`);
    await recorder.start(VIDEO_FILE);

    // 2) Ir al sitio.
    console.log(`🌐 Navegando a ${SITE_URL} …`);
    await page.goto(SITE_URL, { waitUntil: 'networkidle2' });
    await waitForTimeout(800); // deja que se pinte el catálogo

    await uiLog(page, 'sdk', `SDK 2.1.0 listo · mode=${truslay.mode} · operator=${truslay.operatorType}`);
    await uiLog(page, 'info', 'Cada acción crítica se evalúa antes de ejecutarse.');

    const totalProducts = await page.$$eval('.product-card', (cards) => cards.length);
    console.log(`🛍️  Catálogo cargado con ${totalProducts} productos.`);
    await uiLog(page, 'info', `Catálogo cargado: ${totalProducts} productos.`);

    await screenshot(page, '01-home.png');
    await waitForTimeout(600);

    // 3) Leer el catálogo (acción de lectura: también pasa por el SDK).
    await authorize(page, {
      intent: 'read_catalog',
      target: SITE_URL,
      payload: { category: 'all', productsVisible: totalProducts },
    });
    await waitForTimeout(500);

    // 4) Buscar "Auriculares Pro X1" por texto y agregarlo al carrito.
    console.log(`🔎 Buscando el producto "${PRODUCT_NAME}"…`);
    const addButton = await findAddButtonByText(page, PRODUCT_NAME);
    await authorize(page, {
      intent: 'add_to_cart',
      target: SITE_URL,
      payload: { product: PRODUCT_NAME, quantity: 1 },
    });
    await uiLog(page, 'info', `Producto localizado: ${PRODUCT_NAME}`);
    await addButton.click();
    console.log('🛒 Producto agregado al carrito.');
    await waitForTimeout(900);

    await screenshot(page, '02-added-to-cart.png');
    await waitForTimeout(400);

    // 5) Abrir el carrito lateral.
    console.log('📂 Abriendo el carrito lateral…');
    await page.click('#cart-toggle');
    await page.waitForFunction(() =>
      document.getElementById('cart-drawer')?.classList.contains('open'),
    );
    await waitForTimeout(700);

    const cartSummary = await page.evaluate(() => ({
      items: Array.from(document.querySelectorAll('#cart-items .cart-item')).map((row) => {
        const name = row.querySelector('h4')?.textContent.trim() ?? '';
        const qty = row.querySelector('.quantity')?.textContent.trim() ?? '';
        return `${name} x${qty}`;
      }),
      total: document.getElementById('cart-total')?.textContent.trim() ?? '',
    }));
    console.log(`🧾 Carrito: ${cartSummary.items.join(', ')} — total ${cartSummary.total}`);
    await uiLog(page, 'info', `Carrito: ${cartSummary.items.join(', ')} · ${cartSummary.total}`);

    // 6) Abrir el modal de checkout (acción de UI: se autoriza igual).
    await authorize(page, {
      intent: 'open_checkout',
      target: `${SITE_URL}/checkout`,
      payload: { cartTotal: cartSummary.total, items: cartSummary.items },
    });
    console.log('💳 Abriendo el formulario de checkout…');
    await page.click('#checkout-btn');
    await page.waitForSelector('#checkout-form input[name="name"]', { visible: true });
    await waitForTimeout(700);

    await screenshot(page, '03-checkout-modal.png');
    await waitForTimeout(400);

    // 7) Rellenar el formulario con los datos del cliente de pruebas.
    await authorize(page, {
      intent: 'fill_checkout_form',
      target: `${SITE_URL}/checkout`,
      payload: { fields: ['name', 'email', 'address', 'card'], email: CUSTOMER.email },
    });
    console.log('⌨️  Rellenando el formulario…');
    await fillField(page, 'name', CUSTOMER.name);
    await fillField(page, 'email', CUSTOMER.email);
    await fillField(page, 'address', CUSTOMER.address);
    await fillField(page, 'card', CUSTOMER.card);
    await waitForTimeout(600);

    await screenshot(page, '04-form-filled.png');
    await waitForTimeout(400);

    // 8) Enviar el pedido: la acción de mayor riesgo de todo el flujo.
    await authorize(page, {
      intent: 'submit_order',
      target: `${SITE_URL}/orders`,
      payload: { total: cartSummary.total, email: CUSTOMER.email, card: '**** **** **** 4242' },
    });
    console.log('✅ Enviando el pedido…');
    await page.click('#checkout-form button[type="submit"]');

    // El modal de confirmación aparece cuando la orden ya está creada.
    await page.waitForFunction(() => {
      const modal = document.getElementById('confirmation-modal');
      return Boolean(modal) && getComputedStyle(modal).display !== 'none';
    });
    await waitForTimeout(700);

    const order = await page.evaluate(() => ({
      id: document.getElementById('order-id')?.textContent.trim() ?? '',
      stored: JSON.parse(localStorage.getItem('techgadgets_orders') || '[]').map((o) => o.id),
    }));
    console.log(`🎉 Compra completada. Pedido: ${order.id}`);
    console.log(`💾 Órdenes en localStorage: ${order.stored.length} → ${order.stored.join(', ')}`);
    await uiLog(page, 'allow', `Compra completada · pedido ${order.id}`);

    // 9) Captura final: modal de confirmación con el número de pedido.
    await screenshot(page, '05-purchase-complete.png');

    // 10) Resumen de veredictos, visible también en el video.
    console.log('\n📊 Veredictos del SDK:');
    for (const item of verdictHistory) {
      const line = `${item.intent.padEnd(20)} ${item.verdict} · ${item.reason ?? '-'} · ${item.latencyMs ?? 0}ms`;
      console.log(`   ${line}`);
      await uiLog(page, 'sdk', line);
    }

    // 11) Dejar el navegador abierto 10 segundos para revisar el resultado.
    console.log('⏳ Navegador visible 10 segundos para revisar el resultado…');
    await waitForTimeout(10000);
  } catch (error) {
    // 12) Cualquier fallo se reporta con un mensaje legible y código de salida 1.
    console.error(`❌ Falló la automatización: ${error.message}`);
    console.error(error.stack);
    process.exitCode = 1;
  } finally {
    // 13) Detener la grabación antes de cerrar el navegador: `stop()` espera a que
    // ffmpeg termine de escribir el MP4.
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

    // El navegador se cierra siempre, incluso si algo falló a mitad de camino.
    if (browser) {
      await browser.close();
      console.log('🔒 Navegador cerrado.');
    }
  }
})();
