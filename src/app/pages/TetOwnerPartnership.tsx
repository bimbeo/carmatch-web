import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react';
import { useSEO } from '@/hooks/useSEO';
import { submitLead, type LeadPayload } from '@/hooks/useLeads';
import {
  cooperationOptions, dateLabel, dateSpan, editSchedule, estimateIncome, inRange, leadSchedule, makeSchedule,
  money, segmentLabel, summarizeSchedule, tetOwnerCampaign as campaign, tetOwnerHero,
  type DayStatus, type FleetSchedule, type ScheduleOrigin, type TetDate, type TetPreset,
} from '@/data/tetOwnerCampaign';
import { tetOwnerFaq, tetOwnerMoreFaq } from '@/data/tetOwnerFaq';
import { trackCtaClick, trackEvent, trackLeadSubmit, trackZaloClick } from '@/lib/analytics';
import { copyToClipboard, copyZaloContext, makeIdempotencyKey, partnerContact } from '@/lib/ownerPartnership';
import { PartnerChecklistDialog, PartnerDialog } from '../components/PartnerChecklistDialog';
import './tetOwner.css';

const origin = 'https://www.carmatch.vn';
const canonical = origin + campaign.path;
const assets = '/tet-owner/';
const { defaults, year, season, presets, days } = campaign;
const tetDate = dateLabel(campaign.newYear);
const [firstDay, firstLunar] = days[0];
const lastDay = days[days.length - 1][0];
const numberFormatter = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 });
const groupMoneyDigits = (digits: string) => digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const weekdays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const leadingDays = (new Date(firstDay + 'T00:00:00Z').getUTCDay() + 6) % 7;
const presetLabels = {
  full: `Xuyên Tết · ${dateSpan(presets.full.free[0])}`,
  duxuan: `Du xuân · ${dateSpan(presets.duxuan.free[0])}`,
  before: 'Trước Tết',
  family: 'Giữ mùng 1–3',
  clear: 'Đặt lại',
};
const dayLabels: Record<DayStatus, string> = {
  free: 'Có thể cho thuê', hold: 'Giữ xe cho gia đình', maybe: 'Chưa quyết định',
};
const daySymbols: Record<DayStatus, string> = { free: '+', hold: '♥', maybe: '–' };
const vehicleUses = [
  ['Xe điện đô thị', 'Di chuyển trong Hà Nội và các chuyến gần có điểm sạc phù hợp.'],
  ['Sedan 5 chỗ', 'Đi thăm gia đình hoặc đi tỉnh với ít hành lý.'],
  ['CUV / SUV', 'Đi du xuân, chở thêm hành lý hoặc chạy chặng dài.'],
  ['MPV / xe 7 chỗ', 'Đi theo nhóm hoặc gia đình đông người.'],
];
const regions = [
  'Cầu Giấy / Tôn Thất Thuyết', 'Thanh Xuân / Nguyễn Xiển', 'Gia Lâm / Vinhomes Ocean Park', 'Hai Bà Trưng / Times City',
  'Nam Từ Liêm / Smart City', 'Hà Đông', 'Tây Hồ / Ba Đình', 'Long Biên', 'Đông Anh / Nội Bài', 'Khu vực Hà Nội khác',
];
const articles = [
  ['Checklist hợp tác Tết', '/blog/hop-tac-chu-xe-cho-thue-tet-can-gi'],
  ['Điều khoản hợp đồng', '/blog/hop-dong-hop-tac-cho-thue-xe-can-dieu-khoan-gi'],
  ['Xe nhàn rỗi dịp Tết có nên cho thuê?', '/blog/xe-nhan-roi-dip-tet-co-nen-cho-thue-khong'],
  ['Cho thuê xe cá nhân ngày Tết có an toàn?', '/blog/cho-thue-xe-ca-nhan-ngay-tet-co-an-toan-khong'],
  ['Doanh thu xe nhàn rỗi dịp Tết tính thế nào?', '/blog/doanh-thu-xe-nhan-roi-dip-tet-tinh-the-nao'],
  ['Ủy thác theo ngày hay cho thuê theo tháng?', '/blog/uy-thac-xe-theo-ngay-hay-cho-thue-theo-thang'],
  ['Xe nào phù hợp khai thác dịp Tết?', '/blog/xe-nao-phu-hop-khai-thac-dip-tet'],
  ['Chuẩn bị xe trước khi cho thuê Tết', '/blog/chuan-bi-xe-truoc-khi-cho-thue-tet'],
  ['Phạt nguội, VETC và hư hỏng', '/blog/phat-nguoi-vetc-hu-hong-xe-hop-tac-xu-ly-the-nao'],
  ['Chủ xe cần chuẩn bị gì khi bàn giao?', '/blog/chu-xe-can-chuan-bi-gi-khi-ban-giao-xe-tet'],
];

const protection = [
  ['♙', 'Kiểm tra người thuê & kế hoạch sử dụng', 'Đối chiếu thông tin khách thuê, GPLX và lịch sử thuê theo quy trình áp dụng. Làm rõ thời gian và điểm đến dự kiến trước khi bàn giao.'],
  ['◷', 'Chốt giờ trả xe trước ngày bạn cần', 'Trước khi chốt chuyến, chủ xe có thể đề xuất đổi lịch. Sau khi chốt, hãy báo đầu mối đã thống nhất để xử lý đổi lịch hoặc trả muộn theo hợp đồng.'],
  ['≋', 'Đối soát ETC & phát sinh sau chuyến', 'Đối chiếu VETC/ePass, phạt nguội và các khoản phát sinh theo chứng từ. Hai bên thống nhất trước điều kiện giữ hoặc hoàn cọc nếu áp dụng.'],
  ['⌁', 'GPS, bảo hiểm & hỗ trợ sự cố', 'Xác nhận thiết bị định vị nếu có, phạm vi bảo hiểm, các khoản loại trừ và đầu mối liên hệ trước khi nhận xe. Khi có sự cố, hai bên làm theo thỏa thuận đã ký.'],
];
const timeline = [
  [`Nên trước ${dateLabel(firstDay)} · ${firstLunar}`, 'Gửi lịch xe rảnh sớm', 'Cho biết mẫu/năm xe, khu vực đỗ và khoảng ngày có thể bàn giao. Có thể điều chỉnh lịch trước khi chốt hợp đồng.'],
  ['Trước khi chốt lịch thuê', 'Thẩm định & thống nhất phương án', 'Kiểm tra hồ sơ, tình trạng, bảo hiểm, khung giá, quyền sử dụng và các trách nhiệm bằng văn bản.'],
  [`${dateSpan(campaign.handover)} · 25–28 Chạp`, 'Đồng kiểm & bàn giao', 'Kiểm tra 15 điểm, chụp hiện trạng, ODO, pin/xăng và phụ kiện tại địa điểm hai bên đã xác nhận.'],
  ['Theo lịch đã thống nhất', 'Nhận lại & đối soát', 'Cùng kiểm tra tình trạng, vệ sinh và các phát sinh như ETC hay phạt nguội. Tiền hợp tác được đối soát và trả theo kỳ hạn đã ghi trong hợp đồng.'],
];

function SectionHeading({ kicker, title, children }: { kicker: string; title: string; children: ReactNode }) {
  return <div className="sec-heading"><div className="sec-title"><div className="eyebrow">{kicker}</div><h2>{title}</h2></div><p>{children}</p></div>;
}

function CampaignImage({ image, alt, mainHero = false }: { image: 'hero' | 'vf6' | 'vf5' | 'vf3'; alt: string; mainHero?: boolean }) {
  const hero = image === 'hero';
  const sizes = hero ? tetOwnerHero.sizes : '(max-width: 760px) calc(100vw - 36px), (max-width: 1240px) 32vw, 390px';
  const img = <img alt={alt} src={hero ? tetOwnerHero.src : `${assets}${image}-720.webp`}
    srcSet={hero ? tetOwnerHero.srcSet : [390, 720].map((width) => `${assets}${image}-${width}.webp ${width}w`).join(', ')}
    sizes={sizes} width={hero ? 1536 : 720} height={{ hero: 1024, vf6: 514, vf5: 522, vf3: 530 }[image]}
    {...(mainHero ? { fetchpriority: 'high' } : {})} loading={mainHero ? 'eager' : 'lazy'} decoding={mainHero ? 'auto' : 'async'} />;
  if (!mainHero) return img;
  return <picture><source media={tetOwnerHero.mobileMedia} type="image/avif" srcSet={tetOwnerHero.mobileSrcSet} sizes={tetOwnerHero.mobileSizes} />{img}</picture>;
}

function RegionSelect({ id, value, onChange, required }: { id: string; value: string; onChange: (value: string) => void; required?: boolean }) {
  return <select id={id} value={value} onChange={(event) => onChange(event.target.value)} required={required}>
    <option value="">Chọn khu vực</option>
    {regions.map((region) => <option key={region}>{region}</option>)}
  </select>;
}

const initialOwner = { name: '', phone: '', car: '', quantity: '1', note: '' };
type Option = keyof typeof cooperationOptions;
type Journey = 'consult' | 'schedule';
type Review = { key: string; text: string; payload: LeadPayload };
const handoverErrors = {
  no_dates: 'Hãy chọn ngày xe rảnh trước khi nhập giờ giao nhận.',
  earliest: 'Mốc bàn giao phải nằm trong ngày đầu tiên bạn đánh dấu có thể cho thuê.',
  latest: 'Mốc nhận lại phải nằm trong ngày cuối cùng bạn đánh dấu có thể cho thuê.',
  order: 'Giờ giao và giờ nhận lại phải để lại thời gian cho thuê trong khoảng đã chọn.',
};
const phoneNumber = (value: string) => value.trim().replace(/[ .()-]/g, '').replace(/^(?:\+84|84)/, '0');
const track = (name: string, detail: Record<string, string> = {}) => trackEvent(name, { ...detail, lead_source: campaign.source });

export default function TetOwnerPartnership() {
  useSEO({
    title: campaign.title, description: campaign.description, canonical,
    ogImage: origin + campaign.image, ogImageAlt: tetOwnerHero.alt, ogImageSize: campaign.socialImage,
  });
  const [schedule, setSchedule] = useState(() => makeSchedule('full'));
  const [mode, setMode] = useState<DayStatus>('free');
  const [activePreset, setActivePreset] = useState<TetPreset | 'custom'>('full');
  const [scheduleOrigin, setScheduleOrigin] = useState<ScheduleOrigin>('sample');
  const [journey, setJourney] = useState<Journey>('consult');
  const [modelGroup, setModelGroup] = useState(vehicleUses[1][0]);
  const [earliest, setEarliest] = useState('');
  const [latest, setLatest] = useState('');
  const [fleetSchedule, setFleetSchedule] = useState<FleetSchedule>('');
  const [fleetNotes, setFleetNotes] = useState('');
  const [usedCalculator, setUsedCalculator] = useState(false);
  const [region, setRegion] = useState('');
  const [otherRegion, setOtherRegion] = useState('');
  const [values, setValues] = useState({
    dailyRate: String(defaults.dailyRate), bookedDays: String(defaults.bookedDays), sharePercent: String(defaults.sharePercent), monthlyCost: '',
  });
  const [owner, setOwner] = useState(initialOwner);
  const [option, setOption] = useState<Option | ''>('');
  const [review, setReview] = useState<Review | null>(null);
  const [sendError, setSendError] = useState('');
  const [formError, setFormError] = useState('');
  const [sending, setSending] = useState(false);
  const [confirmation, setConfirmation] = useState<{ key: string; requestId?: string } | null>(null);
  const [toast, setToast] = useState('');
  const [fallback, setFallback] = useState<{ text: string; zalo: boolean } | null>(null);
  const plannerRef = useRef<HTMLElement>(null);
  const signupRef = useRef<HTMLElement>(null);
  const reviewRef = useRef<HTMLDialogElement>(null);
  const checklistRef = useRef<HTMLDialogElement>(null);
  const fallbackRef = useRef<HTMLDialogElement>(null);
  const confirmationRef = useRef<HTMLDivElement>(null);
  const toastTimer = useRef<number>();
  const leadKeys = useRef(new Map<string, string>());
  const confirmedKeys = useRef(new Set<string>());
  const inFlight = useRef(false);
  const actions = useRef(new Set<string>());

  const stats = summarizeSchedule(schedule, earliest, latest);
  const estimate = estimateIncome(values, stats.free);
  const hasDates = scheduleOrigin === 'selected' && stats.free > 0;
  const multiple = Number(owner.quantity) > 1;
  const withDates = journey === 'schedule';
  const usesReferenceVehicle = multiple && fleetSchedule === 'different';
  const reviewWithDates = review?.payload.tet_owner?.schedule_status === 'owner_selected';
  const firstFreeDate = stats.segments.free[0]?.start;
  const lastFreeDate = stats.segments.free[stats.segments.free.length - 1]?.end;
  const chosenOption = option || (multiple ? 'multi' : hasDates ? stats.option : 'consult');
  const location = region === regions[regions.length - 1] ? otherRegion.trim() : region;
  const reviewWasSent = Boolean(review && confirmedKeys.current.has(review.key));
  useEffect(() => () => window.clearTimeout(toastTimer.current), []);

  function once(event: string, detail: Record<string, string> = {}) {
    if (actions.current.has(event)) return;
    actions.current.add(event);
    track(event, detail);
  }

  function notify(message: string) {
    setToast(message);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(''), 4500);
  }

  function goTo(section: HTMLElement | null) {
    if (!section) return;
    if (window.location.hash !== `#${section.id}`) window.history.pushState(null, '', `#${section.id}`);
    section.focus({ preventScroll: true });
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    section.scrollIntoView({ behavior: reduced ? 'instant' : 'smooth', block: 'start' });
  }

  function calendarStart() {
    once('cm_partner_calendar_start');
  }

  function replaceSchedule(preset: TetPreset, fromCard = false) {
    if (activePreset === 'custom' && !window.confirm('Mẫu lịch sẽ thay thế các ngày bạn đã chọn. Bạn muốn tiếp tục?')) return;
    const selected = makeSchedule(preset);
    const free = summarizeSchedule(selected).free;
    setSchedule(selected);
    setActivePreset(preset);
    setScheduleOrigin(preset === 'clear' ? 'empty' : 'selected');
    setJourney(preset === 'clear' ? 'consult' : 'schedule');
    setValues((current) => ({ ...current, bookedDays: String(Math.min(defaults.bookedDays, free)) }));
    calendarStart();
    track('cm_partner_mode_select', { action: preset });
    if (fromCard) goTo(plannerRef.current);
  }

  function markDay(iso: TetDate) {
    if (scheduleOrigin !== 'sample' && schedule[iso] === mode) return;
    const selected = editSchedule(schedule, scheduleOrigin, iso, mode);
    const free = summarizeSchedule(selected).free;
    setSchedule(selected);
    setActivePreset('custom');
    setScheduleOrigin('selected');
    if (free > 0) setJourney('schedule');
    setValues((current) => ({ ...current, bookedDays: String(Math.min(Number(current.bookedDays), free)) }));
    calendarStart();
  }

  function changeAssumption(key: keyof typeof values, value: string) {
    setValues((current) => ({
      ...current,
      [key]: key === 'bookedDays' && Number(value) > stats.free ? String(stats.free) : value,
    }));
    setUsedCalculator(true);
    once('cm_partner_calculator_use', { action: key });
  }

  function normalizeAssumption(key: keyof typeof values) {
    if (values[key] !== '' && Number(values[key]) !== estimate[key]) changeAssumption(key, String(estimate[key]));
  }

  function changeMoneyInput(key: 'dailyRate' | 'monthlyCost', event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const typed = input.value;
    const caret = input.selectionStart ?? typed.length;
    let before = typed.slice(0, caret).replace(/\D/g, '');
    let after = typed.slice(caret).replace(/\D/g, '');
    const inputType = (event.nativeEvent as InputEvent).inputType;
    const removedSeparator = before + after === values[key] && typed.length < groupMoneyDigits(values[key]).length;
    if (removedSeparator && inputType === 'deleteContentBackward') before = before.slice(0, -1);
    if (removedSeparator && inputType === 'deleteContentForward') after = after.slice(1);

    const digits = (before + after).replace(/^0+(?=\d)/, '');
    const next = digits && /^\s*[-−]/.test(typed) ? '0' : digits;
    const formatted = groupMoneyDigits(next);
    if (typed !== formatted) {
      // Count from the right so regrouping the digits keeps the edit at the same place.
      let position = formatted.length;
      for (let remaining = after.length; remaining > 0 && position > 0;) {
        position--;
        if (formatted[position] !== '.') remaining--;
      }
      input.value = formatted;
      input.setSelectionRange(position, position);
    }
    changeAssumption(key, next);
  }

  function startForm(source: string) {
    once('cm_partner_form_open', { source });
  }

  function startConsultation() {
    setJourney('consult');
    setFormError('');
    startForm('hero_consult');
    goTo(signupRef.current);
  }

  function finishCalendar(source: string) {
    if (hasDates) once('cm_partner_calendar_complete', { source });
  }

  function scheduleLines(includeEstimate: boolean) {
    const list = (status: 'free' | 'hold') => stats.segments[status].map(segmentLabel).join('; ');
    const formatTime = (value: string) => `${value.slice(8, 10)}/${value.slice(5, 7)} ${value.slice(11)}`;
    return [
      `Rảnh ${stats.free} ngày: ${list('free')}.`,
      list('hold') ? `Giữ xe: ${list('hold')}.` : '',
      !stats.timeError && earliest ? `Có thể bàn giao xe sớm nhất: ${formatTime(earliest)}.` : '',
      !stats.timeError && latest ? `Cần nhận lại xe chậm nhất: ${formatTime(latest)}.` : '',
      includeEstimate ? `Tính thử: ${money(estimate.dailyRate)}/ngày × ${estimate.bookedDays} ngày × ${estimate.sharePercent}% → ${money(estimate.ownerShare)}.` : '',
    ].filter(Boolean);
  }

  function contactText(includeContact: boolean, includeDates = withDates && hasDates) {
    return [
      `HỢP TÁC CHỦ XE TẾT ${season.toLocaleUpperCase('vi-VN')} ${year} · CAR MATCH`,
      includeContact && owner.name.trim() ? `Họ tên: ${owner.name.trim()}` : '',
      includeContact && owner.phone.trim() ? `Điện thoại: ${phoneNumber(owner.phone)}` : '',
      owner.car.trim() ? `Xe: ${owner.car.trim()}${includeDates ? ` · Số lượng: ${owner.quantity || '1'}` : ''}` : '',
      includeDates && location ? `Khu vực: ${location}` : '',
      includeDates ? `Phương án muốn trao đổi: ${cooperationOptions[chosenOption]}` : 'Lịch xe: Chưa xác định hoặc chưa gửi lịch.',
      ...(includeDates ? scheduleLines(usedCalculator) : []),
      includeDates && multiple && fleetSchedule === 'same' ? 'Các xe cùng lịch.' : '',
      includeDates && multiple && fleetSchedule === 'different' ? `Mỗi xe có lịch riêng: ${fleetNotes.trim() || 'Cần trao đổi thêm'}.` : '',
      includeDates && owner.note.trim() ? `Ghi chú: ${owner.note.trim()}` : '',
    ].filter(Boolean).join('\n');
  }

  async function copyContext(text: string, locationName?: string) {
    if (locationName) {
      trackZaloClick(`tet_owner_${locationName}`, { lead_source: campaign.source });
      const { copied, opened } = await copyZaloContext(text);
      if (copied && opened) {
        notify('Đã sao chép thông tin xe và lịch. Bạn có thể dán vào Zalo.');
        return;
      }
      setFallback({ text, zalo: !opened });
      if (!reviewRef.current?.open) fallbackRef.current?.showModal();
      notify(copied ? 'Đã sao chép. Bạn có thể mở Zalo bằng liên kết bên dưới.' : 'Trình duyệt chưa cho phép sao chép tự động.');
      return;
    }
    if (await copyToClipboard(text)) {
      notify('Đã sao chép lịch xe và phương án tính thử.');
    } else {
      setFallback({ text, zalo: false });
      fallbackRef.current?.showModal();
    }
  }

  function openReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current) return;
    const phone = phoneNumber(owner.phone);
    if (!/^0\d{9}$/.test(phone) || !owner.name.trim() || !owner.car.trim()) {
      setFormError('Kiểm tra họ tên, số điện thoại Việt Nam và mẫu xe.');
      return;
    }
    if (withDates && (!hasDates || !location)) {
      setFormError('Chọn ít nhất một ngày xe rảnh và điền khu vực đỗ xe, hoặc chọn tư vấn khi chưa có lịch.');
      return;
    }
    if (withDates && stats.timeError) {
      setFormError(handoverErrors[stats.timeError]);
      return;
    }
    if (withDates && multiple && (!fleetSchedule || (fleetSchedule === 'different' && !fleetNotes.trim()))) {
      setFormError('Chọn các xe cùng lịch hay khác lịch. Với lịch khác nhau, hãy ghi rõ lịch từng xe.');
      return;
    }
    setFormError('');
    startForm('review');
    if (withDates) finishCalendar('review');
    const text = contactText(true);
    const details = leadSchedule({ stats, estimate: usedCalculator ? estimate : null, origin: scheduleOrigin, withDates,
      earliest, latest, fleet: multiple ? fleetSchedule : '', fleetNotes, option: chosenOption, preset: activePreset, modelGroup });
    const payload: LeadPayload = {
      source: 'partner', form_type: 'daily', name: owner.name.trim(), phone, car_model: owner.car.trim(),
      quantity: withDates ? (owner.quantity || '1') : '1', building: withDates ? location : undefined,
      note: contactText(false),
      tet_owner: details,
    };
    const fingerprint = JSON.stringify(payload);
    const key = leadKeys.current.get(fingerprint) ?? makeIdempotencyKey();
    leadKeys.current.set(fingerprint, key);
    if (confirmation?.key !== key) setConfirmation(null);
    setReview({ key, payload, text });
    setSendError('');
    setFallback(null);
    reviewRef.current?.showModal();
  }

  async function confirmLead() {
    if (!review || inFlight.current || confirmedKeys.current.has(review.key)) return;
    inFlight.current = true;
    setSending(true);
    setSendError('');
    const context = { lead_source: campaign.source, form_type: 'daily', schedule_status: reviewWithDates ? 'owner_selected' : 'unknown' };
    trackLeadSubmit('attempt', context);
    try {
      const result = await submitLead({ ...review.payload, idempotency_key: review.key });
      if (!result.ok) {
        trackLeadSubmit('error', context);
        setSendError(result.error || 'Chưa lưu được đăng ký. Bạn có thể thử gửi lại.');
        return;
      }
      if (!result.duplicate) trackLeadSubmit('success', context);
      confirmedKeys.current.add(review.key);
      setConfirmation({ key: review.key, requestId: result.requestId });
      reviewRef.current?.close();
      requestAnimationFrame(() => confirmationRef.current?.focus());
    } finally {
      inFlight.current = false;
      setSending(false);
    }
  }

  return <div className="tet-owner">
    <a href="#noi-dung" className="skip-link">Đến nội dung chính</a>
    <div className="topbar">XUÂN {season.toLocaleUpperCase('vi-VN')} {year} · MÙNG 1 TẾT: {tetDate}/{year} · CHUYÊN TRANG DÀNH CHO CHỦ XE</div>
    <header className="nav">
      <div className="wrap nav-in">
        <a className="logo" href="/" aria-label={`Car Match TẾT ${year}, về trang chủ`}>Car <span>Match</span> <small>TẾT {year}</small></a>
        <nav className="nav-links" aria-label="Điều hướng trang Tết">
          <a href="#phu-hop">Xe phù hợp</a><a href="#lich-tet">Chọn lịch Tết</a>
          <a href="#van-hanh">Quy trình</a><a href="#hoi-dap">Câu hỏi</a>
        </nav>
        <a className="btn btn-red" href="#dang-ky" onClick={() => startForm('nav')}>Đăng ký <span aria-hidden="true">↗</span></a>
      </div>
    </header>
    <main id="noi-dung" tabIndex={-1}>
      <section className="hero">
        <div className="wrap hero-grid">
          <div className="hero-copy">
            <h1><span className="pill hero-pill">Hợp tác chủ xe cho thuê Tết {year} tại Hà Nội</span><span className="hero-headline">Tết này có xe dư? <em>Để những ngày xe rảnh tạo thêm thu nhập.</em></span></h1>
            <p>Có xe thứ hai, xe dư hoặc nhiều xe? Bạn tự chọn ngày muốn cho thuê và ngày giữ xe cho gia đình. Car Match xem xét phương án theo từng xe và lịch bạn đề xuất.</p>
            <div className="hero-actions">
              <a className="btn btn-red" href="#lich-tet" onClick={() => trackCtaClick('tet_owner_calendar')}>Chọn lịch xe rảnh &amp; tính thử thu nhập</a>
              <button type="button" className="btn btn-light" onClick={() => void copyContext(contactText(false), 'hero')}>Nhận tư vấn hợp tác qua Zalo</button>
            </div>
            <div className="hero-consult">
              <a href="#dang-ky" onClick={(event) => { event.preventDefault(); startConsultation(); }}>Chưa có lịch? Đăng ký tư vấn trước <span aria-hidden="true">↗</span></a>
              <p>Trao đổi về phương án cho thuê, khoản thu dự kiến và điều kiện hợp tác trước khi quyết định giao xe.</p>
            </div>
            <div className="hero-tags">
              {['Ưu tiên xe rảnh xuyên Tết', 'Giữ ngày dùng cho gia đình', 'Thẩm định trước hợp tác'].map((tag) => <span className="pill" key={tag}>✓ {tag}</span>)}
            </div>
          </div>
          <figure className="hero-visual">
            <CampaignImage image="hero" alt={tetOwnerHero.alt} mainHero />
            <div className="hero-note"><b>Giữ Tết cho gia đình? Được.</b><span>Đánh dấu ngày cần xe, Car Match chỉ xem xét những khoảng còn rảnh.</span></div>
            <figcaption className="photo-caption">Ảnh minh họa không khí Tết.</figcaption>
          </figure>
        </div>
      </section>

      <div className="value-strip"><div className="wrap">
        <h2>Chủ xe được hỗ trợ gì khi hợp tác với Car Match?</h2>
        <div className="value-grid">
          {[
            ['↔', 'Kết nối khách thuê', 'Car Match đối chiếu nhu cầu của khách với mẫu xe và những ngày bạn mở lịch.'],
            ['◷', 'Chủ động lịch Tết', 'Bạn đề xuất ngày cho thuê và giữ riêng những ngày gia đình cần xe.'],
            ['✧', 'Hỗ trợ giao nhận', 'Hai bên thống nhất đầu mối giao nhận và ghi hiện trạng xe khi bàn giao.'],
            ['▣', 'Rõ khoản chủ xe nhận', 'Trao đổi trước về giá, phần chủ xe nhận, chi phí và kỳ thanh toán.'],
          ].map(([icon, title, copy]) => <div key={title}><span className="symbol" aria-hidden="true">{icon}</span><div><strong>{title}</strong><p>{copy}</p></div></div>)}
        </div>
      </div></div>

      <section className="section" id="phu-hop"><div className="wrap">
        <SectionHeading kicker="01 / Chọn đúng phương án" title="Bạn có thể dành xe cho thuê khoảng nào trong Tết?">
          Chủ xe tại Hà Nội có thể đề xuất lịch <strong>xuyên Tết, du xuân sau Tết hoặc trước Tết và theo từng chặng linh hoạt</strong>. Car Match xem hồ sơ, tình trạng xe và lịch trước khi trao đổi phương án.
        </SectionHeading>
        <div className="persona-grid">
          <article className={`card persona-card ${hasDates && activePreset === 'full' ? 'selected' : ''}`}>
            <CampaignImage image="vf6" alt="Xe điện VinFast màu trắng, minh họa nhóm xe rảnh xuyên Tết" />
            <div className="persona-body"><div className="ribbon">★ Ưu tiên thẩm định</div><h3>Xe rảnh xuyên Tết</h3>
              <p>Ưu tiên thẩm định xe rảnh liên tục cả cao điểm <strong>{dateSpan(campaign.peak)}</strong>, ví dụ <strong>{dateSpan(presets.full.free[0])}/{year}</strong>. Nếu chỉ rảnh qua giao thừa, hãy chọn đúng các ngày có thể bàn giao.</p>
              <button type="button" className="btn btn-outline" onClick={() => replaceSchedule('full', true)}>Chọn lịch xuyên Tết ↗</button>
            </div>
          </article>
          <article className={`card persona-card ${activePreset === 'duxuan' ? 'selected' : ''}`}>
            <CampaignImage image="vf5" alt="Xe điện VinFast màu xanh, minh họa cho thuê du xuân sau Tết" />
            <div className="persona-body"><div className="ribbon">Chặng đầu năm</div><h3>Cho thuê du xuân sau Tết</h3>
              <p>Nếu xe rảnh mùng 3, có thể đề xuất chặng <strong>mùng 3 đến mùng 10</strong> ({dateSpan(presets.duxuan.free[0])}). Giữ trọn mùng 3 thì bắt đầu từ mùng 4.</p>
              <button type="button" className="btn btn-outline" onClick={() => replaceSchedule('duxuan', true)}>Chọn lịch du xuân ↗</button>
            </div>
          </article>
          <article className={`card persona-card ${activePreset === 'before' || activePreset === 'family' ? 'selected' : ''}`}>
            <CampaignImage image="vf3" alt="VinFast VF3 minh họa xe rảnh trước Tết hoặc có lịch ngắt quãng" />
            <div className="persona-body"><div className="ribbon">Linh hoạt theo lịch</div><h3>Cho thuê trước Tết hoặc lịch linh hoạt</h3>
              <p>Chỉ rảnh trước Tết hoặc muốn giữ mùng 1–3? Chọn đúng lịch để Car Match xem xét <strong>các chặng thuê riêng</strong>.</p>
              <button type="button" className="btn btn-outline" onClick={() => replaceSchedule('before', true)}>Xem chặng trước Tết ↗</button>
            </div>
          </article>
        </div>
      </div></section>

      <section className="section planner" id="lich-tet" ref={plannerRef} tabIndex={-1}><div className="wrap">
        <SectionHeading kicker="02 / Lịch xe rảnh & phương án thu nhập" title="Chọn lịch xe rảnh. Xem phương án hợp tác Tết.">
          Đánh dấu ngày cho thuê, ngày giữ xe cho gia đình hoặc ngày chưa quyết định. Kết quả sẽ cập nhật theo khoảng ngày <strong>liên tục</strong> bạn chọn.
        </SectionHeading>
        <div className="planner-layout">
          <div className="calendar-wrap">
            <div className="cal-top">
              <div><div className="eyebrow">Bước 1</div><h3>Chọn lịch xe rảnh</h3><p className="tiny">Tết {season} · {dateSpan([firstDay, lastDay])}/{year}</p></div>
              <span className="pill">Mùng 1: {new Intl.DateTimeFormat('vi-VN', { weekday: 'long', timeZone: campaign.timeZone }).format(new Date(campaign.newYear + 'T00:00:00Z'))} {tetDate}</span>
            </div>
            <div className="schedule-status" data-origin={scheduleOrigin}>
              <p role="status">{scheduleOrigin === 'sample' ? `Lịch minh họa ${dateSpan(presets.full.free[0])}. Chọn dùng lịch mẫu hoặc bấm từng ngày để bắt đầu lịch riêng.` :
                hasDates ? 'Lịch bạn đã chọn để trao đổi với Car Match.' : 'Bạn chưa chọn ngày sẵn sàng cho thuê.'}</p>
              {scheduleOrigin === 'sample' && <button type="button" className="btn btn-outline" onClick={() => replaceSchedule('full')}>Dùng lịch mẫu này</button>}
            </div>
            <div className="legend">{(Object.keys(dayLabels) as DayStatus[]).map((state) => <span key={state}><span className={`dot ${state}`} aria-hidden="true">{daySymbols[state]}</span>{dayLabels[state]}</span>)}</div>
            <div className="mode-toggle" role="group" aria-label="Chọn cách đánh dấu ngày">
              {([['free', '+ Cho thuê'], ['hold', '♡ Giữ cho gia đình'], ['maybe', '? Chưa chắc']] as const).map(([state, label]) =>
                <button key={state} type="button" className={mode === state ? 'active' : ''} aria-pressed={mode === state}
                  onClick={() => { setMode(state); calendarStart(); }}>{label}</button>)}
            </div>
            <div className="preset-row" role="group" aria-label="Mẫu lịch Tết">
              {(Object.keys(presetLabels) as TetPreset[]).map((preset) => <button key={preset} type="button" data-preset={preset}
                aria-pressed={scheduleOrigin !== 'sample' && activePreset === preset} onClick={() => replaceSchedule(preset)}>{presetLabels[preset]}</button>)}
              <button type="button" data-preset="custom" aria-pressed={activePreset === 'custom'} onClick={() => {
                if (scheduleOrigin === 'sample') replaceSchedule('clear');
                setMode('free');
                calendarStart();
                plannerRef.current?.querySelector<HTMLButtonElement>('.day')?.focus();
              }}>Tự chọn lịch</button>
            </div>
            <div className="cal-week" aria-hidden="true">{weekdays.map((day) => <span key={day}>{day}</span>)}</div>
            <div className="cal-grid" role="group" aria-label="Lịch âm và dương" aria-describedby="tet-calendar-help">
              {Array.from({ length: leadingDays }, (_, index) => <span key={index} aria-hidden="true" />)}
              {days.map(([iso, lunar]) => <button key={iso} type="button" data-date={iso}
                className={`day ${schedule[iso]}${inRange(iso, campaign.peak) ? ' peak' : ''}`} aria-pressed={schedule[iso] === mode}
                aria-describedby={`status-${iso}`} onClick={() => markDay(iso)}>
                <b>{dateLabel(iso)}</b>{' '}<span>{lunar}</span><span className="day-symbol" aria-hidden="true">{daySymbols[schedule[iso]]}</span>
                <span hidden id={`status-${iso}`}>{dayLabels[schedule[iso]]}</span>
              </button>)}
            </div>
            <p id="tet-calendar-help" className="cal-hint">★ Giai đoạn trọng điểm {dateSpan(campaign.peak)}. Chọn cách đánh dấu rồi bấm vào từng ngày. Nếu có lịch ngoài khoảng trên, bạn có thể ghi thêm vào form.</p>
            <div className="calendar-summary" aria-live="polite">
              <h4>{scheduleOrigin === 'sample' ? 'Khoảng rảnh trong lịch minh họa' : 'Các khoảng rảnh liên tục'}</h4>
              {stats.free ? <ul>{stats.segments.free.map((segment) => <li key={segment.start}>{segmentLabel(segment)} · {segment.days} ngày</li>)}</ul> : <p>Chưa có ngày rảnh.</p>}
            </div>
            <div className="row2 time-fields">
              <div className="field"><label htmlFor="earliestHandover">Có thể bàn giao xe sớm nhất (tùy chọn)</label>
                <input id="earliestHandover" type="datetime-local" value={earliest}
                  min={firstFreeDate && `${firstFreeDate}T00:00`} max={firstFreeDate && `${firstFreeDate}T23:59`}
                  aria-describedby="tet-time-help" aria-invalid={stats.timeError === 'earliest' || stats.timeError === 'order'}
                  onChange={(event) => setEarliest(event.target.value)} /></div>
              <div className="field"><label htmlFor="latestReturn">Cần nhận lại xe chậm nhất (tùy chọn)</label>
                <input id="latestReturn" type="datetime-local" value={latest}
                  min={lastFreeDate && `${lastFreeDate}T00:00`} max={lastFreeDate && `${lastFreeDate}T23:59`}
                  aria-describedby="tet-time-help" aria-invalid={stats.timeError === 'latest' || stats.timeError === 'order'}
                  onChange={(event) => setLatest(event.target.value)} /></div>
            </div>
            <p id="tet-time-help" className="tiny time-fields-note">Giờ Việt Nam. Chọn giờ giao trong ngày rảnh đầu tiên và giờ nhận lại trong ngày rảnh cuối cùng. Khoảng giữa các chặng vẫn theo lịch đã đánh dấu. Nếu mỗi xe có lịch riêng, hai mốc này chỉ dùng cho xe tham khảo.</p>
            {stats.timeError && <p className="error-message" role="status">{handoverErrors[stats.timeError]}</p>}
          </div>
          <aside className="plan-side card">
            <div className="eyebrow">Bước 2</div><h3>Thông tin xe và giả định thu nhập</h3>
            <div className="field"><label htmlFor="vehicleGroup">Nhóm xe của bạn</label>
              <select id="vehicleGroup" value={modelGroup} onChange={(event) => { setModelGroup(event.target.value); once('cm_partner_calculator_use', { action: 'vehicle_group' }); }}>
                {vehicleUses.map(([group]) => <option key={group}>{group}</option>)}
              </select>
            </div>
            <details className="calc-car-details">
              <summary>Thêm mẫu xe và năm sản xuất</summary>
              <div className="field"><label htmlFor="carNameCalc">Mẫu xe, năm sản xuất (tùy chọn)</label>
                <input id="carNameCalc" maxLength={150} placeholder="Ví dụ: VF6 2025" value={owner.car}
                  onChange={(event) => { setOwner({ ...owner, car: event.target.value }); once('cm_partner_calculator_use', { action: 'car_model_field' }); }} />
              </div>
            </details>
            <div className="field"><label htmlFor="regionCalc">Khu vực xe đang đỗ (tùy chọn)</label>
              <RegionSelect id="regionCalc" value={region} onChange={(next) => { setRegion(next); once('cm_partner_calculator_use', { action: 'region' }); }} />
            </div>
            <div className="field"><label htmlFor="dailyRate">Đơn giá thuê/ngày muốn thử (VNĐ)</label>
              <input id="dailyRate" type="text" inputMode="numeric" value={groupMoneyDigits(values.dailyRate)}
                onChange={(event) => changeMoneyInput('dailyRate', event)} onBlur={() => normalizeAssumption('dailyRate')} />
              <div className="quick-picks" role="group" aria-label="Đơn giá minh họa">{campaign.sampleRates.map((rate) =>
                <button key={rate} type="button" aria-pressed={estimate.dailyRate === rate} onClick={() => changeAssumption('dailyRate', String(rate))}>{money(rate)}</button>)}</div>
              <div className="tiny">{money(estimate.dailyRate)}/ngày · mức minh họa tự chỉnh</div>
            </div>
            <div className="field"><label htmlFor="assumedDays">Số ngày giả định có khách</label>
              <input id="assumedDays" type="number" min="0" max={stats.free} inputMode="numeric" value={values.bookedDays} onChange={(event) => changeAssumption('bookedDays', event.target.value)} onBlur={() => normalizeAssumption('bookedDays')} />
              <div className="quick-picks" role="group" aria-label="Số ngày có khách minh họa">{[3, 5, 7].map((count) =>
                <button key={count} type="button" disabled={count > stats.free} aria-pressed={estimate.bookedDays === count} onClick={() => changeAssumption('bookedDays', String(count))}>{count} ngày</button>)}
                <button type="button" disabled={!stats.free} onClick={() => changeAssumption('bookedDays', String(stats.free))}>Tất cả ({stats.free})</button></div>
              <div className="tiny">Không vượt số ngày bạn đã mở cho thuê.</div>
            </div>
            <div className="calc-options">
              <div className="field"><label htmlFor="ownerSharePct">Tỷ lệ chủ xe nhận để tính thử (%)</label>
                <input id="ownerSharePct" type="number" min="0" max="100" step="any" inputMode="decimal" value={values.sharePercent} onChange={(event) => changeAssumption('sharePercent', event.target.value)} onBlur={() => normalizeAssumption('sharePercent')} />
                <div className="tiny">Tỷ lệ tùy chỉnh, dùng để tính thử.</div>
              </div>
              <div className="field"><label htmlFor="monthlyCost">Chi phí nuôi xe/tháng (tùy chọn)</label>
                <input id="monthlyCost" type="text" inputMode="numeric" placeholder="Ví dụ: 2.500.000" value={groupMoneyDigits(values.monthlyCost)}
                  onChange={(event) => changeMoneyInput('monthlyCost', event)} onBlur={() => normalizeAssumption('monthlyCost')} />
                <div className="tiny">Dùng để so sánh chi phí cố định bạn nhập.</div>
              </div>
            </div>
          </aside>
          <section className="plan-result card" aria-labelledby="tet-result-title">
            <div className="eyebrow">Bước 3</div><h3 id="tet-result-title">Kết quả mô phỏng</h3>
            <div className="plan-result-grid">
            <div>
              <div className="stats" aria-live="polite">
                {[[stats.free, 'Ngày có thể cho thuê'], [stats.longest, 'Ngày rảnh liền nhau'], [stats.peak, 'Ngày trong giai đoạn cao điểm'], [stats.hold, 'Ngày giữ cho gia đình']].map(([num, label]) =>
                  <div key={label}><b>{num}</b><span>{label}</span></div>)}
              </div>
              <p className="insight">{scheduleOrigin === 'sample' ? 'Số liệu đang tính theo lịch mẫu. Lịch mẫu sẽ không được gửi kèm đăng ký.'
                : stats.timeError ? 'Hãy chỉnh lại giờ giao nhận để xem xe rảnh trong giai đoạn nào.' : stats.insight}</p>
            </div>
            <div><div className="owner-revenue"><div className="tiny">Phần chủ xe theo tỷ lệ giả định</div>
              <strong id="estimatedOwnerShare" aria-live="polite">{money(estimate.ownerShare)}</strong><span>Trước chi phí riêng hoặc thuế có thể phát sinh</span>
            </div>
            {estimate.monthlyCost > 0 && <p className="cost-equivalent">Phần chủ xe theo giả định tương đương khoảng {numberFormatter.format(estimate.ownerShare / estimate.monthlyCost)} tháng chi phí cố định bạn đã nhập.</p>}
            <div className="est"><div><div className="tiny">Doanh thu gộp giả định</div><div className="tiny">Đơn giá × số ngày có khách</div></div><b id="estimatedGross">{money(estimate.gross)}</b></div>
            <p className="sec-note">Kết quả dùng để hình dung dòng tiền. Tỷ lệ chia, các khoản trừ và lịch khai thác sẽ được xác nhận khi hai bên thống nhất phương án.</p>
            </div></div>
            <div className="result-actions">
              <button className="btn btn-red" type="button" onClick={() => {
                setJourney(hasDates ? 'schedule' : 'consult');
                if (hasDates) { setUsedCalculator(true); finishCalendar('planner'); }
                startForm('planner'); goTo(signupRef.current);
              }}>{hasDates ? 'Nhận phương án thu nhập dành riêng cho xe của tôi' : 'Nhận tư vấn khi chưa có lịch'}</button>
              {hasDates && <button className="btn btn-outline" type="button" onClick={() => { finishCalendar('copy'); void copyContext(scheduleLines(true).join('\n')); }}>Sao chép lịch Tết đã chọn</button>}
            </div>
          </section>
        </div>
      </div></section>

      <section className="section" id="van-hanh"><div className="wrap">
        <SectionHeading kicker="03 / Bảo vệ xe dịp Tết" title="Gửi xe dịp Tết, chủ xe cần yên tâm về điều gì?">
          Thời gian thuê dài hơn và lịch nghỉ lễ khiến các điều khoản <strong>giao–trả và xử lý sự cố</strong> cần được làm rõ trước khi nhận xe.
        </SectionHeading>
        <div className="feature-grid">
          {protection.map(([icon, title, copy]) => <article className="card feature" key={title}>
            <div className="mini-icon" aria-hidden="true">{icon}</div><div><h3>{title}</h3><p>{copy}</p></div>
          </article>)}
        </div>
        <div className="trust-action">
          <div><strong>Những điều cần thống nhất trước khi giao xe</strong><p>Chốt ngày giờ giao và nhận lại, khoản chủ xe được nhận, các chi phí có thể phát sinh, phạm vi bảo hiểm, trách nhiệm mỗi bên, cách xử lý trả trễ và kỳ thanh toán. Hai bên đối chiếu hiện trạng và ghi lại theo biên bản 15 điểm.</p></div>
          <button className="btn btn-outline" type="button" onClick={() => {
            track('cm_partner_document_open', { document: 'checklist_15_diem' }); checklistRef.current?.showModal();
          }}>Xem biên bản đồng kiểm 15 điểm ↗</button>
        </div>
      </div></section>

      <section className="section story"><div className="wrap story-grid">
        <div><div className="eyebrow">04 / Xe nào nên đăng ký?</div><h2>Có xe rảnh liên tục? Hãy cho Car Match biết lịch và thông tin xe.</h2>
          <p>Car Match tiếp nhận thông tin xe tại Hà Nội. Khi thẩm định, hai bên đối chiếu giấy tờ, quyền cho thuê, năm sản xuất, hiện trạng xe và các ngày có thể bàn giao.</p>
          <div className="story-points">{vehicleUses.map(([title, copy], index) => <div className="story-point" key={title}><b aria-hidden="true">0{index + 1}</b><p><strong>{title}</strong><br />{copy}</p></div>)}</div>
          <a className="btn btn-light" href="#dang-ky" onClick={() => startForm('vehicles')}>Gửi thông tin xe &amp; lịch Tết ↗</a>
        </div>
        <figure className="story-gallery">
          <img src={`${assets}gallery-xpander.webp`} width="720" height="360" loading="lazy" decoding="async" alt="Xe Mitsubishi Xpander màu đen trong danh mục Car Match" />
          <img src={`${assets}gallery-mazda3.webp`} width="480" height="240" loading="lazy" decoding="async" alt="Sedan Mazda 3 màu xám trong danh mục Car Match" />
          <img src={`${assets}gallery-creta.webp`} width="480" height="240" loading="lazy" decoding="async" alt="Hyundai Creta màu đen trong danh mục Car Match" />
          <figcaption className="caption">Ảnh xe từ danh mục Car Match. Mỗi xe và lịch thuê được thẩm định riêng.</figcaption>
        </figure>
      </div></section>

      <section className="section" id="quy-trinh"><div className="wrap">
        <SectionHeading kicker={`05 / Lịch chuẩn bị Tết ${year}`} title={`4 mốc để chuẩn bị xe hợp tác Tết ${year}.`}>
          Đăng ký sớm giúp có thêm thời gian kiểm tra xe và phương án ghép lịch. Đây là các mốc gợi ý để chuẩn bị.
        </SectionHeading>
        <div className="steps">{timeline.map(([date, title, copy], index) => <article className="card step" key={title}>
          <div className="no" aria-hidden="true">0{index + 1}</div><div className="date-chip">{date}</div><h3>{title}</h3><p>{copy}</p>
        </article>)}</div>
      </div></section>

      <section className="section faq-section" id="hoi-dap"><div className="wrap faqs">
        <div><div className="eyebrow">06 / Giải đáp chủ xe</div><h2>Những câu hỏi cần rõ trước khi giao xe.</h2>
          <p className="muted">Tết là thời điểm khó thay đổi kế hoạch gia đình. Hãy xác nhận ngày nhận lại xe và trách nhiệm của hai bên trước khi ký.</p>
          <div className="faq-links">{articles.slice(0, 2).map(([title, href]) => <a href={href} key={href}>{title} ↗</a>)}<a href="/hop-tac">Hợp tác quanh năm ↗</a></div>
          <details className="more-articles"><summary>Đọc thêm hướng dẫn chủ xe</summary><div className="faq-links">
            {articles.slice(2).map(([title, href]) => <a href={href} key={href}>{title} ↗</a>)}
          </div></details>
        </div>
        <div className="faq-list">
          {tetOwnerFaq.map(({ question, answer }) => <details className="faq-item" key={question}><summary>{question}</summary><p>{answer}</p></details>)}
          <details className="faq-item faq-extension"><summary>Xem thêm câu hỏi về hợp tác</summary>
            <div className="faq-list">{tetOwnerMoreFaq.map(({ question, answer }) => <details className="faq-item" key={question}><summary>{question}</summary><p>{answer}</p></details>)}</div>
          </details>
        </div>
      </div></section>

      <section className="section signup" id="dang-ky" ref={signupRef} tabIndex={-1}><div className="wrap signup-grid">
        <aside className="signup-promo">
          <span className="pill">✿ Chào Xuân {season} {year}</span>
          <h2>{withDates ? 'Gửi lịch xe Tết để nhận phương án theo xe' : 'Chưa chốt lịch Tết? Trao đổi trước với Car Match.'}</h2>
          <p>{withDates
            ? 'Car Match xem mẫu xe, ngày bạn muốn cho thuê và giờ cần nhận lại để trao đổi phương án thu nhập và điều kiện giao nhận.'
            : 'Cho Car Match biết mẫu xe và cách liên hệ. Bạn có thể hỏi về cách tính khoản thu, điều kiện hợp tác và bổ sung lịch khi đã sắp xếp xong.'}</p>
          <div className="signup-prep"><strong>Thông tin nên chuẩn bị</strong><p>{withDates
            ? 'Mẫu và năm sản xuất, khu vực đỗ, ngày rảnh và giờ giao nhận nếu đã biết. Có nhiều xe, hãy ghi lịch riêng cho từng xe.'
            : 'Họ tên, số điện thoại hoặc Zalo và mẫu xe là đủ để bắt đầu trao đổi.'}</p></div>
          <button className="btn btn-light full-width" type="button" onClick={() => void copyContext(contactText(false), 'promo')}>Trao đổi trước qua Zalo ↗</button>
          <p className="signup-zalo-hint">{withDates && hasDates
            ? 'Trang sẽ thử sao chép lịch xe để bạn dán vào cuộc trò chuyện.'
            : 'Trang sẽ thử sao chép nội dung tư vấn để bạn dán vào cuộc trò chuyện.'}</p>
        </aside>
        <div className="card signup-card">
          <div className="eyebrow">Đăng ký hợp tác Tết</div><h3>{withDates ? 'Gửi lịch xe hợp tác Tết' : 'Đăng ký tư vấn hợp tác Tết'} {year}</h3>
          <p className="muted tiny">Gửi thông tin để được tư vấn trước. Bạn chưa cần cam kết giao xe ở bước này.</p>
          {confirmation && <div className="success-message" role="status" tabIndex={-1} ref={confirmationRef}>
            <strong>Car Match đã nhận đăng ký.</strong>
            {confirmation.requestId && <div>Mã yêu cầu <b>{confirmation.requestId}</b></div>}
            <div>Car Match sẽ liên hệ qua số điện thoại bạn cung cấp để trao đổi lịch, hồ sơ xe và điều kiện thẩm định.{confirmation.requestId && ' Bạn có thể dùng mã yêu cầu khi hỏi về đăng ký này.'}</div>
          </div>}
          <form id="ownerForm" onFocus={() => startForm('form_focus')} onSubmit={openReview}>
            <fieldset className="journey-choice"><legend>Tình trạng lịch xe</legend>
              <label><input type="radio" name="tet-journey" checked={!withDates} onChange={() => { setJourney('consult'); setFormError(''); }} /> Chưa có lịch, cần tư vấn</label>
              <label><input type="radio" name="tet-journey" checked={withDates} onChange={() => { setJourney('schedule'); setFormError(''); }} /> Đã có lịch xe</label>
            </fieldset>
            <div className="row2">
              <div className="field"><label htmlFor="ownerName">Họ và tên *</label><input id="ownerName" autoComplete="name" required maxLength={100} placeholder="Họ tên chủ xe" value={owner.name} onChange={(event) => setOwner({ ...owner, name: event.target.value })} /></div>
              <div className="field"><label htmlFor="ownerPhone">Số điện thoại / Zalo *</label><input id="ownerPhone" autoComplete="tel" type="tel" inputMode="tel" required maxLength={18} placeholder="09xx xxx xxx" value={owner.phone} onChange={(event) => setOwner({ ...owner, phone: event.target.value })} /></div>
            </div>
            <div className="row2">
              <div className="field"><label htmlFor="carName">Mẫu xe *</label><input id="carName" required maxLength={150} placeholder="Ví dụ: VF6 2025 / Xpander 2023" value={owner.car} onChange={(event) => setOwner({ ...owner, car: event.target.value })} /></div>
              {withDates && <div className="field"><label htmlFor="carCount">Số xe có thể hợp tác</label><input id="carCount" type="number" min="1" max="99" value={owner.quantity} onChange={(event) => setOwner({ ...owner, quantity: event.target.value })} /></div>}
            </div>
            {withDates && <>
            <div className="row2">
              <div className="field"><label htmlFor="ownerRegion">Khu vực xe đang đỗ *</label><RegionSelect id="ownerRegion" value={region} onChange={setRegion} required /></div>
              <div className="field"><label htmlFor="ownerType">Phương án muốn trao đổi</label><select id="ownerType" value={chosenOption} onChange={(event) => setOption(event.target.value as Option)}>
                {Object.entries(cooperationOptions).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select></div>
            </div>
            {region === regions[regions.length - 1] && <div className="field"><label htmlFor="otherRegion">Nhập khu vực xe đang đỗ *</label><input id="otherRegion" required maxLength={120} value={otherRegion} onChange={(event) => setOtherRegion(event.target.value)} /></div>}
            {multiple && <div className="field"><label htmlFor="fleetSchedule">Lịch của các xe *</label>
              <select id="fleetSchedule" required value={fleetSchedule} onChange={(event) => setFleetSchedule(event.target.value as FleetSchedule)}>
                <option value="">Chọn cách dùng lịch</option><option value="same">Các xe cùng lịch</option><option value="different">Mỗi xe có lịch riêng</option>
              </select>
            </div>}
            {usesReferenceVehicle && <div className="field"><label htmlFor="fleetNotes">Mẫu xe và lịch riêng của từng xe *</label>
              <textarea id="fleetNotes" required maxLength={700} value={fleetNotes} placeholder="Ví dụ: VF6 rảnh 04–12/02. Xpander rảnh 08–15/02."
                onChange={(event) => setFleetNotes(event.target.value)} />
              <p className="tiny">Ghi rõ giờ giao và nhận lại của từng xe nếu đã biết. Lịch và giờ chọn ở trên chỉ dùng cho xe tham khảo.</p>
            </div>}
            <div className="field"><label htmlFor="ownerNote">Ghi chú (nếu có)</label>
              <textarea id="ownerNote" maxLength={1200} placeholder="Ví dụ: cần lấy xe trước 10h hoặc có lịch ngoài khoảng Tết." value={owner.note} onChange={(event) => setOwner({ ...owner, note: event.target.value })} />
            </div>
            </>}
            <div className="summary-preview" id="formScheduleSummary" aria-live="polite">
              {!withDates ? <p><strong>Lịch xe:</strong> Chưa xác định. Có thể bổ sung sau khi được tư vấn.</p>
                : hasDates ? <>
                  <strong>{usesReferenceVehicle ? 'Lịch và giờ của một xe tham khảo' : 'Lịch xe gửi kèm'}</strong>
                  <ul>{scheduleLines(usedCalculator).map((line) => <li key={line}>{line}</li>)}</ul>
                  <a href="#lich-tet">Chỉnh lịch hoặc giờ giao nhận</a>
                </> : <p>Chưa có ngày sẵn sàng cho thuê. <a href="#lich-tet">Chọn lịch xe</a></p>}
            </div>
            {formError && <p className="error-message" role="alert">{formError}</p>}
            <div className="form-actions">
              <button className="btn btn-red" type="submit">{withDates ? 'Kiểm tra lịch xe trước khi gửi' : 'Kiểm tra thông tin tư vấn'}</button>
              <button className="btn btn-light" type="button" onClick={() => void copyContext(contactText(false), 'form')}>Sao chép &amp; mở Zalo</button>
            </div>
          </form>
        </div>
      </div></section>
    </main>

    <footer className="footer"><div className="wrap foot-flex">
      <div className="foot-company"><a className="logo" href="/">Car <span>Match</span></a><strong>{partnerContact.company}</strong>
        <p>Mã số thuế: {partnerContact.taxCode} · Trụ sở đăng ký: {partnerContact.registeredAddress}</p>
        <p>Hotline: <a href={`tel:${partnerContact.phone}`}>{partnerContact.phoneLabel}</a> · <a href={partnerContact.zalo} target="_blank" rel="noopener noreferrer">Zalo Car Match</a> · <a href={`mailto:${partnerContact.email}`}>{partnerContact.email}</a></p>
        <p>Khu vực hỗ trợ phối hợp giao nhận: {partnerContact.handoverAreas.join(', ')}. Địa điểm bàn giao cụ thể theo lịch đã xác nhận.</p>
      </div>
      <nav className="footlinks" aria-label="Liên kết cuối trang">
        <a href="/hop-tac">Hợp tác quanh năm</a><a href="/thue-xe-tu-lai-tet-ha-noi">Khách thuê xe Tết</a>
        <a href={articles[0][1]}>Hướng dẫn chủ xe</a><a href="/chinh-sach">Chính sách &amp; quyền riêng tư</a>
      </nav>
    </div></footer>

    <div className={`toast ${toast ? 'show' : ''}`} role="status">{toast}</div>
    <PartnerChecklistDialog ref={checklistRef} onDocument={() => track('cm_partner_document_open', { document: 'checklist_15_diem_full' })} />
    <PartnerDialog ref={reviewRef} id="reviewModal" aria-labelledby="reviewTitle" aria-busy={sending} onCancel={(event) => { if (inFlight.current) event.preventDefault(); }}
      onClose={() => setFallback(null)}>
      <div className="partner-dialog-top">
        <div><div className="eyebrow">Xác nhận trước khi gửi</div><h3 id="reviewTitle">{reviewWithDates ? 'Thông tin chủ xe và lịch Tết' : 'Thông tin đăng ký tư vấn'}</h3></div>
        <button className="partner-dialog-close" type="button" aria-label="Đóng" disabled={sending} onClick={() => reviewRef.current?.close()}>×</button>
      </div>
      {review && <pre>{review.text}</pre>}
      {sendError && <p role="alert" className="error-message">{sendError}</p>}
      {reviewWasSent && <p role="status">Yêu cầu này đã được Car Match tiếp nhận.</p>}
      <div className="partner-dialog-actions">
        <button className="partner-dialog-primary" type="button" onClick={() => void confirmLead()} disabled={sending || reviewWasSent}>
          {sending ? 'Đang gửi…' : sendError ? 'Thử gửi lại' : reviewWithDates ? 'Gửi đăng ký hợp tác Tết' : 'Gửi yêu cầu tư vấn'}
        </button>
        <button type="button" disabled={sending} onClick={() => reviewRef.current?.close()}>Quay lại chỉnh sửa</button>
        <button type="button" disabled={sending} onClick={() => { if (review) void copyContext(review.text, 'review'); }}>Sao chép &amp; mở Zalo</button>
      </div>
      {fallback && <CopyFallback text={fallback.text} zalo={fallback.zalo} />}
    </PartnerDialog>
    <PartnerDialog ref={fallbackRef} aria-labelledby="copyTitle" onClose={() => setFallback(null)}>
      <div className="partner-dialog-top"><h3 id="copyTitle">Sao chép thông tin xe và lịch</h3>
        <form method="dialog"><button className="partner-dialog-close" aria-label="Đóng">×</button></form>
      </div>
      {fallback && <CopyFallback text={fallback.text} zalo={fallback.zalo} />}
    </PartnerDialog>
  </div>;
}

function CopyFallback({ text, zalo }: { text: string; zalo: boolean }) {
  return <div className="copy-fallback">
    <label>Chọn và sao chép nội dung để dán vào cuộc trò chuyện.
      <textarea readOnly rows={6} value={text} onFocus={(event) => event.currentTarget.select()} />
    </label>
    {zalo && <div className="partner-dialog-actions"><a href={partnerContact.zalo} target="_blank" rel="noopener noreferrer">Mở Zalo Car Match ↗</a></div>}
  </div>;
}
