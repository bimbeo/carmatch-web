export interface LocalHubData {
  slug: 'cau-giay';
  locationShortName: string;
  heroLead: string;
  heroPills: string[];
  pickupAreas: string[];
  requiredDocuments: string;
}

/**
 * Pilot-only operational copy for the Cầu Giấy landing page.
 * Keep these facts aligned with the booking flow before expanding to other areas.
 */
export const cauGiayHubData: LocalHubData = {
  slug: 'cau-giay',
  locationShortName: 'Cầu Giấy',
  heroLead: 'Tìm xe 4–7 chỗ phù hợp cho công việc, gia đình hoặc chuyến đi tỉnh. Xem ảnh, giá tham khảo và điều kiện thuê; chọn ngày giờ và điểm nhận để Car Match kiểm tra lịch, chi phí trước khi xác nhận.',
  heroPills: [
    'Hỗ trợ giao xe theo địa chỉ và lịch đã xác nhận',
    'Nhiều lựa chọn xe tự động',
    'Giá, cọc và phụ phí được báo trước khi xác nhận',
  ],
  pickupAreas: [
    'Duy Tân – Tôn Thất Thuyết – Phạm Hùng – Dịch Vọng Hậu',
    'Trung Hòa – Nhân Chính – Trần Duy Hưng – Hoàng Đạo Thúy',
    'Xuân Thủy – Cầu Giấy – Nguyễn Văn Huyên – Hoàng Quốc Việt',
  ],
  requiredDocuments: 'giấy tờ định danh, giấy phép lái xe phù hợp và điều kiện bảo đảm theo chính sách của từng xe',
};
