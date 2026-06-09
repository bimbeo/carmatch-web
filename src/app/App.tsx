import { Component, lazy, Suspense, useEffect, useLayoutEffect, type ReactNode } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router';
import Home from './pages/Home';

const Fleet = lazy(() => import('./pages/Fleet'));
const CarDetail = lazy(() => import('./pages/CarDetail'));
const GoWhere = lazy(() => import('./pages/GoWhere'));
const GoWhereCollection = lazy(() => import('./pages/GoWhereCollection'));
const GoWhereDetail = lazy(() => import('./pages/GoWhereDetail'));
const TripFinder = lazy(() => import('./pages/TripFinder'));
const B2B = lazy(() => import('./pages/B2B'));
const About = lazy(() => import('./pages/About'));
const Blog = lazy(() => import('./pages/Blog'));
const BlogPost = lazy(() => import('./pages/BlogPost'));
const Partner = lazy(() => import('./pages/Partner'));
const BookingConfirm = lazy(() => import('./pages/BookingConfirm'));
const Policy = lazy(() => import('./pages/Policy'));
const FAQ = lazy(() => import('./pages/FAQ'));
const Admin = lazy(() => import('./pages/Admin'));

const chunkReloadKey = 'carmatch-chunk-reload-attempted';

function isRecoverableChunkError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return /Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed|Loading chunk/i.test(message);
}

async function clearStaleAppCache({ resetReloadAttempt = false } = {}) {
  if (resetReloadAttempt) sessionStorage.removeItem(chunkReloadKey);

  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.unregister()));
  }

  if ('caches' in window) {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
  }
}

function reloadFresh() {
  void clearStaleAppCache({ resetReloadAttempt: true }).finally(() => {
    const url = new URL(window.location.href);
    url.searchParams.set('_cm_refresh', Date.now().toString());
    window.location.replace(url.toString());
  });
}

class AppErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error) {
    if (!isRecoverableChunkError(error)) return;

    if (sessionStorage.getItem(chunkReloadKey)) return;

    sessionStorage.setItem(chunkReloadKey, '1');
    void clearStaleAppCache().finally(() => window.location.reload());
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-6 text-center">
        <div>
          <p className="text-gray-700 font-medium mb-4">Trang vừa được cập nhật. Tải lại để tiếp tục.</p>
          <button
            type="button"
            onClick={reloadFresh}
            className="px-5 py-2.5 rounded-full bg-brand-600 text-white font-semibold"
          >
            Tải lại trang
          </button>
        </div>
      </div>
    );
  }
}

function ScrollToTop() {
  const { pathname, search, hash } = useLocation();

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  useLayoutEffect(() => {
    if (hash) {
      requestAnimationFrame(() => {
        const target = document.getElementById(decodeURIComponent(hash.slice(1)));
        if (target) {
          target.scrollIntoView({ block: 'start' });
          return;
        }

        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      });
      return;
    }

    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [pathname, search, hash]);

  return null;
}

export default function App() {
  return (
    <AppErrorBoundary>
      <BrowserRouter>
        <ScrollToTop />
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" /></div>}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/xe" element={<Fleet />} />
            <Route path="/xe/:slug" element={<CarDetail />} />
            <Route path="/di-dau" element={<GoWhere />} />
            <Route path="/di-dau/chu-de/:slug" element={<GoWhereCollection />} />
            <Route path="/di-dau/:slug" element={<GoWhereDetail />} />
            <Route path="/lap-ke-hoach-chuyen-di" element={<TripFinder />} />
            <Route path="/lap-ke-hoach-chuyen-di/:slug" element={<TripFinder />} />
            <Route path="/thue-xe-thang" element={<B2B />} />
            <Route path="/gioi-thieu" element={<About />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/hop-tac" element={<Partner />} />
            <Route path="/dat-xe" element={<BookingConfirm />} />
            <Route path="/chinh-sach" element={<Policy />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AppErrorBoundary>
  );
}
