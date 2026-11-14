import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { ArrowRight, CalendarDays, CheckCircle2, Clock3, Fuel, Gauge, Settings, ShieldCheck, Users } from 'lucide-react';
import { formatPrice, type Car } from '@/data/cars';
import { trackCtaClick } from '@/lib/analytics';
import type { LocalRentalArea } from '@/data/localRentalAreas';
import { cauGiayHubData } from '@/data/localHubsData';
import BookingWidget, {
  type BookingAvailabilityStatus,
  type BookingOpenRequest,
  type BookingSummary,
} from './BookingWidget';

interface AreaProps {
  area: LocalRentalArea;
}

interface PlannerProps extends AreaProps {
  cars: Car[];
  source: string;
  selectedCarId: string;
  onSelectCar: (carId: string) => void;
}

function SelectedVehicleMainInfo({ car }: { car: Car }) {
  const conditions = car.conditions.filter((condition) => condition.trim().length > 0);
  const hasPublishedCollateral = conditions.some((condition) => /cọc|bảo đảm|thế chấp|xe máy/i.test(condition));

  return (
    <section className="scroll-mt-28 overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm" aria-labelledby="selected-vehicle-main-info">
      <div className="border-b border-slate-200 px-5 py-5 sm:px-7">
        <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-brand-700">Xe đang chọn</p>
        <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
          <h3 id="selected-vehicle-main-info" className="text-2xl font-black tracking-tight text-slate-950">
            Thông tin chính · {car.name}
          </h3>
          <Link to={`/xe/${car.slug}`} className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-700 hover:text-brand-900">
            Xem đầy đủ chi tiết xe <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="grid gap-px bg-slate-200 sm:grid-cols-3">
        {[
          [Users, 'Số chỗ', `${car.seats} chỗ`],
          [Fuel, 'Nhiên liệu', car.fuel],
          [Settings, 'Hộp số', car.transmission],
        ].map(([Icon, label, value]) => {
          const FactIcon = Icon as typeof Users;
          return (
            <div key={label as string} className="flex items-center gap-3 bg-white px-5 py-5 sm:px-7">
              <span className="rounded-full bg-brand-50 p-3 text-brand-800"><FactIcon className="h-5 w-5" /></span>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label as string}</p>
                <p className="mt-1 font-black text-slate-950">{value as string}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2">
        <div className="border-b border-slate-200 p-5 sm:p-7 lg:border-b-0 lg:border-r">
          <h4 className="flex items-center gap-2 text-lg font-black text-slate-950">
            <ShieldCheck className="h-5 w-5 text-brand-700" /> Giấy tờ và tài sản bảo đảm
          </h4>
          {conditions.length > 0 ? (
            <ul className="mt-4 space-y-3">
              {conditions.map((condition) => (
                <li key={condition} className="flex gap-3 text-sm leading-6 text-slate-700">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 flex-none text-emerald-600" />
                  {condition}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm leading-6 text-slate-600">Điều kiện giấy tờ và tài sản bảo đảm của xe này sẽ được Car Match xác nhận trước khi giữ lịch.</p>
          )}
          <p className={`mt-4 rounded-xl px-4 py-3 text-xs leading-5 ${hasPublishedCollateral ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-900'}`}>
            {hasPublishedCollateral
              ? 'Mức cọc/tài sản bảo đảm đang hiển thị theo dữ liệu của xe được chọn và sẽ được đối chiếu lại trước khi bạn chuyển cọc.'
              : 'Dữ liệu xe chưa công bố mức cọc/tài sản bảo đảm cụ thể. Car Match sẽ xác nhận rõ mức áp dụng trước khi bạn chuyển cọc.'}
          </p>
        </div>

        <div className="p-5 sm:p-7">
          <h4 className="flex items-center gap-2 text-lg font-black text-slate-950">
            <Gauge className="h-5 w-5 text-brand-700" /> Giới hạn và phụ phí
          </h4>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between gap-4"><dt className="text-slate-600">Số km đã gồm</dt><dd className="font-black text-slate-950">{car.kmPerDay} km/ngày</dd></div>
            <div className="flex items-center justify-between gap-4"><dt className="text-slate-600">Phí vượt km</dt><dd className="font-black text-slate-950">{formatPrice(car.kmSurcharge)}/km</dd></div>
            <div className="flex items-center justify-between gap-4"><dt className="flex items-center gap-1.5 text-slate-600"><Clock3 className="h-4 w-4" /> Trả xe trễ</dt><dd className="font-black text-slate-950">100.000đ/giờ</dd></div>
          </dl>
          <p className="mt-5 text-xs leading-5 text-slate-500">Phí giao nhận và nhiên liệu hoặc sạc được tính riêng theo lựa chọn thực tế và xác nhận trước khi booking được chốt.</p>
        </div>
      </div>
    </section>
  );
}

export function LocalRentalQuickAnswer({ area }: AreaProps) {
  return (
    <section className="border-b border-slate-200 bg-white py-10 sm:py-14" aria-label="Thông tin thuê xe nhanh">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <nav aria-label="Đi tới nội dung" className="mb-7 flex gap-2 overflow-x-auto pb-1 text-xs font-semibold sm:flex-wrap sm:text-sm">
          <span className="mr-2 hidden self-center text-slate-500 sm:inline">Xem nhanh</span>
          {[
            ['#xe-goi-y', 'Xe và giá'],
            ['#booking-tool', 'Chọn lịch & tính giá'],
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
            <p className="text-xs font-extrabold uppercase tracking-[0.15em] text-brand-700">Thông tin nhanh khi thuê tại Cầu Giấy</p>
            <h2 className="mt-3 max-w-2xl text-2xl font-black tracking-[-0.025em] text-slate-950 sm:text-3xl">
              Thuê xe tại {area.shortName} cần biết gì?
            </h2>
            <p className="mt-4 max-w-3xl leading-7 text-slate-700">
              Bạn có thể chọn xe và ngày giờ ngay trên trang. Car Match kiểm tra lịch của xe, báo tổng chi phí và thống nhất điểm bàn giao theo địa chỉ bạn cung cấp trước khi xác nhận đơn.
            </p>
          </div>
          <div className="bg-[#10163f] p-6 text-white sm:p-8 lg:p-10">
            <p className="text-sm font-bold text-blue-200">Thông tin cần có</p>
            <div className="mt-5 space-y-4 text-sm text-slate-200">
              {['Ngày & giờ nhận/trả', 'Điểm nhận xe', 'Số người và hành lý'].map((text) => (
                <p key={text} className="flex items-start gap-3"><CheckCircle2 className="mt-0.5 h-5 w-5 flex-none text-blue-300" />{text}</p>
              ))}
            </div>
            <a href="#xe-goi-y" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 font-bold text-brand-900 transition hover:bg-blue-50">
              Chọn xe và tính tiền thuê <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {[
            [Gauge, 'Đa dạng xe tự động', 'So sánh theo số ghế, nhiên liệu và giá niêm yết'],
            [ShieldCheck, 'Giấy tờ theo chính sách thuê', cauGiayHubData.requiredDocuments],
            [CalendarDays, 'Hỗ trợ giao nhận theo lịch', 'Điểm hẹn và chi phí được xác nhận theo địa chỉ'],
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

export function LocalRentalPlanner({ area, cars, source, selectedCarId, onSelectCar }: PlannerProps) {
  const car = cars.find((item) => item.id === selectedCarId) || cars[0];
  const [availabilityStatus, setAvailabilityStatus] = useState<BookingAvailabilityStatus | null>(null);
  const [bookingSummary, setBookingSummary] = useState<BookingSummary | null>(null);
  const [openRequest, setOpenRequest] = useState<BookingOpenRequest | null>(null);
  const relatedCars = useMemo(() => (
    cars
      .filter((item) => item.id !== car?.id)
      .slice(0, 3)
      .map((item) => ({ vehicleId: item.id, slug: item.slug, name: item.name, price: item.price }))
  ), [car?.id, cars]);

  useEffect(() => {
    setAvailabilityStatus(null);
    setBookingSummary(null);
  }, [car?.id]);

  const selectCar = (carId: string) => {
    onSelectCar(carId);
    trackCtaClick(`${source}_select_car`, { vehicle_id: carId });
  };

  const openBooking = () => {
    if (!car) return;
    setOpenRequest({ id: Date.now(), source: `${source}_sticky_booking`, vehicleId: car.id });
  };

  const mobileAction = availabilityStatus?.isLoading
    ? 'Đang kiểm tra lịch…'
    : availabilityStatus?.selectedRangeHasHardConflict
      ? 'Đổi lịch hoặc chọn xe khác'
      : 'Xem giá & gửi yêu cầu';

  return (
    <section id="booking-tool" className="scroll-mt-24 bg-[#f4f5f9] py-16 sm:py-24" aria-label="Chọn lịch, tính giá và gửi yêu cầu thuê xe">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-brand-700">Đặt xe trực tiếp trên trang</p>
          <h2 className="mt-3 text-3xl font-black tracking-[-0.035em] sm:text-5xl">Chọn lịch thuê, xem tổng chi phí và gửi yêu cầu</h2>
          <p className="mt-3 leading-7 text-slate-600">
            Bạn không cần chuyển sang trang khác. Chọn xe, thời gian và cách nhận xe; Car Match sẽ kiểm tra lịch và điều kiện trước khi xác nhận.
          </p>
        </div>

        <div className="mt-8 space-y-6">
          {car ? <SelectedVehicleMainInfo car={car} /> : null}
          <div>
            {car ? (
              <BookingWidget
                basePrice={car.price}
                carName={car.name}
                carSlug={car.slug}
                priceMonth={car.priceMonth}
                vehicleId={car.id}
                kmPerDay={car.kmPerDay}
                kmSurcharge={car.kmSurcharge}
                relatedCars={relatedCars}
                initialDeliveryMode="self"
                pageType="local_rental"
                layout="wide"
                deliveryPolicy="conditional"
                separateReturnAddress
                onRelatedCarSelect={selectCar}
                externalOpenRequest={openRequest}
                onAvailabilityStatusChange={setAvailabilityStatus}
                onBookingSummaryChange={setBookingSummary}
              />
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">Chưa có xe phù hợp để đặt tại {area.shortName}.</div>
            )}
            <p className="mt-3 text-xs leading-5 text-slate-600">Hệ thống Car Match kiểm tra lại giá, lịch và trạng thái xe trước khi ghi nhận yêu cầu. Gửi yêu cầu không đồng nghĩa booking đã được xác nhận.</p>
          </div>
        </div>
      </div>

      {car && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3 shadow-[0_-12px_30px_rgba(15,23,42,0.14)] backdrop-blur sm:hidden">
          <button type="button" onClick={openBooking} className="mx-auto flex min-h-12 w-full max-w-md items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 text-sm font-black text-white shadow-sm hover:bg-brand-700">
            <CalendarDays className="h-4 w-4" /> {mobileAction}{bookingSummary?.valid ? ` · ${formatPrice(bookingSummary.totalAmount)}` : ''}
          </button>
        </div>
      )}
    </section>
  );
}
