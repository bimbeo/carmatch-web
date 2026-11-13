import { useState } from 'react';
import { Link } from 'react-router';
import { ArrowRight, CalendarDays, Calculator, CheckCircle2, Clock3, Gauge, MapPin, MessageCircle, ShieldCheck } from 'lucide-react';
import { formatPrice, type Car } from '@/data/cars';
import { calculateRentalBillingDays, formatRentalBillingDays } from '@/lib/rentalDuration';
import { trackCtaClick, trackZaloClick } from '@/lib/analytics';
import type { LocalRentalArea } from '@/data/localRentalAreas';
import { cauGiayHubData } from '@/data/localHubsData';

const ZALO_BASE = 'https://zalo.me/0971163290';
const hours = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];

interface AreaProps {
  area: LocalRentalArea;
}

interface PlannerProps extends AreaProps {
  cars: Car[];
  source: string;
}

function getTomorrowIsoDate() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const year = tomorrow.getFullYear();
  const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
  const day = String(tomorrow.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function describeVehicleFit(car: Car) {
  const normalizedName = car.name.toLocaleLowerCase('vi-VN');
  if (/carnival|innova|xpander|limo/.test(normalizedName) || car.seats >= 7) {
    return { luggage: '3–5 vali', need: 'Gia đình đông, đi tỉnh' };
  }
  if (/vf\s*3/.test(normalizedName) || car.seats <= 4) {
    return { luggage: '1–2 vali nhỏ', need: 'Đi phố, nhóm nhỏ' };
  }
  if (/vf\s*6|creta|mazda/.test(normalizedName)) {
    return { luggage: '2–3 vali', need: 'Gia đình, đường dài' };
  }
  return { luggage: '2 vali', need: 'Đi phố, cuối tuần' };
}

export function LocalRentalQuickAnswer({ area }: AreaProps) {
  return (
    <section className="border-b border-slate-200 bg-white py-10 sm:py-14" aria-label="Thông tin thuê xe nhanh">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <nav aria-label="Đi tới nội dung" className="mb-7 flex gap-2 overflow-x-auto pb-1 text-xs font-semibold sm:flex-wrap sm:text-sm">
          <span className="mr-2 hidden self-center text-slate-500 sm:inline">Xem nhanh</span>
          {[
            ['#xe-goi-y', 'Xe và giá'],
            ['#so-sanh-xe', 'So sánh & tính chi phí'],
            ['#giao-nhan', 'Giao nhận'],
            ['#cau-hoi', 'Câu hỏi thường gặp'],
          ].map(([href, label]) => (
            <a key={href} href={href} className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-slate-700 transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700">
              {label}
            </a>
          ))}
        </nav>
        <div className="grid overflow-hidden rounded-[1.75rem] border border-slate-200 bg-[#f7f8fb] shadow-[0_16px_45px_rgba(15,23,42,0.06)] lg:grid-cols-[1.2fr_0.8fr]">
          <div className="p-6 sm:p-8 lg:p-10">
            <p className="text-xs font-extrabold uppercase tracking-[0.15em] text-brand-700">Thông tin nhanh tại khu vực</p>
            <h2 className="mt-3 max-w-2xl text-2xl font-black tracking-[-0.025em] text-slate-950 sm:text-3xl">
              Thuê và nhận xe tự lái tại {area.shortName} như thế nào?
            </h2>
            <p className="mt-4 max-w-3xl leading-7 text-slate-700">
              Tự nhận xe miễn phí tại {cauGiayHubData.pickupHub}, hoặc đăng ký giao xe tận nơi với phí từ {formatPrice(cauGiayHubData.deliveryFeePerWay)}/lượt. Chuẩn bị {cauGiayHubData.requiredDocuments}; gửi lịch qua Zalo để đội vận hành đối chiếu mẫu xe và tổng chi phí.
            </p>
          </div>
          <div className="bg-[#10163f] p-6 text-white sm:p-8 lg:p-10">
            <p className="text-sm font-bold text-blue-200">Chuẩn bị 3 thông tin</p>
            <div className="mt-5 space-y-4 text-sm text-slate-200">
              {['Ngày, giờ nhận và trả xe', 'Địa chỉ hoặc tòa nhà, cổng hẹn', 'Số người, hành lý và tuyến di chuyển'].map((text) => (
                <p key={text} className="flex items-start gap-3"><CheckCircle2 className="mt-0.5 h-5 w-5 flex-none text-blue-300" />{text}</p>
              ))}
            </div>
            <a href="#so-sanh-xe" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 font-bold text-brand-900 transition hover:bg-blue-50">
              Chọn xe & tính thử tiền <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {[
            [Gauge, 'Đội xe & giá', 'Xe 4–7 chỗ, giá lấy trực tiếp từ danh mục'],
            [ShieldCheck, 'Thủ tục', 'CCCD gắn chip + GPLX hạng B bản gốc'],
            [Clock3, 'Giờ phục vụ', cauGiayHubData.serviceHours],
          ].map(([Icon, label, note]) => {
            const FactIcon = Icon as typeof Gauge;
            return (
              <div key={label as string} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4">
                <span className="rounded-xl bg-brand-50 p-2 text-brand-700"><FactIcon className="h-5 w-5" /></span>
                <div><p className="font-bold text-slate-900">{label as string}</p><p className="mt-0.5 text-sm text-slate-500">{note as string}</p></div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function LocalRentalPlanner({ area, cars, source }: PlannerProps) {
  const [carId, setCarId] = useState('');
  const [defaultRentalDate] = useState(getTomorrowIsoDate);
  const [fromDate, setFromDate] = useState(defaultRentalDate);
  const [toDate, setToDate] = useState(defaultRentalDate);
  const [fromHour, setFromHour] = useState(8);
  const [toHour, setToHour] = useState(20);
  const [pickupLocation, setPickupLocation] = useState('');
  const [partySize, setPartySize] = useState('');
  const [destination, setDestination] = useState('');

  const car = cars.find((item) => item.id === carId) || cars[0];
  const dateRangeReady = Boolean(fromDate && toDate);
  const days = dateRangeReady
    ? calculateRentalBillingDays(fromDate, fromHour, toDate, toHour)
    : 0;
  const validPeriod = dateRangeReady && days > 0;
  const isDefaultPeriod = fromDate === defaultRentalDate && toDate === defaultRentalDate && fromHour === 8 && toHour === 20;
  const baseCost = validPeriod && car?.price ? Math.round(days * car.price) : null;
  const canRequest = Boolean(car && validPeriod && pickupLocation.trim());
  const description = [
    'Xin chào Car Match, tôi muốn thuê xe tại ' + area.name + '.',
    'Xe quan tâm: ' + (car?.name || 'Nhờ tư vấn mẫu phù hợp') + '.',
    dateRangeReady ? 'Nhận: ' + fromDate + ' lúc ' + fromHour + ':00; trả: ' + toDate + ' lúc ' + toHour + ':00.' : '',
    'Địa chỉ nhận: ' + pickupLocation.trim() + '.',
    partySize ? 'Số người: ' + partySize + '.' : '',
    destination.trim() ? 'Hành trình: ' + destination.trim() + '.' : '',
    baseCost !== null ? 'Giá thuê cơ bản ước tính: ' + formatPrice(baseCost) + ' (chưa gồm cọc, giao nhận và phụ phí).' : '',
    'Nhờ kiểm tra lịch xe, phí giao nhận, số km, tiền cọc và tổng chi phí trước khi đặt.',
  ].filter(Boolean).join('\n');
  const zaloHref = ZALO_BASE + '?text=' + encodeURIComponent(description);

  return (
    <section id="so-sanh-xe" className="scroll-mt-24 bg-[#f4f5f9] py-16 sm:py-24" aria-label="So sánh xe và ước tính chi phí">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-brand-700">Công cụ ra quyết định</p>
          <h2 className="mt-3 text-3xl font-black tracking-[-0.035em] sm:text-5xl">So sánh xe. Tính chi phí. Gửi một lần.</h2>
          <p className="mt-3 leading-7 text-slate-600">
            Đối chiếu số người, hành lý, định mức km và nhu cầu sử dụng để chọn mẫu phù hợp. Đơn giá được lấy trực tiếp từ danh mục Car Match và công cụ bên dưới giúp bạn dự tính nhanh chi phí thuê cơ bản.
          </p>
        </div>
        {cars.length > 0 && (
          <div className="mt-8 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-[0_12px_35px_rgba(15,23,42,0.06)]">
            <table className="w-full min-w-[820px] text-left text-sm">
              <caption className="sr-only">So sánh xe, số ghế, hành lý, nhu cầu sử dụng, giới hạn km và giá tham khảo</caption>
              <thead className="bg-[#10163f] text-white">
                <tr>
                  {['Mẫu xe', 'Chỗ ngồi', 'Hành lý', 'Phù hợp', 'Km/ngày', 'Giá ngày từ'].map((head) => (
                    <th key={head} scope="col" className="border-b border-white/10 px-5 py-4 text-xs font-bold uppercase tracking-[0.08em]">{head}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cars.map((item) => {
                  const fit = describeVehicleFit(item);
                  return <tr key={item.id} className="border-b border-slate-100 transition-colors last:border-0 hover:bg-brand-50/50">
                    <td className="px-5 py-4 font-bold text-brand-700">
                      <Link to={'/xe/' + item.slug} className="hover:underline">{item.name}</Link>
                    </td>
                    <td className="px-5 py-4">{item.seats} chỗ</td>
                    <td className="px-5 py-4">{fit.luggage}</td>
                    <td className="px-5 py-4">{fit.need}</td>
                    <td className="px-5 py-4">{item.kmPerDay > 0 ? item.kmPerDay + ' km' : 'Xác nhận theo xe'}</td>
                    <td className="px-5 py-4 font-bold text-slate-950">{formatPrice(item.price)}</td>
                  </tr>;
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className="mt-8 grid gap-6 lg:grid-cols-[1.12fr_0.88fr]">
          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_18px_55px_rgba(15,23,42,0.07)] sm:p-8">
            <div className="flex items-center gap-3">
              <span className="rounded-xl bg-brand-50 p-2.5 text-brand-700"><Calculator className="h-6 w-6" /></span>
              <div><p className="text-xs font-bold uppercase tracking-[0.12em] text-brand-700">Ước tính theo lịch</p><h3 className="mt-0.5 text-2xl font-black">Tính thử tiền thuê cơ bản</h3></div>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Dùng đúng quy tắc ngày tính tiền trên website. Báo giá cuối cùng sẽ được xác nhận sau khi kiểm tra lịch, địa chỉ và điều kiện từng xe.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="mb-2 block text-sm font-semibold">Chọn xe quan tâm</span>
                <select value={car?.id || ''} onChange={(event) => setCarId(event.target.value)} className="min-h-12 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 text-slate-800 outline-none transition focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-100">
                  {cars.length === 0 && <option value="">Chưa có xe để ước tính</option>}
                  {cars.map((item) => <option key={item.id} value={item.id}>{item.name} — {formatPrice(item.price)}/ngày</option>)}
                </select>
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold">Ngày nhận</span>
                <input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} className="min-h-12 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 outline-none transition focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-100" />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold">Giờ nhận</span>
                <select value={fromHour} onChange={(event) => setFromHour(Number(event.target.value))} className="min-h-12 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 outline-none transition focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-100">
                  {hours.map((hour) => <option key={hour} value={hour}>{hour}:00</option>)}
                </select>
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold">Ngày trả</span>
                <input type="date" min={fromDate || undefined} value={toDate} onChange={(event) => setToDate(event.target.value)} className="min-h-12 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 outline-none transition focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-100" />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold">Giờ trả</span>
                <select value={toHour} onChange={(event) => setToHour(Number(event.target.value))} className="min-h-12 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 outline-none transition focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-100">
                  {hours.map((hour) => <option key={hour} value={hour}>{hour}:00</option>)}
                </select>
              </label>
              <label className="block sm:col-span-2">
                <span className="mb-2 block text-sm font-semibold">Địa chỉ nhận xe tại {area.shortName}</span>
                <input type="text" value={pickupLocation} onChange={(event) => setPickupLocation(event.target.value)} placeholder="Tòa nhà, phố, cổng hoặc địa điểm hẹn" className="min-h-12 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 outline-none transition focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-100" />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold">Số người (không bắt buộc)</span>
                <input inputMode="numeric" type="number" min={1} max={15} value={partySize} onChange={(event) => setPartySize(event.target.value)} placeholder="Ví dụ: 4" className="min-h-12 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 outline-none transition focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-100" />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold">Đi đâu (không bắt buộc)</span>
                <input type="text" value={destination} onChange={(event) => setDestination(event.target.value)} placeholder="Ví dụ: Nội Bài, Ninh Bình..." className="min-h-12 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 outline-none transition focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-100" />
              </label>
            </div>
            {dateRangeReady && !validPeriod && <p role="alert" className="mt-3 text-sm font-semibold text-red-700">Ngày/giờ nhận và trả chưa hợp lệ. Thời gian thuê phải tối thiểu 4 giờ.</p>}
            <a
              href={canRequest ? zaloHref : '#so-sanh-xe'}
              aria-disabled={!canRequest}
              target={canRequest ? '_blank' : undefined}
              rel={canRequest ? 'noopener noreferrer' : undefined}
              onClick={(event) => {
                if (!canRequest) { event.preventDefault(); return; }
                trackZaloClick(source + '_estimate', { car_slug: car?.slug, rental_days: days });
              }}
              className={'mt-6 inline-flex min-h-13 w-full items-center justify-center gap-2 rounded-xl px-4 py-3 font-bold transition ' + (canRequest ? 'bg-brand-600 text-white shadow-[0_10px_25px_rgba(30,64,175,0.2)] hover:bg-brand-700' : 'cursor-not-allowed bg-slate-200 text-slate-500')}
            >
              <MessageCircle className="h-5 w-5" /> Gửi thông tin để kiểm tra lịch xe
            </a>
            {!canRequest && <p className="mt-2 text-xs text-slate-500">Chọn mẫu xe, ngày giờ hợp lệ và nhập địa chỉ nhận để gửi yêu cầu.</p>}
          </div>
          <aside className="h-fit rounded-[1.75rem] border border-slate-800 bg-[#10163f] p-6 text-white shadow-[0_22px_60px_rgba(15,23,42,0.18)] sm:p-8">
            <div className="flex items-center gap-2 text-blue-200"><CalendarDays className="h-5 w-5" /><span className="text-sm font-bold">Ước tính minh bạch</span></div>
            <h3 className="mt-4 text-2xl font-black text-white">Chi phí dự kiến</h3>
            <div className="mt-6 space-y-4">
              <div className="flex items-start justify-between gap-5 border-b border-white/10 pb-4">
                <span className="text-slate-300">Đơn giá</span>
                <strong>{car ? formatPrice(car.price) + '/ngày' : 'Đang cập nhật'}</strong>
              </div>
              <div className="flex items-start justify-between gap-5 border-b border-white/10 pb-4">
                <span className="text-slate-300">Thời lượng tính tiền</span>
                <strong>{validPeriod ? (isDefaultPeriod ? '1 ngày (Mặc định)' : formatRentalBillingDays(days)) : 'Chưa chọn ngày'}</strong>
              </div>
              <div className="flex items-start justify-between gap-5 border-b border-white/10 pb-4">
                <span className="text-slate-300">Thuê xe cơ bản</span>
                <strong className="text-xl text-blue-200">{baseCost !== null ? formatPrice(baseCost) : 'Chưa tính'}</strong>
              </div>
            </div>
            <p className="mt-5 text-sm leading-6 text-slate-300">
              <strong>Chưa bao gồm:</strong> tiền cọc, giao nhận (nếu có), phí vượt km, cao tốc, bãi đỗ, nhiên liệu hoặc sạc. Tiền cọc không phải phí thuê.
            </p>
            <div className="mt-6 rounded-2xl border border-white/10 bg-white/10 p-4 text-sm text-slate-200">
              <ShieldCheck className="mb-2 h-5 w-5 text-blue-200" />
              Lịch xe và tổng tiền chỉ được xác nhận khi Car Match kiểm tra yêu cầu cụ thể.
            </div>
            <Link to="/chinh-sach" onClick={() => trackCtaClick(source + '_policy', { target_path: '/chinh-sach' })} className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-blue-200 hover:text-white hover:underline">
              Đọc điều kiện thuê và phụ phí <ArrowRight className="h-4 w-4" />
            </Link>
          </aside>
        </div>
        <p className="mt-5 flex items-start gap-2 text-xs leading-5 text-slate-500">
          <MapPin className="mt-0.5 h-4 w-4 flex-none" /> Đội vận hành Car Match tiếp nhận địa chỉ, đối chiếu lịch xe thực tế và phản hồi phương án giao nhận qua Zalo hoặc điện thoại.
        </p>
      </div>
    </section>
  );
}
