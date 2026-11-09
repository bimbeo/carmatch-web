# Bản đồ query–page GSC và kiểm tra cannibalization

Ngày chốt dữ liệu: **09/11/2026**

Khoảng dữ liệu: **08/08/2026–07/11/2026 (90 ngày)**

Nguồn: Google Search Console của `sc-domain:carmatch.vn`

Bản xuất đầy đủ: [Google Sheet — carmatch.vn Performance on Search 2026-11-09](https://docs.google.com/spreadsheets/d/12BOFEQm6MAfQhd4EM200R0flIjcr10IHCS4Wrmz408k/edit)

> Lưu ý: các hub/nội dung phát hành ngày 08/11 chưa nằm trong cửa sổ dữ liệu này. Không dùng báo cáo này để kết luận sớm rằng trang mới không hiệu quả.

## Baseline toàn website

| Chỉ số | Kết quả |
|---|---:|
| Click | 1.537 |
| Impression | 43.237 |
| CTR | 3,6% |
| Vị trí trung bình | 6,4 |
| Query có dữ liệu | 436 |

## Query–page map ưu tiên

| Query | Click | Impression | CTR tính lại | Vị trí | URL đang nhận traffic chính | Kết luận |
|---|---:|---:|---:|---:|---|---|
| thuê xe tự lái hà nội | 83 | 4.330 | 1,9% | 9,1 | `/` — 83 click, 4.287 impression | Trang chủ sở hữu đúng intent; CTR và vị trí còn nhiều dư địa |
| thuê xe điện tự lái hà nội | 119 | 1.020 | 11,7% | 2,9 | `/` — 119 click, 1.018 impression | Trang chủ đang thắng; hub `/thue-xe-dien-ha-noi` quá mới để đánh giá |
| thuê xe vinfast tự lái hà nội | 32 | 393 | 8,1% | 3,7 | `/` — toàn bộ 32 click | Sạch, chưa cần đổi URL đích |
| thuê xe vf3 tự lái hà nội | 69 | 538 | 12,8% | 2,3 | Nhiều URL xe VF3 | Có phân tán lịch sử; xem chi tiết bên dưới |
| thuê xe vf5 tự lái hà nội | 59 | 336 | 17,6% | 2,0 | `/` — 59 click, 336 impression | Trang chủ sở hữu truy vấn; model page mới chỉ có 3 impression |
| thuê xe carnival tự lái hà nội | 60 | 235 | 25,5% | 1,6 | `/xe/kia-carnival` — toàn bộ 60 click | Sạch và đang hoạt động tốt |
| thuê xe carnival hà nội | 13 | 725 | 1,8% | 4,1 | `/xe/kia-carnival` — toàn bộ 13 click | Đúng URL nhưng CTR thấp; ứng viên thử title/meta sau mốc 14 ngày |
| thuê xe tự lái theo tháng | 14 | 170 | 8,2% | 4,2 | `/thue-xe-thang` — toàn bộ 14 click | Sạch |
| thuê xe tháng | 4 | 473 | 0,8% | 4,6 | `/thue-xe-thang` — toàn bộ 4 click | Đúng URL nhưng CTR thấp; cần làm rõ lợi ích/bảng giá trong snippet |

## Các trường hợp cần xử lý

### P0 — VF3 từng có nhiều URL cùng xuất hiện

Với query `thuê xe vf3 tự lái hà nội`, GSC ghi nhận:

| URL | Click | Impression | Vị trí |
|---|---:|---:|---:|
| `/xe/vinfast-vf3-2024` | 27 | 315 | 2,8 |
| `/xe/vinfast-vf3-2025` | 24 | 194 | 3,1 |
| `/xe/vinfast-vf3-2024-xanh` | 11 | 53 | 1,7 |
| `/` | 9 | 382 | 8,3 |

Trạng thái kỹ thuật hiện tại:

- `/xe/vinfast-vf3-2024-xanh` đã 301 về `/xe/vinfast-vf3-2024`.
- URL có biển số đã 301 về trang model tương ứng.
- Hai trang model 2024 và 2025 vẫn tồn tại độc lập vì đại diện cho hai đời xe khác nhau.

Hành động:

1. Giữ redirect hiện có, không khôi phục URL màu/biển số.
2. Phân biệt rõ hai trang 2024 và 2025 bằng ảnh xe thật, thông số fleet, giá, biển/đời xe và tình trạng lịch.
3. Sau 28 ngày, nếu một đời xe không còn trong fleet hoặc gần như không có lead, 301 trang yếu về trang model còn hoạt động.
4. Nếu cả hai đời vẫn cho thuê, tạo một section so sánh ngắn trên trang mạnh hơn và liên kết rõ sang đời còn lại; không để title/meta giống nhau.

### P1 — Trang chủ và hub xe điện

Toàn bộ dữ liệu 90 ngày kết thúc trước khi `/thue-xe-dien-ha-noi` được phát hành. Hiện tại chưa có bằng chứng hub đang tranh traffic với trang chủ.

Quy ước intent:

- `/`: nhu cầu chung “thuê xe tự lái Hà Nội”, đồng thời có thể xếp hạng cho VinFast/xe điện ở mức tổng quan.
- `/thue-xe-dien-ha-noi`: nhu cầu chọn xe điện, so sánh model, sạc/pin, chi phí và lịch xe điện.
- `/xe/...`: nhu cầu xem/đặt một model cụ thể.
- `/blog/...`: câu hỏi hỗ trợ, so sánh hoặc kinh nghiệm; không cạnh tranh title thương mại chính.

Chỉ consolidate khi sau ít nhất 28 ngày hai URL liên tục nhận cùng một query và không thể phân biệt intent bằng nội dung.

### P1 — CTR thấp ở truy vấn đang top 10

Ba cơ hội rõ nhất:

1. `thuê xe tự lái hà nội`: vị trí 9,1 nhưng CTR 1,9%.
2. `thuê xe carnival hà nội`: vị trí 4,1 nhưng CTR 1,8%.
3. `thuê xe tháng`: vị trí 4,6 nhưng CTR 0,8%.

Không đổi title hàng loạt ngay. Tại checkpoint 14 ngày, chỉ thử từng trang một; ghi lại title/meta cũ, mới và ngày đổi để tránh mất khả năng đối chiếu.

### P2 — Chuẩn hóa hostname và URL cũ

GSC còn vài impression lẻ cho hostname không có `www` và URL gõ sai `/thue-xethang`. Đây chưa phải cannibalization đáng kể. Cần duy trì 301 về hostname chuẩn, self-canonical và không đưa URL cũ vào sitemap/internal link.

## Lịch kiểm tra 14/28/42 ngày

Lấy ngày phát hành 08/11/2026 làm mốc:

| Checkpoint | Ngày | Quyết định |
|---|---|---|
| 14 ngày | 22/11/2026 | Kiểm tra index, impression, query mới; thử title/meta cho trang top 10 CTR thấp |
| 28 ngày | 06/12/2026 | Kiểm tra query trùng giữa homepage, hub và model; tăng nội dung/internal link cho vị trí 5–20 |
| 42 ngày | 20/12/2026 | Gộp/redirect trang gần như không có impression hoặc không có intent riêng; giữ trang hỗ trợ có assisted conversion |

Mỗi lần đo phải lưu cùng các cột: query, page, click, impression, CTR, position, organic sessions, vehicle view, form open, booking submit, phone/Zalo click.

## 30 câu hỏi AI Search cần theo dõi

Theo dõi thủ công cùng một tài khoản/vị trí tương đối ổn định, ghi ngày, nguồn được trích và URL Car Match nếu xuất hiện:

1. Thuê xe tự lái Hà Nội ở đâu uy tín?
2. Giá thuê xe tự lái Hà Nội một ngày bao nhiêu?
3. Thuê xe tự lái Hà Nội cần giấy tờ gì?
4. Thuê xe tự lái Hà Nội cần đặt cọc bao nhiêu?
5. Thuê xe tự lái Hà Nội giao tận nơi có mất phí không?
6. Thuê xe điện tự lái Hà Nội ở đâu?
7. Thuê VF3 tự lái Hà Nội giá bao nhiêu?
8. Thuê VF5 tự lái Hà Nội giá bao nhiêu?
9. VF3 hay VF5 phù hợp đi phố hơn?
10. Thuê xe điện đi tỉnh cần lưu ý gì?
11. Chi phí sạc xe điện cho chuyến 300 km bao nhiêu?
12. Xe điện thuê có phải trả đúng mức pin không?
13. Thuê Carnival tự lái Hà Nội giá bao nhiêu?
14. Carnival chở được bao nhiêu vali?
15. Carnival hay Xpander phù hợp gia đình hơn?
16. Carnival, Xpander hay Limo Green cho nhóm 6 người?
17. Thuê xe 7 chỗ Hà Nội loại nào tiết kiệm?
18. Thuê xe tháng Hà Nội giá bao nhiêu?
19. Thuê xe theo tháng hay thuê từng ngày tiết kiệm hơn?
20. Thuê xe tháng hay mua xe phù hợp doanh nghiệp nhỏ?
21. Thuê xe hai ngày một đêm hết bao nhiêu?
22. Thuê xe ba ngày hai đêm hết bao nhiêu?
23. Thuê xe tự lái vượt km tính phí thế nào?
24. Trả xe thuê muộn tính phí ra sao?
25. Hủy thuê xe có được hoàn cọc không?
26. Xe thuê bị xước nhỏ ai chịu?
27. Xe thuê bị phạt nguội ai trả?
28. Cần chụp gì khi nhận xe tự lái?
29. Thuê xe tự lái đi Ninh Bình tổng chi phí bao nhiêu?
30. Thuê xe tự lái đi Hạ Long nên chọn xe nào?

## Quy tắc ra quyết định

- Có impression, vị trí 5–20: bổ sung câu trả lời, dữ liệu thật và internal link.
- Top 10 nhưng CTR thấp: thử title/meta có kiểm soát.
- Có traffic nhưng không có vehicle view/form open: xem lại intent và CTA.
- Hai URL cùng query: phân biệt intent trước; chỉ gộp khi không thể phân biệt hoặc một URL không còn giá trị vận hành.
- Gần như không có impression sau 42 ngày: kiểm tra index, canonical, internal link rồi mới quyết định gộp.
- Không ra quyết định từ query bất thường nếu chưa đối chiếu lại GSC ở cửa sổ thời gian khác.
