import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router';

const Home = lazy(() => import('./pages/Home'));
const Fleet = lazy(() => import('./pages/Fleet'));
const CarDetail = lazy(() => import('./pages/CarDetail'));
const B2B = lazy(() => import('./pages/B2B'));
const About = lazy(() => import('./pages/About'));
const Blog = lazy(() => import('./pages/Blog'));
const BlogPost = lazy(() => import('./pages/BlogPost'));
const Partner = lazy(() => import('./pages/Partner'));

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" /></div>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/xe" element={<Fleet />} />
          <Route path="/xe/:slug" element={<CarDetail />} />
          <Route path="/thue-xe-thang" element={<B2B />} />
          <Route path="/gioi-thieu" element={<About />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="/hop-tac" element={<Partner />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
