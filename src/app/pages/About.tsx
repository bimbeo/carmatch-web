import {
  ArrowRight,
  Car,
  CheckCircle2,
  Clock,
  FileText,
  Handshake,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Wrench,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ZaloFAB from '../components/ZaloFAB';
import MobileConversionBar from '../components/MobileConversionBar';
import { useSEO } from '@/hooks/useSEO';

const ZALO_LINK = 'https://zalo.me/0975563290';

const stats = [
  { value: '20+', label: 'Mẫu xe', detail: 'Xe 4-7 chỗ, xăng và điện' },
  { value: '7h-22h', label: 'Giờ hỗ trợ', detail: 'Kiểm tra lịch xe qua Zalo' },
  { value: 'CCCD + GPLX', label: 'Giấy tờ', detail: 'Xác nhận trước khi nhận xe' },
  { value: 'Hà Nội', label: 'Khu vực', detail: 'Ưu tiên chung cư, khu đô thị' },
];

const operatingSteps = [
  {
    icon: MessageCircle,
    title: 'Khách gửi nhu cầu',
    desc: 'Ngày thuê, khu vực nhận xe, số người và mẫu xe mong muốn.',
  },
  {
    icon: Car,
    title: 'Car Match kiểm tra xe',
    desc: 'Đối chiếu lịch xe thật, giá thuê, cọc và điểm giao nhận.',
  },
  {
    icon: ShieldCheck,
    title: 'Xác nhận điều kiện',
    desc: 'Giấy tờ, bảo hiểm, phí phát sinh và cách bàn giao được nói rõ trước cọc.',
  },
  {
    icon: MapPin,
    title: 'Giao nhận theo lịch',
    desc: 'Ưu tiên giao xe tận sảnh chung cư hoặc điểm hẹn thuận tiện tại Hà Nội.',
  },
];

const commitments = [
  {
    icon: ShieldCheck,
    title: 'Minh bạch trước khi đặt cọc',
    desc: 'Giá thuê, cọc, phí giao nhận, km/ngày và điều kiện hoàn/hủy được xác nhận trước khi khách chuyển cọc.',
  },
  {
    icon: CheckCircle2,
    title: 'Kiểm tra xe cùng khách',
    desc: 'Ngoại thất, nội thất, nhiên liệu/pin, đồng hồ km và phụ kiện được ghi nhận khi bàn giao để hạn chế tranh chấp.',
  },
  {
    icon: Clock,
    title: 'Phản hồi đúng ngữ cảnh',
    desc: 'Nếu chưa chắc nên chọn xe nào, Car Match gợi ý theo hành lý, cung đường, số người và thời gian thuê.',
  },
  {
    icon: Wrench,
    title: 'Có người hỗ trợ khi phát sinh',
    desc: 'Trong chuyến đi, khách nhắn Zalo hoặc gọi hotline để được hướng dẫn bước xử lý khi cần đổi giờ, sự cố hoặc phát sinh phí.',
  },
];

const processSteps = [
  { step: '01', title: 'Chọn xe hoặc gửi nhu cầu', desc: 'Khách xem đội xe trên website hoặc nhắn thẳng lịch trình để được gợi ý.' },
  { step: '02', title: 'Xác nhận lịch và giấy tờ', desc: 'Car Match kiểm tra xe trống, điều kiện thuê, CCCD, GPLX và khoản cọc.' },
  { step: '03', title: 'Nhận xe theo lịch hẹn', desc: 'Hai bên kiểm tra xe, chụp hiện trạng, ghi nhận km và nhiên liệu/pin.' },
  { step: '04', title: 'Trả xe và đối soát', desc: 'Xe được kiểm tra lại, chi phí phát sinh nếu có được đối chiếu theo điều kiện đã xác nhận.' },
];

const conditions = [
  'CCCD hoặc giấy tờ tùy thân bản gốc',
  'Giấy phép lái xe hạng B còn hiệu lực',
  'Khoản cọc theo mẫu xe và thời điểm thuê',
  'Điểm nhận/trả xe tại Hà Nội hoặc khu vực đã hẹn',
  'Thông tin liên hệ chính xác để xác nhận lịch',
  'Kiểm tra xe cùng Car Match trước khi khởi hành',
];

export default function About() {
  useSEO({
    title: 'Về Car Match — Thuê xe tự lái minh bạch tại Hà Nội',
    description:
      'Car Match là dịch vụ thuê xe tự lái tại Hà Nội, tập trung vào quy trình rõ ràng: kiểm tra xe trống qua Zalo, xác nhận điều kiện thuê và giao xe tận sảnh theo lịch hẹn.',
    canonical: 'https://www.carmatch.vn/gioi-thieu',
  });

  return (
    <div className="min-h-screen bg-slate-50 pb-24 text-slate-950 sm:pb-0" style={{ fontFamily: "'Be Vietnam Pro', 'Inter', sans-serif" }}>
      <Navbar />
      <ZaloFAB />
      <MobileConversionBar source="about" zaloLabel="Nhắn Zalo" />

      <main id="main-content" className="pt-20">
        <section className="border-b border-slate-200 bg-white px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_440px] lg:items-start">
            <div>
              <p className="mb-4 text-sm font-semibold uppercase text-brand-600">Về Car Match</p>
              <h1 className="max-w-4xl text-4xl font-semibold leading-tight text-slate-950 sm:text-5xl lg:text-6xl">
                Thuê xe tự lái Hà Nội rõ xe, rõ lịch, rõ điều kiện
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                Car Match tập trung vào trải nghiệm thuê xe thực tế: khách biết xe còn lịch hay không, nhận xe ở đâu,
                cần giấy tờ gì và chi phí nào cần xác nhận trước khi đặt cọc.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  href="/xe"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700"
                >
                  Xem đội xe
                  <ArrowRight className="h-4 w-4" />
                </a>
                <a
                  href={ZALO_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3.5 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-50"
                >
                  <MessageCircle className="h-4 w-4" />
                  Nhắn Zalo đặt xe
                </a>
              </div>
            </div>

            <aside className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
              <div className="rounded-xl bg-slate-950 p-5 text-white">
                <p className="text-sm font-semibold text-white/60">Mô hình vận hành</p>
                <h2 className="mt-2 text-2xl font-semibold">Car Match xác nhận xe trước khi khách chốt</h2>
              </div>
              <div className="mt-4 divide-y divide-slate-200">
                {operatingSteps.map((item) => (
                  <div key={item.title} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-brand-600 shadow-sm">
                      <item.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-950">{item.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-slate-600">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </section>

        <section className="border-b border-slate-200 bg-white px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                <div className="text-2xl font-semibold text-slate-950">{stat.value}</div>
                <div className="mt-1 text-sm font-semibold text-slate-700">{stat.label}</div>
                <div className="mt-2 text-sm leading-6 text-slate-500">{stat.detail}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl">
              <p className="mb-3 text-sm font-semibold uppercase text-brand-600">Điều Car Match ưu tiên</p>
              <h2 className="text-3xl font-semibold text-slate-950 sm:text-4xl">Giảm mơ hồ trong từng bước thuê xe</h2>
              <p className="mt-4 text-base leading-8 text-slate-600">
                Một chuyến thuê tốt không chỉ là có xe. Quan trọng hơn là điều kiện rõ, có người xác nhận, và khách biết cần làm gì trước, trong và sau chuyến đi.
              </p>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {commitments.map((item) => (
                <article key={item.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-950">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{item.desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="quy-trinh" className="border-y border-slate-200 bg-white px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[380px_1fr]">
            <div>
              <p className="mb-3 text-sm font-semibold uppercase text-brand-600">Quy trình thuê xe</p>
              <h2 className="text-3xl font-semibold text-slate-950 sm:text-4xl">Từ nhu cầu đến bàn giao xe</h2>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                Car Match giữ quy trình ngắn, nhưng các điểm dễ tranh chấp như cọc, km, phí phát sinh và hiện trạng xe đều được xác nhận trước.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {processSteps.map((step) => (
                <article key={step.step} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <div className="mb-5 inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-950 text-sm font-semibold text-white">
                    {step.step}
                  </div>
                  <h3 className="text-lg font-semibold text-slate-950">{step.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{step.desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="dieu-kien" className="px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_440px]">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-slate-950">Điều kiện thuê xe</h2>
                  <p className="mt-2 text-sm leading-7 text-slate-600">Các điều kiện chính được xác nhận trước khi giao xe.</p>
                </div>
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {conditions.map((cond) => (
                  <div key={cond} className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
                    <span className="text-sm leading-6 text-slate-700">{cond}</span>
                  </div>
                ))}
              </div>
            </div>

            <aside className="rounded-2xl bg-slate-950 p-6 text-white shadow-sm">
              <Handshake className="h-8 w-8 text-brand-200" />
              <h2 className="mt-6 text-2xl font-semibold">Dịch vụ phù hợp với khách muốn rõ ràng trước khi nhận xe</h2>
              <p className="mt-4 text-sm leading-7 text-white/70">
                Nếu cần xe cho cuối tuần, đi tỉnh, công tác ngắn ngày hoặc thuê theo tháng, Car Match sẽ kiểm tra xe phù hợp rồi xác nhận lại điều kiện qua Zalo.
              </p>
              <a
                href={ZALO_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-slate-100"
              >
                Nhắn Zalo kiểm tra xe
                <ArrowRight className="h-4 w-4" />
              </a>
            </aside>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
