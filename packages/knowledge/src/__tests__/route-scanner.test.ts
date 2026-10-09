import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
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
});
