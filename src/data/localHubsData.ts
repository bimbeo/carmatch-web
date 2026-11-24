export type LocalHubSlug =
  | 'vinhomes-ocean-park'
  | 'vinhomes-smart-city'
  | 'times-city'
  | 'ecopark'
  | 'the-manor-central-park'
  | 'cau-giay'
  | 'my-dinh'
  | 'ha-dong'
  | 'tay-ho'
  | 'long-bien'
  | 'hoan-kiem'
  | 'hai-ba-trung'
  | 'thanh-xuan'
  | 'nam-tu-liem'
  | 'bac-tu-liem'
  | 'gia-lam'
  | 'dong-anh-noi-bai';

export interface LocalHubInfoCard {
  badge: string;
  bullets: string[];
}

export interface LocalHubFaq {
  question: string;
  answer: string;
}

export interface LocalHubData {
  slug: LocalHubSlug;
  path: string;
  locationName: string;
  locationShortName: string;
  hubSlug: string;
  selfPickupId?: string;
  heroBadge: string;
  h1Title: string;
  heroSubtitle: string;
  recommendedModels: string[];
  pickupCard: LocalHubInfoCard;
  deliveryCard: LocalHubInfoCard;
  infraCard: LocalHubInfoCard;
  faqs: LocalHubFaq[];
}

export const LOCAL_RENTAL_HERO_POINTS = [
  'Hỗ trợ giao xe theo địa chỉ và lịch đã xác nhận',
  'Nhiều lựa chọn xe tự động',
  'Giá, cọc và phụ phí được báo trước khi xác nhận',
];

export const LOCAL_HUBS_DATA: LocalHubData[] = [
  {
    "slug": "vinhomes-ocean-park",
    "path": "/thue-xe-tu-lai-vinhomes-ocean-park",
    "locationName": "Vinhomes Ocean Park 1-2-3, Gia Lâm",
    "locationShortName": "Vinhomes Ocean Park",
    "hubSlug": "ocean-park",
    "selfPickupId": "ocean-park",
    "heroBadge": "● CÓ HUB XE TRỰC THUỘC GIA LÂM · GIAO TẬN SẢNH 15–30 PHÚT",
    "h1Title": "Thuê Xe Tự Lái Vinhomes Ocean Park — Nhận Xe Ngay Dưới Sảnh Tòa Nhà",
    "heroSubtitle": "Đội xe điện VinFast VF3, VF5, VF6, Limo Green và xe gia đình 5–7 chỗ đỗ sẵn tại Hub Ocean Park. Giao nhận tận sảnh Sapphire, Pavilion, Masteri, Sao Biển đúng giờ hẹn từ 07:00 – 22:00.",
    "recommendedModels": [
      "vinfast-vf3-2025",
      "vinfast-vf5-plus",
      "vinfast-vf6-plus",
      "mitsubishi-xpander-2023",
      "kia-carnival",
      "vinfast-fadil-2021"
    ],
    "pickupCard": {
      "badge": "Sảnh S1–S2 Sapphire & Pavilion",
      "bullets": [
        "Phân khu Sapphire 1 & 2: Sảnh S1.06, S1.12, S2.05, S2.18",
        "The Pavilion, The Zenpark (R1), Masteri Waterfront",
        "Khu biệt thự thấp tầng: Sao Biển, Ngọc Trai, Hải Âu, San Hô",
        "Hỗ trợ giao nhận sang Vinhomes Ocean Park 2 & 3"
      ]
    },
    "deliveryCard": {
      "badge": "✓ MIỄN PHÍ GIAO TẬN SẢNH (0đ)",
      "bullets": [
        "Khoảng cách từ Hub Ocean Park: 0 – 1,5 km",
        "Thời gian điều phối bàn giao: 15 – 30 phút",
        "Miễn phí giao xe tận sảnh khi đặt lịch trước tối thiểu 4 tiếng",
        "Hoặc tự nhận xe miễn phí trực tiếp tại điểm đỗ Ocean Park"
      ]
    },
    "infraCard": {
      "badge": "⚡ Sẵn trạm sạc V-Green & Nút giao QL5B",
      "bullets": [
        "Trụ sạc nhanh VinFast V-Green tại Nhà để xe nổi 5 tầng & hầm phân khu",
        "Cây xăng Petrolimex ngay lối ra Kiêu Kỵ / Đa Tốn – Lý Thánh Tông",
        "5 phút nhập làn trực tiếp Cao tốc Hà Nội – Hải Phòng (QL5B)",
        "Lộ trình cực thuận tiện đi Hải Phòng, Hạ Long, Hưng Yên, Nội Bài"
      ]
    },
    "faqs": [
      {
        "question": "Cư dân Vinhomes Ocean Park có được miễn phí giao xe tận sảnh không?",
        "answer": "Có. Do Car Match có Hub xe đặt trực tiếp tại Vinhomes Ocean Park (Gia Lâm), cư dân tại các phân khu Sapphire, Pavilion, Zenpark, Masteri và khu thấp tầng được miễn phí giao xe tận sảnh khi đặt lịch trước 4 tiếng (hoặc tự nhận miễn phí tại điểm đỗ)."
      },
      {
        "question": "Thuê xe tại Ocean Park đi Hải Phòng, Hạ Long cần chuẩn bị gì?",
        "answer": "Bạn chỉ cần CCCD gắn chip, GPLX hạng B bản gốc và kiểm tra số dư tài khoản VETC (tối thiểu 400.000đ – 500.000đ khứ hồi) vì tuyến kết nối thẳng lên Cao tốc Hà Nội – Hải Phòng ngay cạnh khu đô thị."
      },
      {
        "question": "Khi trả xe điện VinFast tại Ocean Park thì quy định mức pin thế nào?",
        "answer": "Hai bên ghi nhận mức pin thực tế trên đồng hồ lúc bàn giao. Khi trả xe, bạn chỉ cần hoàn trả tương đương mức pin lúc nhận (có thể cắm sạc nhanh tại nhà để xe nổi Ocean Park ngay trước khi trả)."
      }
    ]
  },
  {
    "slug": "vinhomes-smart-city",
    "path": "/thue-xe-tu-lai-vinhomes-smart-city",
    "locationName": "Vinhomes Smart City, Tây Mỗ – Đại Mỗ",
    "locationShortName": "Vinhomes Smart City",
    "hubSlug": "cau-giay",
    "heroBadge": "● GIAO XE TẬN SẢNH SAPPHIRE, IMPERIA, TONKIN · HỖ TRỢ 07:00–22:00",
    "h1Title": "Thuê Xe Tự Lái Vinhomes Smart City — Giao Xe Tận Sảnh, Rõ Giá Trọn Gói",
    "heroSubtitle": "Đặt xe tự lái 4–7 chỗ đời mới dành riêng cho cư dân Vinhomes Smart City (Nam Từ Liêm). Không cần đi xa lấy xe, nhận bàn giao ngay tại sảnh tòa nhà hoặc cổng khu đô thị chỉ trong 20–30 phút.",
    "recommendedModels": [
      "vinfast-vf5-plus",
      "vinfast-vf3-2025",
      "vinfast-vf6-plus",
      "hyundai-creta-2025",
      "mitsubishi-xpander-2023",
      "mazda-3-2018"
    ],
    "pickupCard": {
      "badge": "Sảnh S1–S4, Imperia & Masteri",
      "bullets": [
        "Phân khu Sapphire 1, 2, 3, 4 (điểm dừng sảnh nội khu dễ đỗ)",
        "The Sakura (SA), The Tonkin (TK), Imperia Smart City, Masteri West Heights",
        "Điểm hẹn nhanh tại Cổng 1 (Đại lộ Thăng Long) hoặc Vườn Nhật",
        "Đội ngũ giao xe nắm rõ luồng giao thông nội khu, không làm khách chờ lâu"
      ]
    },
    "deliveryCard": {
      "badge": "✓ ƯU ĐÃI GIAO XE VINHOMES",
      "bullets": [
        "Điều phối trực tiếp từ Hub Cầu Giấy / Mỹ Đình (cách 5–6 km)",
        "Thời gian giao xe tới sảnh: 20 – 30 phút theo giờ hẹn",
        "Miễn phí giao tận sảnh theo chương trình ưu đãi cư dân Vinhomes (đặt trước 4h) hoặc +100k/chiều",
        "Bàn giao ngoài sảnh thoáng đãng, không mất phí quẹt thẻ hầm"
      ]
    },
    "infraCard": {
      "badge": "⚡ Trạm sạc Nhà xe nổi & Đại lộ Thăng Long",
      "bullets": [
        "Hệ thống trạm sạc V-Green dày đặc tại Nhà để xe nổi Parking Zone 1, 2, 3, 4",
        "Cây xăng quân đội & Petrolimex dọc gom Đại lộ Thăng Long – Lê Trọng Tấn",
        "2 phút ra thẳng Đại lộ Thăng Long đi Ba Vì, Hòa Bình, Mộc Châu",
        "Kết nối Vành đai 3.5 và Vành đai 3 đi Sân bay Nội Bài hoặc phía Nam"
      ]
    },
    "faqs": [
      {
        "question": "Nhận xe tại Vinhomes Smart City thì hẹn ở dưới sảnh tòa nhà hay ở đâu thuận tiện nhất?",
        "answer": "Nhân viên Car Match sẽ giao xe trực tiếp tại điểm dừng đón trả khách ngay trước sảnh tòa nhà của bạn (S1–S4, Sakura, Tonkin, Imperia) hoặc tại khu vực gần Parking Zone để hai bên dễ dàng kiểm tra xe và ký biên bản."
      },
      {
        "question": "Gia đình ở Smart City đi Ba Vì, Hòa Bình cuối tuần nên chọn mẫu xe nào?",
        "answer": "Với gia đình 4–5 người đi theo hướng Đại lộ Thăng Long lên Ba Vì, Kim Bôi hoặc Mai Châu, các mẫu gầm cao như VinFast VF6 Plus, Hyundai Creta hoặc 7 chỗ Mitsubishi Xpander là lựa chọn êm ái và rộng cốp nhất."
      },
      {
        "question": "Thuê xe tại Smart City có cần sổ hộ khẩu gốc không?",
        "answer": "Không cần. Bạn chỉ cần CCCD gắn chip bản gốc (hoặc VNeID mức 2 để đối chiếu) kèm Giấy phép lái xe hạng B còn hiệu lực và tài sản đặt cọc theo quy định mẫu xe."
      }
    ]
  },
  {
    "slug": "times-city",
    "path": "/thue-xe-tu-lai-times-city",
    "locationName": "Vinhomes Times City & Park Hill, 458 Minh Khai",
    "locationShortName": "Times City",
    "hubSlug": "times-city",
    "selfPickupId": "times-city",
    "heroBadge": "● CÓ ĐIỂM NHẬN XE MIỄN PHÍ TẠI TIMES CITY · GIAO NHẬN TRONG 15 PHÚT",
    "h1Title": "Thuê Xe Tự Lái Vinhomes Times City — Điểm Nhận Xe Miễn Phí Ngay 458 Minh Khai",
    "heroSubtitle": "Car Match có điểm giao nhận xe trực tiếp tại Times City (Hai Bà Trưng). Cư dân T1–T18, Park Hill và Park Hill Premium có thể tự nhận xe miễn phí hoặc hẹn giao tận sảnh trong 15 phút.",
    "recommendedModels": [
      "vinfast-vf3-2025",
      "vinfast-vf5-plus",
      "mazda-3-2018",
      "vinfast-vf6-plus",
      "mitsubishi-xpander-2023",
      "kia-carnival"
    ],
    "pickupCard": {
      "badge": "Khu T1–T18, Park Hill & Premium",
      "bullets": [
        "Sảnh các tòa T1 – T11, T18 và khu quảng trường nhạc nước",
        "Khu Park Hill (Park 1 – Park 8) & Park Hill Premium (Park 9 – Park 12)",
        "Cổng chính 458 Minh Khai hoặc lối vào ngõ 13 Lĩnh Nam / Dương Văn Bé",
        "Có điểm dừng rộng rãi tại đường nội khu để quay video bàn giao xe"
      ]
    },
    "deliveryCard": {
      "badge": "✓ NHẬN XE MIỄN PHÍ 0đ TẠI HUB",
      "bullets": [
        "Times City là 1 trong 4 điểm tự nhận xe MIỄN PHÍ (0đ) của Car Match",
        "Giao tận sảnh tòa nhà miễn phí khi đặt trước 4 tiếng",
        "Thời gian chuẩn bị và bàn giao xe: chỉ 15 – 20 phút",
        "Hỗ trợ linh hoạt từ 07:00 sáng đến 22:00 tối tất cả các ngày"
      ]
    },
    "infraCard": {
      "badge": "⚡ Sát Vành đai 2 trên cao & Cầu Vĩnh Tuy",
      "bullets": [
        "Trạm sạc V-Green dưới hầm B1/B2 Times City và khu vực Minh Khai",
        "Cây xăng Nguyễn Khoái – Minh Khai và cây xăng Lĩnh Nam cách 800m",
        "Lên thẳng Vành đai 2 trên cao đi Ngã Tư Sở – Cầu Giấy không lo tắc đường",
        "Qua Cầu Vĩnh Tuy 5 phút kết nối Quốc lộ 5 và Cao tốc Hải Phòng / Ninh Bình"
      ]
    },
    "faqs": [
      {
        "question": "Tôi ở Times City chọn mục \"Tự nhận xe\" trên web thì có mất phí giao nhận không?",
        "answer": "Hoàn toàn miễn phí (0đ). Times City (Hai Bà Trưng) là một trong 4 điểm giao nhận cố định của Car Match trên hệ thống đặt lịch."
      },
      {
        "question": "Đường Minh Khai giờ cao điểm đông xe thì nên hẹn nhận xe ở sảnh nào?",
        "answer": "Đội vận hành thường hẹn cư dân tại đường nội khu trước sảnh Park Hill hoặc lối Dương Văn Bé / ngõ 13 Lĩnh Nam — nơi thông thoáng, dễ dừng xe kiểm tra kỹ ngoại thất trước khi xuất phát."
      },
      {
        "question": "Tôi muốn thuê xe buổi tối hôm trước để sáng sớm hôm sau về quê có ưu đãi gì không?",
        "answer": "Bạn có thể nhắn Zalo 0971 163 290 để đội vận hành kiểm tra lịch trống và hỗ trợ gói giờ nhận xe linh hoạt từ tối hôm trước với chi phí tối ưu nhất."
      }
    ]
  },
  {
    "slug": "ecopark",
    "path": "/thue-xe-tu-lai-ecopark",
    "locationName": "Khu đô thị Ecopark, Văn Giang (Giáp Gia Lâm)",
    "locationShortName": "Ecopark",
    "hubSlug": "ocean-park",
    "heroBadge": "● ĐIỀU PHỐI NHANH TỪ HUB OCEAN PARK (CÁCH 4KM) · GIAO TẬN SẢNH ECOPARK",
    "h1Title": "Thuê Xe Tự Lái Ecopark — Giao Xe Tận Sảnh Rừng Cọ, Aqua Bay, West Bay, Sol Forest",
    "heroSubtitle": "Giải pháp thuê xe tự lái theo ngày và theo tháng cho cư dân Ecopark đi làm nội thành Hà Nội hoặc du lịch cuối tuần. Điều phối xe trực tiếp từ Hub Gia Lâm lân cận chỉ trong 20–30 phút.",
    "recommendedModels": [
      "vinfast-vf5-plus",
      "vinfast-vf3-2025",
      "vinfast-vf6-plus",
      "toyota-raize-2022",
      "mitsubishi-xpander-2023",
      "vinfast-limo-green-2025"
    ],
    "pickupCard": {
      "badge": "Rừng Cọ, West Bay, Sky Oasis",
      "bullets": [
        "Giai đoạn 1: Chung cư Rừng Cọ (A–E), Phố Trúc, Vườn Tùng, Vườn Mai",
        "Giai đoạn 2: West Bay (A–D), Aqua Bay, Central Lake, Grand Marina",
        "Tuyến phố Vịnh Đảo: Sky Oasis, Sol Forest, Haven Park, Swan Lake Onsen",
        "Đường nội khu Ecopark rộng thoáng, bàn giao xe ngay dưới sảnh tòa nhà"
      ]
    },
    "deliveryCard": {
      "badge": "✓ MIỄN PHÍ GIAO XE (ĐẶT TRƯỚC 4H)",
      "bullets": [
        "Khoảng cách từ Hub Ocean Park sang Ecopark: chỉ 4 – 5 km qua đường ĐT379",
        "Miễn phí giao xe tận sảnh Ecopark khi đặt lịch trước 4 tiếng",
        "Đặc biệt ưu đãi cho cư dân Ecopark đăng ký gói Thuê xe theo tháng đi làm",
        "Có nhân viên giao nhận trực tiếp 2 chiều từ 07:00 – 22:00"
      ]
    },
    "infraCard": {
      "badge": "⚡ Sạc V-Green nội khu & Kết nối ĐT379 / QL5B",
      "bullets": [
        "Trạm sạc VinFast V-Green tại bãi đỗ xe Rừng Cọ, West Bay và Sky Oasis",
        "Cây xăng Xuân Quan / Văn Giang ngay trục đường chính ra vào khu đô thị",
        "Đi nội thành Hà Nội nhanh qua trục ĐT379 – Cổ Linh – Cầu Vĩnh Tuy / Chương Dương",
        "10 phút nhập làn Cao tốc Hà Nội – Hải Phòng tại nút giao Vành đai 3 / QL5B"
      ]
    },
    "faqs": [
      {
        "question": "Ecopark thuộc địa phận Hưng Yên thì Car Match có giao xe tận nơi như ở Hà Nội không?",
        "answer": "Có. Ecopark nằm ngay sát Hub Vinhomes Ocean Park (Gia Lâm) của Car Match (chỉ mất 10 phút di chuyển), nên cư dân Ecopark được phục vụ giao nhận tận sảnh với chính sách tương đương nội thành Hà Nội."
      },
      {
        "question": "Cư dân Ecopark thuê xe theo tháng để đi làm hàng ngày ở Hà Nội giá bao nhiêu?",
        "answer": "Gói thuê xe theo tháng cho cư dân Ecopark bắt đầu từ 10 – 12 triệu/tháng (với xe điện VinFast VF3, VF5 hoặc Fadil, định mức 2.500–3.000 km/tháng), giúp bạn tiết kiệm hoàn toàn chi phí khấu hao và bảo dưỡng xe."
      },
      {
        "question": "Gia đình ở Ecopark cần xe 7 chỗ đi du lịch cuối tuần có những mẫu nào?",
        "answer": "Bạn có thể chọn Mitsubishi Xpander (1.000.000đ/ngày), VinFast Limo Green 7 chỗ thuần điện (1.400.000đ/ngày) hoặc Kia Carnival cao cấp (2.000.000đ/ngày)."
      }
    ]
  },
  {
    "slug": "the-manor-central-park",
    "path": "/thue-xe-tu-lai-the-manor",
    "locationName": "The Manor Central Park, Nguyễn Xiển (Hoàng Mai)",
    "locationShortName": "The Manor Central Park",
    "hubSlug": "the-manor",
    "selfPickupId": "manor",
    "heroBadge": "● TRỤ SỞ HUB PHÍA NAM HÀ NỘI · NHẬN XE MIỄN PHÍ 0đ NGAY NGUYỄN XIỂN",
    "h1Title": "Thuê Xe Tự Lái The Manor Central Park (Nguyễn Xiển) — Điểm Nhận Xe Chính Thức",
    "heroSubtitle": "The Manor Central Park (mặt đường Nguyễn Xiển – Nghiêm Xuân Yêm, Hoàng Mai) là Hub điều phối xe trọng điểm phía Nam của Car Match. Nhận xe miễn phí 0đ trong 10 phút, kết nối thẳng Vành đai 3 và Cao tốc Pháp Vân.",
    "recommendedModels": [
      "vinfast-vf3-2025",
      "vinfast-vf5-plus",
      "hyundai-creta-2025",
      "vinfast-vf6-plus",
      "mitsubishi-xpander-2023",
      "kia-carnival"
    ],
    "pickupCard": {
      "badge": "Hub Chính Nguyễn Xiển – Hoàng Mai",
      "bullets": [
        "Khu nhà phố thương mại (Shophouse) & Chung cư The Manor Central Park",
        "Đối diện Công viên Chu Văn An, sát Đại học Thăng Long & Kim Văn Kim Lũ",
        "Điểm tập kết thuận tiện nhất cho khách ở Hoàng Mai, Thanh Xuân, Hà Đông, Thanh Trì",
        "Đường nội khu rộng 4 làn xe, có chỗ gửi xe máy miễn phí cho khách tới lấy ô tô"
      ]
    },
    "deliveryCard": {
      "badge": "✓ NHẬN XE MIỄN PHÍ 0đ TẠI HUB",
      "bullets": [
        "Khoảng cách: 0 km (Nằm ngay tại Hub Nguyễn Xiển của Car Match)",
        "Miễn phí 100% phí giao nhận khi lấy và trả xe tại The Manor Central Park",
        "Khách có thể xem trực tiếp nhiều mẫu xe tại bãi trước khi lăn bánh",
        "Thời gian làm thủ tục và bàn giao xe chỉ 5 – 10 phút"
      ]
    },
    "infraCard": {
      "badge": "⚡ Sát lối lên Vành đai 3 & Cao tốc Pháp Vân",
      "bullets": [
        "Trạm sạc V-Green và cây xăng lớn ngay trục Nguyễn Xiển – Đại lộ Chu Văn An",
        "1 phút lên thẳng đường Vành đai 3 trên cao đi Nội Bài hoặc Cầu Thanh Trì",
        "10 phút kết nối Cao tốc Pháp Vân – Cầu Giẽ đi Ninh Bình, Thanh Hóa, Nghệ An",
        "Trục đường Xa La – Nguyễn Xiển kết nối thẳng sang Hà Đông cực nhanh"
      ]
    },
    "faqs": [
      {
        "question": "The Manor Central Park nằm ở quận nào và đi đường nào vào nhận xe dễ nhất?",
        "answer": "Khu đô thị The Manor Central Park nằm trên mặt đường Nguyễn Xiển – Nghiêm Xuân Yêm (thuộc quận Hoàng Mai, giáp ranh Thanh Xuân và Thanh Trì), ngay cạnh Công viên Chu Văn An. Bạn có thể đi từ Nguyễn Xiển hoặc trục Xa La – Nguyễn Xiển vào đều rất thoáng."
      },
      {
        "question": "Tôi đi xe máy đến Hub The Manor Central Park để lấy ô tô thì gửi xe máy ở đâu?",
        "answer": "Khu vực Hub The Manor Central Park của Car Match có điểm gửi xe máy an toàn, thuận tiện ngay gần điểm bàn giao để bạn yên tâm lấy ô tô đi công tác hoặc về quê nhiều ngày."
      },
      {
        "question": "Tại Hub The Manor hiện có sẵn những dòng xe nào?",
        "answer": "Hub thường xuyên có sẵn các dòng xe điện VinFast (VF3, VF5, VF6, VF7, VF8, Limo Green) và các dòng xe xăng/dầu gia đình (Fadil, Mazda 3, Raize, Creta, Xpander, Kia Carnival)."
      }
    ]
  },
  {
    "slug": "cau-giay",
    "path": "/thue-xe-tu-lai-cau-giay",
    "locationName": "Quận Cầu Giấy (Hub Tôn Thất Thuyết – Duy Tân)",
    "locationShortName": "Cầu Giấy",
    "hubSlug": "cau-giay",
    "selfPickupId": "trung-lan",
    "heroBadge": "● CÓ HUB XE TRỰC THUỘC CẦU GIẤY · NHẬN XE MIỄN PHÍ HOẶC GIAO TẬN VĂN PHÒNG",
    "h1Title": "Thuê Xe Tự Lái Cầu Giấy — Nhận Xe Miễn Phí Tại Hub Hoặc Giao Tận Sảnh",
    "heroSubtitle": "Phục vụ nhanh nhất khu vực Tôn Thất Thuyết, Duy Tân, Trung Hòa – Nhân Chính, Xuân Thủy, Cầu Giấy. Tự lấy xe miễn phí tại Hub Cầu Giấy hoặc nhận xe tận sảnh tòa văn phòng/chung cư trong 15–20 phút.",
    "recommendedModels": [
      "vinfast-vf3-2025",
      "vinfast-vf5-plus",
      "mazda-3-2018",
      "toyota-raize-2022",
      "vinfast-vf6-plus",
      "kia-carnival"
    ],
    "pickupCard": {
      "badge": "Tôn Thất Thuyết, Duy Tân, Trung Hòa",
      "bullets": [
        "Cụm văn phòng Duy Tân – Tôn Thất Thuyết – Phạm Hùng – Dịch Vọng Hậu",
        "Khu Trung Hòa – Nhân Chính, Trần Duy Hưng, Hoàng Đạo Thúy, Mandarin Garden",
        "Tổ hợp Indochina Plaza (IPH), Discovery Complex, Cầu Giấy Center Point",
        "Khu vực Nghĩa Đô, Hoàng Quốc Việt, Nguyễn Văn Huyên, Công viên Cầu Giấy"
      ]
    },
    "deliveryCard": {
      "badge": "✓ NHẬN XE 0đ TẠI HUB CẦU GIẤY",
      "bullets": [
        "Cầu Giấy là 1 trong 4 điểm tự nhận xe MIỄN PHÍ (0đ) trên hệ thống Car Match",
        "Giao tận sảnh văn phòng/chung cư trong quận chỉ từ 15 – 20 phút (+100k/chiều)",
        "Có chỗ đỗ rộng tại khu vực Tôn Thất Thuyết để kiểm tra xe không lo đường cấm dừng",
        "Hỗ trợ xuất hóa đơn VAT cho các công ty tại Cầu Giấy thuê xe công tác/tháng"
      ]
    },
    "infraCard": {
      "badge": "⚡ Sát Vành đai 3 Phạm Hùng & Cầu Nhật Tân",
      "bullets": [
        "Trạm sạc V-Green dày đặc tại bãi xe Tôn Thất Thuyết, Công viên Cầu Giấy, Vincom Trần Duy Hưng",
        "Cây xăng Tôn Thất Thuyết, Xuân Thủy và Hoàng Quốc Việt ngay sát điểm trả xe",
        "Lên thẳng Vành đai 3 trên cao đi Sân bay Nội Bài (25 phút) hoặc Đại lộ Thăng Long",
        "Kết nối Võ Chí Công – Cầu Nhật Tân đi Tam Đảo, Vĩnh Phúc, Phú Thọ cực nhanh"
      ]
    },
    "faqs": [
      {
        "question": "Điểm tự nhận xe miễn phí của Car Match ở Cầu Giấy nằm ở khu vực nào?",
        "answer": "Hub Cầu Giấy nằm tại khu vực phố Tôn Thất Thuyết – Duy Tân (gần Bến xe Mỹ Đình và trục Phạm Hùng). Khi đặt lịch trên web, bạn chỉ cần chọn điểm \"Cầu Giấy — Miễn phí\" để nhận vị trí bản đồ chính xác."
      },
      {
        "question": "Các phố văn phòng như Duy Tân, Hoàng Đạo Thúy có biển cấm đỗ thì nhận xe tận nơi thế nào?",
        "answer": "Nhân viên giao xe sẽ liên hệ trước 15 phút để hẹn bạn ngay tại sảnh tòa nhà hoặc đường nội khu không cấm dừng, giúp hai bên ký biên bản bàn giao nhanh gọn trong 5 phút."
      },
      {
        "question": "Công ty tôi ở Cầu Giấy muốn thuê xe đi công tác tỉnh có xuất hóa đơn VAT được không?",
        "answer": "Có. Car Match hỗ trợ hợp đồng thuê xe doanh nghiệp (theo ngày hoặc gói 22/30 ngày) và xuất hóa đơn VAT đầy đủ."
      }
    ]
  },
  {
    "slug": "my-dinh",
    "path": "/thue-xe-tu-lai-my-dinh",
    "locationName": "Khu vực Mỹ Đình (Mỹ Đình 1, Mỹ Đình 2, Đình Thôn, Mễ Trì)",
    "locationShortName": "Mỹ Đình",
    "hubSlug": "cau-giay",
    "heroBadge": "● SÁT HUB CẦU GIẤY (CÁCH 1.5KM) · GIAO NHẬN NHANH TẠI MỸ ĐÌNH – MỄ TRÌ",
    "h1Title": "Thuê Xe Tự Lái Mỹ Đình — Giao Tận Sảnh Keangnam, The Zei, Vinhomes Skylake",
    "heroSubtitle": "Kết nối trực tiếp với Hub Cầu Giấy cách chỉ 5 phút di chuyển. Giao xe tự lái 4–7 chỗ tận sảnh các tòa chung cư, văn phòng khu vực Mỹ Đình – Phạm Hùng – Lê Đức Thọ đúng giờ hẹn.",
    "recommendedModels": [
      "vinfast-vf5-plus",
      "vinfast-vf6-plus",
      "mazda-3-2018",
      "hyundai-creta-2025",
      "mitsubishi-xpander-2023",
      "kia-carnival"
    ],
    "pickupCard": {
      "badge": "Skylake, The Zei, Mỹ Đình Sông Đà",
      "bullets": [
        "Vinhomes Skylake, Keangnam Landmark 72, Khu đô thị Mỹ Đình – Mễ Trì (Sudico)",
        "The Zei, HD Mon City, Vinhomes Gardenia Hàm Nghi,The Emerald,The Matrix One",
        "Khu vực Sân vận động Quốc gia Mỹ Đình, Lê Đức Thọ, Nguyễn Cơ Thạch",
        "Đón/giao xe cho khách từ các tỉnh về Bến xe Mỹ Đình cần xe tự lái đi tiếp"
      ]
    },
    "deliveryCard": {
      "badge": "✓ CÁCH HUB CẦU GIẤY CHỈ 5–10 PHÚT",
      "bullets": [
        "Khách ở Mỹ Đình có thể qua Hub Tôn Thất Thuyết nhận xe miễn phí (0đ) chỉ mất 5 phút",
        "Hoặc chọn giao xe tận sảnh chung cư tại Mỹ Đình (+100k/chiều) trong 15–20 phút",
        "Nhiều dòng xe 7 chỗ & Sedan sang trọng phục vụ chuyên gia Hàn Quốc/Nhật Bản tại Mỹ Đình",
        "Hỗ trợ giao nhận xe từ 07:00 – 22:00 tất cả các ngày"
      ]
    },
    "infraCard": {
      "badge": "⚡ Cửa ngõ Đại lộ Thăng Long & Vành đai 3",
      "bullets": [
        "Trạm sạc V-Green tại Vinhomes Skylake, Gardenia, SVĐ Mỹ Đình và The Matrix One",
        "Cây xăng Lê Đức Thọ, Mỹ Đình và Phạm Hùng cực tiện nạp nhiên liệu khi trả xe",
        "Nằm ngay nút giao Đại lộ Thăng Long – Phạm Hùng, thoát nội đô trong 2 phút",
        "Đi Sân bay Nội Bài, Hòa Lạc, Ba Vì, Sơn Tây hay về các tỉnh phía Bắc đều thuận lợi"
      ]
    },
    "faqs": [
      {
        "question": "Từ Mỹ Đình muốn tự đi lấy xe để không mất phí giao nhận thì lấy ở đâu gần nhất?",
        "answer": "Bạn chỉ cần chọn điểm nhận \"Cầu Giấy (Miễn phí)\" ngay khu vực Tôn Thất Thuyết — cách Bến xe Mỹ Đình và trục Phạm Hùng chỉ khoảng 1 – 1,5 km."
      },
      {
        "question": "Khu Mỹ Đình – Mễ Trì có nhiều chuyên gia nước ngoài, người nước ngoài thuê xe cần giấy tờ gì?",
        "answer": "Người nước ngoài tại Mỹ Đình có thể thuê xe tự lái khi có Hộ chiếu (Passport), Thẻ tạm trú/Visa còn hạn và Giấy phép lái xe Việt Nam hoặc Bằng lái quốc tế (IDP) hợp lệ theo quy định, hoặc lựa chọn gói thuê xe theo tháng của Car Match."
      },
      {
        "question": "Xung quanh Sân vận động Mỹ Đình có dễ bàn giao xe không?",
        "answer": "Khu vực quảng trường SVĐ Mỹ Đình, đường Lê Đức Thọ và Nguyễn Cơ Thạch cực kỳ rộng rãi, rất lý tưởng để dừng xe đối chiếu biên bản và làm quen thao tác lái trước khi xuất phát."
      }
    ]
  },
  {
    "slug": "ha-dong",
    "path": "/thue-xe-tu-lai-ha-dong",
    "locationName": "Quận Hà Đông (Văn Quán, Mỗ Lao, Dương Nội, Xa La)",
    "locationShortName": "Hà Đông",
    "hubSlug": "the-manor",
    "heroBadge": "● KẾT NỐI THẲNG TRỤC XA LA – NGUYỄN XIỂN · GIAO TẬN SẢNH KĐT HÀ ĐÔNG",
    "h1Title": "Thuê Xe Tự Lái Hà Đông — Giao Xe Tận Sảnh Văn Quán, Mỗ Lao, Dương Nội, Văn Phú",
    "heroSubtitle": "Phục vụ cư dân các khu đô thị lớn tại quận Hà Đông. Điều phối xe nhanh qua đại lộ Chu Văn An (Xa La – Nguyễn Xiển) chỉ trong 15–25 phút, đa dạng xe điện VinFast và xe gia đình 5–7 chỗ.",
    "recommendedModels": [
      "vinfast-vf3-2025",
      "vinfast-vf5-plus",
      "vinfast-fadil-2021",
      "vinfast-vf6-plus",
      "mitsubishi-xpander-2023",
      "hyundai-creta-2025"
    ],
    "pickupCard": {
      "badge": "Mỗ Lao, Văn Quán, Dương Nội, Xa La",
      "bullets": [
        "Làng Việt Kiều Châu Âu (Mỗ Lao), Mulberry Lane, Seasons Avenue, Booyoung Vina",
        "KĐT Văn Quán, Hồ Gươm Plaza, KĐT Xa La, Kiến Hưng, Thanh Hà",
        "KĐT Dương Nội (Anland, Terra An Hưng), ParkCity, Văn Phú, Quang Trung",
        "Sảnh chờ các khu đô thị tại Hà Đông rộng, dễ dừng xe kiểm tra 2 chiều"
      ]
    },
    "deliveryCard": {
      "badge": "✓ KẾT NỐI HUB THE MANOR 10–15 PHÚT",
      "bullets": [
        "Cư dân Xa La, Văn Quán, Mỗ Lao chạy thẳng đường Chu Văn An ra Hub The Manor nhận xe 0đ chỉ 10 phút",
        "Hoặc chọn giao xe tận sảnh tòa nhà tại Hà Đông (+100k/chiều) đúng khung giờ hẹn",
        "Định mức 250–300 km/ngày thoải mái cho các chuyến về quê, đi tỉnh cuối tuần",
        "Xác nhận rõ tổng giá và điều kiện cọc trước khi giữ lịch"
      ]
    },
    "infraCard": {
      "badge": "⚡ Sạc V-Green Aeon Mall & Quốc lộ 6 / Đường 70",
      "bullets": [
        "Trạm sạc lớn tại Aeon Mall Hà Đông, KĐT Dương Nội, Văn Phú và Mỗ Lao",
        "Hệ thống cây xăng dọc trục Trần Phú – Quang Trung, Tố Hữu và đường 70",
        "Cửa ngõ phía Tây Nam đi thẳng Quốc lộ 6 (Hòa Bình, Mai Châu, Mộc Châu) hoặc Đường 21B",
        "Ra Cao tốc Pháp Vân – Cầu Giẽ nhanh qua trục đường 70 – Cienco 5"
      ]
    },
    "faqs": [
      {
        "question": "Ở Hà Đông muốn qua bãi lấy xe miễn phí thì điểm nào gần nhất?",
        "answer": "Điểm nhận xe miễn phí gần Hà Đông nhất là **The Manor Central Park (Nguyễn Xiển)** — nằm ngay đầu đại lộ Chu Văn An (đường Xa La – Nguyễn Xiển), cách khu Xa La và Văn Quán chỉ khoảng 3 – 4 km."
      },
      {
        "question": "Gia đình ở Hà Đông thuê xe đi Mộc Châu, Mai Châu theo Quốc lộ 6 nên chọn xe nào?",
        "answer": "Tuyến Quốc lộ 6 có đèo Thung Khe và dốc Cun, bạn nên ưu tiên các mẫu xe gầm cao máy khoẻ, tầm nhìn thoáng như Hyundai Creta, VinFast VF6 Plus, VF7/VF8 hoặc Mitsubishi Xpander 7 chỗ."
      },
      {
        "question": "Nhận xe tại khu đô thị Dương Nội hoặc Văn Phú cần đặt trước bao lâu?",
        "answer": "Bạn nên đặt giữ lịch trên web hoặc nhắn Zalo trước tối thiểu 2–4 tiếng để đội vận hành vệ sinh xe sạch sẽ và điều phối nhân viên giao xe đúng giờ hẹn dưới sảnh."
      }
    ]
  },
  {
    "slug": "tay-ho",
    "path": "/thue-xe-tu-lai-tay-ho",
    "locationName": "Quận Tây Hồ (Ciputra, Ngoại Giao Đoàn, Quảng An, Xuân La)",
    "locationShortName": "Tây Hồ",
    "hubSlug": "cau-giay",
    "heroBadge": "● GIAO XE TẬN SẢNH CIPUTRA, NGOẠI GIAO ĐOÀN, HỒ TÂY · CÓ HỖ TRỢ KHÁCH EXPAT",
    "h1Title": "Thuê Xe Tự Lái Tây Hồ — Giao Tận Sảnh Ciputra, Ngoại Giao Đoàn & Ven Hồ Tây",
    "heroSubtitle": "Dịch vụ thuê xe tự lái theo ngày, theo tháng chất lượng cao tại quận Tây Hồ. Giao xe nhanh từ Hub Cầu Giấy qua trục Võ Chí Công – Nguyễn Văn Huyên kéo dài chỉ trong 15–20 phút.",
    "recommendedModels": [
      "vinfast-vf6-plus",
      "vinfast-vf8-plus-2024",
      "mazda-3-2018",
      "kia-carnival",
      "vinfast-vf5-plus",
      "hyundai-creta-2025"
    ],
    "pickupCard": {
      "badge": "Ciputra, Ngoại Giao Đoàn, Quảng An",
      "bullets": [
        "KĐT Nam Thăng Long (Ciputra), Sunshine City, Sunshine Riverside, IA20",
        "Khu Đoàn Ngoại Giao, Starlake Tây Hồ Tây, Kosmo Tây Hồ, 6th Element",
        "Khu bán đảo Quảng An, Xuân Diệu, Tô Ngọc Vân, Tây Hồ, Lạc Long Quân",
        "Trục Thụy Khuê, Hoàng Hoa Thám, Trích Sài, Nguyễn Đình Thi, Phú Thượng"
      ]
    },
    "deliveryCard": {
      "badge": "✓ ĐIỀU PHỐI TỪ HUB CẦU GIẤY 15 PHÚT",
      "bullets": [
        "Khoảng cách từ Hub Cầu Giấy sang Tây Hồ Tây / Ngoại Giao Đoàn chỉ 3 – 5 km",
        "Giao nhận tận sảnh chung cư hoặc biệtự theo lịch hẹn (+100k/chiều)",
        "Nhiều dòng xe đời mới (VF6, VF7, VF8, Carnival, Creta) phù hợp cư dân & chuyên gia tại Tây Hồ",
        "Có gói thuê xe theo tháng/năm ổn định cho chuyên gia nước ngoài (Expat)"
      ]
    },
    "infraCard": {
      "badge": "⚡ Sát trục Võ Chí Công – Cầu Nhật Tân – Nội Bài",
      "bullets": [
        "Trạm sạc V-Green tại Lotte Mall West Lake, khu Ngoại Giao Đoàn, Ciputra và Watermark",
        "Cây xăng Võ Chí Công, Xuân La và Lạc Long Quân thuận tiện đổ xăng khi trả xe",
        "Chỉ 15–20 phút chạy thẳng Võ Chí Công – Cầu Nhật Tân tới Sân bay Nội Bài",
        "Tuyến xuất phát lý tưởng nhất Hà Nội để đi Tam Đảo, Đại Lải, Sóc Sơn, Phú Thọ, Sapa"
      ]
    },
    "faqs": [
      {
        "question": "Ở khu vực Quảng An, Xuân Diệu đường nhỏ đông xe thì nhận xe ở đâu thuận tiện?",
        "answer": "Với các ngõ nhỏ trên bán đảo Quảng An, nhân viên Car Match có thể giao xe trực tiếp tại sảnh căn hộ dịch vụ của bạn hoặc hẹn tại trục đường đôi Xuân Diệu / Âu Cơ / Lotte Mall West Lake rộng rãi ngay gần đó."
      },
      {
        "question": "Car Match có gói thuê xe dài hạn cho chuyên gia nước ngoài sống ở Ciputra và Tây Hồ không?",
        "answer": "Có. Chúng tôi cung cấp gói thuê xe theo tháng và theo năm (tự lái hoặc kèm tài xế) với hợp đồng song ngữ/hóa đơn đầy đủ và hỗ trợ bảo dưỡng trọn gói tại sảnh tòa nhà."
      },
      {
        "question": "Từ Tây Hồ thuê xe đi Sóc Sơn, Đại Lải trong ngày thì chi phí khoảng bao nhiêu?",
        "answer": "Quãng đường khứ hồi từ Tây Hồ đi Sóc Sơn hoặc Đại Lải chỉ khoảng 60–90 km (nằm gọn trong định mức 250–300 km/ngày), bạn chỉ tốn tiền thuê xe từ 600.000đ – 1.000.000đ/ngày và khoảng 100.000đ tiền điện/xăng."
      }
    ]
  },
  {
    "slug": "long-bien",
    "path": "/thue-xe-tu-lai-long-bien",
    "locationName": "Quận Long Biên (Vinhomes Riverside, Việt Hưng, Sài Đồng, Bồ Đề)",
    "locationShortName": "Long Biên",
    "hubSlug": "ocean-park",
    "heroBadge": "● KẾT NỐI HAI ĐẦU HUB OCEAN PARK & TIMES CITY · GIAO XE NHANH TẠI LONG BIÊN",
    "h1Title": "Thuê Xe Tự Lái Long Biên — Giao Tận Nơi Vinhomes Riverside, Việt Hưng, Bồ Đề",
    "heroSubtitle": "Quận Long Biên nằm ngay giữa 2 điểm giao nhận lớn của Car Match là Vinhomes Ocean Park và Times City (qua cầu Vĩnh Tuy). Nhận xe nhanh trong 15–25 phút với đầy đủ các dòng xe 4–7 chỗ.",
    "recommendedModels": [
      "vinfast-vf5-plus",
      "vinfast-vf6-plus",
      "vinfast-vf8-plus-2024",
      "mitsubishi-xpander-2023",
      "kia-carnival",
      "vinfast-vf3-2025"
    ],
    "pickupCard": {
      "badge": "Riverside, Việt Hưng, Sài Đồng, Bồ Đề",
      "bullets": [
        "KĐT Vinhomes Riverside, Vinhomes Symphony, VinhomesThe Harmony, Sài Đồng",
        "KĐT Việt Hưng, Khai Sơn City, Berriver Nguyễn Văn Cừ, Hồng Tiến, Bồ Đề",
        "Khu vực Aeon Mall Long Biên, Cổ Linh, Thạch Bàn, Đàm Quang Trung",
        "Khu vực Ngọc Thụy, Thượng Thanh, Đức Giang, Ngô Gia Tự"
      ]
    },
    "deliveryCard": {
      "badge": "✓ KẸP GIỮA 2 HUB LỚN (10–20 PHÚT)",
      "bullets": [
        "Khách ở Thạch Bàn, Sài Đồng cách Hub Ocean Park chỉ 3 – 5 km (có thể tự lấy xe 0đ)",
        "Khách ở Bồ Đề, Nguyễn Văn Cừ qua cầu Vĩnh Tuy tới Hub Times City chỉ 10 phút",
        "Giao xe tận cửa biệt thự/sảnh chung cư tại Long Biên (+100k/chiều)",
        "Đường xá tại Long Biên rộng thoáng, cực kỳ thuận lợi để kiểm tra và bàn giao xe"
      ]
    },
    "infraCard": {
      "badge": "⚡ Trung tâm sạc VinFast & Nút giao QL5 / Cao tốc",
      "bullets": [
        "Hệ thống trạm sạc V-Green quy mô lớn nhất tại Vinhomes Symphony, Riverside và Aeon Mall Long Biên",
        "Nhiều cây xăng lớn dọc trục Nguyễn Văn Linh (QL5), Cổ Linh và Ngô Gia Tự",
        "Kết nối trực tiếp Cao tốc Hà Nội – Hải Phòng, Quốc lộ 5, Cao tốc Hà Nội – Bắc Giang / Thái Nguyên",
        "Không phải đi xuyên qua nội đô tắc nghẽn khi xuất phát đi các tỉnh phía Đông và phía Bắc"
      ]
    },
    "faqs": [
      {
        "question": "Ở Long Biên thì chọn lấy xe ở Hub Ocean Park hay Hub Times City tiện hơn?",
        "answer": "Nếu bạn ở khu vực Sài Đồng, Việt Hưng, Thạch Bàn, Vinhomes Riverside thì Hub Ocean Park nằm ngay cạnh. Nếu bạn ở khu vực Bồ Đề, Ngọc Thụy, Nguyễn Văn Cừ thì cả hai Hub đều chỉ cách 10–15 phút di chuyển, hoặc bạn có thể chọn giao xe tận nhà."
      },
      {
        "question": "Thuê xe điện VinFast ở Long Biên thì sạc ở đâu nhanh nhất?",
        "answer": "Long Biên là \"thủ phủ\" trạm sạc của VinFast với hàng trăm cổng sạc nhanh tại Vinhomes Symphony/Riverside, Aeon Mall Long Biên, Tasco Mall (Big C Long Biên) và KĐT Việt Hưng."
      },
      {
        "question": "Tôi muốn thuê xe 7 chỗ tại Long Biên đi Hạ Long cuối tuần thì giá bao nhiêu?",
        "answer": "Bạn có thể chọn Mitsubishi Xpander (1.000.000đ/ngày), VinFast Limo Green (1.400.000đ/ngày) hoặc Kia Carnival (2.000.000đ/ngày). Từ Long Biên nhập thẳng cao tốc đi Hạ Long chỉ mất chưa đầy 2 tiếng."
      }
    ]
  },
  {
    "slug": "hoan-kiem",
    "path": "/thue-xe-tu-lai-hoan-kiem",
    "locationName": "Quận Hoàn Kiếm (Phố Cổ, Tràng Tiền, Trần Hưng Đạo, Chương Dương)",
    "locationShortName": "Hoàn Kiếm",
    "hubSlug": "times-city",
    "heroBadge": "● GIAO XE TẬN KHÁCH SẠN & VĂN PHÒNG TRUNG TÂM · ĐIỀU PHỐI TỪ HUB TIMES CITY",
    "h1Title": "Thuê Xe Tự Lái Hoàn Kiếm — Giao Xe Tận Nơi Khu Trung Tâm & Phố Cổ Hà Nội",
    "heroSubtitle": "Dịch vụ thuê xe tự lái cho cư dân, văn phòng và du khách lưu trú tại quận Hoàn Kiếm. Hẹn điểm bàn giao linh hoạt tránh phố cấm/phố đi bộ, điều phối nhanh từ Hub Times City chỉ trong 15–20 phút.",
    "recommendedModels": [
      "vinfast-vf3-2025",
      "vinfast-fadil-2021",
      "vinfast-vf5-plus",
      "mazda-3-2018",
      "toyota-raize-2022",
      "vinfast-vf6-plus"
    ],
    "pickupCard": {
      "badge": "Trần Hưng Đạo, Lý Thường Kiệt, Phố Cổ",
      "bullets": [
        "Trục văn phòng & khách sạn: Trần Hưng Đạo, Lý Thường Kiệt, Hai Bà Trưng, Quang Trung",
        "Khu vực Nhà hát Lớn, Tràng Tiền, Phan Chu Trinh, Ngô Quyền, Lê Thánh Tông",
        "Vành đai Phố Cổ: Trần Quang Khải, Trần Nhật Duật, Phùng Hưng, Cửa Nam, Ga Hà Nội",
        "Tư vấn sẵn điểm dừng nhận xe hợp lệ, không vi phạm biển cấm đỗ khu trung tâm"
      ]
    },
    "deliveryCard": {
      "badge": "✓ CÁCH HUB TIMES CITY 15 PHÚT",
      "bullets": [
        "Điều phối xe thẳng theo trục Trần Quang Khải – Nguyễn Khoái – Minh Khai (4–5 km)",
        "Giao xe tận sảnh khách sạn/văn phòng tại Hoàn Kiếm (+100k/chiều) đúng giờ hẹn",
        "Hoặc khách đi taxi 10 phút xuống Hub Times City nhận xe miễn phí (0đ)",
        "Hỗ trợ khách du lịch/công tác lưu trú tại Hoàn Kiếm thuê xe đi Ninh Bình, Hạ Long, Sapa"
      ]
    },
    "infraCard": {
      "badge": "⚡ Lưu ý Phố đi bộ cuối tuần & Điểm gửi xe qua đêm",
      "bullets": [
        "Lưu ý khung giờ cấm đường Phố đi bộ Hồ Gươm (từ 19h Thứ 6 đến 24h Chủ Nhật)",
        "Gợi ý bãi đỗ qua đêm an toàn: Trần Quang Khải, Phùng Hưng, Cung Văn hóa Hữu nghị Việt Xô",
        "Cây xăng Trần Hưng Đạo, Trần Quang Khải và Bác Cổ ngay sát khu trung tâm",
        "Qua cầu Chương Dương / Vĩnh Tuy ra thẳng cao tốc đi các tỉnh phía Bắc & phía Đông"
      ]
    },
    "faqs": [
      {
        "question": "Nhà hoặc khách sạn của tôi nằm trong khu Phố đi bộ Hoàn Kiếm thì nhận xe cuối tuần thế nào?",
        "answer": "Vào các ngày cuối tuần (từ tối Thứ 6 đến hết Chủ Nhật), đội vận hành Car Match sẽ hẹn giao nhận xe với bạn tại các điểm rìa ngoài rào chắn phố đi bộ dễ dừng đỗ như đường Trần Quang Khải, Hai Bà Trưng, Lý Thường Kiệt hoặc Phùng Hưng."
      },
      {
        "question": "Đi lại và đỗ xe trong quận Hoàn Kiếm thì nên thuê mẫu xe nào gọn nhất?",
        "answer": "Hai mẫu xe cỡ nhỏ **VinFast VF3** và **VinFast Fadil** (đều có giá chỉ 600.000đ/ngày, số tự động) là lựa chọn được khách ở Hoàn Kiếm ưa chuộng nhất vì bán kính quay đầu nhỏ, cực dễ ghép ngang và luồn lách phố đông."
      },
      {
        "question": "Khách từ TP.HCM hoặc nước ngoài bay ra ở khách sạn phố cổ có thuê xe tự lái được không?",
        "answer": "Hoàn toàn được. Bạn chỉ cần mang theo CCCD gắn chip + GPLX hạng B (với khách Việt Nam) hoặc Hộ chiếu + Bằng lái hợp lệ và đặt cọc theo quy định mẫu xe, Car Match sẽ giao xe tận sảnh khách sạn của bạn."
      }
    ]
  },
  {
    "slug": "hai-ba-trung",
    "path": "/thue-xe-tu-lai-hai-ba-trung",
    "locationName": "Quận Hai Bà Trưng (Minh Khai, Bà Triệu, Đại Cồ Việt, Bách Khoa)",
    "locationShortName": "Hai Bà Trưng",
    "hubSlug": "times-city",
    "heroBadge": "● CÓ HUB XE TRỰC THUỘC TẠI 458 MINH KHAI · NHẬN XE MIỄN PHÍ 0đ",
    "h1Title": "Thuê Xe Tự Lái Hai Bà Trưng — Nhận Xe Miễn Phí Tại Hub Minh Khai Hoặc Giao Tận Nơi",
    "heroSubtitle": "Quận Hai Bà Trưng có điểm giao nhận xe cố định của Car Match tại Times City (458 Minh Khai). Phục vụ cực nhanh khu vực Minh Khai, Kim Ngưu, Bạch Mai, Đại Cồ Việt, Phố Huế – Bà Triệu.",
    "recommendedModels": [
      "vinfast-vf3-2025",
      "vinfast-vf5-plus",
      "mazda-3-2018",
      "vinfast-vf6-plus",
      "mitsubishi-xpander-2023",
      "kia-carnival"
    ],
    "pickupCard": {
      "badge": "Minh Khai, Kim Ngưu, Bách Khoa, Bà Triệu",
      "bullets": [
        "Trục Minh Khai (Imperia Sky Garden, Green Pearl, Hinode City, Hòa Bình Green City)",
        "Khu vực Kim Ngưu, Lò Đúc, Trần Khát Chân, Thanh Nhàn, Võ Thị Sáu (Công viên Tuổi Trẻ)",
        "Khu Bách – Kinh – Xây (Đại Cồ Việt, Giải Phóng, Tạ Quang Bửu, Lê Thanh Nghị)",
        "Trục thương mại Vincom Bà Triệu, Phố Huế, Mai Hắc Đế, Bùi Thị Xuân, Nguyễn Du"
      ]
    },
    "deliveryCard": {
      "badge": "✓ NHẬN XE 0đ TẠI HUB TIMES CITY",
      "bullets": [
        "Miễn phí 100% phí giao nhận khi khách tự lấy xe tại Hub Times City (458 Minh Khai)",
        "Giao xe tận sảnh chung cư/nhà riêng trong quận Hai Bà Trưng chỉ mất 10 – 20 phút",
        "Linh hoạt nhận xe từ tối hôm trước hoặc sáng sớm từ 07:00 hàng ngày",
        "Đầy đủ các phân khúc từ xe đô thị 600k/ngày đến MPV 7 chỗ gia đình"
      ]
    },
    "infraCard": {
      "badge": "⚡ Kết nối Vành đai 2, Cầu Vĩnh Tuy & Giải Phóng",
      "bullets": [
        "Trạm sạc V-Green tại Times City, Vincom Bà Triệu, Công viên Thống Nhất và khu Minh Khai",
        "Cây xăng Võ Thị Sáu, Trần Khát Chân, Giải Phóng và Nguyễn Khoái rất gần điểm trả xe",
        "Lên đường Vành đai 2 trên cao hoặc qua cầu Vĩnh Tuy ra cao tốc chỉ trong 5 phút",
        "Xuôi trục Giải Phóng – Ngọc Hồi ra Cao tốc Pháp Vân – Cầu Giẽ về các tỉnh phía Nam"
      ]
    },
    "faqs": [
      {
        "question": "Nhà tôi ở khu vực Bạch Mai, Kim Ngưu, Minh Khai thì nhận xe ở đâu nhanh nhất?",
        "answer": "Bạn có thể qua trực tiếp điểm giao nhận miễn phí của Car Match tại **Times City (458 Minh Khai)** chỉ cách 5–10 phút di chuyển, hoặc yêu cầu nhân viên giao xe tới tận sảnh tòa nhà của bạn."
      },
      {
        "question": "Thủ tục nhận xe tại quận Hai Bà Trưng mất bao lâu?",
        "answer": "Khi bạn đã gửi trước thông tin CCCD và GPLX qua Zalo để lên hợp đồng sẵn, quá trình đối chiếu giấy tờ bản gốc và quay video bàn giao xe lúc nhận chỉ mất đúng 5 – 10 phút."
      },
      {
        "question": "Xe của Car Match đã có sẵn thẻ thu phí tự động VETC chưa?",
        "answer": "100% xe trong đội xe Car Match đều đã dán sẵn thẻ VETC/ePass hoạt động ổn định để bạn đi qua mọi trạm thu phí cao tốc không dừng."
      }
    ]
  },
  {
    "slug": "thanh-xuan",
    "path": "/thue-xe-tu-lai-thanh-xuan",
    "locationName": "Quận Thanh Xuân (Nguyễn Trãi, Royal City, Lê Văn Lương, Nguyễn Tuân)",
    "locationShortName": "Thanh Xuân",
    "hubSlug": "the-manor",
    "heroBadge": "● SÁT HUB NGUYỄN XIỂN · GIAO XE TẬN SẢNH ROYAL CITY, LÊ VĂN LƯƠNG, NGUYỄN TUÂN",
    "h1Title": "Thuê Xe Tự Lái Thanh Xuân — Nhận Xe Ngay Nguyễn Xiển Hoặc Giao Tận Sảnh Chung Cư",
    "heroSubtitle": "Đáp ứng nhanh nhu cầu thuê xe tự lái của cư dân các tổ hợp chung cư quận Thanh Xuân. Nằm ngay sát Hub Nguyễn Xiển (The Manor Central Park), hỗ trợ tự nhận xe 0đ hoặc giao tận sảnh trong 15 phút.",
    "recommendedModels": [
      "vinfast-vf3-2025",
      "vinfast-vf5-plus",
      "vinfast-vf6-plus",
      "mazda-3-2018",
      "hyundai-creta-2025",
      "mitsubishi-xpander-2023"
    ],
    "pickupCard": {
      "badge": "Royal City, Lê Văn Lương, Nguyễn Tuân",
      "bullets": [
        "Vinhomes Royal City (72A Nguyễn Trãi), King Palace, Golden Land 275 Nguyễn Trãi",
        "Cụm chung cư Nguyễn Tuân – Nguyễn Huy Tưởng – Vũ Trọng Phụng (Imperia Garden, Hapulico)",
        "Trục Lê Văn Lương – Hoàng Đạo Thúy (Star City, Golden Palm, Mandarin Garden)",
        "Khu vực Khuất Duy Tiến, Nguyễn Xiển, Hạ Đình, Khương Đình, Kim Giang, Lê Trọng Tấn"
      ]
    },
    "deliveryCard": {
      "badge": "✓ SÁT HUB NGUYỄN XIỂN (0đ TỰ LẤY)",
      "bullets": [
        "Cư dân Thanh Xuân di chuyển ra Hub The Manor Central Park (Nguyễn Xiển) nhận xe 0đ chỉ mất 5–10 phút",
        "Giao xe tận sảnh Royal City, Hapulico, Imperia Garden... (+100k/chiều) trong 15–20 phút",
        "Giải pháp kinh tế cho cư dân chung cư Thanh Xuân thiếu slot đỗ ô tô cố định dưới hầm",
        "Có cả gói thuê ngày cuối tuần và gói thuê tháng cố định"
      ]
    },
    "infraCard": {
      "badge": "⚡ Trục Vành đai 3 Khuất Duy Tiến – Nguyễn Xiển",
      "bullets": [
        "Trạm sạc V-Green dưới hầm Royal City, Hapulico và dọc trục Nguyễn Xiển – Lê Văn Lương",
        "Cây xăng Nguyễn Trãi (cạnh Royal City), Lê Văn Lương và Nguyễn Xiển rất tiện đường",
        "Nằm dọc trục Vành đai 3 trên cao, dễ dàng đi cả 2 hướng Nội Bài và Pháp Vân – Cầu Giẽ",
        "Kết nối Vành đai 2 trên cao (Ngã Tư Sở) đi sang Vĩnh Tuy – Long Biên nhanh chóng"
      ]
    },
    "faqs": [
      {
        "question": "Chung cư ở Nguyễn Tuân, Vũ Trọng Phụng hầm chật khó đỗ thì nhận và trả xe thế nào?",
        "answer": "Bạn không cần đưa xe xuống hầm. Nhân viên Car Match sẽ giao và nhận lại xe ngay tại sảnh dừng nội khu của tòa nhà (như sảnh Imperia Garden, Rivera Park, Hapulico) theo đúng giờ bạn hẹn về tới nơi."
      },
      {
        "question": "Từ Ngã Tư Sở / Royal City qua Hub lấy xe miễn phí mất bao lâu?",
        "answer": "Bạn chỉ cần đi dọc Nguyễn Trãi – Nguyễn Xiển khoảng 3 km (10 phút) là tới điểm giao nhận miễn phí **The Manor Central Park** (hoặc lên Vành đai 2 sang Hub Times City cũng rất gần)."
      },
      {
        "question": "Tôi muốn thuê xe 5 chỗ đi tỉnh cuối tuần từ Thanh Xuân thì mẫu nào tiết kiệm nhất?",
        "answer": "Nếu ưu tiên chi phí nhiên liệu thấp nhất, bạn nên chọn **VinFast VF5 Plus** (800.000đ/ngày, 5 chỗ gầm cao) hoặc **VinFast VF6 Plus** (1.000.000đ/ngày). Nếu thích đi xe xăng quen thuộc, bạn có thể chọn **Mazda 3** (800.000đ/ngày) hoặc **Hyundai Creta** (1.000.000đ/ngày)."
      }
    ]
  },
  {
    "slug": "nam-tu-liem",
    "path": "/thue-xe-tu-lai-nam-tu-liem",
    "locationName": "Quận Nam Từ Liêm (Mỹ Đình, Mễ Trì, Tây Mỗ, Đại Mỗ, Trung Văn)",
    "locationShortName": "Nam Từ Liêm",
    "hubSlug": "cau-giay",
    "heroBadge": "● GIAO XE NHANH TỪ HUB CẦU GIẤY · PHỦ KÍN MỸ ĐÌNH, MỄ TRÌ, TÂY MỖ, TRUNG VĂN",
    "h1Title": "Thuê Xe Tự Lái Nam Từ Liêm — Giao Tận Sảnh Chung Cư & Khu Đô Thị Phía Tây",
    "heroSubtitle": "Cung cấp xe tự lái 4–7 chỗ đời mới tại toàn bộ các phường thuộc quận Nam Từ Liêm. Tự nhận xe 0đ tại Hub Cầu Giấy giáp ranh hoặc hẹn giao xe tận sảnh tòa nhà từ 07:00 – 22:00.",
    "recommendedModels": [
      "vinfast-vf5-plus",
      "vinfast-vf6-plus",
      "vinfast-vf3-2025",
      "hyundai-creta-2025",
      "mitsubishi-xpander-2023",
      "kia-carnival"
    ],
    "pickupCard": {
      "badge": "Mễ Trì, Trung Văn, Tây Mỗ, Hàm Nghi",
      "bullets": [
        "Khu vực Mễ Trì, Vinhomes Green Bay, The Matrix One, Keangnam, Sudico Sông Đà",
        "Khu đô thị Trung Văn (Vinaconex 3, Roman Plaza), Tố Hữu, Lương Thế Vinh, Phùng Khoang",
        "Đại đô thị Vinhomes Smart City (Tây Mỗ – Đại Mỗ), Xuân Phương, Phương Canh",
        "Khu vực Hàm Nghi (Vinhomes Gardenia), Cầu Diễn, Nguyễn Cơ Thạch, Phú Đô"
      ]
    },
    "deliveryCard": {
      "badge": "✓ LINH HOẠT TỰ NHẬN 0đ HOẶC GIAO TẬN SẢNH",
      "bullets": [
        "Giáp ranh trực tiếp với Hub Cầu Giấy (Tôn Thất Thuyết) ở phía Bắc và Hub Nguyễn Xiển ở phía Đông Nam",
        "Giao xe tận sảnh chung cư tại Nam Từ Liêm trong 15 – 25 phút (+100k/chiều)",
        "Miễn phí giao xe tại các khu đô thị Vinhomes khi đặt lịch trước 4 tiếng",
        "Kiểm tra xe 2 chiều minh bạch bằng hình ảnh/video ngay tại điểm hẹn"
      ]
    },
    "infraCard": {
      "badge": "⚡ Giao điểm Đại lộ Thăng Long – Vành đai 3 – Lê Quang Đạo",
      "bullets": [
        "Mạng lưới trạm sạc V-Green dày đặc tại Vinhomes Green Bay, Smart City, Gardenia và SVĐ Mỹ Đình",
        "Trục đường Lê Quang Đạo kéo dài mới thông xe giúp kết nối Trung Văn – Mỹ Đình – Hà Đông cực nhanh",
        "Ra thẳng Đại lộ Thăng Long hoặc Vành đai 3 trên cao chỉ trong 3 – 5 phút",
        "Thuận tiện cho mọi lộ trình đi Hòa Bình, Sơn Tây, Ba Vì, Vĩnh Phúc và các tỉnh phía Nam"
      ]
    },
    "faqs": [
      {
        "question": "Cư dân Vinhomes Green Bay (Mễ Trì) và Vinhomes Gardenia (Hàm Nghi) nhận xe mất bao lâu?",
        "answer": "Cả hai khu đô thị này đều nằm cách Hub Cầu Giấy chỉ khoảng 2,5 – 3 km, nhân viên Car Match có thể giao xe tới tận sảnh tòa nhà hoặc khu biệt thự trong vòng 15 – 20 phút."
      },
      {
        "question": "Đặt xe trên web có biết trước tổng số tiền phải thanh toán không?",
        "answer": "Có. Ngay khi bạn chọn ngày nhận, ngày trả và hình thức giao nhận trên trang xe, hệ thống sẽ cộng tự động và hiển thị rõ: Tổng tiền thuê, Tiền cọc giữ lịch (200k), Số tiền còn lại khi nhận xe và định mức 250–300 km/ngày."
      },
      {
        "question": "Nếu lịch trình công tác thay đổi cần gia hạn thêm ngày thuê thì làm thế nào?",
        "answer": "Bạn chỉ cần nhắn Zalo 0971 163 290 trước giờ trả xe tối thiểu 4–6 tiếng để đội vận hành kiểm tra lịch trống tiếp theo của xe và xác nhận gia hạn online mà không cần quay lại ký giấy tờ."
      }
    ]
  },
  {
    "slug": "bac-tu-liem",
    "path": "/thue-xe-tu-lai-bac-tu-liem",
    "locationName": "Quận Bắc Từ Liêm (Ngoại Giao Đoàn, Thành Phố Giao Lưu, Cổ Nhuế, Phú Diễn)",
    "locationShortName": "Bắc Từ Liêm",
    "hubSlug": "cau-giay",
    "heroBadge": "● ĐIỀU PHỐI NHANH TỪ HUB CẦU GIẤY · GIAO TẬN SẢNH THÀNH PHỐ GIAO LƯU & NGOẠI GIAO ĐOÀN",
    "h1Title": "Thuê Xe Tự Lái Bắc Từ Liêm — Giao Tận Sảnh Ngoại Giao Đoàn, Cổ Nhuế, Phú Diễn",
    "heroSubtitle": "Dịch vụ thuê xe tự lái 4–7 chỗ uy tín tại quận Bắc Từ Liêm. Kết nối thẳng trục Phạm Văn Đồng – Hoàng Quốc Việt từ Hub Cầu Giấy, nhận xe tận sảnh chung cư chỉ sau 15–25 phút.",
    "recommendedModels": [
      "vinfast-vf3-2025",
      "vinfast-vf5-plus",
      "vinfast-vf6-plus",
      "toyota-raize-2022",
      "mitsubishi-xpander-2023",
      "mazda-3-2018"
    ],
    "pickupCard": {
      "badge": "TP Giao Lưu, Ngoại Giao Đoàn, Goldmark",
      "bullets": [
        "KĐT Thành Phố Giao Lưu (Green Stars, An Bình City), Bộ Công An Phạm Văn Đồng",
        "Khu Đoàn Ngoại Giao (Xuân Đỉnh, Xuân Tảo), Starlake Tây Hồ Tây, Công viên Hòa Bình",
        "Tổ hợp Goldmark City (136 Hồ Tùng Mậu), Phú Diễn, Cầu Diễn, đường K3",
        "Khu vực Cổ Nhuế, Học viện Tài chính, Đông Ngạc (Ecohome 1, 2, 3), Tân Xuân"
      ]
    },
    "deliveryCard": {
      "badge": "✓ KẾT NỐI HUB CẦU GIẤY 10–15 PHÚT",
      "bullets": [
        "Từ Goldmark City hoặc An Bình City chạy qua Hub Cầu Giấy nhận xe 0đ chỉ mất 10 phút",
        "Giao nhận xe tận sảnh các tòa chung cư Bắc Từ Liêm (+100k/chiều) từ 07:00 – 22:00",
        "Giá thuê minh bạch chỉ từ 600.000đ/ngày, đã gồm 250–300 km/ngày",
        "100% xe số tự động, sạch sẽ, bảo hiểm vật chất đầy đủ"
      ]
    },
    "infraCard": {
      "badge": "⚡ Trục Vành đai 3 Phạm Văn Đồng – Cầu Thăng Long",
      "bullets": [
        "Trạm sạc V-Green tại An Bình City (Thành Phố Giao Lưu), Goldmark City, Ecohome và Ngoại Giao Đoàn",
        "Cây xăng Phạm Văn Đồng, Hoàng Quốc Việt, Hồ Tùng Mậu và Xuân Đỉnh ngay trên trục chính",
        "Lên thẳng Vành đai 3 trên cao (Phạm Văn Đồng) qua Cầu Thăng Long đi Nội Bài trong 15–20 phút",
        "Cửa ngõ phía Bắc xuất phát đi Vĩnh Phúc (Tam Đảo, Đại Lải), Phú Thọ, Tuyên Quang, Lào Cai (Sapa)"
      ]
    },
    "faqs": [
      {
        "question": "Ở khu An Bình City (Phạm Văn Đồng) và Goldmark City (Hồ Tùng Mậu) nhận xe có nhanh không?",
        "answer": "Rất nhanh. Cả hai khu đô thị này đều nằm sát Hub Cầu Giấy của Car Match (chỉ cách 2 – 3,5 km), nên bạn có thể tự qua lấy xe miễn phí hoặc nhận xe ngay dưới sảnh tòa nhà trong 15 phút."
      },
      {
        "question": "Gia đình ở Bắc Từ Liêm đi Tam Đảo hoặc Sapa cuối tuần nên lưu ý gì khi chọn xe?",
        "answer": "Bắc Từ Liêm là điểm xuất phát gần nhất để lên cao tốc Nội Bài – Lào Cai. Nếu đi Tam Đảo hoặc Sapa có đường đèo dốc, bạn nên chọn các mẫu xe 5–7 chỗ gầm cao máy khoẻ như VinFast VF6 Plus, VF8 Plus, Hyundai Creta, Mitsubishi Xpander hoặc Kia Carnival."
      },
      {
        "question": "Người mới lấy bằng lái B1/B2 có thuê xe tại Car Match được không?",
        "answer": "Được. Người mới có bằng lái hoàn toàn có thể thuê xe tại Car Match; đội vận hành thường gợi ý bạn chọn các mẫu xe nhỏ gọn, có camera lùi/cảm biến rõ nét như VinFast VF3, Fadil, VF5 hoặc Toyota Raize để tự tin di chuyển."
      }
    ]
  },
  {
    "slug": "gia-lam",
    "path": "/thue-xe-tu-lai-gia-lam",
    "locationName": "Gia Lâm (Trâu Quỳ, Đặng Xá, Đa Tốn, Kiêu Kỵ, Ninh Hiệp)",
    "locationShortName": "Gia Lâm",
    "hubSlug": "ocean-park",
    "heroBadge": "● CÓ HUB XE TẠI TRUNG TÂM GIA LÂM (OCEAN PARK) · NHẬN XE MIỄN PHÍ 0đ",
    "h1Title": "Thuê Xe Tự Lái Gia Lâm — Nhận Xe Miễn Phí Tại Hub Ocean Park Hoặc Giao Tận Nhà",
    "heroSubtitle": "Đội xe tự lái 4–7 chỗ đặt trực tiếp tại trung tâm Gia Lâm (Vinhomes Ocean Park – Trâu Quỳ – Đa Tốn). Phục vụ cư dân Trâu Quỳ, Đặng Xá, Cổ Bi, Yên Viên, Ninh Hiệp nhận xe nhanh chỉ trong 15 phút.",
    "recommendedModels": [
      "vinfast-vf3-2025",
      "vinfast-vf5-plus",
      "vinfast-fadil-2021",
      "vinfast-vf6-plus",
      "mitsubishi-xpander-2023",
      "vinfast-limo-green-2025"
    ],
    "pickupCard": {
      "badge": "Trâu Quỳ, Đặng Xá, Đa Tốn, Cổ Bi",
      "bullets": [
        "Thị trấn Trâu Quỳ, Học viện Nông nghiệp Việt Nam, khu hành chính mới Gia Lâm",
        "Đại đô thị Vinhomes Ocean Park (Đa Tốn – Kiêu Kỵ – Dương Xá)",
        "Khu đô thị Đặng Xá, Phú Thị, Sủi, Keo, Kim Sơn, Lệ Chi",
        "Khu vực Cổ Bi, Yên Thường, Yên Viên, Cầu Đuống, chợ Ninh Hiệp, Bát Tràng"
      ]
    },
    "deliveryCard": {
      "badge": "✓ NHẬN XE MIỄN PHÍ 0đ TẠI GIA LÂM",
      "bullets": [
        "Khách ở Gia Lâm không cần qua cầu vào nội thành để thuê xe như trước đây",
        "Tự nhận xe MIỄN PHÍ (0đ) ngay tại Hub Vinhomes Ocean Park (Gia Lâm)",
        "Hỗ trợ giao xe tận nhà tại Trâu Quỳ, Đặng Xá, Đa Tốn, Bát Tràng nhanh chóng",
        "Xe luôn sẵn lịch cho cả nhu cầu đi việc gia đình trong ngày và thuê dài ngày"
      ]
    },
    "infraCard": {
      "badge": "⚡ Tâm điểm Quốc lộ 5A, Cao tốc 5B & Quốc lộ 1A",
      "bullets": [
        "Trạm sạc V-Green phủ khắp Ocean Park, KĐT Đặng Xá và dọc Quốc lộ 5",
        "Cây xăng Trâu Quỳ, Dương Xá, Cổ Bi và Kiêu Kỵ ngay sát các trục đường chính",
        "Kết nối trực tiếp Quốc lộ 5A (đi Hưng Yên, Hải Dương), Cao tốc 5B (Hải Phòng, Quảng Ninh)",
        "Lên Quốc lộ 1A / Cao tốc Hà Nội – Bắc Giang đi Bắc Ninh, Lạng Sơn chỉ 5 phút"
      ]
    },
    "faqs": [
      {
        "question": "Tôi ở Trâu Quỳ hoặc KĐT Đặng Xá (Gia Lâm) muốn xem và lấy xe trực tiếp thì qua đâu?",
        "answer": "Bạn chỉ cần qua điểm giao nhận cố định của Car Match tại **Vinhomes Ocean Park (Gia Lâm)** — cách thị trấn Trâu Quỳ chỉ 2 km và cách KĐT Đặng Xá khoảng 4 km, hoàn toàn miễn phí giao nhận."
      },
      {
        "question": "Thuê xe tại Gia Lâm đi Bắc Ninh, Hải Dương trong ngày có bị giới hạn tỉnh đến không?",
        "answer": "Không giới hạn tỉnh. Với định mức 250 – 300 km/ngày đã bao gồm trong giá thuê, bạn hoàn toàn thoải mái đi công việc hoặc về quê tại Bắc Ninh, Hưng Yên, Hải Dương, Hải Phòng trong ngày mà không phát sinh phụ phí vượt km."
      },
      {
        "question": "Cần đặt trước bao lâu để chắc chắn còn mẫu xe ưng ý vào dịp cuối tuần?",
        "answer": "Khu vực Gia Lâm – Ocean Park nhu cầu thuê xe cuối tuần (Thứ 7, Chủ Nhật) rất cao, bạn nên đặt giữ lịch trước từ Thứ 4 hoặc Thứ 5 để chọn đúng mẫu xe và màu xe yêu thích."
      }
    ]
  },
  {
    "slug": "dong-anh-noi-bai",
    "path": "/thue-xe-tu-lai-dong-anh-noi-bai",
    "locationName": "Đông Anh & Sân bay Quốc tế Nội Bài (Ga T1 / T2)",
    "locationShortName": "Đông Anh – Nội Bài",
    "hubSlug": "noi-bai",
    "heroBadge": "● GIAO NHẬN XE TỰ LÁI TẠI SẢNH GA T1/T2 NỘI BÀI & ĐÔNG ANH THEO GIỜ BAY",
    "h1Title": "Thuê Xe Tự Lái Đông Anh & Sân Bay Nội Bài — Nhận Xe Ngay Khi Hạ Cánh Ga T1 / T2",
    "heroSubtitle": "Dịch vụ bàn giao xe tự lái trực tiếp tại Sân bay Nội Bài (Ga Quốc nội T1 & Quốc tế T2) và khu vực Đông Anh. Hạ cánh là có xe tự lái đi công tác, về quê hoặc vào Hà Nội ngay không cần chờ đợi.",
    "recommendedModels": [
      "vinfast-vf5-plus",
      "vinfast-vf6-plus",
      "mazda-3-2018",
      "hyundai-creta-2025",
      "mitsubishi-xpander-2023",
      "kia-carnival"
    ],
    "pickupCard": {
      "badge": "Ga T1 / T2 Nội Bài & Trung tâm Đông Anh",
      "bullets": [
        "Sảnh đón/bãi đỗ xe Nhà ga hành khách T1 (Quốc nội) & Nhà ga T2 (Quốc tế) Sân bay Nội Bài",
        "Thị trấn Đông Anh, trục Võ Nguyên Giáp, Cầu Nhật Tân, Vĩnh Ngọc, Hải Bối",
        "KĐT Eurowindow River Park (Cầu Đông Trù), Vinhomes Cổ Loa, KCN Bắc Thăng Long",
        "Hỗ trợ đồng thời cả 2 dịch vụ: Giao xe tự lái tại sân bay & Xe đưa đón Nội Bài có tài xế"
      ]
    },
    "deliveryCard": {
      "badge": "✈️ PHÍ GIAO NHẬN SÂN BAY RÕ RÀNG (+250K)",
      "bullets": [
        "Phí giao hoặc nhận xe tận sảnh Sân bay Nội Bài cố định: +250.000đ/chiều (đã gồm vé qua trạm)",
        "Hoặc khách đi qua Cầu Nhật Tân / Cầu Thăng Long về Hub Cầu Giấy tự lấy xe miễn phí (0đ)",
        "Theo dõi sát mã chuyến bay (Flight Number) để giao xe chuẩn xác ngay cả khi delay",
        "Chốt sẵn hợp đồng online trước giờ bay — Hạ cánh nhận chìa khóa trong 5 phút"
      ]
    },
    "infraCard": {
      "badge": "⚡ Đầu mối Cao tốc Nội Bài – Lào Cai & QL18 / QL2",
      "bullets": [
        "Trạm sạc V-Green ngay bãi đỗ xe Sân bay Nội Bài, Đông Anh và dọc trục Võ Nguyên Giáp",
        "Cây xăng lớn ngay lối ra Sân bay Nội Bài (Võ Văn Kiệt & Võ Nguyên Giáp) tiện đổ đầy trước khi trả",
        "Từ sân bay nhập làn thẳng Cao tốc Nội Bài – Lào Cai (đi Vĩnh Phúc, Phú Thọ, Yên Bái, Sapa)",
        "Kết nối Quốc lộ 18 (đi Bắc Ninh, Quảng Ninh) và Cao tốc Hà Nội – Thái Nguyên ngay tại chỗ"
      ]
    },
    "faqs": [
      {
        "question": "Quy trình nhận xe tự lái tại Sân bay Nội Bài diễn ra như thế nào để không phải chờ lâu?",
        "answer": "Bạn gửi trước mã chuyến bay, giờ hạ cánh dự kiến và ảnh CCCD + GPLX qua Zalo 0971 163 290 trước ngày bay. Khi máy bay vừa hạ cánh và bạn ra lấy hành lý, nhân viên Car Match đã đỗ sẵn xe tại làn đón Ga T1 hoặc T2, hai bên quay video hiện trạng và nhận xe lăn bánh chỉ trong 5 – 10 phút."
      },
      {
        "question": "Nếu chuyến bay của tôi bị delay (chậm giờ) thì Car Match có tính phí chờ không?",
        "answer": "Khi bạn đã cung cấp mã chuyến bay (ví dụ VN214, VJ132...), đội điều phối của Car Match sẽ theo dõi giờ hạ cánh thực tế trên hệ thống sân bay để xuất phát canh đúng giờ bạn ra sảnh mà không tính phí chờ do delay hãng bay."
      },
      {
        "question": "Tôi muốn nhận xe ở Sân bay Nội Bài nhưng khi trả xe lại trả ở trong nội thành Hà Nội (hoặc ngược lại) có được không?",
        "answer": "Hoàn toàn được. Bạn có thể chọn nhận xe tại Nội Bài (+250.000đ) và khi kết thúc lịch trình thì trả xe miễn phí tại 1 trong 4 Hub nội thành của Car Match (Cầu Giấy, Times City, The Manor Nguyễn Xiển, Ocean Park) hoặc hẹn thu hồi xe tại khách sạn của bạn."
      }
    ]
  }
];

const LOCAL_HUBS_BY_SLUG = new Map(LOCAL_HUBS_DATA.map((area) => [area.slug, area]));

export function getLocalHubData(slug: LocalHubSlug): LocalHubData {
  const area = LOCAL_HUBS_BY_SLUG.get(slug);
  if (!area) throw new Error(`Unknown local hub: ${slug}`);
  return area;
}
