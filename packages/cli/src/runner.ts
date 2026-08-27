import {
  chromium,
  Browser,
  BrowserContext,
  Page,
} from 'playwright-core';

export interface PrototypeResult {
  title: string;
  headerText: string;
  executionTimeMs: number;
}

export async function runChromiumPrototype(
  targetUrl: string = 'https://example.com'
): Promise<PrototypeResult> {
  const startTime = Date.now();

  let browser: Browser | null = null;
  let context: BrowserContext | null = null;
  let page: Page | null = null;

  try {
    // 1. Lanzamiento de Chromium Headless
    browser = await chromium.launch({
      headless: true,
    });

    console.log('✅ Chromium Headless lanzado correctamente');

    // 2. Creación de contexto aislado
    context = await browser.newContext();
    page = await context.newPage();

    console.log('✅ BrowserContext y Page creados correctamente');

    // 3. Navegación básica
    await page.goto(targetUrl, {
      waitUntil: 'domcontentloaded',
    });

    console.log(`✅ Navegación completada: ${targetUrl}`);

    // 4. Resolución de selectores
    const title = await page.title();
    const headerText = await page.locator('h1').innerText();

    console.log('✅ Selector h1 resuelto correctamente');

    const executionTimeMs = Date.now() - startTime;

    return {
      title,
      headerText,
      executionTimeMs,
    };
  } catch (error) {
    console.error('❌ Error en el prototipo de Chromium:', error);
    throw error;
  } finally {
    // 5. Cierre controlado de recursos
    if (page) {
      await page.close().catch(() => {});
      console.log('✅ Page cerrada correctamente');
    }

    if (context) {
      await context.close().catch(() => {});
      console.log('✅ BrowserContext cerrado correctamente');
    }

    if (browser) {
      await browser.close().catch(() => {});
      console.log('✅ Chromium cerrado correctamente');
    }
  }
}

// Ejecución directa desde terminal
console.log('Iniciando prototipo técnico...');

runChromiumPrototype()
  .then((result) => {
    console.log('✅ Prototipo completado con éxito:');
    console.log(`   - Título: "${result.title}"`);
    console.log(`   - Texto H1: "${result.headerText}"`);
    console.log(`   - Tiempo: ${result.executionTimeMs}ms`);
    console.log('   - Estado: PASS');
  })
  .catch(() => {
    process.exit(1);
  });