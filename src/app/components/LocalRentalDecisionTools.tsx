import { useState } from 'react';
import { Link } from 'react-router';
import { ArrowRight, CalendarDays, Calculator, CheckCircle2, MapPin, MessageCircle, ShieldCheck } from 'lucide-react';
import { formatPrice, type Car } from '@/data/cars';
import { calculateRentalBillingDays, formatRentalBillingDays } from '@/lib/rentalDuration';
import { trackCtaClick, trackZaloClick } from '@/lib/analytics';
import type { LocalRentalArea } from '@/data/localRentalAreas';

const ZALO_BASE = 'https://zalo.me/0971163290';
const hours = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];

interface AreaProps {
  area: LocalRentalArea;
}

interface PlannerProps extends AreaProps {
  cars: Car[];
  source: string;
}

export function LocalRentalQuickAnswer({ area }: AreaProps) {
  return (
    <section className="border-b border-slate-200 bg-white py-8 sm:py-10" aria-label="Thông tin thuê xe nhanh">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <nav aria-label="Đi tới nội dung" className="mb-5 flex flex-wrap items-center gap-2 text-xs font-semibold sm:text-sm">
          <span className="mr-2 text-slate-500">Xem nhanh</span>
          {[
            ['#xe-goi-y', 'Xe và giá'],
            ['#so-sanh-xe', 'So sánh & tính chi phí'],
            ['#giao-nhan', 'Giao nhận'],
            ['#cau-hoi', 'Câu hỏi thường gặp'],
          ].map(([href, label]) => (
            <a key={href} href={href} className="rounded-full border border-slate-200 bg-white px-3 py-2 text-slate-700 transition-colors hover:border-brand-300 hover:text-brand-700">
              {label}
            </a>
          ))}
        </nav>
        <div className="grid gap-5 rounded-3xl border border-brand-100 bg-brand-50 p-5 sm:p-7 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-brand-700">Trả lời nhanh</p>
            <h2 className="mt-2 text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">
              Thuê xe tự lái tại {area.shortName} như thế nào?
            </h2>
            <p className="mt-3 leading-7 text-slate-700">{area.heroAnswer}</p>
          </div>
          <div className="rounded-2xl border border-white bg-white p-5">
            <p className="font-bold text-brand-700">Thông tin cần chuẩn bị</p>
            <div className="mt-3 space-y-3 text-sm text-slate-700">
              {['Ngày, giờ nhận và trả xe', 'Địa chỉ hoặc tòa nhà, cổng hẹn', 'Số người, hành lý và tuyến di chuyển'].map((text) => (
                <p key={text} className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-brand-600" />{text}</p>
              ))}
            </div>
            <a href="#so-sanh-xe" className="mt-5 inline-flex items-center gap-2 font-bold text-brand-700 hover:underline">
              Chọn xe và tính thử tiền <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

export function LocalRentalPlanner({ area, cars, source }: PlannerProps) {
  const [carId, setCarId] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
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
    <section id="so-sanh-xe" className="scroll-mt-24 bg-slate-50 py-16 sm:py-20" aria-label="So sánh xe và ước tính chi phí">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-[0.15em] text-brand-700">Chọn đúng xe, hiểu rõ chi phí</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">So sánh xe phù hợp tại {area.shortName}</h2>
          <p className="mt-3 leading-7 text-slate-600">
            Các mẫu dưới đây được lấy từ danh mục của Car Match, không phải danh sách xe đã được xác nhận còn trống vào ngày bạn chọn. Hãy đối chiếu số người, hành lý và số km thay vì chỉ nhìn đơn giá.
          </p>
        </div>
        {cars.length > 0 && (
          <div className="mt-7 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <table className="w-full min-w-[620px] text-left text-sm">
              <caption className="sr-only">So sánh xe, số ghế, nhiên liệu, giới hạn km và giá tham khảo</caption>
              <thead className="bg-brand-50 text-slate-700">
                <tr>
                  {['Mẫu xe', 'Chỗ ngồi', 'Nhiên liệu', 'Km/ngày', 'Giá ngày từ'].map((head) => (
                    <th key={head} scope="col" className="border-b border-slate-200 px-4 py-4 font-bold">{head}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cars.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-4 font-bold text-brand-700">
                      <Link to={'/xe/' + item.slug} className="hover:underline">{item.name}</Link>
                    </td>
                    <td className="px-4 py-4">{item.seats} chỗ</td>
                    <td className="px-4 py-4">{item.fuel}</td>
                    <td className="px-4 py-4">{item.kmPerDay > 0 ? item.kmPerDay + ' km' : 'Xác nhận theo xe'}</td>
                    <td className="px-4 py-4 font-bold text-slate-950">{formatPrice(item.price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-7">
            <div className="flex items-center gap-3">
              <Calculator className="h-7 w-7 text-brand-700" />
              <h3 className="text-2xl font-bold">Tính thử tiền thuê cơ bản</h3>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Dùng đúng quy tắc ngày tính tiền trên website. Báo giá cuối cùng sẽ được xác nhận sau khi kiểm tra lịch, địa chỉ và điều kiện từng xe.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="mb-2 block text-sm font-semibold">Chọn xe quan tâm</span>
                <select value={car?.id || ''} onChange={(event) => setCarId(event.target.value)} className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-slate-800">
                  {cars.length === 0 && <option value="">Chưa có xe để ước tính</option>}
                  {cars.map((item) => <option key={item.id} value={item.id}>{item.name} — {formatPrice(item.price)}/ngày</option>)}
                </select>
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold">Ngày nhận</span>
                <input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} className="min-h-12 w-full rounded-xl border border-slate-300 px-3" />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold">Giờ nhận</span>
                <select value={fromHour} onChange={(event) => setFromHour(Number(event.target.value))} className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3">
                  {hours.map((hour) => <option key={hour} value={hour}>{hour}:00</option>)}
                </select>
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold">Ngày trả</span>
                <input type="date" min={fromDate || undefined} value={toDate} onChange={(event) => setToDate(event.target.value)} className="min-h-12 w-full rounded-xl border border-slate-300 px-3" />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold">Giờ trả</span>
                <select value={toHour} onChange={(event) => setToHour(Number(event.target.value))} className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3">
                  {hours.map((hour) => <option key={hour} value={hour}>{hour}:00</option>)}
                </select>
              </label>
              <label className="block sm:col-span-2">
                <span className="mb-2 block text-sm font-semibold">Địa chỉ nhận xe tại {area.shortName}</span>
                <input type="text" value={pickupLocation} onChange={(event) => setPickupLocation(event.target.value)} placeholder="Tòa nhà, phố, cổng hoặc địa điểm hẹn" className="min-h-12 w-full rounded-xl border border-slate-300 px-3" />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold">Số người (không bắt buộc)</span>
                <input inputMode="numeric" type="number" min={1} max={15} value={partySize} onChange={(event) => setPartySize(event.target.value)} placeholder="Ví dụ: 4" className="min-h-12 w-full rounded-xl border border-slate-300 px-3" />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold">Đi đâu (không bắt buộc)</span>
                <input type="text" value={destination} onChange={(event) => setDestination(event.target.value)} placeholder="Ví dụ: Nội Bài, Ninh Bình..." className="min-h-12 w-full rounded-xl border border-slate-300 px-3" />
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
              className={'mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-4 py-3 font-bold ' + (canRequest ? 'bg-brand-600 text-white hover:bg-brand-700' : 'cursor-not-allowed bg-slate-200 text-slate-500')}
            >
              <MessageCircle className="h-5 w-5" /> Gửi thông tin để kiểm tra lịch xe
            </a>
            {!canRequest && <p className="mt-2 text-xs text-slate-500">Chọn mẫu xe, ngày giờ hợp lệ và nhập địa chỉ nhận để gửi yêu cầu.</p>}
          </div>
          <aside className="h-fit rounded-3xl border border-brand-100 bg-brand-50 p-6 sm:p-8">
            <div className="flex items-center gap-2 text-brand-700"><CalendarDays className="h-5 w-5" /><span className="text-sm font-bold">Ước tính minh bạch</span></div>
            <h3 className="mt-4 text-2xl font-bold text-slate-950">Chi phí dự kiến</h3>
            <div className="mt-6 space-y-4">
              <div className="flex items-start justify-between gap-5 border-b border-brand-100 pb-4">
                <span className="text-slate-600">Đơn giá</span>
                <strong>{car ? formatPrice(car.price) + '/ngày' : 'Đang cập nhật'}</strong>
              </div>
              <div className="flex items-start justify-between gap-5 border-b border-brand-100 pb-4">
                <span className="text-slate-600">Thời lượng tính tiền</span>
                <strong>{validPeriod ? formatRentalBillingDays(days) : 'Chưa chọn ngày'}</strong>
              </div>
              <div className="flex items-start justify-between gap-5 border-b border-brand-100 pb-4">
                <span className="text-slate-600">Thuê xe cơ bản</span>
                <strong className="text-lg text-brand-700">{baseCost !== null ? formatPrice(baseCost) : 'Chưa tính'}</strong>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-700">
              <strong>Chưa bao gồm:</strong> tiền cọc, giao nhận (nếu có), phí vượt km, cao tốc, bãi đỗ, nhiên liệu hoặc sạc. Tiền cọc không phải phí thuê.
            </p>
            <div className="mt-6 rounded-2xl bg-white p-4 text-sm text-slate-700">
              <ShieldCheck className="mb-2 h-5 w-5 text-brand-700" />
              Lịch xe và tổng tiền chỉ được xác nhận khi Car Match kiểm tra yêu cầu cụ thể.
            </div>
            <Link to="/chinh-sach" onClick={() => trackCtaClick(source + '_policy', { target_path: '/chinh-sach' })} className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-brand-700 hover:underline">
              Đọc điều kiện thuê và phụ phí <ArrowRight className="h-4 w-4" />
            </Link>
          </aside>
        </div>
        <p className="mt-5 flex items-start gap-2 text-xs leading-5 text-slate-500">
          <MapPin className="mt-0.5 h-4 w-4 flex-none" /> Thông tin giao nhận theo từng địa chỉ sẽ được hai bên xác nhận, không mặc định Car Match có chi nhánh hay xe đỗ sẵn ở mọi khu vực.
        </p>
      </div>
    </section>
  );
}
