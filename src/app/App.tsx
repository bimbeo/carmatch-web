import { BrowserRouter, Routes, Route } from 'react-router';
import Home from './pages/Home';
import Fleet from './pages/Fleet';
import CarDetail from './pages/CarDetail';
import B2B from './pages/B2B';
import About from './pages/About';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/xe" element={<Fleet />} />
        <Route path="/xe/:slug" element={<CarDetail />} />
        <Route path="/thue-xe-thang" element={<B2B />} />
        <Route path="/gioi-thieu" element={<About />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:slug" element={<BlogPost />} />
      </Routes>
    </BrowserRouter>
  );
}
