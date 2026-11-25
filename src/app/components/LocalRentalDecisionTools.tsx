import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router';
import { ArrowRight, CheckCircle2, Clock3, Fuel, Gauge, MapPin, Settings, ShieldCheck, Users } from 'lucide-react';
import { describeRentalCondition, formatPrice, type Car } from '@/data/cars';
import { LATE_RETURN_FEE_PER_HOUR } from '@/lib/rentalDuration';
import type { LocalRentalArea } from '@/data/localRentalAreas';
import { BOOKING_PICKUP_LOCATIONS, type BookingPickupLocation } from '@/data/bookingPickupLocations';
import { localRentalModelKey } from '@/data/localRentalFleet';
import type { BookingOpenRequest } from './BookingWidget';

const BookingWidget = lazy(() => import('./BookingWidget'));

interface AreaProps {
  area: LocalRentalArea;
}

interface PlannerProps extends AreaProps {
  preferredPickupId?: string;
  pickupOrderHint: string;
  cars: Car[];
  selectedCarId: string;
  explicitlySelected: boolean;
  dateRequest: BookingOpenRequest | null;
  onWidgetVisibleChange: (visible: boolean) => void;
  onDialogOpenChange: (open: boolean) => void;
  onSelectCar: (carId: string) => void;
}

function SelectedVehicleMainInfo({ car, explicitlySelected, areaSlug }: { car: Car; explicitlySelected: boolean; areaSlug: string }) {
  const conditions = car.conditions.filter((condition) => condition.trim().length > 0)
    .map(describeRentalCondition);

  return (
    <section className="scroll-mt-28 overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm" aria-labelledby="selected-vehicle-main-info">
      <div className="border-b border-slate-200 px-5 py-5 sm:px-7">
        <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-brand-700">
          <p className="uppercase tracking-[0.14em]">{explicitlySelected ? 'Xe đang chọn' : 'Xe đang xem'}</p>
          <a href="#xe-goi-y" className="inline-flex min-h-8 items-center underline underline-offset-4">Chọn xe khác</a>
        </div>
        <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
          <h3 id="selected-vehicle-main-info" className="text-2xl font-black tracking-tight text-slate-950">
            Thông tin chính · {car.name}
            {car.color && !car.name.includes(car.color) && <span className="ml-2 text-sm text-slate-600">{car.color}</span>}
          </h3>
          <Link to={`/xe/${car.slug}`} state={{ localRentalAreaSlug: areaSlug }} className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-700 hover:text-brand-900">
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
          <p className="mt-4 text-xs leading-5 text-slate-600">Car Match xác nhận tài sản bảo đảm của xe này trước khi bạn giữ lịch. Khoản bảo đảm được đối chiếu riêng khi nhận xe.</p>
        </div>

        <div className="p-5 sm:p-7">
          <h4 className="flex items-center gap-2 text-lg font-black text-slate-950">
            <Gauge className="h-5 w-5 text-brand-700" /> Giới hạn và phụ phí
          </h4>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between gap-4"><dt className="text-slate-600">Số km đã gồm</dt><dd className="font-black text-slate-950">{car.kmPerDay} km/ngày</dd></div>
            <div className="flex items-center justify-between gap-4"><dt className="text-slate-600">Phí vượt km</dt><dd className="font-black text-slate-950">{formatPrice(car.kmSurcharge)}/km</dd></div>
            <div className="flex items-center justify-between gap-4"><dt className="flex items-center gap-1.5 text-slate-600"><Clock3 className="h-4 w-4" /> Trả xe trễ</dt><dd className="font-black text-slate-950">{formatPrice(LATE_RETURN_FEE_PER_HOUR)}/giờ</dd></div>
          </dl>
          <p className="mt-5 text-xs leading-5 text-slate-600">
            {car.fuel === 'Điện'
              ? 'Tiền điện tại trụ đã gồm trong giá của gói áp dụng. Khi xác nhận xe, Car Match sẽ báo phạm vi trụ, mức pin giao trả và khoản ngoài tiền điện nếu có.'
              : 'Xem phí giao nhận theo địa chỉ và điều kiện nhiên liệu của gói thuê đã chọn.'}
          </p>
        </div>
      </div>
    </section>
  );
}

export function LocalRentalQuickAnswer({ area, localPickup }: AreaProps & { localPickup?: BookingPickupLocation }) {
  return (
    <section id="nhan-xe" className="scroll-mt-24 border-b border-slate-200 bg-white py-6 sm:py-10" aria-label="Thông tin nhận xe">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid overflow-hidden rounded-[1.75rem] border border-slate-200 bg-[#f7f8fb] shadow-[0_16px_45px_rgba(15,23,42,0.06)] lg:grid-cols-[1.2fr_0.8fr]">
          <div className="p-5 sm:p-7">
            <h2 className="max-w-2xl text-2xl font-black tracking-[-0.025em] text-slate-950 sm:text-3xl">
              Nhận xe tại {area.shortName}
            </h2>
            {localPickup ? (
              <div className="flex flex-col items-start">
                <p className="mt-3 text-sm text-slate-700"><strong>Tự nhận xe</strong> · {localPickup.address}</p>
                <a href={localPickup.mapUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-brand-800 underline underline-offset-4"><MapPin className="h-4 w-4" /> Mở bản đồ điểm tự nhận</a>
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-700">Nếu muốn tự nhận, bạn có thể chọn điểm có bản đồ trong phần đặt xe.</p>
            )}
            <a href="#xe-goi-y" className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-brand-800 underline-offset-4 hover:underline">{localPickup ? 'Xem mẫu xe và giá thuê' : 'Chọn xe để xem các điểm tự nhận'} <ArrowRight className="h-4 w-4" /></a>
          </div>
          <div className="bg-[#10163f] p-5 text-white sm:p-7">
            <h3 className="font-black">Yêu cầu giao tận nơi</h3>
            <p className="mt-2 text-sm leading-6 text-slate-200">{area.localContexts[1].description}</p>
            <p className="mt-2 text-sm leading-6 text-slate-200">Phí tạm tính theo số chiều. Car Match xác nhận phí theo địa chỉ nhận và trả.</p>
            <a href="#booking-tool" className="mt-1 inline-flex min-h-11 items-center gap-2 text-sm font-bold text-blue-200 underline underline-offset-4">Chọn cách nhận và kiểm tra phí <ArrowRight className="h-4 w-4" /></a>
          </div>
        </div>
      </div>
    </section>
  );
}

export function LocalRentalPlanner({ area, cars, selectedCarId, explicitlySelected, dateRequest, onWidgetVisibleChange, onDialogOpenChange, onSelectCar, preferredPickupId, pickupOrderHint }: PlannerProps) {
  const car = cars.find((item) => item.id === selectedCarId) || cars[0];
  const widgetSection = useRef<HTMLElement>(null);
  const [widgetNearViewport, setWidgetNearViewport] = useState(false);
  const needsWidget = widgetNearViewport || explicitlySelected || Boolean(dateRequest);
  const pickupLocations = useMemo(() => {
    const preferredId = preferredPickupId ?? ({
      'cau-giay': 'trung-lan',
      'the-manor': 'manor',
    } as Record<string, string>)[pickupOrderHint] ?? pickupOrderHint;
    return [
      ...BOOKING_PICKUP_LOCATIONS.filter((location) => location.id === preferredId),
      ...BOOKING_PICKUP_LOCATIONS.filter((location) => location.id !== preferredId),
    ];
  }, [preferredPickupId, pickupOrderHint]);
  const relatedCars = useMemo(() => {
    const currentModel = car && localRentalModelKey(car);
    return cars
      .filter((item) => item.id !== car?.id)
      .sort((a, b) => Number(localRentalModelKey(b) === currentModel) - Number(localRentalModelKey(a) === currentModel))
      .slice(0, 3)
      .map((item) => ({
        vehicleId: item.id,
        slug: item.slug,
        name: item.color && !item.name.includes(item.color) ? `${item.name} · ${item.color}` : item.name,
        price: item.price,
      }))
  }, [car, cars]);

  useEffect(() => {
    if (!widgetSection.current) return;
    const observer = new IntersectionObserver(([entry]) => onWidgetVisibleChange(entry.isIntersecting));
    observer.observe(widgetSection.current);
    return () => observer.disconnect();
  }, [onWidgetVisibleChange]);

  useEffect(() => {
    if (needsWidget || !widgetSection.current) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      setWidgetNearViewport(true);
      observer.disconnect();
    }, { rootMargin: '640px' });
    observer.observe(widgetSection.current);
    return () => observer.disconnect();
  }, [needsWidget]);

  return (
    <section id="booking-tool" ref={widgetSection} className="scroll-mt-24 bg-[#f4f5f9] py-10 sm:py-20" aria-label="Chọn lịch, tính giá và gửi yêu cầu thuê xe">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-brand-700">Đặt xe trực tiếp trên trang</p>
          <h2 className="mt-3 text-3xl font-black tracking-[-0.035em] sm:text-5xl">Chọn lịch thuê, xem tổng chi phí và gửi yêu cầu</h2>
          <p className="mt-3 leading-7 text-slate-600">
            Bạn không cần chuyển sang trang khác. Chọn xe, thời gian và cách nhận xe; Car Match sẽ kiểm tra lịch và điều kiện trước khi xác nhận.
          </p>
        </div>

        <div className="mt-8 space-y-6">
          {car ? <SelectedVehicleMainInfo car={car} explicitlySelected={explicitlySelected} areaSlug={area.slug} /> : null}
          <div id="local-rental-quote" className="scroll-mt-24">
            {!car ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">Chưa có xe phù hợp để đặt tại {area.shortName}.</div>
            ) : needsWidget ? (
              <Suspense fallback={<p role="status" className="p-6 text-sm text-slate-600">Đang tải lịch và giá thuê…</p>}>
              <BookingWidget
                basePrice={car.price}
                carName={car.name}
                carSlug={car.slug}
                priceMonth={car.priceMonth}
                vehicleId={car.id}
                kmPerDay={car.kmPerDay}
                kmSurcharge={car.kmSurcharge}
                relatedCars={relatedCars}
                pickupLocations={pickupLocations}
                areaSlug={area.slug}
                initialDeliveryMode={preferredPickupId ? 'self' : 'delivery'}
                initialPickupLocationId={preferredPickupId}
                pageType="local_rental"
                layout="wide"
                deliveryPolicy="conditional"
                separateReturnAddress
                onRelatedCarSelect={onSelectCar}
                externalOpenRequest={dateRequest}
                onDialogOpenChange={onDialogOpenChange}
                onExternalCalendarConfirm={() => document.getElementById('local-rental-quote')?.scrollIntoView({ block: 'start' })}
              />
              </Suspense>
            ) : (
              <p className="p-6 text-sm text-slate-600">Chọn lịch để kiểm tra xe và giá thuê.</p>
            )}
          </div>
        </div>
      </div>

    </section>
  );
}
