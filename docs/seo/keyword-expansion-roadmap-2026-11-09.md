# Roadmap mở rộng độ phủ từ khóa Google và AI Search

Mục tiêu: tạo **64 URL có intent riêng**, liên kết vào các trang xe/hub hiện có và tránh tạo trang mỏng chỉ thay tên model hoặc địa điểm.

Trạng thái cập nhật: **09/11/2026**

## Nguyên tắc triển khai

- Trang model `/xe/...` giữ intent đặt xe cụ thể.
- Blog so sánh/giải đáp mở rộng long-tail và dẫn về trang model.
- Landing khu vực chỉ xuất bản sau khi Ops xác nhận phục vụ ổn định.
- Trang chi phí tuyến phải có phép tính, giả định và ngày kiểm chứng.
- Bài chính sách/rủi ro phải được Ops duyệt trước khi publish.
- Mọi URL cần static HTML, canonical, sitemap, schema phù hợp và ít nhất ba internal link có ngữ cảnh.

## Tiến độ tổng

| Wave | Cụm | Số URL | Trạng thái |
|---|---|---:|---|
| 1 | Model, so sánh và tình huống dùng xe | 18 | Hoàn thành 18/18 |
| 2 | Khu vực Hà Nội | 12 | Hoàn thành 12/12 với điều kiện xác nhận theo booking |
| 3 | Chi phí theo điểm đến | 10 | Hoàn thành 10/10 |
| 4 | Câu hỏi AEO và hỗ trợ khách | 16 | Hoàn thành 16/16 |
| 5 | Thuê tháng/B2B | 8 | Hoàn thành 8/8 |
| **Tổng** |  | **64** | **64/64 đã triển khai** |

## Wave 1 — Model và so sánh

### Đã triển khai trong batch 1

| URL | Intent |
|---|---|
| `/blog/vf5-hay-vf6-phu-hop-gia-dinh-hon` | So sánh VF5–VF6 cho gia đình |
| `/blog/vf6-hay-vf7-phu-hop-di-tinh-hon` | So sánh VF6–VF7 khi đi tỉnh |
| `/blog/vf7-hay-vf8-phu-hop-chuyen-di-dai` | So sánh VF7–VF8 cho chuyến dài |
| `/blog/vf5-co-phu-hop-di-tinh-khong` | Khả năng dùng VF5 đi tỉnh |
| `/blog/vf6-co-phu-hop-gia-dinh-5-nguoi-khong` | VF6 cho gia đình năm người |
| `/blog/vf7-cho-duoc-bao-nhieu-hanh-ly` | Bài toán hành lý của VF7 |
| `/blog/vf8-co-phu-hop-di-duong-dai-khong` | VF8 cho đường dài |
| `/blog/toyota-raize-hay-vinfast-vf5-di-pho` | Raize–VF5 cho nhu cầu đi phố |

### Batch 2 — Đã triển khai

| URL đề xuất | Intent |
|---|---|
| `/blog/vf7s-hay-vf7-plus-khac-nhau-the-nao` | So sánh hai phiên bản và ghi rõ VF7 Plus đang tạm ngừng |
| `/blog/chi-phi-sac-vf5-cho-chuyen-di-300-km` | Công thức chi phí sạc VF5 |
| `/blog/chi-phi-sac-vf6-cho-chuyen-di-300-km` | Công thức chi phí sạc VF6 |
| `/blog/thue-vf5-theo-ngay-hay-theo-thang` | Quyết định ngày/tháng cho VF5 |
| `/blog/vf3-vf5-hay-vf6-phu-hop-di-pho` | Bảng chọn ba model xe điện nhỏ |
| `/blog/fadil-hay-vf3-phu-hop-di-pho` | Xe xăng cỡ nhỏ và xe điện |
| `/blog/creta-hay-vf6-phu-hop-gia-dinh` | Creta–VF6 cho gia đình |
| `/blog/xpander-hay-limo-green-cho-nhom-dong` | Xe 7 chỗ xăng và điện |
| `/blog/limo-green-cho-duoc-bao-nhieu-vali` | Hành lý Limo Green |
| `/blog/jaecoo-j7-hay-vf7-di-tinh` | So sánh và ghi rõ Jaecoo J7 đang tạm ngừng |

## Wave 2 — Khu vực Hà Nội

Trạng thái: **Đã triển khai 12/12** theo phê duyệt tiếp tục ngày 09/11/2026. Do chưa có bảng phí/điểm giao cố định cho toàn bộ khu vực, tất cả trang dùng guardrail chung: tiếp nhận yêu cầu nhưng chỉ xác nhận xe, điểm hẹn, khung giờ và khoản giao nhận nếu có theo đúng booking; không hứa giao tận nơi và không ghi phí cứng. Tên khu vực cũ như Nam/Bắc Từ Liêm hoặc Mỹ Đình được giữ cho intent tìm kiếm, đồng thời yêu cầu khách gửi phường và địa chỉ hiện tại sau sắp xếp hành chính.

| URL đã triển khai | Khu vực/giá trị riêng |
|---|---|
| `/thue-xe-tu-lai-cau-giay` | Văn phòng/chung cư, Vành đai 3, Nội Bài |
| `/thue-xe-tu-lai-my-dinh` | Tòa nhà, bến xe/sân vận động, giờ sự kiện |
| `/thue-xe-tu-lai-ha-dong` | Khu đô thị, trục Tây Nam, hướng Hòa Bình |
| `/thue-xe-tu-lai-tay-ho` | Phố ven hồ, khách nước ngoài, hướng Nội Bài |
| `/thue-xe-tu-lai-long-bien` | Qua cầu, khu dân cư phía Đông, Hải Phòng/Hạ Long |
| `/thue-xe-tu-lai-hoan-kiem` | Phố trung tâm, hạn chế dừng, phố đi bộ |
| `/thue-xe-tu-lai-hai-ba-trung` | Nội đô, Times City, hướng Ninh Bình |
| `/thue-xe-tu-lai-thanh-xuan` | Chung cư, Vành đai 3, bàn giao ngoài hầm |
| `/thue-xe-tu-lai-nam-tu-liem` | Mapping tên quận cũ sang Từ Liêm/Đại Mỗ/Tây Mỗ |
| `/thue-xe-tu-lai-bac-tu-liem` | Mapping sang Phú Diễn/Xuân Đỉnh/Đông Ngạc |
| `/thue-xe-tu-lai-gia-lam` | Ocean Park riêng, phạm vi phía Đông, tuyến cao tốc |
| `/thue-xe-tu-lai-dong-anh-noi-bai` | Phân biệt nhà ga và khu dân cư, thông tin chuyến bay |

## Wave 3 — Chi phí theo điểm đến

Trạng thái: **Đã triển khai 10/10**. Mỗi bài dùng công thức thay số, nêu rõ giả định, liên kết hai chiều với trang `/di-dau/...` và không cố định giá nhiên liệu/phí đường dễ lỗi thời.

| URL đã triển khai | Trang hub nhận internal link |
|---|---|
| `/blog/chi-phi-thue-xe-tu-lai-di-ninh-binh` | `/di-dau/ninh-binh` |
| `/blog/chi-phi-thue-xe-tu-lai-di-ha-long` | `/di-dau/ha-long` |
| `/blog/chi-phi-thue-xe-tu-lai-di-tam-dao` | `/di-dau/tam-dao` |
| `/blog/chi-phi-thue-xe-tu-lai-di-moc-chau` | `/di-dau/moc-chau` |
| `/blog/chi-phi-thue-xe-tu-lai-di-sapa` | `/di-dau/sapa` |
| `/blog/chi-phi-thue-xe-tu-lai-di-cat-ba` | `/di-dau/cat-ba` |
| `/blog/chi-phi-thue-xe-tu-lai-di-ba-vi` | `/di-dau/ba-vi` |
| `/blog/chi-phi-thue-xe-tu-lai-di-mai-chau` | `/di-dau/mai-chau` |
| `/blog/chi-phi-thue-xe-tu-lai-di-hai-phong` | `/di-dau/hai-phong` |
| `/blog/chi-phi-thue-xe-tu-lai-di-soc-son` | `/di-dau/soc-son` |

## Wave 4 — Câu hỏi AEO

Trạng thái: **Đã triển khai 16/16**. Nội dung dựa trên chính sách công khai hiện tại, ưu tiên hướng dẫn an toàn và yêu cầu xác nhận theo đúng xe/hợp đồng. Các bài pháp lý, bảo hiểm và chính sách không đưa cam kết hoặc mức phí chưa được xác minh.

| URL đã triển khai | Nguồn/guardrail |
|---|---|
| `/blog/co-duoc-cho-nguoi-khac-lai-xe-thue-khong` | Chính sách công khai: người lái phải được ghi nhận |
| `/blog/nguoi-nuoc-ngoai-thue-xe-tu-lai-can-giay-to-gi` | 22/VBHN-BGTVT; kiểm tra giấy tờ gốc |
| `/blog/co-duoc-di-xe-thue-ra-ngoai-ha-noi-khong` | Chính sách công khai: báo và xác nhận tuyến trước |
| `/blog/phi-vetc-xe-thue-thanh-toan-the-nao` | Đối soát giao dịch thực tế, không ghi phí cứng |
| `/blog/xe-thue-bi-thung-lop-xu-ly-the-nao` | Hướng dẫn an toàn; chi phí theo nguyên nhân/hợp đồng |
| `/blog/xe-thue-khong-khoi-dong-can-lam-gi` | Hướng dẫn an toàn; không tự can thiệp kỹ thuật |
| `/blog/mat-chia-khoa-xe-thue-xu-ly-the-nao` | Không tự làm chìa; đối soát chi phí thực tế |
| `/blog/co-duoc-mang-thu-cung-len-xe-thue-khong` | Yêu cầu chấp thuận cho đúng xe |
| `/blog/co-duoc-hut-thuoc-tren-xe-thue-khong` | Không mặc định được phép; xác nhận theo xe |
| `/blog/tra-xe-thue-khac-dia-diem-co-duoc-khong` | Chỉ đổi điểm trả khi được xác nhận trước |
| `/blog/co-the-nhan-xe-thue-dem-muon-khong` | Không cam kết giờ cố định; xác nhận theo lịch vận hành |
| `/blog/can-chup-nhung-gi-khi-nhan-xe-tu-lai` | Quy trình bàn giao hiện tại |
| `/blog/bien-ban-ban-giao-xe-thue-can-co-gi` | Checklist hồ sơ, không thay thế hợp đồng |
| `/blog/bao-lau-sau-khi-tra-xe-duoc-hoan-coc` | Không hứa thời hạn chung; yêu cầu mốc bằng văn bản |
| `/blog/bao-hiem-xe-thue-chi-tra-nhung-gi` | Nghị định 67/2023; kiểm tra hợp đồng đúng xe |
| `/blog/gia-thue-xe-le-tet-tinh-the-nao` | Không đặt hệ số; dùng báo giá đúng booking |

## Wave 5 — Thuê tháng và B2B

Trạng thái: **Đã triển khai 8/8**. Mỗi bài có câu trả lời trực tiếp, bảng quyết định, checklist báo giá/hợp đồng và liên kết hai chiều với `/thue-xe-thang`. Nội dung không mặc định hóa đơn, xe thay thế, hạn mức km hoặc SLA nếu chưa được xác nhận cho đúng booking.

| URL đã triển khai | Intent/guardrail |
|---|---|
| `/blog/thue-xe-thang-cho-doanh-nghiep-nho` | Tổng chi phí, người lái và quy trình quản trị |
| `/blog/thue-xe-thang-cho-chuyen-gia-nuoc-ngoai` | Kiểm tra giấy phép/người lái, không mặc định hồ sơ hợp lệ |
| `/blog/thue-xe-thang-cho-nhan-vien-di-cong-tac` | Lịch chạy, km, VETC và đối soát chuyến |
| `/blog/goi-thue-xe-22-ngay-va-30-ngay-khac-gi-nhau` | So quyền giữ xe, km và giao nhận thay vì chỉ giá |
| `/blog/thue-xe-thang-co-xuat-hoa-don-khong` | Xác nhận chủ thể/phạm vi chứng từ trước khi cọc |
| `/blog/hop-dong-thue-xe-thang-can-dieu-khoan-gi` | Checklist hợp đồng và phụ lục bàn giao |
| `/blog/thue-xe-thang-co-gioi-han-km-khong` | Không đặt mức chung; dùng kịch bản km thực tế |
| `/blog/xe-thay-the-khi-bao-duong-xu-ly-the-nao` | Không hứa SLA; định nghĩa xe tương đương theo công việc |

## Definition of done cho mỗi batch

1. Nội dung có một intent riêng, câu trả lời trực tiếp và dữ liệu/giả định rõ.
2. Không trùng slug, title hoặc canonical với URL hiện có.
3. Có liên kết tới ít nhất hai trang xe/hub và hai bài hỗ trợ liên quan khi phù hợp.
4. Hub liên quan liên kết ngược lại bài mới.
5. Static build tạo HTML, sitemap, RSS, `llms.txt` và `llms-full.txt`.
6. Test kiểm tra canonical, metadata, H1/heading, nội dung tối thiểu và tên thương hiệu.
7. Chỉ push/deploy sau khi toàn bộ batch vượt build và audit.
