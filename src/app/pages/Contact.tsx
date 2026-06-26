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
    icon: Phone,
    title: 'Hotline',
    detail: PHONE_DISPLAY,
    description: 'Dùng khi cần xác nhận xe gấp, đổi lịch nhận/trả hoặc xử lý việc phát sinh trong chuyến.',
    href: PHONE_LINK,
    label: 'Gọi Car Match',
  },
  {
    icon: Mail,
    title: 'Email',
    detail: EMAIL,
    description: 'Phù hợp với thuê xe tháng, hợp đồng doanh nghiệp, chủ xe muốn hợp tác hoặc yêu cầu cần ghi nhận bằng văn bản.',
    href: `mailto:${EMAIL}`,
    label: 'Gửi email',
  },
];

const quickInfo = [
  'Ngày nhận và ngày trả xe',
  'Khu vực nhận xe hoặc tòa nhà',
  'Số người, hành lý và điểm đến dự kiến',
  'Mẫu xe mong muốn hoặc ngân sách',
];

const serviceAreas = [
  'Vinhomes Ocean Park',
  'Times City',
  'Smart City',
  'Royal City',
  'The Manor Central Park',
  'Ecopark',
  'Linh Đàm',
  'Nội thành Hà Nội',
];

const contactNotes = [
  'Car Match kiểm tra lịch xe thật trước khi báo phương án.',
  'Giá thuê, cọc, km/ngày và phí giao nhận được xác nhận trước khi chốt.',
  'Khách có thể nhắn Zalo nếu chưa biết nên chọn xe nào.',
];

export default function Contact() {
  useSEO({
    title: 'Liên hệ thuê xe tự lái Hà Nội | Car Match',
    description:
      'Liên hệ Car Match qua Zalo 0975 563 290, hotline hoặc email để kiểm tra xe trống, giá thuê, giấy tờ và lịch giao xe tận sảnh tại Hà Nội.',
    canonical: 'https://www.carmatch.vn/lien-he',
  });

  return (
    <div className="min-h-screen bg-slate-50 pb-24 text-slate-950 sm:pb-0" style={{ fontFamily: "'Be Vietnam Pro', 'Inter', sans-serif" }}>
      <Navbar />
      <ZaloFAB />
      <MobileConversionBar source="contact" zaloLabel="Kiểm tra xe" />

      <main id="main-content" className="pt-20">
        <section className="border-b border-slate-200 bg-white px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_460px] lg:items-start">
            <div>
              <p className="mb-4 text-sm font-semibold uppercase text-brand-600">Liên hệ Car Match</p>
              <h1 className="max-w-4xl text-4xl font-semibold leading-tight text-slate-950 sm:text-5xl lg:text-6xl">
                Kiểm tra xe trống và lịch giao nhận tại Hà Nội
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                Gửi nhu cầu qua Zalo để Car Match kiểm tra xe còn lịch, báo giá, cọc và điều kiện thuê trước khi anh/chị chốt chuyến.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  href={ZALO_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackZaloClick('contact_hero')}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700"
                  data-cta="contact-hero-zalo"
                >
                  <MessageCircle className="h-5 w-5" />
                  Nhắn Zalo kiểm tra xe
                </a>
                <a
                  href={PHONE_LINK}
                  onClick={() => trackPhoneClick('contact_hero')}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3.5 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-50"
                  data-cta="contact-hero-phone"
                >
                  <Phone className="h-5 w-5" />
                  Gọi {PHONE_DISPLAY}
                </a>
              </div>
            </div>

            <aside className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
              <div className="flex items-start gap-4 rounded-xl bg-white p-5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-950">Gửi 4 thông tin để được báo nhanh</h2>
                  <p className="mt-2 text-sm leading-7 text-slate-600">Nếu chưa có đủ thông tin, chỉ cần gửi lịch và khu vực nhận xe trước.</p>
                </div>
              </div>
              <div className="mt-4 grid gap-3">
                {quickInfo.map((item, index) => (
                  <div key={item} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-950 text-xs font-semibold text-white">
                      {index + 1}
                    </span>
                    <span className="text-sm font-medium text-slate-700">{item}</span>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </section>

        <section className="px-4 py-14 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <article className="rounded-2xl bg-slate-950 p-6 text-white shadow-sm sm:p-8">
              <MessageCircle className="h-9 w-9 text-brand-200" />
              <h2 className="mt-7 text-3xl font-semibold">Zalo là kênh nhanh nhất</h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/70">
                Car Match thường xác nhận xe qua Zalo vì dễ gửi hình xe, lịch nhận/trả, vị trí giao nhận và các điều kiện cần lưu lại trước khi đặt cọc.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <a
                  href={ZALO_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackZaloClick('contact_primary_card')}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-slate-100"
                  data-cta="contact-primary-zalo"
                >
                  Nhắn Zalo {PHONE_DISPLAY}
                  <ArrowRight className="h-4 w-4" />
                </a>
                <a
                  href="/xe"
                  className="inline-flex items-center justify-center rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                >
                  Xem đội xe
                </a>
              </div>
            </article>

            <div className="grid gap-4">
              {contactMethods.map((method) => (
                <a
                  key={method.title}
                  href={method.href}
                  onClick={() => {
                    if (method.title.includes('Hotline')) trackPhoneClick('contact_method_card');
                    else trackCtaClick('contact_email_click', { target: method.href });
                  }}
                  className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                        <method.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-slate-950">{method.title}</h2>
                        <p className="mt-1 font-semibold text-slate-700">{method.detail}</p>
                      </div>
                    </div>
                    <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-1" />
                  </div>
                  <p className="mt-4 text-sm leading-7 text-slate-600">{method.description}</p>
                </a>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-slate-200 bg-white px-4 py-14 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[380px_1fr]">
            <div>
              <p className="mb-3 text-sm font-semibold uppercase text-brand-600">Giao nhận xe</p>
              <h2 className="text-3xl font-semibold text-slate-950 sm:text-4xl">Khu vực thường phục vụ</h2>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                Lịch giao nhận cụ thể phụ thuộc xe trống, thời điểm thuê và vị trí nhận xe trong ngày.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {serviceAreas.map((area) => (
                <div key={area} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <MapPin className="mb-3 h-4 w-4 text-brand-600" />
                  <p className="text-sm font-semibold leading-6 text-slate-700">{area}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-14 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1fr_1fr]">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <Clock className="h-7 w-7 text-brand-600" />
              <h2 className="mt-5 text-2xl font-semibold text-slate-950">Giờ hỗ trợ</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Tư vấn và kiểm tra lịch xe trong khung <strong>7h-22h mỗi ngày</strong>. Với việc gấp, gọi hotline sẽ nhanh hơn nhắn nhiều tin rời rạc.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <MapPin className="h-7 w-7 text-brand-600" />
              <h2 className="mt-5 text-2xl font-semibold text-slate-950">Địa điểm vận hành</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Car Match phục vụ tại Hà Nội, có điểm giao nhận quanh The Manor Central Park và các khu đô thị lớn theo lịch hẹn.
              </p>
              <a
                href={MAP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackCtaClick('contact_map_click', { target: MAP_LINK })}
                className="mt-5 inline-flex items-center gap-2 rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-50"
              >
                Xem bản đồ
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </section>

        <section className="px-4 pb-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl rounded-2xl border border-brand-100 bg-brand-50 p-6">
            <div className="grid gap-4 md:grid-cols-3">
              {contactNotes.map((note) => (
                <div key={note} className="flex gap-3">
                  <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-brand-600" />
                  <p className="text-sm leading-7 text-slate-700">{note}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
