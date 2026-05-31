export interface TravelCollection {
  slug: string;
  title: string;
  eyebrow: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  destinationSlugs: string[];
  ctaLabel: string;
}

export const travelCollections: TravelCollection[] = [
  {
    slug: 'cuoi-tuan-gan-ha-noi',
    title: 'Cuối tuần gần Hà Nội',
    eyebrow: 'Đi 1-2 ngày',
    description: 'Các tuyến dễ đi cuối tuần, phù hợp gia đình hoặc nhóm bạn muốn thuê xe tự lái để chủ động lịch trình.',
    seoTitle: 'Cuối Tuần Gần Hà Nội Đi Đâu Bằng Xe Tự Lái',
    seoDescription: 'Gợi ý điểm đi chơi cuối tuần gần Hà Nội bằng xe tự lái: Ba Vì, Sóc Sơn, Tam Đảo, Ninh Bình, Đại Lải, Ecopark.',
    destinationSlugs: ['ba-vi', 'soc-son', 'ecopark', 'dai-lai', 'tam-dao', 'ninh-binh'],
    ctaLabel: 'Tính chuyến cuối tuần',
  },
  {
    slug: 'di-trong-ngay',
    title: 'Đi trong ngày từ Hà Nội',
    eyebrow: 'Sáng đi tối về',
    description: 'Những điểm đến không cần ngủ lại, dễ biến thành đơn thuê xe tự lái hoặc xe có lái trong ngày.',
    seoTitle: 'Đi Trong Ngày Từ Hà Nội Bằng Xe Tự Lái',
    seoDescription: 'Các điểm đi trong ngày từ Hà Nội: Nội Bài, Ecopark, Sóc Sơn, Ba Vì, Ninh Bình, Hồ Núi Cốc kèm chi phí di chuyển.',
    destinationSlugs: ['noi-bai', 'ecopark', 'soc-son', 'ba-vi', 'ninh-binh', 'ho-nui-coc'],
    ctaLabel: 'Tư vấn xe trong ngày',
  },
  {
    slug: 'cho-gia-dinh-co-tre-em',
    title: 'Đi với gia đình có trẻ em',
    eyebrow: 'Lịch trình nhẹ',
    description: 'Ưu tiên tuyến dễ lái, có điểm dừng, xe rộng, chỗ đỗ rõ và lịch trình không quá dày.',
    seoTitle: 'Đi Đâu Gần Hà Nội Cho Gia Đình Có Trẻ Em',
    seoDescription: 'Gợi ý điểm đi chơi gần Hà Nội cho gia đình có trẻ em, kèm loại xe nên thuê, lịch trình nhẹ và lưu ý chỗ đỗ.',
    destinationSlugs: ['ha-long', 'ninh-binh', 'ecopark', 'dai-lai', 'ba-vi', 'hai-phong'],
    ctaLabel: 'Tư vấn xe gia đình',
  },
  {
    slug: 'xe-7-cho-di-tinh',
    title: 'Tuyến nên đi xe 7 chỗ',
    eyebrow: 'Đi đông, nhiều đồ',
    description: 'Các tuyến nên chọn xe 7 chỗ hoặc gầm cao để ngồi thoải mái, đủ cốp và hợp cung đường dài.',
    seoTitle: 'Thuê Xe 7 Chỗ Đi Tỉnh Từ Hà Nội',
    seoDescription: 'Gợi ý các tuyến nên thuê xe 7 chỗ đi tỉnh từ Hà Nội: Hạ Long, Mộc Châu, Mai Châu, Pù Luông, Sapa, Cát Bà.',
    destinationSlugs: ['ha-long', 'moc-chau', 'mai-chau', 'pu-luong', 'sapa', 'cat-ba'],
    ctaLabel: 'Tìm xe 7 chỗ',
  },
  {
    slug: 'di-xe-dien',
    title: 'Tuyến phù hợp đi xe điện',
    eyebrow: 'Tính sạc trước',
    description: 'Các tuyến ngắn hoặc có cao tốc/dịch vụ tốt, phù hợp để tư vấn xe điện nếu kiểm tra pin và trạm sạc trước chuyến đi.',
    seoTitle: 'Đi Du Lịch Gần Hà Nội Bằng Xe Điện',
    seoDescription: 'Gợi ý tuyến gần Hà Nội phù hợp đi xe điện: Nội Bài, Ecopark, Ninh Bình, Hải Phòng, Hạ Long, Đại Lải.',
    destinationSlugs: ['noi-bai', 'ecopark', 'ninh-binh', 'hai-phong', 'ha-long', 'dai-lai'],
    ctaLabel: 'Tư vấn xe điện',
  },
];

export const defaultTravelCollection = travelCollections[0];
