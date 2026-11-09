# Đặc tả calculator tổng chi phí thuê xe

Trạng thái: **sẵn sàng cho thiết kế và triển khai**

Owner nghiệp vụ: **Lâm/Ops**

Owner sản phẩm/nội dung: **Bim + Đạt/AI**

Mục tiêu phát hành đề xuất: giai đoạn tài sản dữ liệu, sau khi các công thức được Ops duyệt.

## 1. Mục tiêu

Giúp khách ước tính **tổng tiền phải chuẩn bị cho một chuyến đi**, không chỉ nhìn giá thuê ngày. Công cụ phải trả lời được:

- Tiền thuê xe dự kiến.
- Phí giao/nhận nếu có.
- Nhiên liệu hoặc sạc dự kiến.
- Phí cao tốc/VETC, gửi xe do khách nhập hoặc dùng gợi ý tuyến.
- Phí vượt km dự kiến nếu gói có giới hạn.
- Tiền cọc cần chuẩn bị, hiển thị riêng và không cộng vào “chi phí chuyến đi”.

Calculator là công cụ hỗ trợ quyết định, không phải báo giá/hợp đồng chính thức.

## 2. Phạm vi phiên bản 1

### Bao gồm

- Thuê theo ngày cho xe đang có trong fleet công khai.
- Chọn thời gian nhận/trả và cách làm tròn ngày theo chính sách đã duyệt.
- Chọn hoặc nhập tổng quãng đường dự kiến.
- Gợi ý tuyến phổ biến nếu có dữ liệu đã kiểm chứng.
- Ước tính sạc/nhiên liệu từ mức tiêu thụ và đơn giá do Ops cấu hình.
- Tách “chi phí chuyến đi” và “tiền mặt cần chuẩn bị”.
- CTA kiểm tra lịch xe hoặc mở form đặt xe, giữ lại các lựa chọn calculator.
- URL/chia sẻ kết quả bằng query params không chứa PII.

### Chưa bao gồm

- Báo giá lễ/Tết tự động khi chưa có bảng giá đã duyệt.
- Tính bồi thường, bảo hiểm, phạt nguội hoặc hư hỏng.
- Cam kết trạm sạc, thời gian di chuyển hay mức tiêu thụ chính xác.
- Tính vay/mua xe. Calculator “thuê tháng so với mua” là phiên bản 2 độc lập.

## 3. Điểm đặt và intent SEO

Đề xuất đặt section tương tác tại `/lap-ke-hoach-chuyen-di`, đồng thời có liên kết rõ từ:

- Trang chủ.
- `/thue-xe-dien-ha-noi`.
- `/thue-xe-thang` nếu sau này hỗ trợ gói tháng.
- Trang model xe.
- Các trang route/điểm đến.
- Bài bảng giá/chi phí.

Không tạo một URL mỏng chỉ chứa form. Trang chứa calculator cần có đoạn trả lời trực tiếp, giải thích giả định, ví dụ tính, ngày kiểm chứng và người kiểm duyệt.

## 4. Dữ liệu đầu vào

| Trường | Bắt buộc | Nguồn | Ghi chú |
|---|---|---|---|
| Mẫu xe | Có | Fleet/API công khai | Chỉ hiển thị xe có thể đặt hoặc còn hoạt động |
| Thời gian nhận | Có | Người dùng | Múi giờ Asia/Ho_Chi_Minh |
| Thời gian trả | Có | Người dùng | Phải sau thời gian nhận |
| Quãng đường dự kiến | Có | Người dùng/gợi ý tuyến | Cho phép sửa tay |
| Điểm giao/nhận | Không | Người dùng/bảng khu vực | Không suy đoán phí nếu chưa cấu hình |
| Loại năng lượng | Tự động | Dữ liệu xe | Điện/xăng/dầu |
| Mức tiêu thụ | Tự động, cho phép xem | Ops cấu hình | Hiển thị là giả định tham khảo |
| Đơn giá năng lượng | Tự động | Ops cập nhật | Luôn có ngày cập nhật |
| Phí cao tốc/VETC | Không | Gợi ý tuyến/người dùng | Cho phép nhập 0 |
| Phí gửi xe | Không | Người dùng | Không tự khẳng định giá bãi |
| Phụ phí đã biết | Không | Cấu hình | Chỉ dùng khoản phí hiển thị và giải thích được |

Tuyệt đối không hard-code giá, mức cọc, giới hạn km hoặc phụ phí chưa được Ops xác nhận vào nội dung SEO.

## 5. Dữ liệu cấu hình tối thiểu

Mỗi model/gói cần có:

```text
vehicle_id
vehicle_slug
display_name
energy_type
daily_rate
included_km_per_day
overage_rate_per_km
deposit_amount
consumption_per_100km
consumption_unit
rate_valid_from
rate_valid_to
last_verified_at
verified_by
```

Mỗi khu vực giao xe cần có:

```text
zone_id
zone_name
delivery_fee
pickup_fee
conditions
last_verified_at
verified_by
```

Các trường chưa có dữ liệu phải trả về `unknown`, không tự đổi thành 0.

## 6. Công thức phiên bản 1

### Số ngày thuê

```text
rental_days = policy_rounding(return_at - pickup_at)
```

Quy tắc `policy_rounding` phải do Ops cung cấp. UI cần giải thích cách làm tròn trước khi khách gửi form.

### Tiền thuê cơ bản

```text
base_rental = rental_days × daily_rate
```

Nếu ngày lễ/chặng giá chưa có dữ liệu, hiển thị “cần xác nhận” thay vì lấy giá ngày thường.

### Km vượt dự kiến

```text
included_km = rental_days × included_km_per_day
estimated_overage_km = max(0, planned_km - included_km)
estimated_overage_cost = estimated_overage_km × overage_rate_per_km
```

### Năng lượng

```text
energy_quantity = planned_km × consumption_per_100km / 100
energy_cost = energy_quantity × energy_unit_price
```

Mức tiêu thụ thực tế thay đổi theo tải, điều hòa, tốc độ, đường và phong cách lái; disclaimer phải nằm ngay cạnh kết quả.

### Tổng chi phí và tiền cần chuẩn bị

```text
trip_cost_estimate = base_rental
                   + delivery_fee
                   + pickup_fee
                   + estimated_overage_cost
                   + energy_cost
                   + toll_estimate
                   + parking_estimate
                   + disclosed_addons

cash_to_prepare = trip_cost_estimate + deposit_amount
```

UI phải thể hiện tiền cọc là khoản tạm giữ/đảm bảo theo chính sách, không gọi là chi phí chuyến đi.

### Làm tròn

- Hiển thị tiền theo VND, làm tròn tới 1.000 đồng ở phần ước tính.
- Phần chi tiết có thể giữ giá trị tính thực để đối chiếu.
- Không dùng khoảng giá giả nếu chỉ có một giá cấu hình; nếu bất định, ghi rõ khoản nào “cần xác nhận”.

## 7. Kết quả hiển thị

Thứ tự ưu tiên:

1. Tổng chi phí chuyến đi ước tính.
2. Khoảng bất định hoặc danh sách khoản cần xác nhận.
3. Bảng breakdown từng khoản.
4. Tiền cọc và tổng tiền cần chuẩn bị.
5. Giả định: số ngày, km, mức tiêu thụ, đơn giá, ngày cập nhật.
6. CTA “Kiểm tra lịch xe” và “Nhắn Car Match xác nhận”.
7. Hai lựa chọn xe gần nhất để so sánh.

Không dùng CTA hoặc nội dung ngụ ý kết quả là giá cuối cùng.

## 8. Trạng thái và lỗi

- Ngày trả trước/ngang ngày nhận: chặn tính và đưa lỗi tại trường.
- Thiếu giá xe: vẫn cho tính các khoản khác nhưng ghi “giá thuê cần xác nhận”, không cho tổng giả.
- Thiếu mức tiêu thụ: bỏ khoản năng lượng khỏi tổng và giải thích.
- Thiếu phí giao xe: hiển thị “chưa gồm phí giao/nhận”.
- Quãng đường âm/0: chặn hoặc yêu cầu xác nhận nếu khách chỉ thuê tại chỗ.
- API lỗi: giữ dữ liệu người dùng đã nhập; không reset form.
- Giá hết hiệu lực: không dùng âm thầm; yêu cầu Ops xác nhận.

## 9. Tracking

Các event đề xuất:

| Event | Khi nào bắn | Thuộc tính không chứa PII |
|---|---|---|
| `cm_cost_calculator_start` | Người dùng tương tác lần đầu | landing_page, vehicle_slug |
| `cm_cost_calculator_complete` | Hiển thị được kết quả | vehicle_slug, rental_days, distance_band, estimated_total_band, has_unknown_cost |
| `cm_cost_calculator_compare` | Đổi model để so sánh | from_vehicle, to_vehicle |
| `cm_cost_calculator_vehicle_click` | Mở trang model | vehicle_slug |
| `cm_cost_calculator_booking_click` | Mở form đặt xe | vehicle_slug, rental_days, distance_band |
| `cm_cost_calculator_contact_click` | Bấm gọi/Zalo | channel, vehicle_slug |

Không đưa số điện thoại, tên, địa chỉ chi tiết, biển số hoặc nội dung trao đổi vào analytics.

## 10. SEO, AEO và schema

- Render server/static được phần giải thích, công thức, ví dụ và câu hỏi thường gặp; calculator JS chỉ là phần nâng cao.
- H1 phải trả lời intent “tổng chi phí thuê xe” thay vì nhồi nhiều biến thể keyword.
- Có ví dụ 2 ngày/1 đêm và 3 ngày/2 đêm với giả định rõ, lấy từ cấu hình hợp lệ.
- Ghi `last verified`, người viết và người duyệt nghiệp vụ.
- Dùng `BreadcrumbList` và schema đúng với trang hiện có. Không tạo rating/review, giá hoặc `Offer` không hiển thị.
- Không kỳ vọng FAQ rich result; FAQ phục vụ người đọc và AI citation.

## 11. Fact-check bắt buộc trước khi code

Lâm/Ops cần duyệt bằng văn bản:

- Cách làm tròn ngày/giờ thuê.
- Giá ngày thường, cuối tuần, lễ/Tết và thời hạn áp dụng.
- Km bao gồm theo từng model/gói.
- Phí vượt km.
- Mức cọc và quy trình hoàn.
- Phí giao/nhận theo khu vực và điều kiện miễn phí.
- Cách xử lý mức pin/nhiên liệu khi nhận và trả.
- Mức tiêu thụ tham khảo được phép công khai.

Nếu một mục chưa được duyệt, phiên bản 1 phải đánh dấu “cần xác nhận”, không tự suy luận.

## 12. Tiêu chí nghiệm thu

1. Cùng đầu vào và cùng phiên bản cấu hình luôn cho cùng kết quả.
2. Tổng breakdown khớp tổng hiển thị, sai số tối đa do làm tròn là 1.000 đồng/mục.
3. Tiền cọc không bị cộng vào chi phí chuyến đi.
4. Không có khoản phí ẩn hoặc dữ liệu `unknown` bị coi là 0.
5. Form dùng được bằng bàn phím, có label/error và hoạt động tốt trên mobile.
6. Kết quả vẫn đọc được khi JS lỗi ở mức nội dung hướng dẫn/giả định.
7. CTA giữ lại model, ngày và quãng đường nhưng không ghi PII vào URL.
8. Analytics không gửi PII.
9. Có unit test cho công thức và test cho các trạng thái thiếu dữ liệu.
10. Ops có thể cập nhật giá/cấu hình mà không sửa nội dung bài SEO.

## 13. Bộ test tối thiểu

- Thuê đúng 24 giờ, không vượt km.
- Thuê qua nhiều ngày, có giờ lẻ theo policy rounding.
- Vượt km và không vượt km.
- Xe điện và xe xăng cùng một quãng đường.
- Có/không có phí giao xe.
- Có khoản chưa xác định.
- Giá hết hiệu lực.
- Ngày trả không hợp lệ.
- Số km cực lớn, không tràn số.
- Chia sẻ URL rồi tải lại cho cùng lựa chọn không PII.

## 14. Phiên bản 2: thuê tháng so với mua

Chỉ triển khai khi Ops/Finance cung cấp dữ liệu đủ tin cậy. Tách riêng các biến: giá mua, khấu hao, lãi vay, bảo hiểm, đăng kiểm, bảo dưỡng, lốp, bãi đỗ, chi phí vốn và số tháng sử dụng. Kết quả phải là mô hình theo giả định, không phải tư vấn tài chính hay cam kết tiết kiệm.
