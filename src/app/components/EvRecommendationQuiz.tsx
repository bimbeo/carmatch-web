import { useMemo, useState } from 'react';
import { ArrowRight, CheckCircle2, Info } from 'lucide-react';
import type { Car } from '@/data/cars';
import { formatPrice } from '@/data/cars';
import { exactSpecForCar, evFamilyFromCar } from '@/data/evVehicleSpecs';
import { trackEvent } from '@/lib/analytics';

interface QuizInputs {
  passengers: number;
  luggage: number;
  usage: 'city' | 'family' | 'long';
  budget: number;
  distance: number;
  driving: 'city' | 'mixed' | 'demanding';
  reserveSoc: number;
}

function scoreCar(car: Car, input: QuizInputs) {
  const family = evFamilyFromCar(car) ?? car.name;
  const spec = exactSpecForCar(car);
  if (car.seats < input.passengers) {
    return { car, score: -1000, reasons: [], checks: [`Không đủ ${input.passengers} chỗ ngồi`] };
  }

  let score = 30;
  const reasons = [`Đủ ${input.passengers} chỗ cho nhóm`];
  const checks = ['Đối chiếu kích thước vali và phiên bản xe thực tế'];
  if (!input.budget || car.price <= input.budget) {
    score += 25;
    reasons.push('giá ngày nằm trong ngân sách');
  } else {
    score -= 20;
    checks.push('giá ngày cao hơn ngân sách đã chọn');
  }
  if (input.luggage >= 3) {
    checks.push('chưa có dữ liệu dung tích khoang hành lý đã xác minh; cần đối chiếu vali với xe thực tế');
    if (car.seats >= 7 || ['VF7', 'VF8'].includes(family)) {
      score += 8;
      reasons.push('thuộc nhóm xe lớn hơn để cân nhắc cách xếp hành lý');
    }
  }
  if (input.usage === 'city' && ['VF3', 'VF5'].includes(family)) {
    score += 18;
    reasons.push('kích thước phù hợp đi phố');
  }
  if (input.usage === 'family' && ['VF6', 'VF7', 'VF8', 'Limo Green'].includes(family)) {
    score += 18;
    reasons.push('phù hợp nhu cầu gia đình');
  }
  if (input.usage === 'long' && ['VF6', 'VF7', 'VF8'].includes(family)) {
    score += 16;
    reasons.push('thuộc nhóm nên cân nhắc cho chuyến dài');
  }
  if (spec?.rangeKm) {
    const conservativeRange = spec.rangeKm
      * (input.driving === 'demanding' ? 0.6 : input.driving === 'mixed' ? 0.7 : 0.8)
      * (1 - input.reserveSoc / 100);
    if (input.distance <= conservativeRange) reasons.push('quãng đường nằm trong ngưỡng tham khảo thận trọng');
    else checks.push('cần lập kế hoạch dừng sạc cho quãng đường đã nhập');
  } else {
    checks.push('cần vận hành xác minh pin/đời xe trước khi lập kế hoạch');
  }
  return { car, score, reasons, checks };
}

export default function EvRecommendationQuiz({ cars, onSelect }: { cars: Car[]; onSelect: (car: Car, source: string) => void }) {
  const [input, setInput] = useState<QuizInputs>({ passengers: 5, luggage: 2, usage: 'family', budget: 1_000_000, distance: 180, driving: 'mixed', reserveSoc: 15 });
  const [submitted, setSubmitted] = useState(false);
  const results = useMemo(() => cars
    .map((car) => scoreCar(car, input))
    .filter((result) => result.score > -1000)
    .sort((a, b) => b.score - a.score || a.car.price - b.car.price)
    .slice(0, 2), [cars, input]);

  const fieldClass = 'mt-2 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100';

  return (
    <section id="advisor" className="scroll-mt-24 bg-[#f2efe7] py-16 sm:py-20" aria-labelledby="ev-advisor-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">03 / Công cụ chọn xe điện</p>
        <div className="mt-4 grid gap-5 lg:grid-cols-[1fr_0.65fr] lg:items-end">
          <div>
            <h2 id="ev-advisor-heading" className="max-w-3xl text-3xl font-black tracking-tight sm:text-5xl">Xe điện nào hợp chuyến đi của bạn?</h2>
            <p className="mt-4 max-w-2xl text-slate-600">Nhập số người, hành lý, tuyến dự kiến và ngân sách. Quãng đường công bố chỉ là số hãng đo trong điều kiện thử nghiệm, không phải mức xe luôn đạt ngoài thực tế.</p>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-white/80 p-5 text-sm leading-6 text-slate-600">
            <strong className="block text-slate-950">Khác với bảng thông số đơn thuần</strong>
            Kết quả ưu tiên nhu cầu thật và luôn nêu điều cần xác minh trước khi thuê.
          </div>
        </div>

        <div className="mt-9 grid overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-300/30 lg:grid-cols-2">
          <form className="p-5 sm:p-8" onSubmit={(event) => {
            event.preventDefault();
            setSubmitted(true);
            trackEvent('ev_recommendation_complete', { passengers: input.passengers, luggage: input.luggage, usage: input.usage, budget: input.budget, distance_km: input.distance, reserve_soc: input.reserveSoc, result_vehicle_ids: results.map((item) => item.car.id).join(',') });
          }}>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">Bước 1 · Nhu cầu của bạn</p>
            <h3 className="mt-2 text-2xl font-black">Chuyến này bạn cần xe như thế nào?</h3>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-bold text-slate-700">Số người (kể cả trẻ em)
                <select className={fieldClass} value={input.passengers} onChange={(e) => setInput((value) => ({ ...value, passengers: Number(e.target.value) }))}>
                  <option value={2}>1–2 người</option><option value={4}>3–4 người</option><option value={5}>5 người</option><option value={7}>6–7 người</option>
                </select>
              </label>
              <label className="text-sm font-bold text-slate-700">Hành lý mang theo
                <select className={fieldClass} value={input.luggage} onChange={(e) => setInput((value) => ({ ...value, luggage: Number(e.target.value) }))}>
                  <option value={0}>Ít hoặc không có</option><option value={2}>1–2 vali</option><option value={3}>3 vali trở lên / đồ cồng kềnh</option>
                </select>
              </label>
              <label className="text-sm font-bold text-slate-700">Mục đích chính
                <select className={fieldClass} value={input.usage} onChange={(e) => setInput((value) => ({ ...value, usage: e.target.value as QuizInputs['usage'] }))}>
                  <option value="city">Đi lại nội thành</option><option value="family">Gia đình / cuối tuần</option><option value="long">Đi tỉnh / đường dài</option>
                </select>
              </label>
              <label className="text-sm font-bold text-slate-700">Ngân sách thuê/ngày
                <select className={fieldClass} value={input.budget} onChange={(e) => setInput((value) => ({ ...value, budget: Number(e.target.value) }))}>
                  <option value={800000}>Tối đa 800.000đ</option><option value={1000000}>Tối đa 1 triệu</option><option value={1500000}>Tối đa 1,5 triệu</option><option value={0}>Chưa giới hạn</option>
                </select>
              </label>
              <label className="text-sm font-bold text-slate-700">Quãng đường dự kiến (km)
                <input className={fieldClass} type="number" min={1} max={3000} value={input.distance} onChange={(e) => setInput((value) => ({ ...value, distance: Number(e.target.value) }))} />
              </label>
              <label className="text-sm font-bold text-slate-700">Điều kiện vận hành
                <select className={fieldClass} value={input.driving} onChange={(e) => setInput((value) => ({ ...value, driving: e.target.value as QuizInputs['driving'] }))}>
                  <option value="city">Chủ yếu nội đô</option><option value="mixed">Hỗn hợp nội đô / cao tốc</option><option value="demanding">Cao tốc / đường đèo / tải nặng</option>
                </select>
              </label>
              <label className="text-sm font-bold text-slate-700">Pin muốn giữ lại khi đến
                <select className={fieldClass} value={input.reserveSoc} onChange={(e) => setInput((value) => ({ ...value, reserveSoc: Number(e.target.value) }))}>
                  <option value={10}>Ít nhất 10%</option><option value={15}>Ít nhất 15%</option><option value={20}>Ít nhất 20%</option><option value={25}>Ít nhất 25%</option>
                </select>
              </label>
            </div>
            <p className="mt-4 flex gap-2 text-xs leading-5 text-slate-500"><Info className="mt-0.5 h-4 w-4 flex-none" />Xe đủ chỗ ngồi vẫn có thể thiếu chỗ hành lý. Hãy đối chiếu vali và xe thực tế trước khi chốt.</p>
            <button type="submit" className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 font-black text-white hover:bg-emerald-800">Xem xe phù hợp với tôi <ArrowRight className="h-4 w-4" /></button>
          </form>

          <div className="border-t border-slate-200 bg-slate-950 p-5 text-white sm:p-8 lg:border-l lg:border-t-0" aria-live="polite">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-300">Bước 2 · Đề xuất có giải thích</p>
            <h3 className="mt-2 text-2xl font-black">{submitted ? 'Hai lựa chọn đáng xem' : 'Sẵn sàng đối chiếu nhu cầu'}</h3>
            {!submitted ? (
              <p className="mt-5 leading-7 text-slate-300">Điền nhu cầu rồi bấm xem gợi ý. Kết quả dùng giá thuê đang công bố của từng xe, không tạo bảng giá riêng.</p>
            ) : results.length > 0 ? (
              <div className="mt-6 space-y-4">
                {results.map((result, index) => {
                  const spec = exactSpecForCar(result.car);
                  return (
                    <article key={result.car.id} className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                      {result.car.images?.[0] ? <div className="relative aspect-[16/9] overflow-hidden bg-slate-200/90"><img src={result.car.images[0]} alt={`Xe ${result.car.name} được đề xuất`} className="absolute inset-0 h-full w-full object-contain p-2" loading="lazy" decoding="async" /></div> : null}
                      <div className="p-5">
                        <div className="flex items-start justify-between gap-3"><strong className="text-lg">{index + 1}. {result.car.name}</strong><span className="rounded-full bg-emerald-300 px-2.5 py-1 text-[10px] font-black uppercase text-slate-950">{index === 0 ? 'Ưu tiên xem' : 'Lựa chọn khác'}</span></div>
                        <p className="mt-2 text-xs font-bold text-slate-400">{formatPrice(result.car.price)}/ngày · {spec?.rangeKm ? `${spec.rangeKm} km công bố` : 'Pin/đời xe cần xác minh'}</p>
                        <div className="mt-4 grid gap-3 text-sm leading-6 sm:grid-cols-2">
                          <div><strong className="text-emerald-300">Vì sao phù hợp</strong><ul className="mt-1 space-y-1 text-slate-200">{result.reasons.slice(0, 3).map((reason) => <li key={reason} className="flex gap-2"><CheckCircle2 className="mt-1 h-4 w-4 flex-none text-emerald-300" />{reason}</li>)}</ul></div>
                          <div><strong className="text-amber-200">Điều cần kiểm tra</strong><ul className="mt-1 space-y-1 text-amber-50">{result.checks.slice(0, 3).map((check) => <li key={check}>• {check}</li>)}</ul></div>
                        </div>
                        {index === 1 && <p className="mt-3 rounded-xl bg-white/5 p-3 text-xs leading-5 text-slate-300"><strong>So với lựa chọn đầu:</strong> giá và kích thước xe có thể khác; hãy đối chiếu hành lý và lịch xe thực tế trước khi chốt.</p>}
                        <div className="mt-4 flex flex-col gap-2 sm:flex-row"><button type="button" onClick={() => onSelect(result.car, 'ev_recommendation')} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-black text-slate-950 hover:bg-emerald-100">Chọn xe và xem lịch <ArrowRight className="h-4 w-4" /></button><a href="#ev-comparison" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/20 px-4 text-sm font-black text-white">So sánh thông số</a></div>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : <p className="mt-5 text-slate-300">Chưa có xe đủ số chỗ trong danh mục hiện tại. Hãy giảm số người hoặc liên hệ Car Match.</p>}
          </div>
        </div>
      </div>
    </section>
  );
}
