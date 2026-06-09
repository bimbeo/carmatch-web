import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;
const ASSISTANT_TIMEOUT_MS = Number(process.env.TRAVEL_ASSISTANT_TIMEOUT_MS || 9000);
const OPENAI_BASE_URL = (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '');
const OPENAI_CHAT_COMPLETIONS_URL = process.env.OPENAI_CHAT_COMPLETIONS_URL || `${OPENAI_BASE_URL}/chat/completions`;

const bundledDestinations = [
  {
    slug: 'ha-long',
    name: 'Hạ Long',
    region: 'Quảng Ninh',
    distance_km: 160,
    duration: '2 ngày 1 đêm',
    route: 'Hà Nội → cao tốc Hải Phòng - Hạ Long → Bãi Cháy/Tuần Châu',
    recommended_vehicle: 'Xe 7 chỗ hoặc SUV/crossover nếu đi 5-6 người, có trẻ em hoặc nhiều hành lý.',
    parking_note: 'Khu Bãi Cháy, Tuần Châu có nhiều bãi gửi xe theo giờ/ngày; cuối tuần nên hỏi trước khách sạn.',
    toll_estimate: 450000,
  },
  {
    slug: 'ninh-binh',
    name: 'Ninh Bình',
    region: 'Ninh Bình',
    distance_km: 95,
    duration: '1-2 ngày',
    route: 'Hà Nội → Phủ Lý → Tràng An/Tam Cốc',
    recommended_vehicle: 'Xe 5 chỗ tiết kiệm cho 2-4 người; xe 7 chỗ nếu đi gia đình đông hoặc có nhiều đồ.',
    parking_note: 'Các khu du lịch lớn như Tràng An, Tam Cốc, Hang Múa đều có bãi xe riêng.',
    toll_estimate: 220000,
  },
  {
    slug: 'tam-dao',
    name: 'Tam Đảo',
    region: 'Vĩnh Phúc',
    distance_km: 80,
    duration: '2 ngày 1 đêm',
    route: 'Hà Nội → Vĩnh Phúc → Tam Đảo',
    recommended_vehicle: 'Xe gầm cao, xe số tự động dễ kiểm soát; tránh chở quá tải nếu chưa quen đường dốc.',
    parking_note: 'Khu trung tâm cuối tuần đông, nên chọn homestay/khách sạn có chỗ đỗ riêng.',
    toll_estimate: 80000,
  },
];

function money(value) {
  return Number(value || 0).toLocaleString('vi-VN') + 'đ';
}

function normalizeText(value = '') {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

async function loadDestinations() {
  if (!supabase) return bundledDestinations;
  const { data, error } = await supabase
    .from('travel_destinations')
    .select('slug,name,region,summary,tags,distance_km,duration,ideal,route,stops,driving_note,parking_note,recommended_vehicle,nearby_places,schedule,notes,faq,toll_estimate,fuel_cost_per_km')
    .eq('status', 'published')
    .order('sort_order', { ascending: true })
    .limit(20);

  if (error || !data?.length) return bundledDestinations;
  return data;
}

function withTimeout(promise, ms, label) {
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId));
}

function pickDestination(message, destinationSlug, destinations) {
  if (destinationSlug) {
    const matched = destinations.find((item) => item.slug === destinationSlug);
    if (matched) return matched;
  }
  const normalized = normalizeText(message);
  return destinations.find((item) => normalized.includes(normalizeText(item.name))) || destinations[0];
}

function parseTravelers(message) {
  const normalized = normalizeText(message);
  const match = normalized.match(/(\d+)\s*(nguoi|khach|be)/);
  if (match) return Math.min(7, Math.max(1, Number(match[1])));
  if (normalized.includes('gia dinh') || normalized.includes('nha minh')) return 4;
  return null;
}

function fallbackAnswer(message, destination, destinations) {
  const travelers = parseTravelers(message);
  const roundTripKm = Number(destination.distance_km || 0) * 2;
  const runningEstimate = Math.round((roundTripKm * Number(destination.fuel_cost_per_km || 1800)) / 1000) * 1000;
  const mobilityEstimate = runningEstimate + Number(destination.toll_estimate || 0);
  const vehicle = travelers && travelers >= 5
    ? 'Với nhóm từ 5 người, nên ưu tiên xe 7 chỗ hoặc SUV/crossover có cốp rộng.'
    : destination.recommended_vehicle || 'Với nhóm 2-4 người, xe 5 chỗ thường đủ gọn và tiết kiệm.';
  const alternatives = destinations
    .filter((item) => item.slug !== destination.slug)
    .slice(0, 2)
    .map((item) => item.name)
    .join(', ');

  return [
    `Nếu xuất phát từ Hà Nội, tuyến ${destination.name} hợp lịch ${destination.duration || 'cuối tuần'} theo dữ liệu Car Match đang có.`,
    `Quãng đường ước tính khoảng ${roundTripKm} km hai chiều; riêng xăng/sạc và phí đường nên dự phòng khoảng ${money(mobilityEstimate)} trước khi tính tiền thuê xe.`,
    vehicle,
    destination.parking_note ? `Về chỗ đỗ xe: ${destination.parking_note}` : 'Nên hỏi trước bãi đỗ ở khách sạn/điểm đến, nhất là cuối tuần.',
    alternatives ? `Nếu muốn phương án khác, có thể so thêm ${alternatives}.` : '',
    'Thông tin này là gợi ý từ dữ liệu Car Match, lịch xe và giá thuê cần xác nhận lại theo ngày đi thực tế.',
  ]
    .filter(Boolean)
    .join(' ');
}

async function askOpenAI({ message, destination, destinations }) {
  if (!process.env.OPENAI_API_KEY) return null;
  const model = process.env.OPENAI_MODEL || 'gpt-4.1-mini';
  const context = {
    selectedDestination: destination,
    availableDestinations: destinations.map((item) => ({
      slug: item.slug,
      name: item.name,
      region: item.region,
      distance_km: item.distance_km,
      duration: item.duration,
      route: item.route,
      recommended_vehicle: item.recommended_vehicle,
      parking_note: item.parking_note,
      toll_estimate: item.toll_estimate,
      nearby_places: item.nearby_places,
      schedule: item.schedule,
    })),
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), Math.max(1500, ASSISTANT_TIMEOUT_MS - 1500));
  const response = await fetch(OPENAI_CHAT_COMPLETIONS_URL, {
    method: 'POST',
    signal: controller.signal,
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'system',
          content:
            'Bạn là trợ lý tư vấn chuyến đi của Car Match. Chỉ trả lời dựa trên dữ liệu Car Match trong context. Không bịa giá thuê xe, tình trạng xe còn trống, địa điểm ngoài dữ liệu, giờ mở cửa hoặc số điện thoại mới. Nếu thiếu dữ liệu, nói rõ cần Car Match xác nhận. Trả lời tiếng Việt thân thiện, tối đa 4 ý ngắn. Ưu tiên format dễ đọc: 1 câu mở đầu, sau đó 2-3 bullet bắt đầu bằng "- ". Chỉ dùng **bold** cho nhãn rất ngắn như **Xe nên chọn:** hoặc **Chi phí:**. Kết thúc bằng gợi ý mở Trip Finder hoặc nhắn Zalo.',
        },
        {
          role: 'user',
          content: JSON.stringify({ question: message, context }),
        },
      ],
      max_tokens: 420,
    }),
  }).finally(() => clearTimeout(timeoutId));

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    console.warn('travel-assistant ai provider error', {
      status: response.status,
      type: errorBody?.error?.type,
      code: errorBody?.error?.code,
    });
    return null;
  }
  const data = await response.json();
  return data.choices?.[0]?.message?.content || null;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const { message = '', destinationSlug = '', pageType = 'go_where' } = req.body || {};
    const destinations = await withTimeout(loadDestinations(), 2500, 'loadDestinations').catch(() => bundledDestinations);
    const destination = pickDestination(message, destinationSlug, destinations);
    const aiAnswer = await withTimeout(
      askOpenAI({ message, destination, destinations }).catch(() => null),
      ASSISTANT_TIMEOUT_MS,
      'askOpenAI'
    ).catch(() => null);
    const answer = aiAnswer || fallbackAnswer(message, destination, destinations);

    return res.status(200).json({
      ok: true,
      mode: aiAnswer ? 'ai' : 'fallback',
      pageType,
      destinationSlug: destination.slug,
      answer,
    });
  } catch (error) {
    return res.status(200).json({
      ok: true,
      mode: 'fallback',
      answer:
        'Mình chưa truy xuất được đủ dữ liệu lúc này. Bạn có thể mở Trip Finder để tính tuyến hoặc nhắn Zalo để Car Match kiểm tra xe, giá và lịch còn trống theo ngày đi.',
    });
  }
}
