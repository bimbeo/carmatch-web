const year = 2027;
const path = '/hop-tac-chu-xe-cho-thue-tet';

export const tetOwnerCampaign = {
  year,
  path,
  season: 'Đinh Mùi',
  timeZone: 'Asia/Ho_Chi_Minh',
  source: `partner_tet_${year}`,
  title: `Hợp tác chủ xe cho thuê Tết ${year} tại Hà Nội | Car Match`,
  description: `Có xe dư dịp Tết ${year}? Đăng ký hợp tác cho thuê xe cùng Car Match tại Hà Nội. Chủ động chọn lịch xe rảnh, tính thử thu nhập và nhận tư vấn phương án khai thác phù hợp.`,
  image: '/tet-owner/og-tet-owner-1200.jpg',
  socialImage: { width: 1200, height: 630, type: 'image/jpeg' },
  newYear: '2027-02-06',
  peak: ['2027-02-04', '2027-02-10'],
  handover: ['2027-02-01', '2027-02-04'],
  lateDuXuan: ['2027-02-07', '2027-02-14'],
  defaults: { dailyRate: 900_000, bookedDays: 7, sharePercent: 80 },
  presets: {
    full: { free: [['2027-02-04', '2027-02-12']], hold: [] },
    duxuan: { free: [['2027-02-08', '2027-02-15']], hold: [['2027-02-06', '2027-02-07']] },
    before: { free: [['2027-01-27', '2027-02-04']], hold: [] },
    family: { free: [['2027-02-04', '2027-02-05'], ['2027-02-09', '2027-02-12']], hold: [['2027-02-06', '2027-02-08']] },
    clear: { free: [], hold: [] },
  },
  // Civil dates for Vietnam. Replace this explicit mapping each campaign.
  days: [
    ['2027-01-27', '20 Chạp'], ['2027-01-28', '21 Chạp'], ['2027-01-29', '22 Chạp'],
    ['2027-01-30', '23 Chạp'], ['2027-01-31', '24 Chạp'], ['2027-02-01', '25 Chạp'],
    ['2027-02-02', '26 Chạp'], ['2027-02-03', '27 Chạp'], ['2027-02-04', '28 Chạp'],
    ['2027-02-05', '29 Chạp'], ['2027-02-06', 'Mùng 1'], ['2027-02-07', 'Mùng 2'],
    ['2027-02-08', 'Mùng 3'], ['2027-02-09', 'Mùng 4'], ['2027-02-10', 'Mùng 5'],
    ['2027-02-11', 'Mùng 6'], ['2027-02-12', 'Mùng 7'], ['2027-02-13', 'Mùng 8'],
    ['2027-02-14', 'Mùng 9'], ['2027-02-15', 'Mùng 10'],
  ],
} as const;

export const tetOwnerHero = {
  src: '/tet-owner/hero-960.webp',
  srcSet: [640, 768, 960, 1280].map((width) => `/tet-owner/hero-${width}.webp ${width}w`).join(', '),
  sizes: '(max-width: 760px) calc(100vw - 36px), (max-width: 1240px) 46vw, 548px',
  alt: 'Minh họa chủ xe bên hai ô tô tại nhà trang trí hoa đào và đèn lồng đón Tết',
};

export type TetDate = (typeof tetOwnerCampaign.days)[number][0];
export type TetPreset = keyof typeof tetOwnerCampaign.presets;
export type DayStatus = 'free' | 'hold' | 'maybe';
export type Schedule = Record<TetDate, DayStatus>;
type DateRange = readonly [TetDate, TetDate];

export const dateLabel = (iso: TetDate) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
export const inRange = (iso: TetDate, range: DateRange) => iso >= range[0] && iso <= range[1];
export const dateSpan = ([start, end]: DateRange) => start.slice(5, 7) === end.slice(5, 7)
  ? `${start.slice(8, 10)}–${dateLabel(end)}`
  : `${dateLabel(start)}–${dateLabel(end)}`;

const campaign = tetOwnerCampaign;
const dates = campaign.days.map(([iso]) => iso);
export const formatDay = (iso: TetDate) => `${dateLabel(iso)} (${campaign.days.find(([day]) => day === iso)?.[1]})`;
export const money = (value: number) => `${Math.round(value).toLocaleString('vi-VN')}đ`;

export function makeSchedule(preset: TetPreset): Schedule {
  const { free, hold } = campaign.presets[preset];
  return Object.fromEntries(dates.map((iso) => [
    iso,
    (hold as readonly DateRange[]).some((range) => inRange(iso, range)) ? 'hold'
      : (free as readonly DateRange[]).some((range) => inRange(iso, range)) ? 'free' : 'maybe',
  ])) as Schedule;
}

function getSegments(schedule: Schedule, status: DayStatus) {
  const segments: { start: TetDate; end: TetDate; days: number }[] = [];
  let segment: (typeof segments)[number] | undefined;
  for (const iso of dates) {
    if (schedule[iso] !== status) {
      segment = undefined;
    } else if (segment) {
      segment.end = iso;
      segment.days++;
    } else {
      segment = { start: iso, end: iso, days: 1 };
      segments.push(segment);
    }
  }
  return segments;
}

export const cooperationOptions = {
  full: 'Có thể cho thuê xuyên Tết',
  before: 'Có thể cho thuê trước Tết',
  after: 'Có thể cho thuê du xuân sau Tết',
  flexible: 'Lịch linh hoạt hoặc ngắt quãng',
  multi: 'Có nhiều xe / đội xe',
  consult: 'Muốn được tư vấn trước',
} as const;

export function summarizeSchedule(schedule: Schedule) {
  const segments = {
    free: getSegments(schedule, 'free'),
    hold: getSegments(schedule, 'hold'),
    maybe: getSegments(schedule, 'maybe'),
  };
  const free = dates.filter((iso) => schedule[iso] === 'free');
  const longest = Math.max(0, ...segments.free.map((segment) => segment.days));
  const continuous = (range: DateRange) => segments.free.some(({ start, end }) => start <= range[0] && end >= range[1]);
  const acrossTet = segments.free.some(({ start, end, days }) => start < campaign.newYear && end > campaign.newYear && days >= 7);
  const afterTet = continuous(campaign.presets.duxuan.free[0]) || continuous(campaign.lateDuXuan);
  const familyBreak = dates.filter((iso) => inRange(iso, campaign.presets.family.hold[0]))
    .every((iso) => schedule[iso] === 'hold') && segments.free.length > 1;
  const beforeTet = free.length > 0 && free.every((iso) => iso < campaign.newYear);
  const option: keyof typeof cooperationOptions = !free.length ? 'consult' : acrossTet ? 'full' : familyBreak ? 'flexible' : afterTet ? 'after' : beforeTet ? 'before'
    : free.every((iso) => iso > campaign.newYear) ? 'after' : 'flexible';
  const insight = !free.length
    ? 'Bạn chưa đánh dấu ngày cho thuê. Hãy chọn ngày rảnh hoặc trao đổi với Car Match về lịch phù hợp.'
    : acrossTet
      ? 'Bạn có khoảng rảnh liên tục qua giao thừa. Đây là nhóm lịch thuận tiện để Car Match ưu tiên thẩm định thuê theo kỳ.'
      : familyBreak
        ? 'Giữ mùng 1–3 sẽ ngắt quãng kỳ thuê xuyên Tết. Car Match có thể xem xét hai chặng riêng trước Tết và từ mùng 4, tùy nhu cầu và khả năng giao nhận.'
        : afterTet
          ? 'Xe có thể phục vụ một chặng du xuân liền mạch sau Tết. Car Match sẽ kiểm tra nhu cầu và điều kiện giao nhận theo lịch bạn chọn.'
          : longest <= 3
            ? 'Khoảng rảnh hiện khá ngắn. Bạn vẫn có thể gửi lịch để Car Match kiểm tra nhu cầu từng chuyến.'
            : 'Bạn đã có khoảng ngày rảnh để xem xét. Lịch liền mạch dài hơn thường thuận tiện cho việc ghép khách theo kỳ.';
  return {
    segments, longest, option, insight,
    free: free.length,
    hold: dates.filter((iso) => schedule[iso] === 'hold').length,
    maybe: dates.filter((iso) => schedule[iso] === 'maybe').length,
    peak: free.filter((iso) => inRange(iso, campaign.peak)).length,
  };
}

export function estimateIncome(values: { dailyRate: string; bookedDays: string; sharePercent: string; monthlyCost: string }, free: number) {
  const clamp = (input: string, max: number) => {
    const number = Number(input);
    return Number.isFinite(number) ? Math.max(0, Math.min(max, number)) : 0;
  };
  const dailyRate = Math.round(clamp(values.dailyRate, 100_000_000));
  const bookedDays = Math.floor(clamp(values.bookedDays, free));
  const sharePercent = clamp(values.sharePercent, 100);
  const monthlyCost = Math.round(clamp(values.monthlyCost, 200_000_000));
  const gross = dailyRate * bookedDays;
  const ownerShare = gross * sharePercent / 100;
  return { dailyRate, bookedDays, sharePercent, monthlyCost, gross, ownerShare };
}

export function scheduleText(stats: ReturnType<typeof summarizeSchedule>, estimate: ReturnType<typeof estimateIncome>) {
  const ranges = (status: DayStatus) => stats.segments[status].map(({ start, end }) =>
    start === end ? formatDay(start) : `${formatDay(start)} → ${formatDay(end)}`).join('; ');
  return [
    `${stats.free} ngày có thể cho thuê · ${stats.hold} ngày giữ cho gia đình · ${stats.maybe} ngày chưa quyết định · Dãy liên tục dài nhất ${stats.longest} ngày.`,
    `Ngày có thể cho thuê: ${ranges('free') || 'Chưa chọn'}.`,
    `Ngày giữ xe gia đình: ${ranges('hold') || 'Chưa chọn'}.`,
    `Ngày chưa quyết định: ${ranges('maybe') || 'Không có'}.`,
    `Tính thử: ${money(estimate.dailyRate)}/ngày × ${estimate.bookedDays} ngày = ${money(estimate.gross)} doanh thu gộp. Tỷ lệ giả định ${estimate.sharePercent}% → ${money(estimate.ownerShare)} trước chi phí riêng/thuế.`,
    estimate.monthlyCost > 0 ? `Chi phí nuôi xe tự nhập: ${money(estimate.monthlyCost)}/tháng.` : '',
  ].filter(Boolean).join('\n');
}
