#!/usr/bin/env node
/**
 * agent.js — Agente autónomo de compra con Puppeteer (JavaScript vanilla).
 *
 * Recorre la tienda que corre en modo preview (http://localhost:4173):
 *   abre el sitio → añade "Auriculares Pro X1" → abre el carrito →
 *   abre el checkout → rellena el formulario → envía el pedido.
 * Guarda una captura en cada paso importante y deja el navegador visible
 * 10 segundos al final antes de cerrarse.
 *
 * Uso:  node agent.js
 */

'use strict';

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const { PuppeteerScreenRecorder } = require('puppeteer-screen-recorder');

// ---------------------------------------------------------------------------
// Configuración del escenario
// ---------------------------------------------------------------------------
const SITE_URL = 'http://localhost:4173';
const PRODUCT_NAME = 'Auriculares Pro X1';
const OUTPUT_DIR = __dirname; // capturas y video se guardan junto al script
const VIDEO_FILE = 'demo-agente-truslay.mp4';

//
// Configuración del grabador de video. Windows no trae ffmpeg en el PATH, así que
// apuntamos `ffmpeg_Path` al binario estático que aporta `@ffmpeg-installer/ffmpeg`.
//
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
// Utilidades
// ---------------------------------------------------------------------------

/**
 * Pausa la ejecución N milisegundos para que la automatización sea visible.
 * Ojo: `page.waitForTimeout()` fue eliminado en Puppeteer 22+, por eso usamos
 * este helper propio con la misma semántica.
 */
const waitForTimeout = (ms = 400) => new Promise((resolve) => setTimeout(resolve, ms));

/** Guarda una captura de pantalla dentro de la carpeta del proyecto. */
async function screenshot(page, fileName) {
  await page.screenshot({ path: path.join(OUTPUT_DIR, fileName) });
  console.log(`📸 Captura guardada: ${fileName}`);
}

/**
 * Localiza una tarjeta de producto por su TEXTO visible (nada de selectores
 * frágiles tipo nth-child) y devuelve el botón "Agregar al Carrito" de esa
 * tarjeta. Lanza un error claro si el producto no existe.
 */
async function findAddButtonByText(page, productName) {
  const cardHandle = await page.evaluateHandle((name) => {
    const cards = Array.from(document.querySelectorAll('.product-card'));
    const match = cards.find((card) =>
      card.innerText.toLowerCase().includes(name.toLowerCase()),
    );
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
    // 1) Navegador visible y ralentizado para poder seguir la automatización.
    console.log('🚀 Lanzando el navegador en modo visible…');
    browser = await puppeteer.launch({
      headless: false,
      slowMo: 80,
      defaultViewport: { width: 1280, height: 900 },
    });

    const page = await browser.newPage();
    page.setDefaultTimeout(20000);

    // Los errores de JavaScript de la propia página se muestran en consola.
    page.on('pageerror', (error) => console.log(`⚠️  Error en la página: ${error.message}`));

    // La grabación arranca ANTES de navegar, para capturar la carga del sitio.
    recorder = new PuppeteerScreenRecorder(page, RECORDER_CONFIG);
    console.log(`🎥 Iniciando grabación → ${VIDEO_FILE}`);
    await recorder.start(VIDEO_FILE);

    // 2) Ir al sitio.
    console.log(`🌐 Navegando a ${SITE_URL} …`);
    await page.goto(SITE_URL, { waitUntil: 'networkidle2' });
    await waitForTimeout(800); // deja que se pinte el catálogo

    const totalProducts = await page.$$eval('.product-card', (cards) => cards.length);
    console.log(`🛍️  Catálogo cargado con ${totalProducts} productos.`);

    await screenshot(page, '01-home.png');
    await waitForTimeout(600);

    // 3) Buscar "Auriculares Pro X1" por texto y 4) agregarlo al carrito.
    console.log(`🔎 Buscando el producto "${PRODUCT_NAME}"…`);
    const addButton = await findAddButtonByText(page, PRODUCT_NAME);
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

    // 6) Abrir el modal de checkout.
    console.log('💳 Abriendo el formulario de checkout…');
    await page.click('#checkout-btn');
    await page.waitForSelector('#checkout-form input[name="name"]', { visible: true });
    await waitForTimeout(700);

    await screenshot(page, '03-checkout-modal.png');
    await waitForTimeout(400);

    // 7) Rellenar el formulario con los datos del cliente de pruebas.
    console.log('⌨️  Rellenando el formulario…');
    await fillField(page, 'name', CUSTOMER.name);
    await fillField(page, 'email', CUSTOMER.email);
    await fillField(page, 'address', CUSTOMER.address);
    await fillField(page, 'card', CUSTOMER.card);
    await waitForTimeout(600);

    await screenshot(page, '04-form-filled.png');
    await waitForTimeout(400);

    // 8) Enviar el pedido.
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
    console.log(
      `💾 Órdenes en localStorage: ${order.stored.length} → ${order.stored.join(', ')}`,
    );

    // 9) Captura final: modal de confirmación con el número de pedido.
    await screenshot(page, '05-purchase-complete.png');

    // 10) Dejar el navegador abierto 10 segundos para revisar el resultado.
    console.log('⏳ Navegador visible 10 segundos para revisar el resultado…');
    await waitForTimeout(10000);
  } catch (error) {
    // 11) Cualquier fallo se reporta con un mensaje legible y código de salida 1.
    console.error(`❌ Falló la automatización: ${error.message}`);
    console.error(error.stack);
    process.exitCode = 1;
  } finally {
    // 11) Detener la grabación antes de cerrar el navegador: `stop()` espera a que
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
