function createPost({
  name,
  routeSlug,
  slug,
  publishedAt,
  excerpt,
  seoTitle,
  seoDescription,
  distanceKm,
  duration,
  route,
  routeBudgetNote,
  vehicleAdvice,
  parkingAdvice,
  faqQuestion,
  faqAnswer,
  relatedVehicleLinks,
  relatedPostSlugs,
  siteUrl,
  brandSocialImage,
}) {
  const roundTripKm = distanceKm * 2;
  const bodyHtml = `<p><strong>Câu trả lời ngắn:</strong> chi phí thuê xe tự lái đi ${name} từ Hà Nội không nên được chốt bằng một con số chung cho mọi khách. Dữ liệu tuyến của Car Match đang dùng mức khoảng <strong>${distanceKm} km một chiều, ${roundTripKm} km khứ hồi</strong> và lịch trình phù hợp là <strong>${duration}</strong>. Tổng cần dự toán gồm: tiền thuê xe, giao nhận, xăng hoặc sạc, VETC/phí đường, đỗ xe và khoản vượt km/trả muộn nếu phát sinh. Giá nhiên liệu, giá sạc, phí trạm và lịch xe thay đổi theo thời điểm, vì vậy bài này cung cấp công thức thay số thay vì một báo giá cố định. Kiểm tra lại trên <a href="/di-dau/${routeSlug}">trang tuyến ${name}</a> và báo giá của đúng ngày đi trước khi cọc.</p>
    <h2>Công thức tính tổng chi phí đi ${name}</h2>
    <p>Gọi R là tổng km dự kiến; C là mức tiêu thụ nhiên liệu hoặc điện trên 100 km; P là đơn giá thực trả; T là tổng VETC/phí đường; D là tiền đỗ xe, phà hoặc dịch vụ tại điểm đến; G là phí giao nhận; K là số km vượt và S là đơn giá vượt km. Khi đó:</p>
    <p><strong>Tổng chuyến = tiền thuê + G + (R × C ÷ 100 × P) + T + D + (K × S) + phát sinh được hai bên xác nhận.</strong></p>
    <div class="table-wrap"><table><thead><tr><th>Khoản cần tính</th><th>Cách lấy số đúng</th><th>Lưu ý</th></tr></thead><tbody>
      <tr><td>Tiền thuê</td><td>Giá đúng mẫu xe × số ngày theo báo giá</td><td>Hỏi rõ giờ nhận/trả và cách tính thêm ngày</td></tr>
      <tr><td>Xăng hoặc sạc</td><td>${roundTripKm} × C ÷ 100 × P, sau đó cộng km đi lại tại điểm đến</td><td>Dùng mức tiêu thụ của xe thực giao và đơn giá thực tế</td></tr>
      <tr><td>VETC/phí đường</td><td>Đối chiếu tuyến chạy, ứng dụng VETC hoặc biên lai</td><td>Không dùng một mức cũ cho mọi lối vào/ra</td></tr>
      <tr><td>Đỗ xe/dịch vụ</td><td>Hỏi khách sạn, bãi xe hoặc đơn vị vận hành</td><td>Tách riêng phí qua đêm, phà và phí chờ nếu có</td></tr>
      <tr><td>Vượt km</td><td>Km tính theo hợp đồng trừ km đã gồm</td><td>Không mặc định km được cộng dồn giữa các ngày</td></tr>
    </tbody></table></div>
    <p>Quãng đường ${roundTripKm} km chỉ là mốc khứ hồi Hà Nội–${name} theo dữ liệu tuyến hiện tại. Hãy cộng thêm quãng đường từ nơi nhận xe, các điểm tham quan, đường vòng và điểm trả xe. Google Maps gần giờ xuất phát giúp kiểm tra lại tuyến nhưng không thay thế điều kiện hợp đồng thuê.</p>
    <h2>Điểm làm ngân sách tuyến ${name} thay đổi</h2>
    <p>${routeBudgetNote}</p>
    <p>Tuyến gợi ý hiện tại là <strong>${route}</strong>. Thay đổi lối vào/ra cao tốc, ghé thêm điểm hoặc chạy trong giờ đông có thể làm tăng cả km lẫn thời gian sử dụng. Nếu lịch dự kiến sát giờ trả xe, nên hỏi trước phương án gia hạn; phí trả muộn có thể lớn hơn phần xăng/sạc tiết kiệm được khi cố chạy gấp.</p>
    <h2>Chọn xe thế nào để không đội chi phí?</h2>
    <p>${vehicleAdvice}</p>
    <p>Không nên chọn xe chỉ vì giá ngày thấp nhất. Một xe không đủ chỗ cho người và hành lý có thể buộc đổi xe sát ngày; ngược lại, chọn xe quá lớn khi nhóm ít người làm tăng tiền thuê và có thể tăng chi phí năng lượng. Hãy gửi số người, số vali, ghế trẻ em và tổng km dự kiến để Car Match kiểm tra mẫu xe còn lịch. Hai lựa chọn để tham khảo là <a href="${relatedVehicleLinks[0].url}">${relatedVehicleLinks[0].label}</a> và <a href="${relatedVehicleLinks[1].url}">${relatedVehicleLinks[1].label}</a>.</p>
    <h2>Cách lập bảng dự toán trước khi cọc</h2>
    <ol><li>Chốt ngày, giờ nhận và trả xe.</li><li>Ghi tổng km khứ hồi ${roundTripKm} km rồi cộng km đi lại tại ${name}.</li><li>Lấy giá và mức km đã gồm từ trang của đúng xe.</li><li>Thay mức tiêu thụ C và đơn giá P bằng số của xe, trạm hoặc cây xăng thực tế.</li><li>Kiểm tra VETC/phí đường trên đúng tuyến sẽ chạy.</li><li>Hỏi nơi lưu trú về bãi đỗ: ${parkingAdvice}</li><li>Cộng một khoản dự phòng nhưng không xem đó là phí chắc chắn.</li></ol>
    <p>Ví dụ cách thay số: nếu tổng lịch trình sau khi cộng các điểm phụ là R km, xe tiêu thụ C đơn vị/100 km và đơn giá là P, phần năng lượng bằng R × C ÷ 100 × P. Sau đó cộng báo giá thuê, G, T và D. Cách này cho phép cập nhật dự toán ngay khi đổi xe hoặc đổi tuyến mà không cần dựa vào một con số đã cũ.</p>
    <h2>Những câu cần xác nhận với Car Match</h2>
    <ul><li>Xe nào còn trống đúng ngày và giá cuối đã gồm giao nhận chưa?</li><li>Xe có bao nhiêu km/ngày, phí vượt km và quy tắc cộng km nhiều ngày?</li><li>Mức nhiên liệu hoặc pin khi giao–trả được ghi nhận thế nào?</li><li>Ai thanh toán VETC và thời điểm đối soát?</li><li>Đi ${name} có nằm trong phạm vi sử dụng đã thống nhất không?</li><li>Khi đổi lịch hoặc trả muộn thì áp dụng điều kiện nào?</li></ul>
    <p>Muốn tự điều chỉnh lịch, mở <a href="/lap-ke-hoach-chuyen-di/${routeSlug}?diem-den=${routeSlug}#trip-form">công cụ lập kế hoạch chuyến ${name}</a>. Kết quả là dự toán hỗ trợ quyết định; lịch xe và điều khoản cuối cùng vẫn cần Car Match xác nhận bằng báo giá hoặc hợp đồng.</p>
    <h2>Câu hỏi thường gặp</h2>
    <h3>${faqQuestion}</h3><p>${faqAnswer}</p>
    <h3>Chi phí trong bài đã gồm tiền thuê xe chưa?</h3><p>Chưa có một tổng tiền cố định. Bài cung cấp các biến cần cộng; tiền thuê phải lấy từ mẫu xe và ngày thuê thực tế.</p>
    <h3>Có nên chuẩn bị đúng bằng số dự toán không?</h3><p>Không. Nên chuẩn bị phần dự phòng hợp lý vì tổng km, thời gian chờ, chỗ đỗ và đơn giá năng lượng có thể thay đổi trong chuyến đi.</p>`;

  return {
    _id: `static-destination-cost-${routeSlug}`,
    title: `Chi phí thuê xe tự lái đi ${name} từ Hà Nội tính thế nào?`,
    slug: { current: slug },
    publishedAt,
    updatedAt: publishedAt,
    excerpt,
    mainImageUrl: brandSocialImage,
    categories: ['Chi phí chuyến đi'],
    author: 'Car Match',
    body: [],
    bodyHtml,
    seoTitle,
    seoDescription,
    canonicalUrl: `${siteUrl}/blog/${slug}`,
    ctaEnabled: true,
    ctaTitle: `Cần dự toán xe đi ${name}?`,
    ctaDescription: `Gửi ngày đi, số người và lịch trình để Car Match kiểm tra xe cùng điều kiện thuê hiện tại.`,
    ctaPrimaryLabel: `Xem tuyến ${name}`,
    ctaPrimaryUrl: `/di-dau/${routeSlug}`,
    ctaZaloLabel: 'Nhắn Zalo để kiểm tra xe',
    ctaZaloUrl: 'https://zalo.me/0971163290',
    relatedDestinationSlugs: [routeSlug],
    relatedVehicleLinks,
    relatedPostSlugs,
  };
}

export function createDestinationCostPosts({ siteUrl, brandSocialImage }) {
  const shared = { siteUrl, brandSocialImage };
  return [
    createPost({
      name: 'Ninh Bình', routeSlug: 'ninh-binh', slug: 'chi-phi-thue-xe-tu-lai-di-ninh-binh', publishedAt: '2026-11-09T17:50:00+07:00', distanceKm: 95, duration: '1–2 ngày',
      route: 'Hà Nội → Phủ Lý → Tràng An/Tam Cốc',
      excerpt: 'Công thức tính tiền thuê xe, xăng/sạc, VETC, đỗ xe và vượt km cho chuyến Hà Nội–Ninh Bình khoảng 190 km khứ hồi.',
      seoTitle: 'Chi Phí Thuê Xe Tự Lái Đi Ninh Bình',
      seoDescription: 'Cách tính chi phí thuê xe tự lái Hà Nội–Ninh Bình: tiền xe, xăng/sạc, VETC, đỗ xe, vượt km và các giả định cần kiểm tra.',
      routeBudgetNote: 'Ninh Bình có thể đi trong ngày nên biến số quan trọng là tổng km giữa Tràng An, Tam Cốc, Hang Múa hoặc Bái Đính. Chọn quá nhiều điểm làm quãng đường nội tỉnh và thời gian thuê tăng dù chặng Hà Nội–Ninh Bình không dài. Các khu du lịch lớn thường có bãi riêng, nhưng mức thu cần xem tại điểm đến.',
      vehicleAdvice: 'Nhóm 2–4 người ít đồ có thể ưu tiên xe 5 chỗ để giữ ngân sách. Gia đình đông, có xe đẩy hoặc nhiều hành lý nên kiểm tra xe 7 chỗ. Với xe điện, xác định điểm sạc dự phòng theo đúng phiên bản xe thay vì coi 190 km là phạm vi chắc chắn.',
      parkingAdvice: 'Tràng An, Tam Cốc và Hang Múa có bãi riêng; kiểm tra mức thu tại quầy hoặc bảng niêm yết',
      faqQuestion: 'Đi Ninh Bình trong ngày có phải thuê hai ngày không?',
      faqAnswer: 'Không mặc định. Việc tính một hay hai ngày phụ thuộc giờ nhận–trả và chính sách của báo giá. Hãy gửi lịch sáng đi, tối về để xác nhận trước.',
      relatedVehicleLinks: [{ url: '/xe/vinfast-vf5-2025', label: 'VinFast VF5 2025' }, { url: '/xe/toyota-raize-2022', label: 'Toyota Raize 2022' }],
      relatedPostSlugs: ['thue-xe-tu-lai-ha-noi-gia-bao-nhieu'], ...shared,
    }),
    createPost({
      name: 'Hạ Long', routeSlug: 'ha-long', slug: 'chi-phi-thue-xe-tu-lai-di-ha-long', publishedAt: '2026-11-09T17:40:00+07:00', distanceKm: 160, duration: '2 ngày 1 đêm',
      route: 'Hà Nội → cao tốc Hải Phòng–Hạ Long → Bãi Cháy/Tuần Châu',
      excerpt: 'Cách dự toán chi phí thuê xe tự lái đi Hạ Long cho khoảng 320 km khứ hồi, gồm cao tốc, năng lượng, đỗ xe và phát sinh.',
      seoTitle: 'Chi Phí Thuê Xe Tự Lái Đi Hạ Long',
      seoDescription: 'Dự toán chi phí thuê xe tự lái Hà Nội–Hạ Long theo công thức tiền xe, xăng/sạc, cao tốc, đỗ xe và vượt km.',
      routeBudgetNote: 'Tuyến Hạ Long sử dụng nhiều đoạn cao tốc nên T là biến cần kiểm tra kỹ theo lối vào/ra. Lịch Bãi Cháy, Tuần Châu hay Hòn Gai cũng làm thay đổi km trong thành phố. Nếu ngủ lại, hỏi khách sạn có miễn phí đỗ xe hay thu theo đêm trước khi chốt phòng.',
      vehicleAdvice: 'Nhóm nhỏ có thể dùng crossover 5 chỗ; gia đình 5–6 người hoặc nhiều vali nên kiểm tra xe 7 chỗ. Với xe điện, lập điểm sạc chính và dự phòng, đồng thời dành thời gian chờ trong lịch thay vì chỉ tính tiền điện.',
      parkingAdvice: 'hỏi khách sạn ở Bãi Cháy/Tuần Châu về phí qua đêm và quyền ra vào bãi',
      faqQuestion: 'Phí cao tốc đi Hạ Long có cố định không?',
      faqAnswer: 'Không nên coi là cố định vì lối vào/ra và biểu phí có thể thay đổi. Dùng ứng dụng VETC hoặc biên lai của chuyến thực tế để đối soát.',
      relatedVehicleLinks: [{ url: '/xe/vinfast-vf6', label: 'VinFast VF6' }, { url: '/xe/mitsubishi-xpander-2023', label: 'Mitsubishi Xpander' }],
      relatedPostSlugs: ['vf6-co-phu-hop-gia-dinh-5-nguoi-khong'], ...shared,
    }),
    createPost({
      name: 'Tam Đảo', routeSlug: 'tam-dao', slug: 'chi-phi-thue-xe-tu-lai-di-tam-dao', publishedAt: '2026-11-09T17:30:00+07:00', distanceKm: 80, duration: '2 ngày 1 đêm',
      route: 'Hà Nội → Vĩnh Phúc → thị trấn Tam Đảo',
      excerpt: 'Dự toán chi phí thuê xe đi Tam Đảo khoảng 160 km khứ hồi, chú ý đường dốc, nhiên liệu, bãi đỗ và thời gian trả xe.',
      seoTitle: 'Chi Phí Thuê Xe Tự Lái Đi Tam Đảo',
      seoDescription: 'Công thức tính chi phí thuê xe tự lái đi Tam Đảo: tiền xe, nhiên liệu, phí đường, đỗ xe và lưu ý cung đèo dốc.',
      routeBudgetNote: 'Quãng đường không dài nhưng đoạn lên thị trấn có cua dốc. Mức tiêu thụ có thể khác đường bằng, đặc biệt khi chở đủ người và bật điều hòa. Trung tâm đông cuối tuần có thể khiến thời gian tìm bãi tăng; đây là lý do nên tính lịch trả xe có dư thay vì chỉ dự toán theo km.',
      vehicleAdvice: 'Ưu tiên xe người lái đã quen và không chở quá tải. Xe gầm cao hoặc số tự động có thể dễ dùng hơn với một số khách, nhưng khả năng vận hành vẫn phụ thuộc kỹ năng lái, phanh/lốp và điều kiện thời tiết; không có mẫu xe nào thay thế kinh nghiệm đường đèo.',
      parkingAdvice: 'chọn khách sạn/homestay có chỗ đỗ riêng và hỏi khả năng quay đầu trên đường vào',
      faqQuestion: 'Xe nhỏ có đi Tam Đảo được không?',
      faqAnswer: 'Có thể, nếu xe trong tình trạng phù hợp, tải hợp lý và người lái quen đường dốc. Car Match cần xác nhận đúng xe và người thuê nên tránh đi đêm khi chưa quen tuyến.',
      relatedVehicleLinks: [{ url: '/xe/hyundai-creta-2025', label: 'Hyundai Creta 2025' }, { url: '/xe/vinfast-vf6', label: 'VinFast VF6' }],
      relatedPostSlugs: ['toyota-raize-hay-vinfast-vf5-di-pho'], ...shared,
    }),
    createPost({
      name: 'Mộc Châu', routeSlug: 'moc-chau', slug: 'chi-phi-thue-xe-tu-lai-di-moc-chau', publishedAt: '2026-11-09T17:20:00+07:00', distanceKm: 200, duration: '3 ngày 2 đêm',
      route: 'Hà Nội → Hòa Bình → Mai Châu → Mộc Châu',
      excerpt: 'Cách tính chi phí thuê xe đi Mộc Châu khoảng 400 km khứ hồi với nhiên liệu, đường đèo, đỗ xe, km phát sinh và ba ngày thuê.',
      seoTitle: 'Chi Phí Thuê Xe Tự Lái Đi Mộc Châu',
      seoDescription: 'Tính chi phí thuê xe tự lái đi Mộc Châu theo tiền xe, xăng/sạc, phí đường, đỗ xe và km phát sinh trên cung đèo.',
      routeBudgetNote: 'Mộc Châu là cung dài có nhiều điểm theo mùa. Ghé đồi chè, rừng thông, thác hoặc nông trại có thể cộng đáng kể km nội vùng. Đường đèo và tải xe làm C thay đổi; lịch ba ngày cũng cần đọc đúng quy tắc km/ngày thay vì tự nhân hoặc cộng dồn theo suy đoán.',
      vehicleAdvice: 'SUV/crossover hoặc xe 7 chỗ đáng kiểm tra khi đi đông và nhiều đồ. Quan trọng hơn tên phân khúc là tình trạng lốp, phanh, tải thực tế và người lái có kinh nghiệm. Xe điện cần kế hoạch sạc cả chiều đi lẫn chiều về cùng phương án dự phòng.',
      parkingAdvice: 'hỏi homestay về sân đỗ và đường vào; điểm check-in theo mùa có thể đông xe',
      faqQuestion: 'Có nên đi Mộc Châu hai ngày một đêm để giảm tiền thuê?',
      faqAnswer: 'Có thể nhưng lịch dễ gấp vì tổng quãng đường dài và có đèo. Tiết kiệm một ngày thuê cần được cân bằng với thời gian nghỉ và an toàn, không nên cố chạy đêm để giảm chi phí.',
      relatedVehicleLinks: [{ url: '/xe/hyundai-creta-2025', label: 'Hyundai Creta 2025' }, { url: '/xe/vinfast-vf7s-2025', label: 'VinFast VF7S' }],
      relatedPostSlugs: ['vf6-hay-vf7-phu-hop-di-tinh-hon'], ...shared,
    }),
    createPost({
      name: 'Sapa', routeSlug: 'sapa', slug: 'chi-phi-thue-xe-tu-lai-di-sapa', publishedAt: '2026-11-09T17:10:00+07:00', distanceKm: 320, duration: '3–4 ngày',
      route: 'Hà Nội → cao tốc Nội Bài–Lào Cai → Sapa',
      excerpt: 'Khung tính chi phí thuê xe tự lái đi Sapa khoảng 640 km khứ hồi, gồm nhiều ngày thuê, cao tốc, nhiên liệu và đỗ qua đêm.',
      seoTitle: 'Chi Phí Thuê Xe Tự Lái Đi Sapa',
      seoDescription: 'Dự toán chi phí thuê xe tự lái Hà Nội–Sapa: tiền thuê nhiều ngày, nhiên liệu, cao tốc, đỗ xe, vượt km và dự phòng.',
      routeBudgetNote: 'Đây là tuyến dài nhất trong batch, có cao tốc dài và đoạn đèo lên Sapa. Tổng km thực tăng nếu đi bản, Fansipan hoặc các điểm ngoài trung tâm. Phần lớn chênh lệch ngân sách đến từ số ngày thuê, km phát sinh và mức tiêu thụ khi leo dốc; cần bố trí nghỉ, không đổi an toàn lấy việc giảm một ngày.',
      vehicleAdvice: 'Nhóm đi dài ngày nên ưu tiên xe đủ chỗ và cốp, sau đó kiểm tra lốp, phanh, lịch bảo dưỡng và người lái. Xe 7 chỗ không mặc nhiên tốt hơn nếu chở quá tải. Với xe điện, chỉ chốt khi đã có kế hoạch sạc khả thi và phương án dự phòng trên đúng tuyến.',
      parkingAdvice: 'chọn khách sạn trung tâm có chỗ đỗ rõ ràng hoặc báo trước mức gửi xe theo ngày',
      faqQuestion: 'Đi Sapa 640 km có chắc bị tính vượt km không?',
      faqAnswer: 'Không thể kết luận khi chưa biết số ngày và quy tắc km của đúng hợp đồng. Hãy lấy tổng km dự kiến so với mức đã gồm được xác nhận bằng văn bản.',
      relatedVehicleLinks: [{ url: '/xe/hyundai-creta-2025', label: 'Hyundai Creta 2025' }, { url: '/xe/vinfast-vf8-plus-2024', label: 'VinFast VF8 Plus 2024' }],
      relatedPostSlugs: ['vf8-co-phu-hop-di-duong-dai-khong'], ...shared,
    }),
    createPost({
      name: 'Cát Bà', routeSlug: 'cat-ba', slug: 'chi-phi-thue-xe-tu-lai-di-cat-ba', publishedAt: '2026-11-09T17:00:00+07:00', distanceKm: 160, duration: '2–3 ngày',
      route: 'Hà Nội → Hải Phòng → bến Gót/phà/cáp treo → Cát Bà',
      excerpt: 'Cách dự toán thuê xe đi Cát Bà khoảng 320 km khứ hồi, tách riêng cao tốc, phà/cáp treo, gửi xe và thời gian chờ.',
      seoTitle: 'Chi Phí Thuê Xe Tự Lái Đi Cát Bà',
      seoDescription: 'Tính chi phí thuê xe tự lái đi Cát Bà: tiền xe, năng lượng, cao tốc, phà/cáp treo, gửi xe và thời gian chờ.',
      routeBudgetNote: 'Cát Bà có hai bài toán khác nhau: mang xe sang đảo hoặc gửi xe ngoài bến rồi đi tiếp. Mỗi phương án có khoản D và thời gian khác nhau. Lịch phà/cáp treo, chính sách chở xe và phí vận hành có thể đổi, nên phải kiểm tra nguồn vận hành sát ngày thay vì dùng số cũ.',
      vehicleAdvice: 'Nhóm đông và nhiều đồ biển nên kiểm tra xe 7 chỗ hoặc SUV; nhóm nhỏ có thể dùng crossover 5 chỗ. Trước khi chọn xe, quyết định có mang xe sang đảo không vì kích thước xe, chỗ đỗ khách sạn và phương án qua bến ảnh hưởng tổng chi phí.',
      parkingAdvice: 'xác nhận mang xe sang đảo hay gửi ngoài bến, sau đó hỏi giá theo giờ/ngày tại đơn vị vận hành',
      faqQuestion: 'Phí phà hoặc cáp treo đã nằm trong phí đường chưa?',
      faqAnswer: 'Không nên gộp. Hãy tách T cho cao tốc/VETC và D cho phà, cáp treo hoặc gửi xe để dễ cập nhật theo phương án thực tế.',
      relatedVehicleLinks: [{ url: '/xe/mitsubishi-xpander-2023', label: 'Mitsubishi Xpander' }, { url: '/xe/hyundai-creta-2025', label: 'Hyundai Creta 2025' }],
      relatedPostSlugs: ['xpander-hay-limo-green-cho-nhom-dong'], ...shared,
    }),
    createPost({
      name: 'Ba Vì', routeSlug: 'ba-vi', slug: 'chi-phi-thue-xe-tu-lai-di-ba-vi', publishedAt: '2026-11-09T16:50:00+07:00', distanceKm: 60, duration: 'trong ngày hoặc 2 ngày 1 đêm',
      route: 'Hà Nội → Đại lộ Thăng Long → Sơn Tây → Ba Vì',
      excerpt: 'Dự toán chi phí thuê xe đi Ba Vì khoảng 120 km khứ hồi, cộng km lên vườn quốc gia, đồ picnic, đỗ xe và lịch trong ngày.',
      seoTitle: 'Chi Phí Thuê Xe Tự Lái Đi Ba Vì',
      seoDescription: 'Cách tính chi phí thuê xe tự lái đi Ba Vì: giá xe, xăng/sạc, phí đường, bãi đỗ, km tham quan và lịch trong ngày.',
      routeBudgetNote: 'Ba Vì gần Hà Nội nhưng tổng km khác nhau rõ giữa lịch vườn quốc gia, Đường Lâm, Ao Vua hoặc resort. Đoạn lên vườn quốc gia có dốc nên mức tiêu thụ không giống toàn bộ đường bằng. Nếu mang nhiều đồ picnic, số người và thể tích cốp quan trọng hơn chênh lệch nhỏ ở giá ngày.',
      vehicleAdvice: 'Xe 5 chỗ phù hợp nhóm 2–4 người ít đồ; xe 7 chỗ đáng cân nhắc khi có xe đẩy, đồ picnic hoặc gia đình đông. Xe điện có thể phù hợp quãng đường ngắn nhưng vẫn cần xác nhận pin giao–trả và điểm sạc dự phòng nếu lịch đi nhiều điểm.',
      parkingAdvice: 'hỏi khu du lịch hoặc resort về vé vào cổng, bãi xe và điều kiện đỗ qua đêm',
      faqQuestion: 'Đi Ba Vì trong ngày có cần tính phí trả muộn?',
      faqAnswer: 'Chỉ phát sinh nếu trả sau giờ đã thống nhất. Nên dự phòng thời gian xuống núi và giao thông về Hà Nội, rồi chốt giờ trả trong báo giá.',
      relatedVehicleLinks: [{ url: '/xe/toyota-raize-2022', label: 'Toyota Raize 2022' }, { url: '/xe/vinfast-vf5-2025', label: 'VinFast VF5 2025' }],
      relatedPostSlugs: ['vf5-co-phu-hop-di-tinh-khong'], ...shared,
    }),
    createPost({
      name: 'Mai Châu', routeSlug: 'mai-chau', slug: 'chi-phi-thue-xe-tu-lai-di-mai-chau', publishedAt: '2026-11-09T16:40:00+07:00', distanceKm: 140, duration: '2 ngày 1 đêm',
      route: 'Hà Nội → Hòa Bình → đèo Thung Khe → Mai Châu',
      excerpt: 'Khung tính chi phí thuê xe đi Mai Châu khoảng 280 km khứ hồi, chú ý đường đèo, nhiên liệu, bãi homestay và km nội bản.',
      seoTitle: 'Chi Phí Thuê Xe Tự Lái Đi Mai Châu',
      seoDescription: 'Dự toán chi phí thuê xe tự lái đi Mai Châu: tiền xe, xăng/sạc, phí đường, đỗ homestay, vượt km và cung đèo.',
      routeBudgetNote: 'Mai Châu có cung đèo Thung Khe và đường vào một số homestay hẹp. Tổng chi phí thường tăng khi ghép nhiều bản hoặc điểm tham quan xa nhau. Mức tiêu thụ trên đèo và thời gian dừng nghỉ phải được tính thực tế; tránh xếp lịch quá dày chỉ để giảm một đêm lưu trú.',
      vehicleAdvice: 'Xe gầm cao hoặc 7 chỗ có thể phù hợp gia đình/nhóm đông, nhưng cần ưu tiên tình trạng kỹ thuật và kỹ năng người lái. Nhóm nhỏ ít đồ có thể chọn xe 5 chỗ nếu đúng tải và điều kiện đường. Luôn kiểm tra phanh, lốp và giấy tờ trước cung đèo.',
      parkingAdvice: 'hỏi homestay Bản Lác về sân đỗ, đường vào và khả năng đỗ qua đêm',
      faqQuestion: 'Mai Châu và Mộc Châu có thể dùng cùng một dự toán không?',
      faqAnswer: 'Không. Mai Châu ngắn hơn theo dữ liệu tuyến và thường đi 2 ngày 1 đêm; Mộc Châu xa hơn, có nhiều km nội vùng và thường cần thêm ngày thuê.',
      relatedVehicleLinks: [{ url: '/xe/hyundai-creta-2025', label: 'Hyundai Creta 2025' }, { url: '/xe/vinfast-vf6', label: 'VinFast VF6' }],
      relatedPostSlugs: ['vf6-hay-vf7-phu-hop-di-tinh-hon'], ...shared,
    }),
    createPost({
      name: 'Hải Phòng', routeSlug: 'hai-phong', slug: 'chi-phi-thue-xe-tu-lai-di-hai-phong', publishedAt: '2026-11-09T16:30:00+07:00', distanceKm: 120, duration: 'trong ngày hoặc 2 ngày 1 đêm',
      route: 'Hà Nội → cao tốc Hà Nội–Hải Phòng → trung tâm Hải Phòng',
      excerpt: 'Công thức dự toán thuê xe đi Hải Phòng khoảng 240 km khứ hồi cho food tour, gồm cao tốc, năng lượng, đỗ xe và giờ trả.',
      seoTitle: 'Chi Phí Thuê Xe Tự Lái Đi Hải Phòng',
      seoDescription: 'Tính chi phí thuê xe tự lái Hà Nội–Hải Phòng theo tiền xe, xăng/sạc, cao tốc, bãi đỗ, vượt km và lịch food tour.',
      routeBudgetNote: 'Tuyến cao tốc giúp đi trong ngày nhưng T chiếm phần đáng kể và phụ thuộc lối vào/ra. Food tour nhiều điểm trong trung tâm làm phát sinh km ngắn, thời gian tìm bãi và phí đỗ theo lượt. Nếu ghép Đồ Sơn hoặc Cát Bà, cần lập dự toán mới thay vì chỉ cộng tiền ăn.',
      vehicleAdvice: 'Nhóm nhỏ đi food tour có thể chọn xe 5 chỗ dễ xoay xở trong trung tâm. Gia đình đông hoặc ghép biển nên kiểm tra xe 7 chỗ. Xe điện cần tính trạm sạc vào lịch; đừng coi mức km đã gồm trong hợp đồng là phạm vi pin.',
      parkingAdvice: 'chọn điểm ăn gần bãi công cộng và cộng phí theo từng lượt nếu di chuyển nhiều quán',
      faqQuestion: 'Đi Hải Phòng trong ngày có tiết kiệm hơn ngủ lại?',
      faqAnswer: 'Thường giảm một đêm lưu trú và có thể giảm ngày thuê, nhưng chỉ khi giờ nhận–trả cho phép. Cần cộng đủ cao tốc, bãi đỗ và rủi ro trả muộn trước khi so.',
      relatedVehicleLinks: [{ url: '/xe/vinfast-vf5-2025', label: 'VinFast VF5 2025' }, { url: '/xe/hyundai-creta-2025', label: 'Hyundai Creta 2025' }],
      relatedPostSlugs: ['chi-phi-sac-vf5-cho-chuyen-di-300-km'], ...shared,
    }),
    createPost({
      name: 'Sóc Sơn', routeSlug: 'soc-son', slug: 'chi-phi-thue-xe-tu-lai-di-soc-son', publishedAt: '2026-11-09T16:20:00+07:00', distanceKm: 40, duration: 'trong ngày hoặc 2 ngày 1 đêm',
      route: 'Nội thành Hà Nội → Võ Nguyên Giáp/QL3 → Sóc Sơn',
      excerpt: 'Cách tính chi phí thuê xe đi Sóc Sơn khoảng 80 km khứ hồi, gồm giao nhận, xăng/sạc, đường vào villa, đỗ xe và đồ mang theo.',
      seoTitle: 'Chi Phí Thuê Xe Tự Lái Đi Sóc Sơn',
      seoDescription: 'Dự toán chi phí thuê xe tự lái đi Sóc Sơn: giá xe, giao nhận, xăng/sạc, bãi villa, km nội vùng và giờ trả.',
      routeBudgetNote: 'Sóc Sơn có quãng đường ngắn nên G, tiền thuê và lựa chọn villa có thể ảnh hưởng tổng nhiều hơn nhiên liệu. Một số homestay nằm trên đường nhỏ; đi vòng, tìm lối vào hoặc ghé mua đồ làm tổng km tăng. Hỏi chủ nhà về đường và sân đỗ trước khi chọn xe lớn.',
      vehicleAdvice: 'Nhóm 2–4 người có thể ưu tiên xe nhỏ hoặc xe điện; nhóm villa đông và mang thực phẩm cần cốp lớn hoặc xe 7 chỗ. Đừng chọn xe gầm cao chỉ theo quảng cáo: cần hỏi chính xác mặt đường vào nơi lưu trú và số người thực tế.',
      parkingAdvice: 'xác nhận villa có sân đỗ miễn phí, cổng đủ rộng và có phải gửi xe ngoài hay không',
      faqQuestion: 'Đi gần như Sóc Sơn có cần tính phí giao nhận không?',
      faqAnswer: 'Có thể có, vì phí giao nhận dựa trên điểm nhận/trả chứ không chỉ điểm đến. Hãy yêu cầu báo giá ghi rõ G để so tổng, không chỉ so giá ngày.',
      relatedVehicleLinks: [{ url: '/xe/vinfast-vf3-2025', label: 'VinFast VF3 2025' }, { url: '/xe/vinfast-vf5-2025', label: 'VinFast VF5 2025' }],
      relatedPostSlugs: ['vf3-vf5-hay-vf6-phu-hop-di-pho'], ...shared,
    }),
  ];
}
