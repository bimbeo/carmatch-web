import { useEffect, useMemo, useState } from 'react';
import { BadgeCheck, Star } from 'lucide-react';

interface HomeReview {
  reviewer_name: string;
  rating: number;
  comment: string | null;
  trip_date: string | null;
  created_at: string;
}

function ReviewStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating}/5 sao`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${star <= Math.round(rating) ? 'fill-current text-amber-400' : 'text-gray-200'}`}
        />
      ))}
    </div>
  );
}

export default function HomeReviews() {
  const [reviews, setReviews] = useState<HomeReview[]>([]);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 5000);

    async function loadReviews() {
      try {
        const response = await fetch('/api/reviews?scope=homepage', { signal: controller.signal });
        if (!response.ok) return;
        const data = await response.json();
        if (active) setReviews(Array.isArray(data) ? data : []);
      } catch {
        if (active) setReviews([]);
      } finally {
        window.clearTimeout(timeout);
      }
    }

    void loadReviews();
    return () => {
      active = false;
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, []);

  const averageRating = useMemo(() => {
    if (reviews.length === 0) return 0;
    return reviews.reduce((total, review) => total + review.rating, 0) / reviews.length;
  }, [reviews]);

  if (reviews.length === 0) return null;

  return (
    <section id="danh-gia-khach-thue" className="bg-gray-50 px-4 py-20">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-3xl">
            <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-brand-600">Review đã xác minh</p>
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">Khách thuê xe tại Car Match nói gì?</h2>
            <p className="mt-4 text-base leading-relaxed text-gray-600">
              Chỉ những đánh giá đã được duyệt từ chuyến thuê thực tế mới xuất hiện tại đây.
            </p>
          </div>
          <div className="inline-flex w-fit items-center gap-3 rounded-2xl border border-amber-100 bg-white px-4 py-3 shadow-sm">
            <ReviewStars rating={averageRating} />
            <span className="font-black text-gray-900">{averageRating.toFixed(1)}/5</span>
            <span className="text-sm text-gray-500">· {reviews.length} đánh giá gần đây</span>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {reviews.map((review, index) => (
            <article
              key={`${review.reviewer_name}-${review.created_at}-${index}`}
              className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-900 text-sm font-black text-white">
                    {review.reviewer_name.trim().charAt(0).toUpperCase() || 'C'}
                  </span>
                  <div>
                    <p className="font-bold text-gray-900">{review.reviewer_name}</p>
                    <span className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                      <BadgeCheck className="h-3.5 w-3.5" />
                      Đã thuê xe
                    </span>
                  </div>
                </div>
                <ReviewStars rating={review.rating} />
              </div>
              {review.comment && <p className="text-sm leading-7 text-gray-700">“{review.comment}”</p>}
              {review.trip_date && <p className="mt-4 text-xs text-gray-400">Chuyến đi: {review.trip_date}</p>}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
