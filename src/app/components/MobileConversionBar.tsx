import { MessageCircle, Phone } from 'lucide-react';
import { trackPhoneClick, trackZaloClick } from '@/lib/analytics';

const ZALO_LINK = 'https://zalo.me/0975563290';
const PHONE_LINK = 'tel:0975563290';

interface MobileConversionBarProps {
  source: string;
  zaloHref?: string;
  zaloLabel?: string;
  phoneHref?: string;
  phoneLabel?: string;
  note?: string;
}

export default function MobileConversionBar({
  source,
  zaloHref = ZALO_LINK,
  zaloLabel = 'Nhắn Zalo',
  phoneHref = PHONE_LINK,
  phoneLabel = 'Gọi',
  note = 'Hỗ trợ 7h-22h',
}: MobileConversionBarProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3 shadow-[0_-12px_30px_rgba(15,23,42,0.12)] backdrop-blur sm:hidden">
      <div className="mx-auto flex max-w-md items-center gap-3">
        <a
          href={phoneHref}
          onClick={() => trackPhoneClick(`${source}_mobile_bar`)}
          className="inline-flex min-h-12 w-24 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-black text-slate-800 transition-colors hover:bg-slate-50"
          aria-label={`${phoneLabel} Car Match`}
          data-cta={`${source}-mobile-phone`}
        >
          <Phone className="h-4 w-4" />
          {phoneLabel}
        </a>
        <a
          href={zaloHref}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackZaloClick(`${source}_mobile_bar`)}
          className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 text-sm font-black text-white shadow-sm transition-colors hover:bg-brand-700"
          aria-label={`${zaloLabel} Car Match`}
          data-cta={`${source}-mobile-zalo`}
        >
          <MessageCircle className="h-4 w-4" />
          {zaloLabel}
        </a>
      </div>
    </div>
  );
}
