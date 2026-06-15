import { ArrowRight, Clock, Mail, MapPin, MessageCircle, Phone, ShieldCheck } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ZaloFAB from '../components/ZaloFAB';
import MobileConversionBar from '../components/MobileConversionBar';
import { useSEO } from '@/hooks/useSEO';
import { trackCtaClick, trackPhoneClick, trackZaloClick } from '@/lib/analytics';

const ZALO_LINK = 'https://zalo.me/0975563290';
const PHONE_DISPLAY = '0975 563 290';
const PHONE_LINK = 'tel:0975563290';
const EMAIL = 'info@carmatch.vn';
const MAP_LINK = 'https://www.google.com/maps/search/?api=1&query=Car%20Match%20The%20Manor%20Central%20Park%2038%20Sunrise%20H%20Ha%20Noi';

const contactMethods = [
  {
    icon: MessageCircle,
    title: 'Zalo đặt xe',
    detail: PHONE_DISPLAY,
    description: 'Gửi ngày thuê, khu vực nhận xe, số người và mẫu xe mong muốn.',
    href: ZALO_LINK,
    label: 'Nhắn Zalo',
    primary: true,
  },
  {
    icon: Phone,
    title: 'Hotline',
    detail: PHONE_DISPLAY,
    description: 'Phù hợp khi cần xác nhận xe gấp hoặc thay đổi lịch nhận/trả.',
    href: PHONE_LINK,
    label: 'Gọi ngay',
  },
  {
    icon: Mail,
    title: 'Email',
    detail: EMAIL,
    description: 'Dành cho hợp đồng thuê tháng, doanh nghiệp hoặc hợp tác chủ xe.',
    href: `mailto:${EMAIL}`,
    label: 'Gửi email',
  },
];

const serviceAreas = [
  'Vinhomes Ocean Park, Gia Lâm',
  'Vinhomes Times City, Hai Bà Trưng',
  'Vinhomes Smart City, Nam Từ Liêm',
  'Vinhomes Royal City, Thanh Xuân',
  'The Manor Central Park, Hoàng Mai',
  'Ecopark và khu vực lân cận Hà Nội',
];

export default function Contact() {
  useSEO({
    title: 'Liên hệ thuê xe tự lái Hà Nội | Car Match',
    description: 'Liên hệ Car Match qua Zalo 0975 563 290, hotline hoặc email để kiểm tra xe trống, giá thuê, giấy tờ và lịch giao xe tận sảnh tại Hà Nội.',
    canonical: 'https://www.carmatch.vn/lien-he',
  });

  return (
    <div className="min-h-screen bg-slate-50 pb-24 text-slate-900 sm:pb-0" style={{ fontFamily: "'Be Vietnam Pro', 'Inter', sans-serif" }}>
      <Navbar />
      <ZaloFAB />
      <MobileConversionBar source="contact" zaloLabel="Kiểm tra xe" />

      <main id="main-content" className="pt-24">
        <section className="border-b border-slate-200 bg-white px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_420px] lg:items-center">
            <div>
              <p className="mb-3 text-sm font-bold uppercase tracking-wide text-brand-600">Liên hệ Car Match</p>
              <h1 className="max-w-3xl text-4xl font-black leading-tight text-slate-950 sm:text-5xl">
                Kiểm tra xe trống, giá thuê và điểm giao nhận tại Hà Nội
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                Cách nhanh nhất là nhắn Zalo cho Car Match với ngày thuê, khu vực nhận xe, số người và nhu cầu chuyến đi. Đội vận hành sẽ kiểm tra lịch xe thật trước khi báo giá và điều kiện thuê.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  href={ZALO_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackZaloClick('contact_hero')}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-600 px-6 py-3.5 text-sm font-black text-white shadow-md shadow-brand-100 transition-colors hover:bg-brand-700"
                  data-cta="contact-hero-zalo"
                >
                  <MessageCircle className="h-5 w-5" />
                  Nhắn Zalo kiểm tra xe
                </a>
                <a
                  href={PHONE_LINK}
                  onClick={() => trackPhoneClick('contact_hero')}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3.5 text-sm font-black text-slate-800 transition-colors hover:bg-slate-50"
                  data-cta="contact-hero-phone"
                >
                  <Phone className="h-5 w-5" />
                  Gọi {PHONE_DISPLAY}
                </a>
              </div>
            </div>

            <aside className="rounded-2xl border border-brand-100 bg-brand-50 p-6">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-6 w-6 shrink-0 text-brand-600" />
                <div>
                  <h2 className="text-lg font-black text-slate-950">Thông tin nên gửi trước</h2>
                  <p className="mt-2 text-sm leading-7 text-slate-600">
                    Ngày nhận/trả xe, khu vực nhận xe, số người, điểm đến dự kiến và nhóm xe mong muốn. Nếu chưa biết chọn xe nào, Car Match sẽ gợi ý theo hành lý, cung đường và ngân sách.
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </section>

        <section className="px-4 py-14 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-5 md:grid-cols-3">
            {contactMethods.map((method) => (
              <a
                key={method.title}
                href={method.href}
                target={method.href.startsWith('http') ? '_blank' : undefined}
                rel={method.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                onClick={() => {
                  if (method.title.includes('Zalo')) trackZaloClick('contact_method_card');
                  else if (method.title.includes('Hotline')) trackPhoneClick('contact_method_card');
                  else trackCtaClick('contact_email_click', { target: method.href });
                }}
                className={`rounded-2xl border p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${
                  method.primary
                    ? 'border-brand-200 bg-brand-600 text-white'
                    : 'border-slate-100 bg-white text-slate-900'
                }`}
                data-cta={method.primary ? 'contact-method-zalo' : undefined}
              >
                <method.icon className={`h-7 w-7 ${method.primary ? 'text-white' : 'text-brand-600'}`} />
                <h2 className="mt-5 text-lg font-black">{method.title}</h2>
                <p className={`mt-1 font-bold ${method.primary ? 'text-brand-50' : 'text-slate-700'}`}>{method.detail}</p>
                <p className={`mt-3 min-h-[72px] text-sm leading-7 ${method.primary ? 'text-white/80' : 'text-slate-500'}`}>
                  {method.description}
                </p>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-black">
                  {method.label}
                  <ArrowRight className="h-4 w-4" />
                </span>
              </a>
            ))}
          </div>
        </section>

        <section className="border-y border-slate-200 bg-white px-4 py-14 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="mb-2 text-sm font-bold uppercase tracking-wide text-brand-600">Giao nhận xe</p>
              <h2 className="text-3xl font-black text-slate-950">Khu vực Car Match thường phục vụ</h2>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                Car Match tập trung vào các khu đô thị, chung cư và điểm hẹn thuận tiện tại Hà Nội. Lịch giao nhận cụ thể phụ thuộc mẫu xe, thời điểm thuê và đội vận hành trong ngày.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {serviceAreas.map((area) => (
                <div key={area} className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm font-bold text-slate-700">
                  <MapPin className="mb-2 h-4 w-4 text-brand-600" />
                  {area}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-14 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1fr_1fr]">
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <Clock className="h-7 w-7 text-brand-600" />
              <h2 className="mt-5 text-2xl font-black text-slate-950">Giờ hỗ trợ</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Tư vấn và xác nhận lịch thuê: <strong>7h-22h mỗi ngày</strong>. Với chuyến gấp hoặc thay đổi lịch nhận/trả, anh/chị nên gọi hotline để đội vận hành xử lý nhanh hơn.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <MapPin className="h-7 w-7 text-brand-600" />
              <h2 className="mt-5 text-2xl font-black text-slate-950">Thông tin địa điểm</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Car Match vận hành tại Hà Nội, có điểm giao nhận quanh The Manor Central Park và các khu đô thị lớn theo lịch hẹn.
              </p>
              <a
                href={MAP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackCtaClick('contact_map_click', { target: MAP_LINK })}
                className="mt-5 inline-flex items-center gap-2 rounded-full border border-slate-200 px-5 py-2.5 text-sm font-black text-slate-800 hover:bg-slate-50"
              >
                Xem bản đồ
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
