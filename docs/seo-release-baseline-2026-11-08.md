# SEO roadmap release baseline — 2026-11-08

Tài liệu này chốt mốc đo trước khi đánh giá tác động của đợt triển khai SEO/CRO ngày 2026-11-08. Không dùng số liệu dưới đây để kết luận hiệu quả ngay trong ngày phát hành; cần so sánh cùng kỳ sau tối thiểu 2 tuần, ưu tiên các mốc 14, 28 và 42 ngày.

## Bản phát hành

- Production: <https://www.carmatch.vn/>
- Git commit: `320f0ea7cc903bf5635df6fd16131a4808e6f149`
- Vercel deployment: `dpl_3NwAQsegE1kw246gfgH33jR8LbBw`
- Staging build đã được promote nguyên trạng lên production.
- Phạm vi: nền tảng technical SEO, landing page theo nhu cầu/địa điểm, nội dung hỗ trợ, internal link, schema, sitemap và redirect URL cũ.

## Kiểm tra phát hành

- Unit test: 69/69 đạt.
- TypeScript: đạt (`npx tsc --noEmit`).
- Production build: đạt.
- SEO audit: 132 trang HTML; 129 trang indexable; 16 knowledge entries; 17 priority pages; 0 lỗi; 0 cảnh báo; 0 empty shell.
- Các route ưu tiên, sitemap, redirect và ba API dữ liệu production đều trả kết quả đúng sau khi promote.
- Vercel runtime không ghi nhận lỗi ứng dụng. Có cảnh báo không chặn `DEP0169` từ Node.js về `url.parse()` trên các API; theo dõi và xử lý khi nâng dependency/runtime.
- Vercel Web Analytics chưa được cấu hình, nên baseline hành vi lấy từ GA4.

## Google Search Console baseline

Kỳ đo: 2026-08-07 đến 2026-11-06; dữ liệu được cập nhật khoảng 4 giờ trước lúc ghi nhận.

| Chỉ số | Giá trị |
| --- | ---: |
| Total clicks | 1.53K |
| Total impressions | 43.3K |
| Average CTR | 3.5% |
| Average position | 6.4 |

Các truy vấn nổi bật:

| Truy vấn | Click | Impression | Vị trí TB |
| --- | ---: | ---: | ---: |
| thuê xe điện tự lái hà nội | 117 | 1,018 | 2.9 |
| thuê xe tự lái hà nội | 81 | 4,261 | 9.1 |
| thuê xe vf3 tự lái hà nội | 68 | 536 | 2.3 |
| thuê xe carnival tự lái hà nội | 60 | 232 | 1.6 |
| thuê xe vf5 tự lái hà nội | 59 | 342 | 2.1 |
| car match | 35 | 218 | 1.4 |
| thuê xe vinfast tự lái hà nội | 32 | 395 | 3.7 |
| thuê xe vf3 | 30 | 792 | 5.6 |
| thuê vf3 tự lái hà nội | 29 | 181 | 2.2 |
| carmatch | 27 | 47 | 2.7 |

## GA4 baseline

Kỳ đo: 7 ngày gần nhất tại thời điểm ghi nhận (2026-11-01 đến 2026-11-07), so với 7 ngày liền trước.

| Chỉ số | Giá trị | So với kỳ trước |
| --- | ---: | ---: |
| Active users | 155 | +8.4% |
| Event count | 2.9K | +12.1% |
| Views | 972 | +8.8% |
| Key events | 5 | -37.5% |
| Sessions (tổng theo bảng channel) | 184 | — |
| Organic Search sessions | 150 | +10.3% |
| AI Assistant sessions | 7 | +30.0% |

Nguồn phiên chính: Google organic 146 phiên; direct 13; ChatGPT 7; Bing organic 4; Cốc Cốc referral 2.

GA4 đã được liên kết thành công với Search Console ngày 2026-11-08:

- Search Console property: `carmatch.vn` (`Domain`)
- GA4 web stream: `carmatch.vn`
- Stream ID: `7825492854`
- Linked by: `carmatchvn@gmail.com`

Các key event kinh doanh đã được bật trong GA4 ngày 2026-11-08:

- `cm_booking_submit_success`
- `cm_lead_submit_success`
- `cm_phone_click`
- `cm_zalo_click`

Hai key event cũ `purchase` và `ads_conversion_Li_n_h_v_i_ch_ng_t_i_1` vẫn tồn tại nhưng GA4 báo không có stream data trong 28 ngày gần nhất. Chưa gỡ để tránh ảnh hưởng cấu hình quảng cáo cũ khi chưa xác minh nguồn sử dụng.

## Cách đánh giá sau phát hành

1. Sau 14 ngày: kiểm tra indexation, impressions và truy vấn mới của các landing/article vừa phát hành; chưa kết luận bằng click tuyệt đối nếu trang mới chưa được crawl đủ.
2. Sau 28 ngày: so sánh theo landing page và query cluster, ưu tiên CTR, vị trí trung bình, organic sessions và key events.
3. Sau 42 ngày: quyết định giữ nguyên, mở rộng internal link, viết bổ sung hay chỉnh title/meta dựa trên dữ liệu thực tế.
4. Luôn so sánh cùng độ dài kỳ đo và ghi chú yếu tố mùa vụ, thay đổi ngân sách quảng cáo hoặc gián đoạn tracking.

## Điểm cần theo dõi sát

- Truy vấn `thuê xe tự lái hà nội` có lượng hiển thị lớn nhưng vị trí trung bình 9.1; đây là cơ hội tăng trưởng chính nếu landing tổng được cải thiện thứ hạng và CTR.
- Nhóm xe điện/VF3/VF5 đang có vị trí tốt; theo dõi xem nội dung hỗ trợ mới có tăng impressions, click và chuyển đổi sang xem xe/đặt xe hay không.
- Key events giảm trong baseline dù traffic tăng; cần kiểm tra lại định nghĩa conversion và luồng phát sinh sự kiện trước khi quy kết cho chất lượng traffic.
- Theo dõi thời điểm các báo cáo Search Console bắt đầu xuất hiện trong GA4; dữ liệu tích hợp có thể cần thời gian xử lý sau khi tạo liên kết.
