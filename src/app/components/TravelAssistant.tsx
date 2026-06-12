import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { Bot, Loader2, Send, Sparkles } from 'lucide-react';
import { tripDestinations, type TripDestination } from '@/data/tripDestinations';

type TravelAssistantProps = {
  pageType: 'go_where' | 'destination' | 'trip_finder';
  destinationSlug?: string;
  destinationName?: string;
  compact?: boolean;
};

type AssistantMessage = {
  role: 'user' | 'assistant';
  text: string;
};

type FormattedBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'bullet'; text: string };

const suggestedPrompts = [
  'Nhà 5 người có trẻ em nên đi đâu cuối tuần này?',
  'Tuyến này nên chọn xe 5 chỗ hay 7 chỗ?',
  'Ước tính chi phí di chuyển và lưu ý chỗ đỗ xe',
];

function money(value: number) {
  return value.toLocaleString('vi-VN') + 'đ';
}

function normalizeText(value = '') {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');
}

function parseTravelers(message: string) {
  const normalized = normalizeText(message);
  const match = normalized.match(/(\d+)\s*(nguoi|khach|be)/);
  if (match) return Math.min(7, Math.max(1, Number(match[1])));
  if (normalized.includes('gia dinh') || normalized.includes('nha minh')) return 4;
  if (normalized.includes('cap doi')) return 2;
  return null;
}

function pickDestination(message: string, destinationSlug?: string): TripDestination {
  if (destinationSlug) {
    const bySlug = tripDestinations.find((item) => item.slug === destinationSlug);
    if (bySlug) return bySlug;
  }

  const normalized = normalizeText(message);
  return (
    tripDestinations.find((item) => normalized.includes(normalizeText(item.name))) ||
    tripDestinations.find((item) => {
      const text = normalizeText([item.name, item.region, item.summary, ...(item.tags || [])].filter(Boolean).join(' '));
      return normalized.split(/\s+/).some((word) => word.length > 3 && text.includes(word));
    }) ||
    tripDestinations[0]
  );
}

function answerFromLocalData(message: string, destinationSlug?: string) {
  const destination = pickDestination(message, destinationSlug);
  const travelers = parseTravelers(message);
  const roundTripKm = destination.distanceKm * 2;
  const runningEstimate = Math.round((roundTripKm * (destination.fuelCostPerKm || 1800)) / 1000) * 1000;
  const mobilityEstimate = runningEstimate + destination.tollEstimate;
  const normalized = normalizeText(message);

  if (normalized.includes('di dau') || normalized.includes('cuoi tuan')) {
    const options = tripDestinations
      .filter((item) => {
        const text = normalizeText([item.duration, item.ideal, ...(item.tags || [])].join(' '));
        if (travelers && travelers >= 5) return text.includes('gia dinh') || text.includes('7 cho');
        return text.includes('trong ngay') || text.includes('2 ngay') || item.distanceKm <= 120;
      })
      .slice(0, 3);
    return `Theo dữ liệu Car Match, ${options.map((item) => item.name).join(', ')} là các tuyến đáng cân nhắc. ${
      travelers && travelers >= 5 ? 'Nhà từ 5 người nên ưu tiên xe 7 chỗ/SUV để ngồi thoải mái và có cốp rộng.' : 'Nhóm nhỏ có thể ưu tiên xe 5 chỗ hoặc xe điện để tối ưu chi phí.'
    } Bạn có thể mở Trip Finder để chọn ngày đi và tính ngân sách chi tiết.`;
  }

  const vehicleAdvice = travelers && travelers >= 5
    ? 'Với nhóm từ 5 người, nên ưu tiên xe 7 chỗ hoặc SUV/crossover có cốp rộng. Xe 5 chỗ chỉ hợp khi nhóm 2-4 người và ít hành lý.'
    : destination.recommendedVehicle || 'Nếu đi 2-4 người, xe 5 chỗ thường đủ dùng; nếu có nhiều hành lý hoặc trẻ em, nên cân nhắc xe 7 chỗ.';

  return [
    `Với tuyến ${destination.name}, Car Match đang có dữ liệu quãng đường khoảng ${roundTripKm} km hai chiều và lịch phù hợp ${destination.duration}.`,
    vehicleAdvice,
    `Chi phí xăng/sạc + phí đường nên dự phòng khoảng ${money(mobilityEstimate)}, chưa gồm tiền thuê xe, ăn uống và lưu trú.`,
    destination.parkingNote ? `Lưu ý chỗ đỗ: ${destination.parkingNote}` : 'Nên hỏi trước bãi đỗ tại điểm đến hoặc nơi lưu trú, nhất là cuối tuần.',
    'Lịch xe và giá thuê cuối cùng cần Car Match kiểm tra theo ngày đi thực tế.',
  ].join(' ');
}

function normalizeAssistantText(text: string) {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function parseAssistantBlocks(text: string): FormattedBlock[] {
  const normalized = normalizeAssistantText(text);
  if (!normalized) return [];

  const lines = normalized.split('\n');
  const blocks: FormattedBlock[] = [];
  let paragraph: string[] = [];

  const flushParagraph = () => {
    const value = paragraph.join(' ').replace(/\s+/g, ' ').trim();
    if (value) blocks.push({ type: 'paragraph', text: value });
    paragraph = [];
  };

  for (const line of lines) {
    const cleanLine = line.trim();
    if (!cleanLine) {
      flushParagraph();
      continue;
    }

    const bulletMatch = cleanLine.match(/^[-*•]\s+(.+)$/);
    if (bulletMatch) {
      flushParagraph();
      blocks.push({ type: 'bullet', text: bulletMatch[1] });
      continue;
    }

    paragraph.push(cleanLine);
  }

  flushParagraph();
  return blocks;
}

function renderInlineText(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    const strongMatch = part.match(/^\*\*([^*]+)\*\*$/);
    if (strongMatch) {
      return (
        <strong key={`${part}-${index}`} className="font-black text-slate-950">
          {strongMatch[1]}
        </strong>
      );
    }
    return part;
  });
}

function AssistantText({ text }: { text: string }) {
  const blocks = parseAssistantBlocks(text);
  if (!blocks.length) return null;

  return (
    <div className="space-y-2">
      {blocks.map((block, index) => {
        if (block.type === 'bullet') {
          return (
            <div key={`${block.type}-${index}`} className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
              <p>{renderInlineText(block.text)}</p>
            </div>
          );
        }
        return <p key={`${block.type}-${index}`}>{renderInlineText(block.text)}</p>;
      })}
    </div>
  );
}

export default function TravelAssistant({ pageType, destinationSlug, destinationName, compact = false }: TravelAssistantProps) {
  const initialAssistantText = useMemo(() => {
    if (destinationName) {
      return `Bạn đang xem tuyến ${destinationName}. Mình có thể gợi ý xe phù hợp, chi phí di chuyển, checklist chuẩn bị và cách gửi yêu cầu về Car Match.`;
    }
    return 'Mình có thể gợi ý điểm đi gần Hà Nội, loại xe phù hợp, chi phí di chuyển và cách lập kế hoạch chuyến đi với Car Match.';
  }, [destinationName]);

  const [messages, setMessages] = useState<AssistantMessage[]>([{ role: 'assistant', text: initialAssistantText }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'ai' | 'fallback' | null>(null);

  const askAssistant = async (text: string) => {
    const message = text.trim();
    if (!message || loading) return;
    setMessages((items) => [...items, { role: 'user', text: message }]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/travel-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, pageType, destinationSlug }),
      });
      if (!response.ok) {
        throw new Error(`Assistant API ${response.status}`);
      }
      const data = await response.json();
      setMessages((items) => [
        ...items,
        {
          role: 'assistant',
          text: data?.answer || 'Mình chưa đủ dữ liệu để tư vấn chắc chắn. Bạn gửi số người, ngày đi và điểm đến để Car Match kiểm tra kỹ hơn nhé.',
        },
      ]);
      setMode(data?.mode === 'ai' ? 'ai' : 'fallback');
    } catch {
      const fallbackText = answerFromLocalData(message, destinationSlug);
      setMessages((items) => [
        ...items,
        {
          role: 'assistant',
          text: fallbackText,
        },
      ]);
      setMode('fallback');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className={`rounded-3xl border border-brand-100 bg-white shadow-sm ${compact ? 'p-5' : 'p-5 sm:p-6 lg:p-8'}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 sm:items-center">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 sm:h-11 sm:w-11">
            <Bot className="h-5 w-5 sm:h-6 sm:w-6" />
          </span>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-brand-600 sm:text-sm sm:tracking-[0.18em]">Trợ lý chuyến đi</p>
            <h2 className="text-[1.38rem] font-black leading-tight text-slate-950 sm:text-2xl">Hỏi nhanh trước khi đặt xe</h2>
          </div>
        </div>
        {mode ? (
          <span className="hidden rounded-full bg-slate-50 px-3 py-1 text-xs font-black text-slate-500 sm:inline-flex">
            {mode === 'ai' ? 'AI + dữ liệu' : 'Dữ liệu Car Match'}
          </span>
        ) : null}
      </div>

      <div className="mt-5 max-h-[360px] space-y-3 overflow-y-auto rounded-2xl bg-slate-50 p-2.5 sm:rounded-3xl sm:p-3">
        {messages.map((message, index) => (
          <div key={`${message.role}-${index}`} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`rounded-2xl px-3.5 py-3 text-[14.5px] font-semibold leading-6 sm:px-4 sm:text-sm ${
                message.role === 'user'
                  ? 'max-w-[84%] bg-brand-600 text-white sm:max-w-[78%]'
                  : 'max-w-[96%] bg-white text-slate-700 shadow-sm ring-1 ring-slate-100 md:max-w-[74%]'
              }`}
            >
              {message.role === 'assistant' ? <AssistantText text={message.text} /> : message.text}
            </div>
          </div>
        ))}
        {loading ? (
          <div className="flex justify-start">
            <div className="inline-flex items-center gap-2 rounded-2xl bg-white px-3.5 py-3 text-sm font-black text-slate-500 shadow-sm ring-1 ring-slate-100 sm:px-4">
              <Loader2 className="h-4 w-4 animate-spin" />
              Đang xem dữ liệu tuyến...
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {suggestedPrompts.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => askAssistant(prompt)}
            className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-2 text-left text-xs font-black leading-5 text-brand-700 transition hover:bg-brand-100 sm:px-4"
          >
            <Sparkles className="h-3.5 w-3.5" />
            {prompt}
          </button>
        ))}
      </div>

      <div className="mt-4 flex gap-2">
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') askAssistant(input);
          }}
          className="min-w-0 flex-1 rounded-2xl border border-slate-200 px-3.5 py-3 text-sm font-semibold outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100 sm:px-4"
          placeholder="VD: 6 người đi Hạ Long 2 ngày"
        />
        <button
          type="button"
          onClick={() => askAssistant(input)}
          disabled={loading}
          className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
          aria-label="Gửi câu hỏi"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
        </button>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Link
          to={`/lap-ke-hoach-chuyen-di${destinationSlug ? `/${destinationSlug}` : ''}${destinationSlug ? `?diem-den=${destinationSlug}` : ''}#trip-form`}
          className="inline-flex flex-1 items-center justify-center rounded-full bg-brand-600 px-5 py-3 text-sm font-black text-white transition hover:bg-brand-700"
        >
          Mở Trip Finder
        </Link>
        <a
          href="https://zalo.me/0975563290"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex flex-1 items-center justify-center rounded-full border border-slate-200 px-5 py-3 text-sm font-black text-slate-900 transition hover:border-brand-200 hover:text-brand-700"
        >
          Hỏi Zalo ngay
        </a>
      </div>
    </section>
  );
}
