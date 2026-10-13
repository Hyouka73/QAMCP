import { mkdtempSync, rmSync, writeFileSync, mkdirSync, openSync, closeSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SchemaValidator } from '@qap/shared';

import { scanProjectRoutes, normalizeRoutePath } from '../route-scanner.js';

describe('C3: scanProjectRoutes (Repo-map ligero de rutas)', () => {
  let tempDir: string;
  const validator = new SchemaValidator();

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'qap-routes-'));
  });

  afterEach(() => {
    try {
      rmSync(tempDir, { recursive: true, force: true });
    } catch { /* empty */ }
  });

  it('normaliza rutas y parámetros correctamente', () => {
    expect(normalizeRoutePath('catalog')).toBe('/catalog');
    expect(normalizeRoutePath('/users/[id]')).toBe('/users/:id');
    expect(normalizeRoutePath('/posts/[...slug]')).toBe('/posts/:slug*');
    expect(normalizeRoutePath('/api///v1/')).toBe('/api/v1');
    expect(normalizeRoutePath('')).toBe('/');
  });

  it('ausencia de front o proyecto vacío devuelve rutas vacías sin fallar', () => {
    const res = scanProjectRoutes(tempDir, []);
    expect(res._version).toBe('1.0.0');
    expect(res.rutas).toHaveLength(0);
    expect(res.advertencias).toHaveLength(0);

    const val = validator.validateProjectRepoMap(res);
    expect(val.valid).toBe(true);
  });

  it('extrae rutas de React Router con elementos <Route> y detecta AuthGuard', () => {
    const frontDir = join(tempDir, 'frontend');
    mkdirSync(join(frontDir, 'src'), { recursive: true });

    writeFileSync(
      join(frontDir, 'src', 'App.tsx'),
      `
import { Route, Routes } from 'react-router-dom';
export function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/catalog" element={<Catalog />} />
      <Route path="/product/:productId" element={<ProductDetail />} />
      <AuthGuard>
        <Route path="/account/profile" element={<Profile />} />
      </AuthGuard>
    </Routes>
  );
}
      `,
      'utf-8'
    );

    const res = scanProjectRoutes(tempDir, [
      { path: 'frontend', name: 'app-front', framework: 'react' },
    ]);

    expect(res.rutas.length).toBeGreaterThanOrEqual(4);

    const rootRoute = res.rutas.find((r) => r.path === '/');
    expect(rootRoute).toBeDefined();
    expect(rootRoute?.framework).toBe('react');
    expect(rootRoute?.requiere_sesion).toBeNull();
    expect(rootRoute?.roles).toEqual([]);

    const catalogRoute = res.rutas.find((r) => r.path === '/catalog');
    expect(catalogRoute).toBeDefined();
    expect(catalogRoute?.requiere_sesion).toBeNull();

    const productRoute = res.rutas.find((r) => r.path === '/product/:productId');
    expect(productRoute).toBeDefined();

    const guardedRoute = res.rutas.find((r) => r.path === '/account/profile');
    expect(guardedRoute).toBeDefined();
    expect(guardedRoute?.requiere_sesion).toBe(true);

    const val = validator.validateProjectRepoMap(res);
    expect(val.valid).toBe(true);
  });

  it('extrae rutas de React Router con createBrowserRouter (objetos con path)', () => {
    const frontDir = join(tempDir, 'frontend');
    mkdirSync(join(frontDir, 'src'), { recursive: true });

    writeFileSync(
      join(frontDir, 'src', 'router.ts'),
      `
import { createBrowserRouter } from 'react-router-dom';
export const router = createBrowserRouter([
  { path: '/cart', element: <Cart /> },
  { path: '/checkout', element: <Checkout /> },
]);
      `,
      'utf-8'
    );

    const res = scanProjectRoutes(tempDir, [
      { path: 'frontend', name: 'app-front', framework: 'react' },
    ]);

    expect(res.rutas.some((r) => r.path === '/cart')).toBe(true);
    expect(res.rutas.some((r) => r.path === '/checkout')).toBe(true);
    const val = validator.validateProjectRepoMap(res);
    expect(val.valid).toBe(true);
  });

  it('extrae rutas de Next.js App Router normalizando parámetros y route groups', () => {
    const nextDir = join(tempDir, 'my-next-app');
    mkdirSync(join(nextDir, 'app', '(auth)', 'login'), { recursive: true });
    mkdirSync(join(nextDir, 'app', 'dashboard'), { recursive: true });
    mkdirSync(join(nextDir, 'app', 'users', '[id]'), { recursive: true });

    writeFileSync(join(nextDir, 'app', 'page.tsx'), 'export default function Page() {}', 'utf-8');
    writeFileSync(join(nextDir, 'app', '(auth)', 'login', 'page.tsx'), 'export default function Login() {}', 'utf-8');
    writeFileSync(join(nextDir, 'app', 'dashboard', 'page.tsx'), 'export default function Dashboard() {}', 'utf-8');
    writeFileSync(join(nextDir, 'app', 'users', '[id]', 'page.tsx'), 'export default function User() {}', 'utf-8');

    const res = scanProjectRoutes(tempDir, [
      { path: 'my-next-app', name: 'my-next-app', framework: 'next' },
    ]);

    expect(res.rutas.some((r) => r.path === '/')).toBe(true);
    expect(res.rutas.some((r) => r.path === '/login')).toBe(true);
    expect(res.rutas.some((r) => r.path === '/dashboard')).toBe(true);
    expect(res.rutas.some((r) => r.path === '/users/:id')).toBe(true);

    const val = validator.validateProjectRepoMap(res);
    expect(val.valid).toBe(true);
  });

  it('extrae rutas de Next.js Pages Router ignorando archivos especiales', () => {
    const nextDir = join(tempDir, 'pages-app');
    mkdirSync(join(nextDir, 'pages', 'api'), { recursive: true });
    mkdirSync(join(nextDir, 'pages', 'orders'), { recursive: true });

    writeFileSync(join(nextDir, 'pages', '_app.tsx'), 'export default function App() {}', 'utf-8');
    writeFileSync(join(nextDir, 'pages', '_document.tsx'), 'export default function Doc() {}', 'utf-8');
    writeFileSync(join(nextDir, 'pages', 'api', 'health.ts'), 'export default function Health() {}', 'utf-8');
    writeFileSync(join(nextDir, 'pages', 'index.tsx'), 'export default function Home() {}', 'utf-8');
    writeFileSync(join(nextDir, 'pages', 'orders', '[orderId].tsx'), 'export default function Order() {}', 'utf-8');

    const res = scanProjectRoutes(tempDir, [
      { path: 'pages-app', name: 'pages-app', framework: 'next' },
    ]);

    expect(res.rutas.some((r) => r.path === '/')).toBe(true);
    expect(res.rutas.some((r) => r.path === '/orders/:orderId')).toBe(true);
    expect(res.rutas.some((r) => r.path.includes('_app'))).toBe(false);
    expect(res.rutas.some((r) => r.path.includes('health'))).toBe(false);

    const val = validator.validateProjectRepoMap(res);
    expect(val.valid).toBe(true);
  });

  it('extrae rutas de Vue Router', () => {
    const vueDir = join(tempDir, 'vue-front');
    mkdirSync(join(vueDir, 'src', 'router'), { recursive: true });

    writeFileSync(
      join(vueDir, 'src', 'router', 'index.ts'),
      `
export const routes = [
  { path: '/home', component: Home },
  { path: '/settings', component: Settings },
];
      `,
      'utf-8'
    );

    const res = scanProjectRoutes(tempDir, [
      { path: 'vue-front', name: 'vue-front', framework: 'vue' },
    ]);

    expect(res.rutas.some((r) => r.path === '/home')).toBe(true);
    expect(res.rutas.some((r) => r.path === '/settings')).toBe(true);

    const val = validator.validateProjectRepoMap(res);
    expect(val.valid).toBe(true);
  });

  it('ignora directorios excluidos (node_modules, dist, .next, .git) y archivos .env*', () => {
    mkdirSync(join(tempDir, 'node_modules', 'lib'), { recursive: true });
    mkdirSync(join(tempDir, 'dist'), { recursive: true });
    mkdirSync(join(tempDir, '.next', 'server'), { recursive: true });
    mkdirSync(join(tempDir, '.git'), { recursive: true });

    writeFileSync(join(tempDir, 'node_modules', 'lib', 'routes.js'), "const path = '/ignored';", 'utf-8');
    writeFileSync(join(tempDir, 'dist', 'index.js'), "const path = '/dist-ignored';", 'utf-8');
    writeFileSync(join(tempDir, '.env'), 'VITE_ROUTE=/secret-route', 'utf-8');
    writeFileSync(join(tempDir, '.env.local'), 'VITE_ROUTE=/secret-local', 'utf-8');

    const res = scanProjectRoutes(tempDir, []);
    expect(res.rutas.some((r) => r.path.includes('ignored'))).toBe(false);
    expect(res.rutas.some((r) => r.path.includes('secret'))).toBe(false);
  });

  it('omite archivos mayores a 200 KB', () => {
    const frontDir = join(tempDir, 'front');
    mkdirSync(join(frontDir, 'src'), { recursive: true });

    const hugeContent = `// Grande\n<Route path="/huge-route" />\n` + ' '.repeat(210 * 1024);
    writeFileSync(join(frontDir, 'src', 'huge.tsx'), hugeContent, 'utf-8');

    const res = scanProjectRoutes(tempDir, [
      { path: 'front', name: 'front', framework: 'react' },
    ]);

    expect(res.rutas.some((r) => r.path === '/huge-route')).toBe(false);
  });

  it('demuestra que archivos .env* con rutas parseables no aparecen en repo-map y que no hay rastro del contenido', () => {
    // D4: Señuelos parseables por el escáner (.tsx, .ts y directorio .env/ con routes.tsx)
    const envLocalTsx = join(tempDir, '.env.local.tsx');
    const envProdTs = join(tempDir, '.env.production.ts');
    const envDir = join(tempDir, '.env');
    mkdirSync(envDir, { recursive: true });

    const secretRoute1 = '/secret-from-env-local';
    const secretRoute2 = '/secret-from-env-prod';
    const secretRoute3 = '/secret-from-env-dir';
    const secretKey = 'DATABASE_SECRET_KEY_12345';

    writeFileSync(envLocalTsx, `// Secret\nexport const SecretLocal = () => <Route path="${secretRoute1}" />;\nconst KEY = '${secretKey}';`, 'utf-8');
    writeFileSync(envProdTs, `// Secret\nexport const routes = [{ path: '${secretRoute2}' }];`, 'utf-8');
    writeFileSync(join(envDir, 'routes.tsx'), `<Route path="${secretRoute3}" />`, 'utf-8');

    // Archivo normal para asegurar que la exploracion ocurra normalmente
    const appDir = join(tempDir, 'app');
    mkdirSync(appDir, { recursive: true });
    writeFileSync(join(appDir, 'valid.tsx'), '<Route path="/public-ok" />', 'utf-8');

    const res = scanProjectRoutes(tempDir, [
      { path: '.', name: 'root', framework: 'react' },
    ]);

    // Comprobar que la ruta pública sí se descubrió
    expect(res.rutas.some((r) => r.path === '/public-ok')).toBe(true);

    // Comprobar exhaustivamente que las rutas secretas NO existen en repo-map
    expect(res.rutas.some((r) => r.path === secretRoute1)).toBe(false);
    expect(res.rutas.some((r) => r.path === secretRoute2)).toBe(false);
    expect(res.rutas.some((r) => r.path === secretRoute3)).toBe(false);

    // Comprobar exhaustivamente que NINGÚN rastro del secreto ni de .env existe en el resultado
    const jsonOutput = JSON.stringify(res);
    expect(jsonOutput).not.toContain(secretRoute1);
    expect(jsonOutput).not.toContain(secretRoute2);
    expect(jsonOutput).not.toContain(secretRoute3);
    expect(jsonOutput).not.toContain(secretKey);
    expect(jsonOutput).not.toContain('.env');
  });

  it('D3: rutas contiguas en React Router no contagian guards a rutas hermanas', () => {
    const frontDir = join(tempDir, 'react-contiguous');
    mkdirSync(join(frontDir, 'src'), { recursive: true });

    writeFileSync(
      join(frontDir, 'src', 'App.tsx'),
      `
import { Route, Routes } from 'react-router-dom';
export function App() {
  return (
    <Routes>
      <Route path="/public-prev" element={<PublicPrev />} />
      <Route element={<AuthGuard />}>
        <Route path="/protected-area" element={<ProtectedArea />} />
      </Route>
      <Route path="/public-post" element={<PublicPost />} />
    </Routes>
  );
}
      `,
      'utf-8'
    );

    const res = scanProjectRoutes(tempDir, [
      { path: 'react-contiguous', name: 'react-contiguous', framework: 'react' },
    ]);

    const prev = res.rutas.find((r) => r.path === '/public-prev');
    const prot = res.rutas.find((r) => r.path === '/protected-area');
    const post = res.rutas.find((r) => r.path === '/public-post');

    expect(prev?.requiere_sesion).toBeNull();
    expect(prot?.requiere_sesion).toBe(true);
    expect(post?.requiere_sesion).toBeNull();
  });

  it('D3: rutas contiguas en Vue Router acotan guard al objeto sin afectar rutas vecinas', () => {
    const vueDir = join(tempDir, 'vue-contiguous');
    mkdirSync(join(vueDir, 'src'), { recursive: true });

    writeFileSync(
      join(vueDir, 'src', 'routes.ts'),
      `
export const routes = [
  { path: '/v-public-1', component: C1 },
  { path: '/v-protected', component: C2, meta: { requiresAuth: true } },
  { path: '/v-public-2', component: C3 }
];
      `,
      'utf-8'
    );

    const res = scanProjectRoutes(tempDir, [
      { path: 'vue-contiguous', name: 'vue-contiguous', framework: 'vue' },
    ]);

    const p1 = res.rutas.find((r) => r.path === '/v-public-1');
    const prot = res.rutas.find((r) => r.path === '/v-protected');
    const p2 = res.rutas.find((r) => r.path === '/v-public-2');

    expect(p1?.requiere_sesion).toBeNull();
    expect(prot?.requiere_sesion).toBe(true);
    expect(p2?.requiere_sesion).toBeNull();
  });

  it('D3: Next.js route groups como (auth) no fabrican guard; layouts ancestros con guard si', () => {
    const nextDir = join(tempDir, 'next-guard-app');
    mkdirSync(join(nextDir, 'app', '(auth)', 'login'), { recursive: true });
    mkdirSync(join(nextDir, 'app', '(protected)', 'dashboard'), { recursive: true });

    // (auth)/login sin guard en layout
    writeFileSync(join(nextDir, 'app', '(auth)', 'login', 'page.tsx'), 'export default function Login() {}', 'utf-8');

    // (protected)/dashboard con layout que contiene AuthGuard
    writeFileSync(
      join(nextDir, 'app', '(protected)', 'layout.tsx'),
      'export default function ProtectedLayout({ children }: any) { return <AuthGuard>{children}</AuthGuard>; }',
      'utf-8'
    );
    writeFileSync(join(nextDir, 'app', '(protected)', 'dashboard', 'page.tsx'), 'export default function Dashboard() {}', 'utf-8');

    const res = scanProjectRoutes(tempDir, [
      { path: 'next-guard-app', name: 'next-guard-app', framework: 'next' },
    ]);

    const login = res.rutas.find((r) => r.path === '/login');
    const dash = res.rutas.find((r) => r.path === '/dashboard');

    expect(login?.requiere_sesion).toBeNull();
    expect(dash?.requiere_sesion).toBe(true);
  });

  it('extrae rutas correctamente en subproyectos anidados', () => {
    const nestedDir = join(tempDir, 'packages', 'client', 'web');
    mkdirSync(join(nestedDir, 'src'), { recursive: true });
    writeFileSync(
      join(nestedDir, 'src', 'App.tsx'),
      '<Route path="/nested-subproject" element={<Dashboard />} />',
      'utf-8'
    );

    const res = scanProjectRoutes(tempDir, [
      { path: 'packages/client/web', name: 'nested-client', framework: 'react' },
    ]);

    expect(res.rutas.some((r) => r.path === '/nested-subproject')).toBe(true);
    const ruta = res.rutas.find((r) => r.path === '/nested-subproject');
    expect(ruta?.archivo).toBe('packages/client/web/src/App.tsx');
  });

  it('emite advertencia y se detiene cuando se excede el limite de 2000 archivos', () => {
    const bigDir = join(tempDir, 'many-files');
    mkdirSync(bigDir, { recursive: true });

    // Crear 2005 archivos vacíos rápidamente usando openSync/closeSync
    for (let i = 0; i < 2005; i++) {
      closeSync(openSync(join(bigDir, `f${i}.ts`), 'w'));
    }

    const res = scanProjectRoutes(tempDir, [
      { path: 'many-files', name: 'many-files', framework: 'react' },
    ]);

    expect(res.advertencias).toContain('limite_archivos_excedido');
  }, 15000);

  it('emite advertencia de tiempo_limite_excedido cuando Date.now excede los 3 segundos', () => {
    const appDir = join(tempDir, 'timed-app');
    mkdirSync(appDir, { recursive: true });
    writeFileSync(join(appDir, 'f1.tsx'), '<Route path="/t1" />', 'utf-8');
    writeFileSync(join(appDir, 'f2.tsx'), '<Route path="/t2" />', 'utf-8');

    let counter = 0;
    const dateSpy = vi.spyOn(Date, 'now').mockImplementation(() => {
      counter++;
      // Primeras llamadas retornan tiempo base, luego salta 4 segundos
      return counter > 2 ? 100000 + 4000 : 100000;
    });

    const res = scanProjectRoutes(tempDir, [
      { path: 'timed-app', name: 'timed-app', framework: 'react' },
    ]);

    expect(res.advertencias).toContain('tiempo_limite_excedido');
    dateSpy.mockRestore();
  });
});
