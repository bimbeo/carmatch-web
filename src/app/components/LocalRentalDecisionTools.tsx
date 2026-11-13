import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { ArrowRight, CalendarDays, CheckCircle2, Clock3, Gauge, LoaderCircle, ShieldCheck } from 'lucide-react';
import { formatPrice, type Car } from '@/data/cars';
import { trackCtaClick } from '@/lib/analytics';
import type { LocalRentalArea } from '@/data/localRentalAreas';
import { cauGiayHubData } from '@/data/localHubsData';
import BookingWidget, {
  type BookingAvailabilityStatus,
  type BookingOpenRequest,
  type BookingPickupLocation,
  type BookingSummary,
} from './BookingWidget';

const NO_VERIFIED_CAU_GIAY_PICKUP_LOCATIONS: BookingPickupLocation[] = [];

interface AreaProps {
  area: LocalRentalArea;
}

interface PlannerProps extends AreaProps {
  cars: Car[];
  source: string;
  selectedCarId: string;
  onSelectCar: (carId: string) => void;
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
            ['#so-sanh-xe', 'So sánh & đặt xe'],
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
              Chọn xe và ngày giờ ngay trên trang; công cụ sẽ tính phí giao nhận theo địa chỉ bạn nhập. Chuẩn bị {cauGiayHubData.requiredDocuments}; backend Car Match sẽ kiểm tra lại lịch, giá và điều kiện trước khi ghi nhận yêu cầu.
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
              Chọn xe & mở công cụ đặt <ArrowRight className="h-4 w-4" />
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

  const statusMeta = availabilityStatus?.isLoading
    ? { label: 'Đang kiểm tra lịch xe', className: 'border-blue-200 bg-blue-50 text-blue-800', loading: true }
    : availabilityStatus?.selectedRangeHasHardConflict
      ? { label: 'Xe bận trong lịch đã chọn', className: 'border-red-200 bg-red-50 text-red-800', loading: false }
      : availabilityStatus?.requiresConfirmation
        ? { label: 'Cần nhân viên xác nhận lịch', className: 'border-amber-200 bg-amber-50 text-amber-800', loading: false }
        : availabilityStatus
          ? { label: 'Có thể gửi yêu cầu đặt xe', className: 'border-emerald-200 bg-emerald-50 text-emerald-800', loading: false }
          : { label: 'Chưa kiểm tra lịch xe', className: 'border-slate-200 bg-slate-50 text-slate-700', loading: false };

  return (
    <section id="so-sanh-xe" className="scroll-mt-24 bg-[#f4f5f9] py-16 sm:py-24" aria-label="So sánh xe và đặt xe">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-brand-700">Một công cụ đặt xe duy nhất</p>
          <h2 className="mt-3 text-3xl font-black tracking-[-0.035em] sm:text-5xl">Chọn xe. Xem lịch. Tính đủ chi phí. Gửi yêu cầu.</h2>
          <p className="mt-3 leading-7 text-slate-600">
            Công cụ này dùng chung engine với trang chi tiết xe: cùng lịch bận, quy tắc ngày thuê, giá lễ, phí giao nhận, ưu đãi, tiền cọc và quy trình gửi đơn qua hệ thống Car Match.
          </p>
        </div>

        <div className="mt-8 grid items-start gap-7 lg:grid-cols-[minmax(0,1.25fr)_minmax(340px,0.75fr)]">
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-[0_12px_35px_rgba(15,23,42,0.06)]">
            <table className="w-full min-w-[700px] text-left text-sm">
              <caption className="sr-only">So sánh và chọn xe để mở công cụ đặt xe</caption>
              <thead className="bg-[#10163f] text-white">
                <tr>
                  {['Mẫu xe', 'Chỗ', 'Hành lý', 'Phù hợp', 'Km/ngày', 'Giá từ', 'Chọn'].map((head) => (
                    <th key={head} scope="col" className="border-b border-white/10 px-4 py-4 text-xs font-bold uppercase tracking-[0.08em]">{head}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cars.map((item) => {
                  const fit = describeVehicleFit(item);
                  const selected = item.id === car?.id;
                  return (
                    <tr key={item.id} className={`border-b border-slate-100 transition-colors last:border-0 ${selected ? 'bg-brand-50' : 'hover:bg-brand-50/50'}`}>
                      <td className="px-4 py-4 font-bold text-brand-700"><Link to={`/xe/${item.slug}`} className="hover:underline">{item.name}</Link></td>
                      <td className="px-4 py-4">{item.seats}</td>
                      <td className="px-4 py-4">{fit.luggage}</td>
                      <td className="px-4 py-4">{fit.need}</td>
                      <td className="px-4 py-4">{item.kmPerDay > 0 ? `${item.kmPerDay} km` : 'Theo xe'}</td>
                      <td className="px-4 py-4 font-bold text-slate-950">{formatPrice(item.price)}</td>
                      <td className="px-4 py-4">
                        <button type="button" onClick={() => selectCar(item.id)} aria-pressed={selected} className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-black ${selected ? 'bg-brand-600 text-white' : 'border border-slate-200 bg-white text-brand-700 hover:border-brand-300'}`}>
                          {selected ? 'Đang chọn' : 'Chọn xe'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <aside id="booking-tool" className="scroll-mt-24 space-y-3 lg:sticky lg:top-24">
            <div className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold ${statusMeta.className}`} aria-live="polite">
              {statusMeta.loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              {statusMeta.label}
            </div>
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
                pickupLocations={NO_VERIFIED_CAU_GIAY_PICKUP_LOCATIONS}
                initialDeliveryMode="delivery"
                pageType="local_rental"
                onRelatedCarSelect={selectCar}
                externalOpenRequest={openRequest}
                onAvailabilityStatusChange={setAvailabilityStatus}
                onBookingSummaryChange={setBookingSummary}
              />
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">Chưa có xe phù hợp để đặt tại {area.shortName}.</div>
            )}
            <p className="text-xs leading-5 text-slate-500">Backend kiểm tra lại giá, lịch và trạng thái xe trước khi ghi nhận yêu cầu. Gửi yêu cầu không đồng nghĩa booking đã được xác nhận.</p>
          </aside>
        </div>
      </div>

      {car && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3 shadow-[0_-12px_30px_rgba(15,23,42,0.14)] backdrop-blur sm:hidden">
          <button type="button" onClick={openBooking} className="mx-auto flex min-h-12 w-full max-w-md items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 text-sm font-black text-white shadow-sm hover:bg-brand-700">
            <CalendarDays className="h-4 w-4" /> Đặt {car.name}{bookingSummary?.valid ? ` · ${formatPrice(bookingSummary.totalAmount)}` : ''}
          </button>
        </div>
      )}
    </section>
  );
}
