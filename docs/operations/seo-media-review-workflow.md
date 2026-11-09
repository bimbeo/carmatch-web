# Quy trình ảnh/video thực tế và review Google Business Profile

Mục tiêu: tạo bằng chứng trải nghiệm thật cho các money page, tăng độ tin cậy Local SEO và biến câu hỏi khách hàng thành nội dung AEO.

## 1. Phân công

| Người/nhóm | Trách nhiệm |
|---|---|
| Bim | Duyệt chủ đề lớn, định vị, số liệu được phép công khai và nội dung nhạy cảm |
| Lâm/Ops | Xác minh xe, giá/chính sách; sắp lịch xe và địa điểm quay/chụp |
| Chi/CSKH | Tổng hợp câu hỏi thật; gửi lời mời review sau chuyến thành công |
| Nhật/Marketing | Shot list, chụp/quay, biên tập và phân phối Facebook/TikTok/GBP |
| Đạt/AI | Brief, caption/transcript, CMS, schema phù hợp, alt text và internal link |

Mỗi asset phải có một owner và deadline; không giao chung chung cho “Marketing”.

## 2. Nhịp vận hành hàng tuần

| Ngày | Việc |
|---|---|
| Thứ Hai | Đọc GSC/GA4/CRM, chọn 1 money page và 1 câu hỏi khách cần asset |
| Thứ Ba | Ops chốt xe, địa điểm, chính sách và khách/nhân sự xuất hiện |
| Thứ Tư | Chụp/quay theo shot list, sao lưu file gốc |
| Thứ Năm | Biên tập, transcript, fact-check, publish/refresh trang |
| Thứ Sáu | Internal link, đăng GBP/social, outreach và cập nhật dashboard |

Sản lượng chuẩn: **1 video thực tế + 8–15 ảnh dùng được + 1 money page được bổ sung asset mỗi tuần**.

## 3. Kế hoạch quay/chụp sáu tuần

| Tuần | Chủ đề | Shot bắt buộc | Trang nhận asset |
|---|---|---|---|
| 1 | Kia Carnival | Ngoại thất 4 góc, hàng ghế 2/3, cốp với 2/4/6 vali, vị trí ISOFIX nếu đúng xe, màn hình/điều hòa | `/xe/kia-carnival`, hub xe 7 chỗ, bài so sánh |
| 2 | VF3 và VF5 | Hai xe cùng khung hình, chỗ ngồi trước/sau, cốp, cổng sạc, thao tác sạc thật, đỗ phố | Trang model, `/thue-xe-dien-ha-noi`, bài VF3–VF5 |
| 3 | Carnival–Xpander–Limo Green | Cùng góc quay, hàng ghế ba, lối vào, cốp khi đủ người, bảng so sánh kích thước thực tế đã kiểm chứng | Hub 7 chỗ và bài so sánh ba xe |
| 4 | Bàn giao xe | Chụp bốn góc, kính/lốp, mức nhiên liệu/pin, km, giấy tờ được phép, ký biên bản, hotline hỗ trợ | Bài checklist và trang chính sách |
| 5 | Giao xe khu vực | Mỗi khu vực 3–5 ảnh thật tại Ocean Park, Smart City, Times City, Ecopark, The Manor; điểm hẹn/sảnh/chỗ chờ | Năm landing khu vực |
| 6 | Thuê tháng/B2B | Xe làm việc hằng ngày, khoang hành lý, cảnh giao nhận định kỳ, hóa đơn/hợp đồng chỉ quay bản mẫu đã che dữ liệu | `/thue-xe-thang` và nội dung B2B |

Nếu không có xe/địa điểm thật đúng tuần, dời lịch. Không dùng ảnh stock để mô tả như ảnh fleet Car Match.

## 4. Shot list chuẩn cho mỗi model

### Ảnh

- Ngoại thất: trước, sau, hai bên, góc 3/4.
- Hàng ghế trước, hàng ghế hai, hàng ghế ba nếu có.
- Cốp trống và cốp với hành lý chuẩn có ghi rõ số/kích thước vali.
- Bảng điều khiển, màn hình, điều hòa, cổng sạc/ổ điện liên quan.
- Lốp, cổng sạc/nắp bình nhiên liệu và chìa khóa.
- Một ảnh dọc 4:5 cho GBP/social và một ảnh ngang 16:9 cho web.

### Video 45–90 giây

1. Mở đầu: model/đời xe thật và bài toán khách hàng.
2. 10–15 giây ngoại thất.
3. 15–25 giây chỗ ngồi/cốp.
4. 10–20 giây điểm đặc thù: sạc, hàng ghế ba, ghế trẻ em hoặc giao xe.
5. Kết luận: phù hợp/không phù hợp với ai; không khẳng định quá mức.
6. CTA: xem lịch xe hoặc nhắn xác nhận.

Luôn lưu transcript và caption ngắn. Thông số kỹ thuật chỉ đưa vào sau khi đối chiếu xe thật/tài liệu chính thức.

## 5. Quy chuẩn file và metadata

Tên file:

```text
YYYY-MM-DD-model-location-shot-sequence.ext
2026-11-11-kia-carnival-ha-noi-cop-4-vali-01.webp
```

Metadata nội bộ đi kèm:

```text
asset_id
captured_at
vehicle_model
vehicle_year
vehicle_id_or_internal_ref
location
shot_type
photographer
consent_status
approved_for_web
approved_for_social
source_file
published_urls
```

Alt text mô tả điều nhìn thấy và ngữ cảnh hữu ích, ví dụ: `Cốp Kia Carnival của Car Match khi xếp bốn vali cabin`. Không nhồi “thuê xe tự lái Hà Nội giá rẻ”.

## 6. Quyền riêng tư và đồng ý sử dụng

- Không đăng khuôn mặt/giọng nói khách khi chưa có đồng ý rõ ràng.
- Che biển số khi asset không cần chứng minh đúng xe; nếu cần hiện biển, Ops phải duyệt.
- Không quay CCCD, bằng lái, số điện thoại, địa chỉ, chữ ký, hợp đồng thật hoặc màn hình CRM.
- Không công khai vị trí giao nhận riêng tư của khách.
- Trẻ em chỉ xuất hiện khi người giám hộ đồng ý bằng văn bản và asset thực sự cần thiết.
- Lưu bằng chứng đồng ý theo quy trình nội bộ, không nhét dữ liệu cá nhân vào CMS công khai.

## 7. Đưa asset lên web

Checklist trước publish:

- Đúng xe, đúng đời, đúng nội dung trang.
- Chọn kích thước phù hợp, nén WebP/AVIF nhưng giữ bản gốc.
- Có width/height để tránh layout shift.
- Hero ưu tiên ảnh thật rõ chủ thể; ảnh dưới fold lazy-load.
- Caption nêu bối cảnh/giả định hữu ích.
- Video có poster, transcript và phương án đọc được khi không phát video.
- Internal link từ bài hỗ trợ tới hub/model và ngược lại nếu hợp intent.
- Ghi ngày chụp/kiểm chứng nếu asset thể hiện giá/chính sách/điểm giao.

## 8. Quy trình xin review Google Business Profile

### Điều kiện kích hoạt

Chỉ mời review khi:

- Booking đã hoàn tất và xe đã trả.
- Không có sự cố/tranh chấp đang mở.
- Khách có kênh liên hệ hợp lệ và chưa được mời cho booking này.

Không chỉ mời khách “chắc chắn sẽ cho 5 sao”. Mọi khách đủ điều kiện đều nhận cùng một lời mời trung lập.

### Thời điểm và tần suất

- Gửi một lần trong khoảng **2–24 giờ sau khi hoàn tất chuyến**.
- Nếu khách không phản hồi, tối đa một nhắc lại sau 3–5 ngày nếu chính sách liên hệ cho phép.
- Dừng ngay khi khách từ chối, có khiếu nại hoặc đã review.

### Mẫu Zalo/SMS

Tin đầu:

> Car Match cảm ơn anh/chị đã sử dụng xe trong chuyến vừa rồi. Nếu thuận tiện, anh/chị có thể chia sẻ trải nghiệm thực tế trên Google tại [LINK REVIEW]. Mọi góp ý tích cực hoặc chưa tốt đều giúp đội ngũ cải thiện dịch vụ. Car Match không yêu cầu nội dung hay số sao cụ thể.

Nhắc lại một lần:

> Car Match xin phép nhắc lại đường dẫn góp ý cho chuyến thuê vừa rồi: [LINK REVIEW]. Nếu anh/chị đã đánh giá hoặc không muốn nhận thêm tin này, có thể bỏ qua; bên em sẽ không nhắc lại.

Không tặng tiền/quà/giảm giá để đổi lấy review, không soạn sẵn review cho khách, không dùng tài khoản nhân viên/người thân để tạo review giả và không “lọc” khách hài lòng ra Google còn khách không hài lòng vào form riêng.

### Dữ liệu vận hành tối thiểu

Ghi theo booking, không lưu nội dung riêng tư không cần thiết:

```text
booking_ref
completed_at
eligible_for_review
invite_sent_at
invite_channel
reminder_sent_at
review_received_at
review_url_or_public_id
response_status
owner
```

Không dùng rating dự đoán hoặc cảm nhận nhân viên để quyết định ai được mời.

## 9. Trả lời review

SLA: **100% review được trả lời trong 2 ngày làm việc**.

Nguyên tắc:

- Cảm ơn, nhắc ngắn gọn chi tiết công khai phù hợp, không copy-paste máy móc.
- Không tiết lộ booking, số điện thoại, hành trình, thiệt hại hoặc tranh chấp.
- Review tiêu cực: thừa nhận trải nghiệm, mời liên hệ qua kênh hỗ trợ và chuyển case cho Ops; không tranh luận công khai.
- Review có thông tin sai: giải thích trung tính bằng chính sách công khai, tránh đổ lỗi.
- Không yêu cầu khách sửa/xóa review như điều kiện để được hỗ trợ.

Mẫu review tích cực:

> Cảm ơn anh/chị đã chia sẻ trải nghiệm với Car Match. Đội ngũ rất vui vì quá trình nhận và trả xe thuận tiện. Hẹn được hỗ trợ anh/chị trong chuyến tiếp theo.

Mẫu review chưa tốt:

> Car Match rất tiếc vì trải nghiệm lần này chưa như mong đợi. Đội ngũ muốn kiểm tra lại đầy đủ và xử lý theo đúng chính sách; anh/chị vui lòng liên hệ kênh hỗ trợ chính thức để bên em đối chiếu booking. Cảm ơn anh/chị đã phản hồi để Car Match cải thiện.

## 10. GBP hàng tuần

- Đăng 1 bộ ảnh giao xe/model thật mỗi tuần.
- Cập nhật xe/dịch vụ chỉ khi thông tin còn hiệu lực.
- Giữ thống nhất tên **Car Match**, website, số điện thoại, giờ hoạt động và khu vực phục vụ.
- Không tạo địa điểm ảo ở Ocean Park, Smart City, Times City, Ecopark hoặc The Manor.
- Dùng review để phát hiện FAQ mới, nhưng không sao chép thông tin cá nhân của khách vào bài.

## 11. Dashboard tuần

| Chỉ số | Mục tiêu vận hành ban đầu |
|---|---:|
| Bộ ảnh thật hoàn thành | 1/tuần |
| Video có transcript | 1/tuần |
| Money page được bổ sung asset | 1/tuần |
| GBP post | 1/tuần |
| Booking đủ điều kiện được mời review | 90–100% |
| Review được trả lời đúng SLA | 100% |
| Outreach chất lượng | 5/tuần |

Theo dõi thêm số review mới, tỷ lệ khách bấm link review, rating trung bình, GBP website/call/directions và organic landing sessions của trang nhận asset. Rating là kết quả để quan sát, không đặt KPI ép nhân viên hoặc khách tạo “5 sao”.

## 12. Definition of done mỗi tuần

- Asset đúng shot list, có file gốc và quyền sử dụng.
- Ops đã fact-check mọi giá/chính sách/thông số.
- Web có ảnh/video, alt/caption/transcript và internal link.
- GBP/social dùng đúng phiên bản đã duyệt.
- Review invite được gửi cho toàn bộ booking đủ điều kiện theo cùng quy tắc.
- Review mới được trả lời trong SLA.
- Dashboard được cập nhật; câu hỏi mới từ review/CSKH được đưa vào backlog AEO.
