import { useEffect, useMemo, useState } from 'react';
import { Star } from 'lucide-react';

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
    <section className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-gray-900">Đánh giá từ khách hàng</h2>
          <p className="mt-1 text-sm text-gray-500">{reviews.length} đánh giá thực tế từ khách đã thuê xe</p>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2">
          <Stars rating={average} />
          <span className="text-sm font-black text-gray-900">{average.toFixed(1)}</span>
        </div>
      </div>

      <div className="space-y-3">
        {reviews.map((review, index) => (
          <article key={`${review.reviewer_name}-${review.created_at}-${index}`} className="rounded-xl border border-gray-100 p-4">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-bold text-gray-900">{review.reviewer_name}</p>
                {review.trip_date && <p className="text-xs text-gray-400">Chuyến đi: {review.trip_date}</p>}
              </div>
              <Stars rating={review.rating} size="w-3.5 h-3.5" />
            </div>
            {review.comment && <p className="text-sm leading-relaxed text-gray-600">{review.comment}</p>}
          </article>
        ))}
      </div>
    </section>
  );
}
