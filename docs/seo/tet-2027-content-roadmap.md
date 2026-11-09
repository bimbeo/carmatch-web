# Cụm nội dung Tết 2027 — Website SEO / AEO / GEO

Cập nhật: 2026-11-10
Trạng thái: **Đã triển khai 20/20 URL trong mã nguồn**

## Mục tiêu

- Thu hút hai nhóm nhu cầu có ý định rõ: khách thuê xe tự lái dịp Tết và chủ xe có xe nhàn rỗi muốn hợp tác.
- Tạo câu trả lời trực tiếp, checklist, tiêu chí ra quyết định và FAQ để Google lẫn công cụ AI có thể trích dẫn nội dung an toàn.
- Dẫn traffic về hai trang đích có CTA đo lường được trên website; không phụ thuộc Facebook, Reel hoặc kênh social.

## Hai trang đích ưu tiên

1. `/thue-xe-tu-lai-tet-ha-noi` — hub giao dịch cho khách thuê.
2. `/hop-tac-chu-xe-cho-thue-tet` — hub thu lead chủ xe.

Hai trang đều có canonical, metadata, HTML prerender, breadcrumb/schema phù hợp, CTA Zalo/website và được đưa vào sitemap với `lastmod` 2026-11-10.

## Phân phối nội bộ và GEO

- Trang chủ liên kết trực tiếp tới cả hub khách thuê và hub chủ xe.
- Blog có chuyên đề Tết 2027 trong cả React UI và HTML tĩnh.
- FAQ liên kết tới hai hub theo nhu cầu khách thuê/chủ xe.
- Hub chủ xe hiển thị đủ 10 bài; hub khách thuê hiển thị đủ 8 bài.
- Bài giá thuê xe lễ Tết cũ liên kết ngược về hub thuê xe Tết 2027.
- Hai hub đã được thêm vào `geoKnowledgeBase` và `geoPriorityPages` với câu trả lời trực tiếp cùng liên kết liên quan.

Kiểm tra trước deploy: build production đạt, 101/101 test đạt, audit SEO/GEO có 0 lỗi, 0 cảnh báo và 0 route rỗng.

## 10 bài dành cho chủ xe

1. `/blog/xe-nhan-roi-dip-tet-co-nen-cho-thue-khong`
2. `/blog/hop-tac-chu-xe-cho-thue-tet-can-gi`
3. `/blog/cho-thue-xe-ca-nhan-ngay-tet-co-an-toan-khong`
4. `/blog/hop-dong-hop-tac-cho-thue-xe-can-dieu-khoan-gi`
5. `/blog/doanh-thu-xe-nhan-roi-dip-tet-tinh-the-nao`
6. `/blog/uy-thac-xe-theo-ngay-hay-cho-thue-theo-thang`
7. `/blog/xe-nao-phu-hop-khai-thac-dip-tet`
8. `/blog/chuan-bi-xe-truoc-khi-cho-thue-tet`
9. `/blog/phat-nguoi-vetc-hu-hong-xe-hop-tac-xu-ly-the-nao`
10. `/blog/chu-xe-can-chuan-bi-gi-khi-ban-giao-xe-tet`

## 8 bài dành cho khách thuê

1. `/blog/thue-xe-tu-lai-tet-2027-nen-dat-truoc-bao-lau`
2. `/blog/goi-thue-xe-tet-7-ngay-hay-10-ngay`
3. `/blog/thue-xe-ve-que-an-tet-nen-chon-xe-nao`
4. `/blog/thue-xe-tet-cho-gia-dinh-5-7-nguoi`
5. `/blog/thue-xe-tet-co-nhieu-hanh-ly-chon-xe-nao`
6. `/blog/thue-xe-dien-di-tet-co-phu-hop-khong`
7. `/blog/nhan-tra-xe-tu-lai-dip-tet-can-luu-y-gi`
8. `/blog/thue-xe-tet-ha-noi-di-tinh-can-bao-truoc-gi`

## Nguyên tắc biên tập

- Không cam kết còn xe, thu nhập, bảo hiểm, giá hay thời gian phản hồi khi chưa có dữ liệu cho trường hợp cụ thể.
- Giá và điều kiện cao điểm phải được xác nhận cho đúng xe, ngày và booking.
- Mỗi bài có câu trả lời ngắn ở đầu, tiêu chí quyết định, checklist, rủi ro, quy trình, FAQ và liên kết nội bộ.
- Nội dung chủ xe dẫn về hub hợp tác; nội dung khách thuê dẫn về hub thuê xe Tết, `/xe`, `/chinh-sach` và `/faq`.

## Sau khi deploy

1. Gửi lại `https://www.carmatch.vn/sitemap.xml` trên Google Search Console.
2. Yêu cầu lập chỉ mục trước cho hai hub, sau đó 18 bài theo thứ tự trên.
3. Theo dõi GSC theo nhóm truy vấn `thuê xe Tết`, `xe nhàn rỗi`, `hợp tác chủ xe`, `xe Tết 7 chỗ`, `xe điện đi Tết`.
4. Sau 14–28 ngày, bổ sung đoạn trả lời cho các truy vấn có impression nhưng CTR thấp; không đổi URL.
