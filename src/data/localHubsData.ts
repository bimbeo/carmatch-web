export interface LocalHubData {
  slug: 'cau-giay';
  locationShortName: string;
  heroLead: string;
  heroPills: string[];
  pickupAreas: string[];
  pickupHub: string;
  serviceHours: string;
  deliveryFeePerWay: number;
  requiredDocuments: string;
}

/**
 * Pilot-only operational copy for the Cầu Giấy landing page.
 * Keep these facts aligned with the booking flow before expanding to other areas.
 */
export const cauGiayHubData: LocalHubData = {
  slug: 'cau-giay',
  locationShortName: 'Cầu Giấy',
  heroLead: 'Chọn xe số tự động 4–7 chỗ để đi từ Cầu Giấy, Duy Tân, Trung Hòa, Xuân Thủy và các khu vực lân cận. Bạn có thể tự nhận xe miễn phí tại điểm hẹn hoặc đăng ký giao xe tận sảnh.',
  heroPills: [
    'Nhận xe tại điểm hẹn hoặc giao tận sảnh',
    '100% xe số tự động (Điện & Xăng)',
    'Báo rõ tổng giá & cọc trước khi chốt',
  ],
  pickupAreas: [
    'Duy Tân – Tôn Thất Thuyết – Phạm Hùng – Dịch Vọng Hậu',
    'Trung Hòa – Nhân Chính – Trần Duy Hưng – Hoàng Đạo Thúy',
    'Xuân Thủy – Cầu Giấy – Nguyễn Văn Huyên – Hoàng Quốc Việt',
  ],
  pickupHub: 'điểm hẹn Tôn Thất Thuyết – Duy Tân',
  serviceHours: '07:00–22:00',
  deliveryFeePerWay: 100_000,
  requiredDocuments: 'CCCD gắn chip và giấy phép lái xe hạng B bản gốc',
};
