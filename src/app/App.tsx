import { BrowserRouter, Routes, Route } from 'react-router';
import Home from './pages/Home';
import CarDetail from './pages/CarDetail';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/xe/:slug" element={<CarDetail />} />
      </Routes>
    </BrowserRouter>
  );
}
