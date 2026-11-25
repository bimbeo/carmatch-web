import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { useSEO } from '@/hooks/useSEO';
import { submitLead, type LeadPayload } from '@/hooks/useLeads';
import {
  cooperationOptions, dateLabel, dateSpan, estimateIncome, inRange, makeSchedule,
  money, scheduleText, summarizeSchedule, tetOwnerCampaign as campaign, tetOwnerHero,
  type DayStatus, type TetDate, type TetPreset,
} from '@/data/tetOwnerCampaign';
import { tetOwnerFaq } from '@/data/tetOwnerFaq';
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
const vehicleGroups = ['Xe đô thị 4–5 chỗ', 'Sedan / SUV 5 chỗ', 'MPV / SUV 7 chỗ', 'Xe cao cấp / nhiều xe'];
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
  ['◷', 'Chốt giờ trả xe trước ngày bạn cần', 'Thống nhất giờ trả, điểm nhận lại và cách xử lý nếu trả trễ hoặc đổi lịch. Hai bên đồng kiểm lúc nhận lại xe theo lịch đã chốt.'],
  ['≋', 'Đối soát ETC & phát sinh sau chuyến', 'Đối chiếu VETC/ePass, phạt nguội và các khoản phát sinh theo chứng từ. Hai bên thống nhất trước điều kiện giữ hoặc hoàn cọc nếu áp dụng.'],
  ['⌁', 'GPS, bảo hiểm & hỗ trợ sự cố', 'Kiểm tra điều kiện định vị và phạm vi bảo hiểm theo từng xe. Car Match phối hợp với khách thuê và các bên liên quan nếu xảy ra sự cố.'],
];
const timeline = [
  [`Nên trước ${dateLabel(firstDay)} · ${firstLunar}`, 'Gửi lịch xe rảnh sớm', 'Cho biết mẫu/năm xe, khu vực đỗ và khoảng ngày có thể bàn giao. Có thể điều chỉnh lịch trước khi chốt hợp đồng.'],
  ['Trước khi chốt lịch thuê', 'Thẩm định & thống nhất phương án', 'Kiểm tra hồ sơ, tình trạng, bảo hiểm, khung giá, quyền sử dụng và các trách nhiệm bằng văn bản.'],
  [`${dateSpan(campaign.handover)} · 25–28 Chạp`, 'Đồng kiểm & bàn giao', 'Kiểm tra 15 điểm, chụp hiện trạng, ODO, pin/xăng và phụ kiện tại địa điểm hai bên đã xác nhận.'],
  ['Theo lịch đã thống nhất', 'Nhận lại & đối soát', 'Hoàn trả theo chuyến đã chốt, đồng kiểm, đối chiếu ETC và xử lý phát sinh. Thanh toán theo hợp đồng.'],
];

function SectionHeading({ kicker, title, children }: { kicker: string; title: string; children: ReactNode }) {
  return <div className="sec-heading"><div className="sec-title"><div className="eyebrow">{kicker}</div><h2>{title}</h2></div><p>{children}</p></div>;
}

function CampaignImage({ image, alt, mainHero = false }: { image: 'hero' | 'vf6' | 'vf5' | 'vf3'; alt: string; mainHero?: boolean }) {
  const hero = image === 'hero';
  const sizes = hero ? tetOwnerHero.sizes : '(max-width: 760px) calc(100vw - 36px), (max-width: 1240px) 32vw, 390px';
  return <img alt={alt} src={hero ? tetOwnerHero.src : `${assets}${image}-720.webp`}
    srcSet={hero ? tetOwnerHero.srcSet : [390, 720].map((width) => `${assets}${image}-${width}.webp ${width}w`).join(', ')}
    sizes={sizes} width={hero ? 1536 : 720} height={{ hero: 1024, vf6: 514, vf5: 522, vf3: 530 }[image]}
    {...(mainHero ? { fetchpriority: 'high' } : {})} loading={mainHero ? 'eager' : 'lazy'} decoding={mainHero ? 'auto' : 'async'} />;
}

function RegionSelect({ id, value, onChange, required }: { id: string; value: string; onChange: (value: string) => void; required?: boolean }) {
  return <select id={id} value={value} onChange={(event) => onChange(event.target.value)} required={required}>
    <option value="">Chọn khu vực</option>
    {regions.map((region) => <option key={region}>{region}</option>)}
  </select>;
}

const initialOwner = { name: '', phone: '', car: '', quantity: '1', note: '', consent: false };
type Option = keyof typeof cooperationOptions;
type Review = { key: string; text: string; payload: LeadPayload };
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
  const [planned, setPlanned] = useState(false);
  const [modelGroup, setModelGroup] = useState(vehicleGroups[1]);
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
  const [hasSent, setHasSent] = useState(false);
  const [toast, setToast] = useState('');
  const [fallback, setFallback] = useState<{ text: string; zalo: boolean } | null>(null);
  const [showMobileCTA, setShowMobileCTA] = useState(true);
  const plannerRef = useRef<HTMLElement>(null);
  const signupRef = useRef<HTMLElement>(null);
  const reviewRef = useRef<HTMLDialogElement>(null);
  const checklistRef = useRef<HTMLDialogElement>(null);
  const fallbackRef = useRef<HTMLDialogElement>(null);
  const confirmationRef = useRef<HTMLParagraphElement>(null);
  const toastTimer = useRef<number>();
  const leadKeys = useRef(new Map<string, string>());
  const confirmedKeys = useRef(new Set<string>());
  const inFlight = useRef(false);
  const actions = useRef(new Set<string>());

  const stats = summarizeSchedule(schedule);
  const estimate = estimateIncome(values, stats.free);
  const chosenOption = option || (Number(owner.quantity) > 1 ? 'multi' : stats.option);
  const location = region === regions[regions.length - 1] ? otherRegion.trim() : region;
  const summary = scheduleText(stats, estimate);
  const reviewWasSent = Boolean(review && confirmedKeys.current.has(review.key));

  useEffect(() => {
    const planner = plannerRef.current;
    if (!planner || !('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(([entry]) => {
      setShowMobileCTA(!entry.isIntersecting && entry.boundingClientRect.top > 0);
    }, { threshold: 0 });
    observer.observe(planner);
    return () => observer.disconnect();
  }, []);
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
    setPlanned(true);
    setValues((current) => ({ ...current, bookedDays: String(Math.min(defaults.bookedDays, free)) }));
    calendarStart();
    track('cm_partner_mode_select', { action: preset });
    if (fromCard) goTo(plannerRef.current);
  }

  function markDay(iso: TetDate) {
    if (schedule[iso] === mode) return;
    const selected = { ...schedule, [iso]: mode };
    const free = summarizeSchedule(selected).free;
    setSchedule(selected);
    setActivePreset('custom');
    setPlanned(true);
    setValues((current) => ({ ...current, bookedDays: String(Math.min(Number(current.bookedDays), free)) }));
    calendarStart();
  }

  function changeAssumption(key: keyof typeof values, value: string) {
    setValues((current) => ({
      ...current,
      [key]: key === 'bookedDays' && Number(value) > stats.free ? String(stats.free) : value,
    }));
    once('cm_partner_calculator_use', { action: key });
  }

  function startForm(source: string) {
    once('cm_partner_form_open', { source });
  }

  function finishCalendar(source: string) {
    if (stats.free || stats.hold || planned) once('cm_partner_calendar_complete', { source });
  }

  function contactText(includeContact: boolean) {
    return [
      `HỢP TÁC CHỦ XE TẾT ${season.toLocaleUpperCase('vi-VN')} ${year} · CAR MATCH`,
      includeContact && owner.name.trim() ? `Họ tên: ${owner.name.trim()}` : '',
      includeContact && owner.phone.trim() ? `Điện thoại: ${phoneNumber(owner.phone)}` : '',
      `Xe: ${owner.car.trim() || modelGroup} · Số lượng: ${owner.quantity || '1'}`,
      `Khu vực: ${location || 'Chưa chọn'}`,
      `Phương án: ${cooperationOptions[chosenOption]}`,
      summary,
      Number(owner.quantity) > 1 ? 'Lịch đã chọn là lịch tham khảo. Cần trao đổi lịch riêng của từng xe.' : '',
      owner.note.trim() ? `Ghi chú: ${owner.note.trim()}` : '',
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
    if (!/^0\d{9}$/.test(phone) || !owner.name.trim() || !owner.car.trim() || !location || !owner.consent) {
      setFormError('Kiểm tra họ tên, số điện thoại Việt Nam, mẫu xe, khu vực và đồng ý liên hệ trước khi gửi.');
      return;
    }
    setFormError('');
    startForm('review');
    finishCalendar('review');
    const text = contactText(true);
    const details = {
      version: 1,
      campaign: campaign.source,
      contact_consent: true,
      preset: activePreset,
      declared_option: chosenOption,
      schedule_class: stats.option,
      lead_class: Number(owner.quantity) > 1 ? 'multi' : stats.option,
      schedule_scope: Number(owner.quantity) > 1 ? 'reference_for_discussion' : 'single_vehicle',
      time_zone: campaign.timeZone,
      segments: stats.segments,
      calculator: { ...estimate, vehicle_group: modelGroup },
    };
    const payload: LeadPayload = {
      source: 'partner', form_type: 'daily', name: owner.name.trim(), phone, car_model: owner.car.trim(),
      quantity: owner.quantity || '1', building: location,
      duration: `${stats.free} ngày rảnh`,
      note: `lead_source=${campaign.source}\nsource_page=${canonical}\n${text}\n\n[TET_OWNER_V1]\n${JSON.stringify(details)}`,
    };
    const fingerprint = JSON.stringify(payload);
    const key = leadKeys.current.get(fingerprint) ?? makeIdempotencyKey();
    leadKeys.current.set(fingerprint, key);
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
    trackLeadSubmit('attempt', { lead_source: campaign.source, form_type: 'daily' });
    try {
      const result = await submitLead({ ...review.payload, idempotency_key: review.key });
      if (!result.ok) {
        trackLeadSubmit('error', { lead_source: campaign.source, form_type: 'daily' });
        setSendError(result.error || 'Chưa lưu được đăng ký. Bạn có thể thử gửi lại.');
        return;
      }
      if (!result.duplicate) trackLeadSubmit('success', { lead_source: campaign.source, form_type: 'daily' });
      confirmedKeys.current.add(review.key);
      setHasSent(true);
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
        <a className="logo" href="/" aria-label={`CarMatch TẾT ${year}, về trang chủ`}>Car<span>Match</span> <small>TẾT {year}</small></a>
        <nav className="nav-links" aria-label="Điều hướng trang Tết">
          <a href="#phu-hop">Xe phù hợp</a><a href="#lich-tet">Chọn lịch Tết</a>
          <a href="#van-hanh">Quy trình</a><a href="#hoi-dap">Câu hỏi</a>
        </nav>
        <a className="btn btn-red" href="#dang-ky" onClick={() => startForm('nav')}>Gửi lịch xe <span aria-hidden="true">↗</span></a>
      </div>
    </header>
    <main id="noi-dung" tabIndex={-1}>
      <section className="hero">
        <div className="wrap hero-grid">
          <div className="hero-copy">
            <span className="pill hero-pill">✿ Hợp tác chủ xe Tết {season} {year}</span>
            <h1>Tết này có xe dư? <em>Để những ngày xe rảnh tạo thêm thu nhập.</em></h1>
            <p>Bạn có xe thứ hai, xe gia đình không sử dụng trong kỳ nghỉ hoặc nhiều xe sẵn sàng khai thác? Chọn ngày có thể bàn giao và ngày cần giữ xe. Car Match sẽ xem xét phương án hợp tác theo lịch thực tế của bạn.</p>
            <div className="hero-actions">
              <a className="btn btn-red" href="#lich-tet" onClick={() => trackCtaClick('tet_owner_calendar')}>Chọn lịch xe rảnh Tết ↗</a>
              <button type="button" className="btn btn-light" onClick={() => void copyContext(contactText(false), 'hero')}>Tư vấn qua Zalo ↗</button>
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

      <div className="value-strip"><div className="wrap value-grid">
        {[
          ['◷', 'Lịch xe do bạn chủ động đề xuất', 'Đánh dấu rõ ngày rảnh và ngày muốn sử dụng.'],
          ['▣', 'Phương án theo từng xe', 'Giá, kỳ thuê và trách nhiệm được đối chiếu trước.'],
          ['✧', 'Bàn giao có chứng từ', 'Ghi nhận hiện trạng, km, pin/xăng và phụ kiện.'],
        ].map(([icon, title, copy]) => <div key={title}><span className="symbol" aria-hidden="true">{icon}</span><div><strong>{title}</strong><p>{copy}</p></div></div>)}
      </div></div>

      <section className="section" id="phu-hop"><div className="wrap">
        <SectionHeading kicker="01 / Chọn đúng phương án" title="Bạn có thể dành xe cho thuê khoảng nào trong Tết?">
          Khoảng ngày <strong>liền mạch</strong> thường thuận tiện hơn để ghép khách. Nếu chỉ rảnh một phần kỳ nghỉ, bạn vẫn có thể gửi lịch để Car Match đánh giá.
        </SectionHeading>
        <div className="persona-grid">
          <article className={`card persona-card ${activePreset === 'full' ? 'selected' : ''}`}>
            <CampaignImage image="vf6" alt="Xe điện VinFast màu trắng, minh họa nhóm xe rảnh xuyên Tết" />
            <div className="persona-body"><div className="ribbon">★ Ưu tiên thẩm định</div><h3>Xe rảnh xuyên Tết</h3>
              <p>Bàn giao một lần trước Tết, cho thuê liên tục qua giao thừa, ví dụ <strong>{dateSpan(presets.full.free[0])}/{year}</strong>. Phù hợp với xe thứ hai, xe dư hoặc đội xe.</p>
              <button type="button" className="btn btn-outline" onClick={() => replaceSchedule('full', true)}>Chọn lịch xuyên Tết ↗</button>
            </div>
          </article>
          <article className={`card persona-card ${activePreset === 'duxuan' ? 'selected' : ''}`}>
            <CampaignImage image="vf5" alt="Xe điện VinFast màu xanh, minh họa cho thuê du xuân sau Tết" />
            <div className="persona-body"><div className="ribbon">Chặng đầu năm</div><h3>Cho thuê du xuân sau Tết</h3>
              <p>Gia đình dùng xe đầu năm rồi bàn giao một chặng liên tục từ <strong>mùng 3 đến mùng 10</strong> ({dateSpan(presets.duxuan.free[0])}). Giảm việc giao nhận giữa các ngày Tết.</p>
              <button type="button" className="btn btn-outline" onClick={() => replaceSchedule('duxuan', true)}>Chọn lịch du xuân ↗</button>
            </div>
          </article>
          <article className={`card persona-card ${activePreset === 'before' || activePreset === 'family' ? 'selected' : ''}`}>
            <CampaignImage image="vf3" alt="VinFast VF3 minh họa xe rảnh trước Tết hoặc có lịch ngắt quãng" />
            <div className="persona-body"><div className="ribbon">Linh hoạt theo lịch</div><h3>Trước Tết hoặc lịch ngắt quãng</h3>
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
              <h3>Tết {season} · {dateSpan([firstDay, lastDay])}/{year}</h3>
              <span className="pill">Mùng 1: {new Intl.DateTimeFormat('vi-VN', { weekday: 'long', timeZone: campaign.timeZone }).format(new Date(campaign.newYear + 'T00:00:00Z'))} {tetDate}</span>
            </div>
            <div className="legend">{Object.entries(dayLabels).map(([state, label]) => <span key={state}><span className={`dot ${state}`} aria-hidden="true" />{label}</span>)}</div>
            <div className="mode-toggle" role="group" aria-label="Chọn cách đánh dấu ngày">
              {([['free', '+ Cho thuê'], ['hold', '♡ Giữ cho gia đình'], ['maybe', '? Chưa chắc']] as const).map(([state, label]) =>
                <button key={state} type="button" className={mode === state ? 'active' : ''} aria-pressed={mode === state}
                  onClick={() => { setMode(state); calendarStart(); }}>{label}</button>)}
            </div>
            <div className="preset-row" role="group" aria-label="Mẫu lịch Tết">
              {(Object.keys(presetLabels) as TetPreset[]).map((preset) => <button key={preset} type="button" data-preset={preset}
                aria-pressed={activePreset === preset} onClick={() => replaceSchedule(preset)}>{presetLabels[preset]}</button>)}
              <button type="button" data-preset="custom" aria-pressed={activePreset === 'custom'} onClick={() => {
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
                <b>{dateLabel(iso)}</b>{' '}<span>{lunar}</span>
                <span hidden id={`status-${iso}`}>{dayLabels[schedule[iso]]}</span>
              </button>)}
            </div>
            <p id="tet-calendar-help" className="cal-hint">★ Giai đoạn trọng điểm {dateSpan(campaign.peak)}. Chọn cách đánh dấu rồi bấm vào từng ngày. Nếu có lịch ngoài khoảng trên, bạn có thể ghi thêm vào form.</p>
          </div>
          <aside className="plan-side card">
            <div className="eyebrow">Tóm tắt lịch của bạn</div><h3>Khả năng đưa xe vào hợp tác</h3>
            <div className="stats" aria-live="polite">
              {[[stats.free, 'Ngày có thể cho thuê'], [stats.longest, 'Ngày rảnh liền nhau'], [stats.peak, 'Ngày trong giai đoạn cao điểm'], [stats.hold, 'Ngày giữ cho gia đình']].map(([num, label]) =>
                <div key={label}><b>{num}</b><span>{label}</span></div>)}
            </div>
            <div className="insight">{stats.insight}</div>
            <div className="field"><label htmlFor="vehicleGroup">Nhóm xe của bạn</label>
              <select id="vehicleGroup" value={modelGroup} onChange={(event) => { setModelGroup(event.target.value); once('cm_partner_calculator_use', { action: 'vehicle_group' }); }}>
                {vehicleGroups.map((group) => <option key={group}>{group}</option>)}
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
              <input id="dailyRate" type="number" min="0" max="100000000" inputMode="numeric" value={values.dailyRate} onChange={(event) => changeAssumption('dailyRate', event.target.value)} />
              <div className="tiny">{money(estimate.dailyRate)}/ngày · bạn có thể thay đổi mức giả định</div>
            </div>
            <div className="field"><label htmlFor="assumedDays">Số ngày giả định có khách</label>
              <input id="assumedDays" type="number" min="0" max={stats.free} inputMode="numeric" value={values.bookedDays} onChange={(event) => changeAssumption('bookedDays', event.target.value)} />
              <div className="tiny">Không vượt số ngày bạn đã mở cho thuê.</div>
            </div>
            <div className="calc-options">
              <div className="field"><label htmlFor="ownerSharePct">Tỷ lệ chủ xe nhận để tính thử (%)</label>
                <input id="ownerSharePct" type="number" min="0" max="100" step="any" inputMode="decimal" value={values.sharePercent} onChange={(event) => changeAssumption('sharePercent', event.target.value)} />
                <div className="tiny">Tỷ lệ tùy chỉnh, dùng để tính thử.</div>
              </div>
              <div className="field"><label htmlFor="monthlyCost">Chi phí nuôi xe/tháng (tùy chọn)</label>
                <input id="monthlyCost" type="number" min="0" max="200000000" inputMode="numeric" placeholder="Ví dụ: 2.500.000" value={values.monthlyCost} onChange={(event) => changeAssumption('monthlyCost', event.target.value)} />
                <div className="tiny">Dùng để so sánh chi phí cố định bạn nhập.</div>
              </div>
            </div>
            <div className="owner-revenue"><div className="tiny">Phần chủ xe theo tỷ lệ giả định</div>
              <strong id="estimatedOwnerShare" aria-live="polite">{money(estimate.ownerShare)}</strong><span>Trước chi phí riêng hoặc thuế có thể phát sinh</span>
            </div>
            {estimate.monthlyCost > 0 && <p className="cost-equivalent">Phần chủ xe theo giả định tương đương khoảng {numberFormatter.format(estimate.ownerShare / estimate.monthlyCost)} tháng chi phí cố định bạn đã nhập.</p>}
            <div className="est"><div><div className="tiny">Doanh thu gộp giả định</div><div className="tiny">Đơn giá × số ngày có khách</div></div><b id="estimatedGross">{money(estimate.gross)}</b></div>
            <p className="sec-note">Kết quả dùng để hình dung dòng tiền. Tỷ lệ chia, các khoản trừ và lịch khai thác sẽ được xác nhận khi hai bên thống nhất phương án.</p>
            <button className="btn btn-red full-width" type="button" onClick={() => { finishCalendar('planner'); startForm('planner'); goTo(signupRef.current); }}>Gửi lịch xe để nhận phương án hợp tác ↗</button>
            <button className="btn btn-outline full-width copy-schedule" type="button" onClick={() => { finishCalendar('copy'); void copyContext(summary); }}>Sao chép lịch Tết đã chọn</button>
          </aside>
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
          <div><strong>Xem quy trình đồng kiểm trước khi giao xe</strong><p>Mẫu kiểm tra 15 điểm giúp chủ xe biết những thông tin nào sẽ được đối chiếu và lưu lại khi bàn giao.</p></div>
          <button className="btn btn-outline" type="button" onClick={() => {
            track('cm_partner_document_open', { document: 'checklist_15_diem' }); checklistRef.current?.showModal();
          }}>Xem biên bản đồng kiểm 15 điểm ↗</button>
        </div>
      </div></section>

      <section className="section story"><div className="wrap story-grid">
        <div><div className="eyebrow">04 / Xe nào nên đăng ký?</div><h2>Có xe rảnh liên tục? Hãy cho Car Match biết lịch và thông tin xe.</h2>
          <p>Car Match tiếp nhận thông tin xe điện, sedan, CUV/SUV và xe 7 chỗ tại Hà Nội. Xe có thể cho thuê xuyên Tết thường phù hợp hơn với hợp tác theo kỳ. Xe chỉ rảnh vài ngày sẽ được xem xét theo lịch cụ thể.</p>
          <div className="story-points">{[
            ['Chủ xe có xe thứ hai hoặc nhiều xe', 'đề xuất lịch bàn giao liên tục và số lượng xe có thể cung cấp.'],
            ['Xe gia đình không dùng dịp Tết', 'đánh dấu thời điểm lấy xe về trước ngày cần sử dụng.'],
            ['Xe chỉ rảnh trước/sau Tết', 'gửi lịch để kiểm tra nhu cầu phù hợp với từng chặng.'],
          ].map(([title, copy], index) => <div className="story-point" key={title}><b aria-hidden="true">0{index + 1}</b><p><strong>{title}:</strong> {copy}</p></div>)}</div>
          <a className="btn btn-light" href="#dang-ky" onClick={() => startForm('vehicles')}>Gửi thông tin xe &amp; lịch Tết ↗</a>
        </div>
        <figure className="story-gallery">
          <CampaignImage image="hero" alt={tetOwnerHero.alt} />
          <CampaignImage image="vf6" alt="Xe VinFast màu trắng trong khu vực đỗ xe" />
          <CampaignImage image="vf5" alt="Xe điện VinFast màu xanh" />
          <figcaption className="caption">Ảnh minh họa nhóm xe và không khí Tết. Việc tiếp nhận xe và lịch thuê sẽ được xác nhận riêng.</figcaption>
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
        <div className="faq-list">{tetOwnerFaq.map(({ question, answer }) => <details className="faq-item" key={question}><summary>{question}</summary><p>{answer}</p></details>)}</div>
      </div></section>

      <section className="section signup" id="dang-ky" ref={signupRef} tabIndex={-1}><div className="wrap signup-grid">
        <aside className="signup-promo">
          <span className="pill">✿ Chào Xuân {season} {year}</span><h2>Gửi lịch xe Tết. Car Match kiểm tra phương án phù hợp.</h2>
          <p>Bạn được chọn ngày rảnh, ngày gia đình giữ xe và khoảng còn cân nhắc. Chúng tôi tiếp nhận thông tin để tư vấn phương án theo xe và lịch thực tế.</p>
          <div className="signup-prep"><strong>Thông tin nên chuẩn bị</strong><p>Ảnh xe, mẫu/năm xe, đăng kiểm, bảo hiểm và khoảng thời gian rảnh. Có nhiều xe, bạn có thể ghi thêm lịch riêng cho từng xe.</p></div>
          <button className="btn btn-light full-width" type="button" onClick={() => void copyContext(contactText(false), 'promo')}>Trao đổi trước qua Zalo ↗</button>
          <p className="signup-zalo-hint">Khi nhấn, trang sẽ thử sao chép lịch đã chọn để bạn dán vào cuộc trò chuyện.</p>
        </aside>
        <div className="card signup-card">
          <div className="eyebrow">Đăng ký hợp tác Tết</div><h3>Đăng ký xe hợp tác Tết {year}</h3>
          <p className="muted tiny">Bạn có thể xem lại thông tin liên hệ, lịch xe và phần tính thử trước khi gửi cho Car Match.</p>
          {hasSent && <p className="success-message" role="status" tabIndex={-1} ref={confirmationRef}>Car Match đã nhận đăng ký và sẽ liên hệ qua số điện thoại bạn cung cấp.</p>}
          <form id="ownerForm" onFocus={() => startForm('form_focus')} onSubmit={openReview}>
            <div className="row2">
              <div className="field"><label htmlFor="ownerName">Họ và tên *</label><input id="ownerName" autoComplete="name" required maxLength={100} placeholder="Họ tên chủ xe" value={owner.name} onChange={(event) => setOwner({ ...owner, name: event.target.value })} /></div>
              <div className="field"><label htmlFor="ownerPhone">Số điện thoại / Zalo *</label><input id="ownerPhone" autoComplete="tel" type="tel" inputMode="tel" required maxLength={18} placeholder="09xx xxx xxx" value={owner.phone} onChange={(event) => setOwner({ ...owner, phone: event.target.value })} /></div>
            </div>
            <div className="row2">
              <div className="field"><label htmlFor="carName">Mẫu xe, năm sản xuất *</label><input id="carName" required maxLength={150} placeholder="Ví dụ: VF6 2025 / Xpander 2023" value={owner.car} onChange={(event) => setOwner({ ...owner, car: event.target.value })} /></div>
              <div className="field"><label htmlFor="carCount">Số xe có thể hợp tác</label><input id="carCount" type="number" min="1" max="99" value={owner.quantity} onChange={(event) => setOwner({ ...owner, quantity: event.target.value })} /></div>
            </div>
            <div className="row2">
              <div className="field"><label htmlFor="ownerRegion">Khu vực xe đang đỗ *</label><RegionSelect id="ownerRegion" value={region} onChange={setRegion} required /></div>
              <div className="field"><label htmlFor="ownerType">Phương án muốn trao đổi</label><select id="ownerType" value={chosenOption} onChange={(event) => setOption(event.target.value as Option)}>
                {Object.entries(cooperationOptions).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select></div>
            </div>
            {region === regions[regions.length - 1] && <div className="field"><label htmlFor="otherRegion">Nhập khu vực xe đang đỗ *</label><input id="otherRegion" required maxLength={120} value={otherRegion} onChange={(event) => setOtherRegion(event.target.value)} /></div>}
            <div className="field"><label htmlFor="ownerNote">Ghi chú (nếu có)</label>
              <textarea id="ownerNote" maxLength={1800} placeholder="Ví dụ: cần lấy xe trước 10h, có lịch ngoài khoảng Tết hoặc mỗi xe có lịch khác nhau…" value={owner.note} onChange={(event) => setOwner({ ...owner, note: event.target.value })} />
            </div>
            {Number(owner.quantity) > 1 && <p className="tiny">Nếu các xe có lịch khác nhau, ghi mẫu xe và từng khoảng ngày vào ghi chú. Lịch dưới đây chỉ dùng để trao đổi ban đầu.</p>}
            <div className="summary-preview" id="formScheduleSummary">
              {location ? `Khu vực: ${location}\n` : ''}{summary}
            </div>
            <label className="consent-check"><input id="consent" type="checkbox" required checked={owner.consent} onChange={(event) => setOwner({ ...owner, consent: event.target.checked })} />
              <span>Tôi đồng ý để Car Match dùng thông tin đã cung cấp để liên hệ tư vấn theo <a href="/chinh-sach">chính sách quyền riêng tư</a>.</span>
            </label>
            {formError && <p className="error-message" role="alert">{formError}</p>}
            <div className="form-actions">
              <button className="btn btn-red" type="submit">Xem lại đăng ký ↗</button>
              <button className="btn btn-light" type="button" onClick={() => void copyContext(contactText(false), 'form')}>Sao chép &amp; mở Zalo</button>
            </div>
          </form>
        </div>
      </div></section>
    </main>

    <footer className="footer"><div className="wrap foot-flex">
      <div className="foot-company"><div className="logo">Car<span>Match</span></div><strong>{partnerContact.company}</strong>
        <p>Mã số thuế: {partnerContact.taxCode} · Trụ sở đăng ký: {partnerContact.registeredAddress}</p>
        <p>Hotline/Zalo: <a href={`tel:${partnerContact.phone}`}>{partnerContact.phoneLabel}</a> · <a href={`mailto:${partnerContact.email}`}>{partnerContact.email}</a> · carmatch.vn</p>
        <p>Khu vực hỗ trợ phối hợp giao nhận: {partnerContact.handoverAreas.join(', ')}. Địa điểm bàn giao cụ thể theo lịch đã xác nhận.</p>
      </div>
      <nav className="footlinks" aria-label="Liên kết cuối trang">
        <a href="/hop-tac">Hợp tác quanh năm</a><a href="/thue-xe-tu-lai-tet-ha-noi">Khách thuê xe Tết</a>
        <a href={articles[0][1]}>Hướng dẫn chủ xe</a><a href="/chinh-sach">Chính sách &amp; quyền riêng tư</a>
      </nav>
    </div></footer>

    {showMobileCTA && <div className="mobile-cta"><a href="#lich-tet">Chọn ngày cho thuê Tết {year} ↗</a></div>}
    <div className={`toast ${toast ? 'show' : ''}`} role="status">{toast}</div>
    <PartnerChecklistDialog ref={checklistRef} onDocument={() => track('cm_partner_document_open', { document: 'checklist_15_diem_full' })} />
    <PartnerDialog ref={reviewRef} id="reviewModal" aria-labelledby="reviewTitle" aria-busy={sending} onCancel={(event) => { if (inFlight.current) event.preventDefault(); }}
      onClose={() => setFallback(null)}>
      <div className="partner-dialog-top">
        <div><div className="eyebrow">Xác nhận trước khi gửi</div><h3 id="reviewTitle">Thông tin chủ xe và lịch Tết</h3></div>
        <button className="partner-dialog-close" type="button" aria-label="Đóng" disabled={sending} onClick={() => reviewRef.current?.close()}>×</button>
      </div>
      {review && <pre>{review.text}</pre>}
      {sendError && <p role="alert" className="error-message">{sendError}</p>}
      {reviewWasSent && <p role="status">Yêu cầu này đã được Car Match tiếp nhận.</p>}
      <div className="partner-dialog-actions">
        <button className="partner-dialog-primary" type="button" onClick={() => void confirmLead()} disabled={sending || reviewWasSent}>
          {sending ? 'Đang gửi…' : sendError ? 'Thử gửi lại' : 'Gửi đăng ký hợp tác Tết'}
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
