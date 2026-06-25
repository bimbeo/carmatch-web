import { useEffect, useMemo, useState } from 'react';
import { BadgeCheck, Star } from 'lucide-react';

interface Review {
  reviewer_name: string;
  rating: number;
  comment: string | null;
  trip_date: string | null;
  created_at: string;
}

function Stars({ rating, size = 'w-4 h-4' }: { rating: number; size?: string }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating}/5 sao`}>
      {[1, 2, 3, 4, 5].map(star => (
        <Star
          key={star}
          className={`${size} ${star <= Math.round(rating) ? 'text-amber-400 fill-current' : 'text-gray-200'}`}
        />
      ))}
    </div>
  );
}

export default function CarReviews({ carSlug }: { carSlug: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const timeout = setTimeout(() => {
      if (active) setLoading(false);
    }, 5000);

    async function loadReviews() {
      try {
        const res = await fetch(`/api/reviews?slug=${encodeURIComponent(carSlug)}`);
        const data = await res.json();
        if (active) setReviews(Array.isArray(data) ? data : []);
      } catch {
        if (active) setReviews([]);
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadReviews();
    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [carSlug]);

  const average = useMemo(() => {
    if (reviews.length === 0) return 0;
    return reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
  }, [reviews]);

  if (loading || reviews.length === 0) return null;

  return (
    <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 bg-gradient-to-r from-amber-50 via-white to-white px-5 py-5">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-amber-600">Tín hiệu tin cậy</p>
          <h2 className="mt-1 text-xl font-black text-gray-950">Khách đã thuê xe nói gì?</h2>
          <p className="mt-1 text-sm font-medium text-gray-500">{reviews.length} đánh giá đã duyệt từ chuyến thuê thực tế</p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-amber-100 bg-white px-3 py-2 shadow-sm">
          <Stars rating={average} />
          <span className="text-sm font-black text-gray-900">{average.toFixed(1)}</span>
        </div>
      </div>

      <div className="space-y-3 p-5">
        {reviews.map((review, index) => (
          <article key={`${review.reviewer_name}-${review.created_at}-${index}`} className="rounded-xl border border-gray-100 bg-gray-50/60 p-4">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-900 text-sm font-black text-white">
                  {review.reviewer_name.trim().charAt(0).toUpperCase() || 'C'}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="text-sm font-black text-gray-950">{review.reviewer_name}</p>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                      <BadgeCheck className="h-3 w-3" />
                      Đã thuê
                    </span>
                  </div>
                  {review.trip_date && <p className="mt-0.5 text-xs font-medium text-gray-400">Chuyến đi: {review.trip_date}</p>}
                </div>
              </div>
              <Stars rating={review.rating} size="w-3.5 h-3.5" />
            </div>
            {review.comment && <p className="mt-3 text-sm font-medium leading-7 text-gray-700">{review.comment}</p>}
          </article>
        ))}
      </div>
    </section>
  );
}
