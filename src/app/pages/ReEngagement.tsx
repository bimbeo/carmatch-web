import { useState } from 'react';
import { Link } from 'react-router';
import {
  ArrowRight,
  CalendarCheck2,
  CarFront,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Copy,
  Gift,
  Headphones,
  MessageCircle,
  MousePointerClick,
  ShieldCheck,
  Sparkles,
  TimerReset,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { cars, formatPrice } from '@/data/cars';
import { trackCtaClick, trackZaloClick } from '@/lib/analytics';
import { useSEO } from '@/hooks/useSEO';

const PROMO_CODE = 'DATWEBNGAY';
const ZALO_LINK = 'https://zalo.me/0975563290';
const CAMPAIGN_PARAMS = `utm_source=customer_reactivation&utm_medium=landing&utm_campaign=dat_web_ngay&promo=${PROMO_CODE}`;
const FLEET_URL = `/xe?${CAMPAIGN_PARAMS}`;
const HERO_IMAGE = cars.find((car) => car.slug === 'vinfast-vf6')?.images[0] ?? cars[0]?.images[0];

function buildFleetUrl(extraParams?: string) {
  return extraParams ? `/xe?${CAMPAIGN_PARAMS}&${extraParams}` : FLEET_URL;
}

function buildZaloHref(message: string) {
  return `${ZALO_LINK}?text=${encodeURIComponent(message)}`;
}

const HERO_STATS = [
  ['20+ mẫu xe', 'xem theo số chỗ, nhiên liệu và giá'],
  ['Từ 600.000đ/ngày', 'giá tham khảo theo từng xe'],
  ['30 phút', 'Car Match xác nhận khi có xe phù hợp'],
];

const BENEFITS = [
  {
    icon: MousePointerClick,
    title: 'Tự xem xe trước khi hỏi',
    text: 'Bạn xem ảnh, giá tham khảo, số chỗ, nhiên liệu và điều kiện thuê ngay trên web.',
  },
  {
    icon: CalendarCheck2,
    title: 'Gửi lịch thuê rõ ràng',
    text: 'Chọn ngày nhận, ngày trả và nhu cầu chuyến đi để đội Car Match kiểm tra xe phù hợp.',
  },
  {
    icon: TimerReset,
    title: 'Giảm thời gian chờ chat',
    text: 'Không phải nhắn nhiều vòng chỉ để hỏi còn xe nào. Web gom trước thông tin cần thiết.',
  },
  {
    icon: Headphones,
    title: 'Vẫn có người thật xác nhận',
    text: 'Sau khi bạn gửi yêu cầu, Car Match vẫn kiểm tra lịch, cọc, giao nhận và gọi lại nếu cần.',
  },
];

const BOOKING_STEPS = [
  {
    num: '01',
    title: 'Mở danh sách xe',
    text: 'Lọc theo xe điện, xe 5 chỗ, xe 7 chỗ hoặc giá thấp trước để chọn nhóm xe phù hợp.',
  },
  {
    num: '02',
    title: 'Chọn xe và lịch thuê',
    text: 'Điền ngày nhận, ngày trả, khu vực nhận xe và thông tin liên hệ của bạn.',
  },
  {
    num: '03',
    title: 'Nhập thông tin và mã ưu đãi',
    text: 'Form đặt xe tự điền mã từ link mời; bạn chỉ cần thêm họ tên, số điện thoại và ghi chú nếu có.',
  },
  {
    num: '04',
    title: 'Car Match xác nhận',
    text: 'Bạn nhận mã đặt xe, hướng dẫn cọc giữ xe và thông tin bàn giao sau khi đội vận hành kiểm tra lịch thật.',
  },
];

const TRIAL_FLOW = [
  ['1', 'Bấm xem xe', 'Mở danh sách xe có giá, số chỗ, nhiên liệu và ảnh.'],
  ['2', 'Chọn một mẫu xe', 'Vào chi tiết xe để xem lịch, tổng dự kiến và điều kiện thuê.'],
  ['3', 'Mở form đặt xe', 'Mã DATWEBNGAY được giữ trong link để bạn áp dụng nhanh.'],
  ['4', 'Gửi yêu cầu', 'Car Match nhận đủ thông tin để xác nhận mà không cần hỏi lại từ đầu.'],
];

const QUICK_FILTERS = [
  {
    label: 'Xe điện dễ đi phố',
    text: 'Phù hợp đi làm, cuối tuần gần Hà Nội, gia đình nhỏ.',
    href: buildFleetUrl(`fuelFilter=${encodeURIComponent('Điện')}`),
  },
  {
    label: 'Xe 7 chỗ đi gia đình',
    text: 'Phù hợp đi tỉnh, nhiều người hoặc nhiều hành lý.',
    href: buildFleetUrl('seatFilter=7'),
  },
  {
    label: 'Giá thấp trước',
    text: 'Bắt đầu từ các mẫu xe tiết kiệm chi phí.',
    href: buildFleetUrl('sort=price-asc'),
  },
];

const FEATURED_CARS = ['vinfast-vf5', 'vinfast-vf6', 'toyota-innova']
  .map((slug) => cars.find((car) => car.slug === slug))
  .filter(Boolean);

const TRIAL_CAR = FEATURED_CARS[0];
const TRIAL_BOOKING_URL = TRIAL_CAR ? `/xe/${TRIAL_CAR.slug}?${CAMPAIGN_PARAMS}#booking` : FLEET_URL;

const COMPARISON_ROWS = [
  ['Trước đây', 'Nhắn Zalo để hỏi xe, giá, ngày trống rồi chờ nhân viên tổng hợp lại.'],
  ['Bây giờ', 'Mở web, tự xem xe và gửi yêu cầu có đủ ngày thuê, khu vực nhận xe, số điện thoại.'],
  ['Vẫn giữ', 'Car Match vẫn xác nhận thủ công những phần quan trọng: xe thật còn lịch, cọc, phí giao nhận và giấy tờ.'],
];

function PromoBox() {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(PROMO_CODE);
      setCopied(true);
      trackCtaClick('reengagement_copy_promo', { promo_code: PROMO_CODE });
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section className="border-y border-brand-100 bg-white">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:px-8">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700">
            <Gift className="h-4 w-4" />
            Quà thử web dành cho khách cũ
          </div>
          <h2 className="mt-3 text-2xl font-black leading-tight text-brand-900 sm:text-3xl">
            Nhập mã khi đặt qua web để được giảm 50.000đ
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600">
            Áp dụng cho đơn từ 500.000đ, đến hết ngày 30/09/2026. Nếu cần nhân viên hỗ trợ sau khi gửi form, bạn chỉ cần nhắc lại mã này trong Zalo.
          </p>
        </div>

        <div className="rounded-lg border border-brand-100 bg-gradient-to-br from-brand-50 to-white p-4 shadow-sm sm:p-5">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-500">Mã ưu đãi</p>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex-1 rounded-lg border border-dashed border-brand-300 bg-white px-4 py-3 text-center font-mono text-2xl font-black tracking-[0.18em] text-brand-900">
              {PROMO_CODE}
            </div>
            <button
              type="button"
              onClick={copy}
              className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-bold transition-colors ${
                copied ? 'bg-emerald-600 text-white' : 'bg-brand-600 text-white hover:bg-brand-700'
              }`}
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Đã copy' : 'Copy mã'}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function FleetCta({ source, children, className }: { source: string; children: React.ReactNode; className: string }) {
  return (
    <Link
      to={FLEET_URL}
      onClick={() => trackCtaClick(source, { target: FLEET_URL, promo_code: PROMO_CODE })}
      className={className}
    >
      {children}
    </Link>
  );
}

export default function ReEngagement() {
  const zaloMessage = [
    'Xin chào Car Match, tôi là khách cũ và muốn thử đặt xe qua web.',
    `Mã ưu đãi: ${PROMO_CODE}`,
    'Nhờ Car Match hỗ trợ nếu tôi cần kiểm tra xe hoặc lịch thuê phù hợp.',
  ].join('\n');

  useSEO({
    title: 'Chào bạn quay lại đặt xe online',
    description: 'Khách cũ Car Match có thể tự xem xe, giá tham khảo và gửi yêu cầu thuê xe qua web. Nhập mã DATWEBNGAY để nhận ưu đãi thử web.',
    canonical: 'https://www.carmatch.vn/chao-ban',
  });

  return (
    <div className="min-h-screen bg-white text-gray-900" style={{ fontFamily: "'Be Vietnam Pro', 'Inter', sans-serif" }}>
      <Navbar />

      <main id="main-content">
        <section className="relative isolate overflow-hidden bg-brand-900 text-white">
          {HERO_IMAGE ? (
            <img
              src={HERO_IMAGE}
              alt="Xe tự lái Car Match trên trang đặt xe online"
              className="absolute inset-0 -z-20 h-full w-full object-cover opacity-45"
            />
          ) : null}
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(5,7,20,0.96),rgba(17,22,62,0.84),rgba(17,22,62,0.34))]" />

          <div className="mx-auto flex min-h-[680px] max-w-7xl flex-col justify-center px-4 pb-14 pt-28 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-white/90 backdrop-blur">
                <Sparkles className="h-4 w-4 text-amber-300" />
                Dành riêng cho khách đã từng thuê xe tại Car Match
              </div>

              <h1 className="mt-5 max-w-3xl text-4xl font-black leading-[1.04] tracking-normal sm:text-5xl lg:text-6xl">
                Lần tới cần xe, bạn có thể tự đặt qua web trước.
              </h1>

              <p className="mt-5 max-w-2xl text-base font-medium leading-8 text-white/78 sm:text-lg">
                Car Match đã đưa danh sách xe, giá tham khảo và form đặt xe lên website để bạn không phải nhắn nhiều vòng chỉ để hỏi xe nào còn phù hợp. Chọn xe, gửi lịch thuê, đội vận hành xác nhận lại trong khoảng 30 phút khi có xe phù hợp.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <FleetCta
                  source="reengagement_hero_primary"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-black text-brand-900 shadow-lg shadow-black/20 transition-colors hover:bg-brand-50"
                >
                  Xem xe và đặt thử
                  <ArrowRight className="h-4 w-4" />
                </FleetCta>
                <a
                  href={buildZaloHref(zaloMessage)}
                  target="_blank"
                  rel="me noopener noreferrer"
                  onClick={() => trackZaloClick('reengagement_hero_zalo', { promo_code: PROMO_CODE })}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/25 bg-white/10 px-6 py-3.5 text-sm font-black text-white backdrop-blur transition-colors hover:bg-white/15"
                >
                  <MessageCircle className="h-4 w-4" />
                  Cần hỗ trợ qua Zalo
                </a>
              </div>

              <div className="mt-10 grid gap-3 sm:grid-cols-3">
                {HERO_STATS.map(([value, label]) => (
                  <div key={value} className="rounded-lg border border-white/16 bg-white/10 p-4 backdrop-blur">
                    <p className="text-2xl font-black text-white">{value}</p>
                    <p className="mt-1 text-xs font-semibold leading-5 text-white/68">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <PromoBox />

        <section className="bg-white px-4 py-14 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-500">Thử luồng đặt xe</p>
              <h2 className="mt-3 text-3xl font-black leading-tight text-brand-900 sm:text-4xl">
                Khách cũ có thể tự đi thử từ xem xe đến gửi yêu cầu đặt.
              </h2>
              <p className="mt-4 text-base font-medium leading-7 text-gray-600">
                Đây là điểm cần khách cảm nhận ngay: thay vì nhắn “còn xe nào không em?”, họ tự xem được xe phù hợp, tự thử ngày thuê, thấy tổng tiền dự kiến và gửi form có đủ thông tin cho đội vận hành.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  to={TRIAL_BOOKING_URL}
                  onClick={() => trackCtaClick('reengagement_trial_booking', { target: TRIAL_BOOKING_URL, promo_code: PROMO_CODE })}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-600 px-6 py-3.5 text-sm font-black text-white transition-colors hover:bg-brand-700"
                >
                  Mở thử form đặt xe
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <FleetCta
                  source="reengagement_trial_fleet"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-6 py-3.5 text-sm font-black text-brand-900 transition-colors hover:bg-gray-50"
                >
                  Tự chọn xe khác
                  <CarFront className="h-4 w-4" />
                </FleetCta>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {TRIAL_FLOW.map(([step, title, text]) => (
                <article key={step} className="rounded-lg border border-gray-200 bg-[#f7f8fb] p-5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-sm font-black text-brand-800 shadow-sm">
                    {step}
                  </div>
                  <h3 className="mt-4 text-lg font-black text-brand-900">{title}</h3>
                  <p className="mt-2 text-sm font-medium leading-6 text-gray-600">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#f7f8fb] px-4 py-14 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-500">Vì sao nên chuyển sang đặt web</p>
              <h2 className="mt-3 text-3xl font-black leading-tight text-brand-900 sm:text-4xl">
                Web giúp bạn tự chuẩn bị trước, Car Match xử lý nhanh hơn phía sau.
              </h2>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {BENEFITS.map(({ icon: Icon, title, text }) => (
                <article key={title} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-lg font-black text-brand-900">{title}</h3>
                  <p className="mt-2 text-sm font-medium leading-6 text-gray-600">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-14 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-500">Cách đặt mới</p>
              <h2 className="mt-3 text-3xl font-black leading-tight text-brand-900 sm:text-4xl">
                Đặt xe online trong 4 bước, không cần tạo tài khoản ngay.
              </h2>
              <p className="mt-4 text-base font-medium leading-7 text-gray-600">
                Mục tiêu của web là giảm phần hỏi qua lại ban đầu. Những phần cần chắc chắn như xe còn lịch, phí giao nhận, đặt cọc và giấy tờ vẫn được Car Match xác nhận trước khi bạn nhận xe.
              </p>
            </div>

            <div className="grid gap-4">
              {BOOKING_STEPS.map((step) => (
                <article key={step.num} className="grid gap-4 rounded-lg border border-gray-200 bg-white p-5 shadow-sm sm:grid-cols-[76px_1fr]">
                  <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-brand-900 text-lg font-black text-white">
                    {step.num}
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-brand-900">{step.title}</h3>
                    <p className="mt-2 text-sm font-medium leading-6 text-gray-600">{step.text}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-gray-200 bg-brand-900 px-4 py-14 text-white sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-200">Chọn nhanh theo nhu cầu</p>
                <h2 className="mt-3 max-w-3xl text-3xl font-black leading-tight sm:text-4xl">
                  Nếu chưa biết chọn xe nào, bắt đầu bằng 3 lối đi quen thuộc này.
                </h2>
              </div>
              <FleetCta
                source="reengagement_quick_all"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-black text-brand-900 transition-colors hover:bg-brand-50"
              >
                Xem tất cả xe
                <ArrowRight className="h-4 w-4" />
              </FleetCta>
            </div>

            <div className="mt-8 grid gap-4 lg:grid-cols-3">
              {QUICK_FILTERS.map((item) => (
                <Link
                  key={item.label}
                  to={item.href}
                  onClick={() => trackCtaClick('reengagement_quick_filter', { label: item.label, target: item.href })}
                  className="group rounded-lg border border-white/12 bg-white/8 p-5 transition-colors hover:bg-white/12"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-black">{item.label}</h3>
                      <p className="mt-2 text-sm font-medium leading-6 text-white/68">{item.text}</p>
                    </div>
                    <ArrowRight className="h-5 w-5 shrink-0 text-brand-200 transition-transform group-hover:translate-x-1" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#f7f8fb] px-4 py-14 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-500">Một vài mẫu dễ bắt đầu</p>
              <h2 className="mt-3 text-3xl font-black leading-tight text-brand-900 sm:text-4xl">
                Khách cũ thường bắt đầu bằng xe quen, giá rõ và dễ giao nhận.
              </h2>
            </div>

            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {FEATURED_CARS.map((car) => car ? (
                <Link
                  key={car.slug}
                  to={`/xe/${car.slug}?${CAMPAIGN_PARAMS}`}
                  onClick={() => trackCtaClick('reengagement_featured_car', { vehicle_slug: car.slug, target: `/xe/${car.slug}` })}
                  className="group overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-transform hover:-translate-y-1"
                >
                  <div className="aspect-[16/10] overflow-hidden bg-gray-100">
                    <img
                      src={car.images[0]}
                      alt={`${car.name} cho thuê tự lái qua Car Match`}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-xl font-black text-brand-900">{car.name}</h3>
                        <p className="mt-1 text-sm font-semibold text-gray-500">{car.seats} chỗ - {car.fuel} - {car.transmission}</p>
                      </div>
                      <CarFront className="h-5 w-5 shrink-0 text-brand-500" />
                    </div>
                    <p className="mt-4 text-sm font-medium leading-6 text-gray-600">{car.description}</p>
                    <p className="mt-4 inline-flex rounded-full bg-brand-50 px-3 py-1.5 text-sm font-black text-brand-800">
                      Từ {formatPrice(car.price)}/ngày
                    </p>
                  </div>
                </Link>
              ) : null)}
            </div>
          </div>
        </section>

        <section className="px-4 py-14 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_1fr] lg:items-start">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-500">Từ nhắn tin sang tự đặt</p>
              <h2 className="mt-3 text-3xl font-black leading-tight text-brand-900 sm:text-4xl">
                Thay đổi nhỏ, nhưng tiết kiệm thời gian cho cả hai bên.
              </h2>
              <p className="mt-4 text-base font-medium leading-7 text-gray-600">
                Bạn vẫn có thể nhắn Zalo khi cần tư vấn kỹ. Nhưng nếu đã biết mình cần xe vào ngày nào, hãy gửi yêu cầu qua web trước để Car Match có đủ dữ liệu kiểm tra nhanh hơn.
              </p>
            </div>

            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
              {COMPARISON_ROWS.map(([label, text]) => (
                <div key={label} className="grid gap-3 border-b border-gray-100 p-5 last:border-b-0 sm:grid-cols-[120px_1fr]">
                  <p className="text-sm font-black text-brand-900">{label}</p>
                  <p className="text-sm font-medium leading-6 text-gray-600">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#f7f8fb] px-4 py-14 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-500">Thông tin cần chuẩn bị</p>
              <h2 className="mt-3 text-3xl font-black leading-tight text-brand-900 sm:text-4xl">
                Để đặt web nhanh, bạn chỉ cần 4 thông tin chính.
              </h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                ['Ngày nhận - trả xe', 'Ghi càng rõ giờ dự kiến càng dễ kiểm tra lịch.'],
                ['Khu vực nhận xe', 'Ví dụ: Times City, Ocean Park, Smart City, Ecopark.'],
                ['Nhu cầu chuyến đi', 'Đi phố, đi tỉnh, gia đình, nhiều hành lý hoặc thuê tháng.'],
                ['Số điện thoại/Zalo', 'Để Car Match xác nhận lịch xe và điều kiện thuê.'],
              ].map(([title, text]) => (
                <article key={title} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  <h3 className="mt-3 text-base font-black text-brand-900">{title}</h3>
                  <p className="mt-2 text-sm font-medium leading-6 text-gray-600">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-14 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl rounded-lg bg-brand-900 p-6 text-white shadow-xl shadow-brand-900/15 sm:p-8 lg:p-10">
            <div className="grid gap-8 lg:grid-cols-[1fr_0.85fr] lg:items-center">
              <div>
                <div className="flex flex-wrap gap-2">
                  {[
                    { icon: ShieldCheck, text: 'CCCD + GPLX hạng B' },
                    { icon: ClipboardCheck, text: 'Đặt cọc giữ xe' },
                    { icon: CarFront, text: 'Giao nhận theo lịch xác nhận' },
                  ].map(({ icon: Icon, text }) => (
                    <span key={text} className="inline-flex items-center gap-2 rounded-full border border-white/14 bg-white/8 px-3 py-1.5 text-xs font-bold text-white/86">
                      <Icon className="h-4 w-4 text-brand-200" />
                      {text}
                    </span>
                  ))}
                </div>
                <h2 className="mt-5 text-3xl font-black leading-tight sm:text-4xl">
                  Sẵn sàng thử đặt xe bằng web cho chuyến tiếp theo?
                </h2>
                <p className="mt-4 max-w-2xl text-sm font-medium leading-7 text-white/70">
                  Bấm xem xe, chọn mẫu phù hợp và gửi yêu cầu. Nếu chưa chắc nên chọn xe nào, gửi tin nhắn Zalo kèm mã {PROMO_CODE}, Car Match sẽ hỗ trợ tiếp.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                <FleetCta
                  source="reengagement_final_primary"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-black text-brand-900 transition-colors hover:bg-brand-50"
                >
                  Chọn xe và đặt ngay
                  <ArrowRight className="h-4 w-4" />
                </FleetCta>
                <a
                  href={buildZaloHref(zaloMessage)}
                  target="_blank"
                  rel="me noopener noreferrer"
                  onClick={() => trackZaloClick('reengagement_final_zalo', { promo_code: PROMO_CODE })}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/8 px-6 py-3.5 text-sm font-black text-white transition-colors hover:bg-white/12"
                >
                  <MessageCircle className="h-4 w-4" />
                  Nhắn Zalo nếu cần hỗ trợ
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
