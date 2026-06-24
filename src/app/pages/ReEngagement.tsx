import { useState } from 'react';
import { Link } from 'react-router';
import { Check, Copy, ArrowRight, Clock, MessageSquareOff, Star } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const PROMO_CODE = 'DATWEBNGAY';

function PromoBox() {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    void navigator.clipboard.writeText(PROMO_CODE).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 border-2 border-cyan-300 rounded-2xl p-5 text-center">
      <p className="text-sm font-semibold text-cyan-700 mb-1">Quà tặng dành riêng cho bạn</p>
      <p className="text-xs text-cyan-600 mb-3">Giảm 50.000đ cho đơn từ 500.000đ — hết hạn 30/09/2026</p>
      <div className="flex items-center justify-center gap-3">
        <span className="text-2xl font-black tracking-widest text-cyan-800 font-mono">{PROMO_CODE}</span>
        <button
          onClick={copy}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-semibold transition-all ${
            copied
              ? 'bg-green-500 text-white'
              : 'bg-cyan-600 text-white hover:bg-cyan-700'
          }`}
        >
          {copied ? <><Check className="w-3.5 h-3.5" /> Đã copy</> : <><Copy className="w-3.5 h-3.5" /> Copy mã</>}
        </button>
      </div>
      <p className="text-xs text-cyan-600 mt-3">Nhập mã khi điền form đặt xe — áp dụng tự động</p>
    </div>
  );
}

const STEPS = [
  {
    num: '1',
    title: 'Chọn xe phù hợp',
    desc: 'Xem ảnh thực tế, giá theo ngày, loại nhiên liệu và số chỗ ngồi. Lọc nhanh theo hãng hoặc kiểu xe.',
  },
  {
    num: '2',
    title: 'Điền thông tin 2 phút',
    desc: 'Chọn ngày nhận — trả xe, nhập tên và số điện thoại. Không cần tạo tài khoản nếu chưa muốn.',
  },
  {
    num: '3',
    title: 'Nhận xác nhận trong 30 phút',
    desc: 'Nhân viên Car Match liên hệ lại trong vòng 30 phút để xác nhận lịch và hướng dẫn đặt cọc.',
  },
];

const BENEFITS = [
  { icon: <MessageSquareOff className="w-4 h-4" />, text: 'Không cần nhắn tin chờ tư vấn' },
  { icon: <Clock className="w-4 h-4" />, text: 'Xác nhận trong 30 phút' },
  { icon: <Star className="w-4 h-4" />, text: 'Xem giá và xe ngay, không cần hỏi' },
];

export default function ReEngagement() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-b from-slate-900 to-slate-800 text-white px-4 pt-12 pb-10 text-center">
          <div className="max-w-lg mx-auto">
            <div className="inline-block bg-cyan-500/20 text-cyan-300 text-xs font-semibold px-3 py-1 rounded-full mb-4 border border-cyan-500/30">
              Dành riêng cho khách cũ của Car Match
            </div>
            <h1 className="text-2xl sm:text-3xl font-black leading-tight mb-3">
              Giờ đặt xe chỉ mất<br />
              <span className="text-cyan-400">3 phút — hoàn toàn online</span>
            </h1>
            <p className="text-slate-300 text-sm leading-relaxed mb-6">
              Không cần nhắn tin, không cần chờ nhân viên phản hồi. Bạn chọn xe, điền thông tin — Car Match xác nhận trong 30 phút.
            </p>

            {/* Benefit pills */}
            <div className="flex flex-wrap justify-center gap-2 mb-7">
              {BENEFITS.map((b) => (
                <span key={b.text} className="flex items-center gap-1.5 bg-white/10 text-white text-xs font-medium px-3 py-1.5 rounded-full">
                  {b.icon}
                  {b.text}
                </span>
              ))}
            </div>

            <Link
              to="/xe"
              className="inline-flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-white font-bold px-7 py-3.5 rounded-full text-base transition-colors"
            >
              Xem xe ngay <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        {/* Promo code */}
        <section className="max-w-lg mx-auto px-4 -mt-1 py-8">
          <PromoBox />
        </section>

        {/* How it works */}
        <section className="max-w-lg mx-auto px-4 pb-10">
          <h2 className="text-base font-bold text-slate-900 text-center mb-5">Đặt xe online — 3 bước đơn giản</h2>
          <div className="space-y-4">
            {STEPS.map((step) => (
              <div key={step.num} className="flex gap-4 items-start bg-slate-50 rounded-2xl p-4">
                <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-sm font-black flex-shrink-0 mt-0.5">
                  {step.num}
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-sm mb-0.5">{step.title}</p>
                  <p className="text-slate-500 text-xs leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Social proof */}
        <section className="bg-slate-50 py-8 px-4">
          <div className="max-w-lg mx-auto">
            <p className="text-center text-xs text-slate-400 font-medium uppercase tracking-wide mb-4">Khách hàng nói gì</p>
            <div className="space-y-3">
              {[
                { name: 'Chị Lan Anh', text: 'Đặt qua web nhanh hơn hẳn, điền xong là có xác nhận ngay, không cần hỏi han gì thêm.' },
                { name: 'Anh Minh Tuấn', text: 'Mình thích nhất là thấy ảnh và giá ngay, biết luôn hôm đó còn xe không, không phải chờ hỏi.' },
              ].map((r) => (
                <div key={r.name} className="bg-white rounded-xl p-4 border border-slate-100">
                  <div className="flex items-center gap-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 text-amber-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed mb-2">"{r.text}"</p>
                  <p className="text-xs font-semibold text-slate-400">{r.name}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-10 px-4 text-center">
          <div className="max-w-lg mx-auto">
            <p className="text-slate-500 text-sm mb-4">Dùng mã <strong className="text-slate-800 font-mono">{PROMO_CODE}</strong> để được giảm 50.000đ</p>
            <Link
              to="/xe"
              className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-700 text-white font-bold px-8 py-4 rounded-full text-base transition-colors"
            >
              Chọn xe và đặt ngay <ArrowRight className="w-4 h-4" />
            </Link>
            <p className="text-xs text-slate-400 mt-3">Còn thắc mắc?{' '}
              <a href="https://zalo.me/carmatch" className="text-cyan-600 underline">Nhắn Zalo Car Match</a>
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
