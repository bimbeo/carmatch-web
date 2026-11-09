function createPost({
  id,
  title,
  slug,
  excerpt,
  category,
  bodyHtml,
  seoTitle,
  seoDescription,
  ctaTitle,
  ctaDescription,
  ctaPrimaryLabel,
  ctaPrimaryUrl,
  relatedVehicleLinks = [],
  relatedPostSlugs = [],
  siteUrl,
  brandSocialImage,
  publishedAt,
}) {
  return {
    _id: id,
    title,
    slug: { current: slug },
    publishedAt,
    updatedAt: publishedAt,
    excerpt,
    mainImageUrl: brandSocialImage,
    categories: [category],
    author: 'Car Match',
    body: [],
    bodyHtml,
    seoTitle,
    seoDescription,
    canonicalUrl: `${siteUrl}/blog/${slug}`,
    ctaEnabled: true,
    ctaTitle,
    ctaDescription,
    ctaPrimaryLabel,
    ctaPrimaryUrl,
    ctaZaloLabel: 'Nhắn Zalo để kiểm tra xe',
    ctaZaloUrl: 'https://zalo.me/0971163290',
    relatedDestinationSlugs: [],
    relatedVehicleLinks,
    relatedPostSlugs,
  };
}

export function createRoadmapContentPosts({ siteUrl, brandSocialImage }) {
  return [
    createPost({
      id: 'static-vf3-vf5-city-comparison',
      title: 'VF3 hay VF5 phù hợp đi phố hơn? So sánh trước khi thuê',
      slug: 'vf3-hay-vf5-phu-hop-di-pho',
      publishedAt: '2026-11-09T10:20:00+07:00',
      excerpt: 'So sánh VF3 và VF5 theo số chỗ, giá thuê, hành lý, cảm giác sử dụng và nhu cầu đi phố để chọn đúng xe.',
      category: 'So sánh xe điện',
      bodyHtml: `<p><strong>Câu trả lời ngắn:</strong> VF3 phù hợp hơn khi ưu tiên xe nhỏ, dễ xoay xở trong phố, đi 1–3 người và mang ít hành lý; VF5 phù hợp hơn khi cần đủ 5 chỗ, khoang dùng linh hoạt hơn và có cả lịch nội đô lẫn đi gần Hà Nội. Dữ liệu xe đang hiển thị tại Car Match cho thấy VF3 có giá tham khảo từ 600.000đ/ngày, một số xe có giá tháng từ 7.000.000đ; VF5 từ 800.000đ/ngày, giá tháng khoảng 10–11 triệu đồng tùy xe. Đây không phải báo giá cố định: ngày thuê, lịch xe, điểm giao nhận và điều kiện từng xe có thể làm giá thay đổi. Trước khi chọn, hãy xác nhận số người ngồi thực tế, số vali, quãng đường dự kiến, nơi sạc và mức pin phải trả.</p>
        <h2>VF3 và VF5 khác nhau ở quyết định nào?</h2>
        <div class="table-wrap"><table><thead><tr><th>Tiêu chí</th><th>VinFast VF3</th><th>VinFast VF5</th></tr></thead><tbody>
          <tr><td>Nhu cầu hợp nhất</td><td>Đi phố, ít người, ít hành lý, ưu tiên gọn.</td><td>Gia đình nhỏ, đủ 5 chỗ, lịch trình đa dụng hơn.</td></tr>
          <tr><td>Giá ngày đang hiển thị</td><td>Từ 600.000đ/ngày.</td><td>Từ 800.000đ/ngày.</td></tr>
          <tr><td>Số chỗ theo dữ liệu xe</td><td>4 chỗ ở mẫu đang công bố đầy đủ thông số.</td><td>5 chỗ.</td></tr>
          <tr><td>Hành lý</td><td>Nên báo trước nếu có vali lớn hoặc xe đẩy.</td><td>Dễ bố trí hơn nhưng vẫn cần tính đủ người và đồ.</td></tr>
          <tr><td>Đi tỉnh</td><td>Phù hợp tuyến ngắn khi có kế hoạch sạc rõ.</td><td>Linh hoạt hơn cho gia đình, vẫn cần kiểm tra sạc.</td></tr>
        </tbody></table></div>
        <h2>Khi nào nên thuê VF3?</h2>
        <p>Chọn VF3 nếu phần lớn thời gian di chuyển trong nội đô, thường chỉ có một hoặc hai người, chỗ đỗ hẹp và hành lý gọn. Xe cũng phù hợp người muốn thử trải nghiệm ô tô điện với ngân sách thuê ngày thấp hơn. Trước khi chốt, mở <a href="/xe/vinfast-vf3-2025">trang thuê VinFast VF3</a> để kiểm tra giá, giới hạn km và lịch xe; không nên mặc định mọi chiếc VF3 có cùng định mức.</p>
        <h2>Khi nào nên thuê VF5?</h2>
        <p>VF5 đáng cân nhắc khi có 3–5 người, cần chỗ ngồi và hành lý linh hoạt hơn hoặc lịch trình xen kẽ nội đô với ngoại thành. Mức giá cao hơn VF3 cần được so với lợi ích về không gian và sự phù hợp, không chỉ với quãng đường. Xem <a href="/xe/vinfast-vf5-2024">trang thuê VinFast VF5</a> để đối chiếu mẫu xe thực tế.</p>
        <h2>Chi phí nào ngoài giá thuê cần tính?</h2>
        <p>Tổng chi phí gồm giá thuê, giao nhận nếu có, sạc, cầu đường/gửi xe và phát sinh theo hợp đồng. Cần hỏi mức pin giao–trả, ai thanh toán phiên sạc, giới hạn km và phí quá giờ. Bài <a href="/blog/thue-xe-dien-ai-tra-phi-sac">ai trả phí sạc khi thuê xe điện</a> giải thích cách đối soát, còn <a href="/blog/thue-xe-tu-lai-duoc-di-bao-nhieu-km-moi-ngay">hướng dẫn giới hạn km</a> giúp dự toán phần vượt.</p>
        <h2>Checklist chọn xe trong 60 giây</h2>
        <ol><li>Đi bao nhiêu người và có ghế trẻ em không?</li><li>Có bao nhiêu vali, xe đẩy hoặc đồ cồng kềnh?</li><li>Chủ yếu đi phố hay có cao tốc/đi tỉnh?</li><li>Điểm sạc trên tuyến đã rõ chưa?</li><li>Giá cuối đã gồm giao nhận và điều kiện pin chưa?</li></ol>
        <h2>Câu hỏi thường gặp</h2>
        <h3>VF3 có phù hợp gia đình 4 người không?</h3><p>Có thể phù hợp nếu mọi người ngồi vừa và hành lý ít, nhưng cần đối chiếu thực tế. Với nhiều vali hoặc ghế trẻ em, VF5 thường dễ bố trí hơn.</p>
        <h3>Đi tỉnh gần Hà Nội nên chọn xe nào?</h3><p>Chọn theo số người, hành lý và kế hoạch sạc. VF5 thường đa dụng hơn; VF3 vẫn dùng được cho tuyến phù hợp nếu người thuê đã tính quãng đường và trạm dự phòng.</p>`,
      seoTitle: 'VF3 Hay VF5 Phù Hợp Đi Phố Hơn?',
      seoDescription: 'So sánh VF3 và VF5 theo giá thuê, số chỗ, hành lý, đi phố và đi gần Hà Nội để chọn xe điện phù hợp.',
      ctaTitle: 'Cần chọn giữa VF3 và VF5?',
      ctaDescription: 'Gửi số người, hành lý, ngày thuê và tuyến đi để Car Match kiểm tra xe phù hợp hơn.',
      ctaPrimaryLabel: 'Xem xe điện tự lái',
      ctaPrimaryUrl: '/thue-xe-dien-ha-noi',
      relatedVehicleLinks: [
        { url: '/xe/vinfast-vf3-2025', label: 'Xem VinFast VF3' },
        { url: '/xe/vinfast-vf5-2024', label: 'Xem VinFast VF5' },
      ],
      relatedPostSlugs: ['thue-xe-dien-ai-tra-phi-sac', 'thue-xe-tu-lai-duoc-di-bao-nhieu-km-moi-ngay'],
      siteUrl,
      brandSocialImage,
    }),
    createPost({
      id: 'static-seven-seat-model-comparison',
      title: 'Carnival, Xpander hay Limo Green? So sánh xe 7 chỗ trước khi thuê',
      slug: 'carnival-xpander-hay-limo-green',
      publishedAt: '2026-11-09T10:10:00+07:00',
      excerpt: 'So sánh Carnival, Xpander và Limo Green theo giá, hành lý, nhiên liệu, sự thoải mái và kiểu chuyến đi.',
      category: 'So sánh xe 7 chỗ',
      bodyHtml: `<p><strong>Câu trả lời ngắn:</strong> Kia Carnival phù hợp khi ưu tiên không gian, sự thoải mái, khách doanh nghiệp hoặc gia đình có nhiều hành lý; Mitsubishi Xpander phù hợp nhóm cần xe 7 chỗ cân bằng chi phí và khả năng đi tỉnh; VinFast Limo Green phù hợp người muốn xe 7 chỗ chạy điện, hành trình đã có kế hoạch sạc. Giá đang hiển thị tại Car Match lần lượt khoảng 2.000.000đ/ngày cho Carnival, 1.100.000đ/ngày cho Xpander và 1.400.000đ/ngày cho Limo Green, tùy ngày thuê và lịch xe. Cả ba mẫu đều được khai báo 7 chỗ, nhưng “đủ chỗ” không đồng nghĩa đủ chỗ cho bảy người kèm nhiều vali. Hãy gửi số người, trẻ em, số vali, tuyến đi và điểm nhận xe để kiểm tra phương án thực tế trước khi cọc.</p>
        <h2>Bảng so sánh nhanh ba mẫu xe 7 chỗ</h2>
        <div class="table-wrap"><table><thead><tr><th>Tiêu chí</th><th>Carnival</th><th>Xpander</th><th>Limo Green</th></tr></thead><tbody>
          <tr><td>Giá ngày tham khảo</td><td>2.000.000đ</td><td>1.100.000đ</td><td>1.400.000đ</td></tr>
          <tr><td>Nhiên liệu</td><td>Dầu</td><td>Xăng</td><td>Điện</td></tr>
          <tr><td>Phù hợp</td><td>Gia đình cần rộng, tiếp khách, sự kiện.</td><td>Gia đình/nhóm bạn cần cân bằng chi phí.</td><td>Gia đình muốn xe điện và có kế hoạch sạc.</td></tr>
          <tr><td>Điều cần hỏi</td><td>Hành lý, điểm đỗ, giới hạn km.</td><td>Số người thực tế, hành lý, tuyến đi.</td><td>Pin giao–trả, trạm sạc và thời gian sạc.</td></tr>
        </tbody></table></div>
        <h2>Khi nào Carnival đáng tiền hơn?</h2><p>Carnival phù hợp chuyến cần trải nghiệm ngồi rộng, cửa trượt thuận tiện, đón người lớn tuổi, tiếp khách hoặc mang nhiều hành lý. Giá ngày cao hơn nên hãy cân nhắc tổng nhu cầu, không chọn chỉ vì “xe lớn”. Xem <a href="/xe/kia-carnival">trang thuê Kia Carnival</a> để kiểm tra giá và điều kiện km của xe thực tế.</p>
        <h2>Khi nào Xpander là lựa chọn cân bằng?</h2><p>Xpander phù hợp gia đình hoặc nhóm bạn muốn bảy chỗ với ngân sách thấp hơn Carnival. Nếu đủ bảy người, khoang hành lý có thể cần sắp xếp kỹ; nên báo số vali trước. Mẫu đang hiển thị tại <a href="/xe/mitsubishi-xpander-2023">trang Mitsubishi Xpander</a> có giá tham khảo từ 1.100.000đ/ngày.</p>
        <h2>Khi nào nên chọn Limo Green?</h2><p>Limo Green phù hợp người muốn kết hợp bảy chỗ với trải nghiệm xe điện. Quyết định phụ thuộc tuyến và khả năng sạc nhiều hơn hai mẫu xe dùng nhiên liệu. Trước khi đặt, xem <a href="/xe/vinfast-limo-green-2025">trang VinFast Limo Green</a>, xác nhận mức pin, điểm sạc và cách đối soát.</p>
        <h2>Chọn xe theo số người và hành lý thế nào?</h2><ul><li><strong>4–5 người, nhiều vali:</strong> Carnival thường thoải mái hơn.</li><li><strong>5–7 người, hành lý vừa:</strong> Xpander giúp cân bằng ngân sách.</li><li><strong>Tuyến rõ điểm sạc, muốn xe điện:</strong> cân nhắc Limo Green.</li><li><strong>7 người và nhiều vali:</strong> gửi ảnh/số lượng hành lý để kiểm tra, không tự suy từ số chỗ.</li></ul>
        <h2>Câu hỏi thường gặp</h2><h3>Xe 7 chỗ có luôn chở được 7 người và 7 vali không?</h3><p>Không. Số ghế và khoang hành lý là hai bài toán khác nhau. Cần ưu tiên an toàn, không che tầm nhìn và không nhồi hành lý vào vị trí ngồi.</p><h3>Đi tỉnh xa nên tránh Limo Green không?</h3><p>Không cần tránh tuyệt đối. Hãy chọn khi đã có kế hoạch sạc và thời gian dự phòng; nếu tuyến chưa rõ hạ tầng sạc hoặc lịch quá gấp, xe xăng/dầu có thể linh hoạt hơn.</p>`,
      seoTitle: 'Carnival, Xpander Hay Limo Green?',
      seoDescription: 'So sánh Carnival, Xpander và Limo Green theo giá thuê, hành lý, nhiên liệu và kiểu chuyến đi để chọn xe 7 chỗ.',
      ctaTitle: 'Cần chọn xe 7 chỗ phù hợp?',
      ctaDescription: 'Gửi số người, số vali và tuyến đi để Car Match kiểm tra mẫu xe và lịch phù hợp.',
      ctaPrimaryLabel: 'Xem xe 7 chỗ tự lái',
      ctaPrimaryUrl: '/thue-xe-7-cho-tu-lai-ha-noi',
      relatedVehicleLinks: [
        { url: '/xe/kia-carnival', label: 'Xem Kia Carnival' },
        { url: '/xe/mitsubishi-xpander-2023', label: 'Xem Mitsubishi Xpander' },
        { url: '/xe/vinfast-limo-green-2025', label: 'Xem VinFast Limo Green' },
      ],
      relatedPostSlugs: ['thue-xe-tu-lai-duoc-di-bao-nhieu-km-moi-ngay'],
      siteUrl,
      brandSocialImage,
    }),
    createPost({
      id: 'static-monthly-rent-vs-buy',
      title: 'Thuê xe tháng hay mua xe? Cách so tổng chi phí trước khi quyết định',
      slug: 'thue-xe-thang-hay-mua-xe',
      publishedAt: '2026-11-09T10:00:00+07:00',
      excerpt: 'So sánh thuê xe theo tháng và mua xe theo dòng tiền, mức sử dụng, bảo dưỡng, khấu hao và nhu cầu đổi xe.',
      category: 'Thuê xe theo tháng',
      bodyHtml: `<p><strong>Câu trả lời ngắn:</strong> thuê xe tháng phù hợp khi cần xe trong một giai đoạn xác định, muốn dự toán dòng tiền, chưa muốn bỏ vốn lớn hoặc cần đổi mẫu theo nhu cầu; mua xe phù hợp hơn khi sử dụng ổn định dài hạn, chấp nhận vốn ban đầu và tự quản lý bảo dưỡng, bảo hiểm, khấu hao cùng việc bán lại. Đừng so giá thuê tháng với riêng khoản trả góp. Hãy so tổng chi phí trong cùng kỳ: tiền thuê hoặc khoản trả trước/trả góp, lãi vay, đăng ký, bảo hiểm, bảo dưỡng, lốp, gửi xe, năng lượng và giá trị còn lại. Car Match đang hiển thị gói tháng từ khoảng 7 triệu đồng ở một số xe, nhưng giá cuối phụ thuộc mẫu xe, lịch dùng, km và hợp đồng. Đây là quyết định sử dụng tài sản, không phải tư vấn đầu tư.</p>
        <h2>Nên so những khoản chi phí nào?</h2><div class="table-wrap"><table><thead><tr><th>Khoản</th><th>Thuê tháng</th><th>Mua xe</th></tr></thead><tbody><tr><td>Vốn ban đầu</td><td>Cọc và tiền thuê theo hợp đồng.</td><td>Tiền xe/trả trước, đăng ký và chi phí ban đầu.</td></tr><tr><td>Chi phí cố định</td><td>Giá thuê, giao nhận và điều kiện km.</td><td>Trả góp/lãi, bảo hiểm, gửi xe, đăng kiểm.</td></tr><tr><td>Bảo dưỡng</td><td>Phân định theo hợp đồng; không mặc định gồm mọi khoản.</td><td>Chủ xe tự theo dõi và thanh toán.</td></tr><tr><td>Khấu hao</td><td>Không sở hữu nên không chịu giá bán lại trực tiếp.</td><td>Chịu rủi ro giảm giá và thanh khoản.</td></tr><tr><td>Đổi nhu cầu</td><td>Có thể đổi gói/xe khi hết kỳ nếu còn phương án.</td><td>Phải bán hoặc giữ xe hiện tại.</td></tr></tbody></table></div>
        <h2>Khi nào thuê xe tháng hợp lý hơn?</h2><p>Thuê tháng đáng cân nhắc khi dự án kéo dài vài tháng, gia đình đang thử nhu cầu dùng xe, doanh nghiệp cần xe cho đội sales hoặc người dùng muốn trải nghiệm xe điện trước khi sở hữu. Lợi thế là nhìn được khoản chi định kỳ và không phải tự xử lý việc bán xe. Đổi lại, khách cần tuân thủ km, người lái, giao nhận và trách nhiệm phát sinh trong hợp đồng.</p>
        <h2>Khi nào mua xe hợp lý hơn?</h2><p>Mua xe phù hợp nếu nhu cầu kéo dài nhiều năm, tần suất sử dụng cao và người mua chấp nhận quản lý tài sản. Lợi ích lớn nhất là quyền chủ động sử dụng; rủi ro là vốn bị giữ trong xe, chi phí phát sinh khó dự đoán và giá bán lại thay đổi. Nếu vay, cần đưa lãi và phí tài chính vào phép so sánh.</p>
        <h2>Cách tính trong 12 tháng mà không bị lệch</h2><ol><li>Chọn cùng một nhóm xe và mức sử dụng km.</li><li>Cộng mọi khoản tiền thật phải trả trong 12 tháng.</li><li>Với xe mua, trừ giá trị ước tính còn lại nhưng ghi rõ đây là giả định.</li><li>Định giá thời gian quản lý, bảo dưỡng và bán lại nếu điều đó quan trọng.</li><li>Chạy ba kịch bản: dùng ít, dùng dự kiến và dùng nhiều.</li></ol>
        <h2>Thuê tháng tại Car Match cần xác nhận gì?</h2><p>Hãy gửi số ngày dùng trong tháng, km dự kiến, nơi đỗ/sạc, người lái và khu vực giao nhận. Yêu cầu báo giá ghi giá tháng, cọc, km, phí vượt, bảo dưỡng, xử lý sự cố và điều kiện kết thúc sớm. Trang <a href="/thue-xe-thang">thuê xe theo tháng tại Hà Nội</a> có bảng xe và biểu mẫu nhận báo giá.</p>
        <h2>Câu hỏi thường gặp</h2><h3>Giá thuê tháng đã gồm xăng hoặc điện chưa?</h3><p>Không nên mặc định. Chi phí năng lượng và mức pin/xăng khi trả cần ghi trong hợp đồng.</p><h3>Thuê 12 tháng có giống mua xe trả góp không?</h3><p>Không. Thuê không tạo quyền sở hữu trừ khi hợp đồng có điều khoản riêng; mục tiêu là quyền sử dụng trong thời hạn xác định.</p>`,
      seoTitle: 'Thuê Xe Tháng Hay Mua Xe?',
      seoDescription: 'So sánh thuê xe tháng và mua xe theo tổng chi phí, dòng tiền, bảo dưỡng, khấu hao và nhu cầu sử dụng thực tế.',
      ctaTitle: 'Cần tính phương án thuê tháng?',
      ctaDescription: 'Gửi mẫu xe, số km và thời gian sử dụng để Car Match kiểm tra báo giá tháng phù hợp.',
      ctaPrimaryLabel: 'Xem gói thuê xe tháng',
      ctaPrimaryUrl: '/thue-xe-thang',
      relatedPostSlugs: ['thue-xe-tu-lai-ha-noi-gia-bao-nhieu', 'thue-xe-thang-co-bao-gom-bao-duong-khong'],
      siteUrl,
      brandSocialImage,
    }),
    createPost({
      id: 'static-three-day-rental-cost',
      title: 'Chi phí thuê xe tự lái 3 ngày 2 đêm gồm những gì?',
      slug: 'chi-phi-thue-xe-tu-lai-3-ngay-2-dem',
      publishedAt: '2026-11-09T09:50:00+07:00',
      excerpt: 'Công thức tính chi phí thuê xe 3 ngày 2 đêm với giá xe, giao nhận, xăng/sạc, cầu đường, gửi xe và phát sinh.',
      category: 'Chi phí thuê xe',
      bodyHtml: `<p><strong>Câu trả lời ngắn:</strong> chi phí chuyến thuê xe tự lái 3 ngày 2 đêm không chỉ là giá ngày nhân ba. Công thức nên dùng là <strong>giá thuê 3 ngày + giao nhận + xăng hoặc sạc + VETC/cầu đường + gửi xe + phụ phí đã thỏa thuận</strong>. Theo dữ liệu đang hiển thị tại Car Match, tiền thuê cơ bản minh họa cho ba ngày là khoảng 1,8 triệu đồng với VF3, 2,4 triệu với VF5, 3,3 triệu với Xpander, 4,2 triệu với Limo Green hoặc 6 triệu với Carnival, trước điều chỉnh theo ngày lễ, lịch xe và gói giá. Khách cần xác nhận giờ nhận/trả vì phần lẻ có thể ảnh hưởng số ngày tính tiền; đồng thời ước tính tổng km để tránh bất ngờ về phần vượt.</p>
        <h2>Bảng tiền thuê cơ bản cho 3 ngày</h2><div class="table-wrap"><table><thead><tr><th>Mẫu xe minh họa</th><th>Giá ngày đang hiển thị</th><th>Tiền thuê 3 ngày trước điều chỉnh</th></tr></thead><tbody><tr><td>VinFast VF3</td><td>600.000đ</td><td>1.800.000đ</td></tr><tr><td>VinFast VF5</td><td>800.000đ</td><td>2.400.000đ</td></tr><tr><td>Mitsubishi Xpander</td><td>1.100.000đ</td><td>3.300.000đ</td></tr><tr><td>VinFast Limo Green</td><td>1.400.000đ</td><td>4.200.000đ</td></tr><tr><td>Kia Carnival</td><td>2.000.000đ</td><td>6.000.000đ</td></tr></tbody></table></div>
        <p>Bảng chỉ giúp lập ngân sách. Giá cuối phải lấy từ báo giá theo ngày thuê, xe còn lịch và điểm giao nhận.</p>
        <h2>Những khoản nào thường bị bỏ sót?</h2><ul><li><strong>Giao nhận:</strong> phụ thuộc khu vực và phương án bàn giao.</li><li><strong>Xăng hoặc sạc:</strong> tính theo mức dùng thực tế và điều kiện giao–trả.</li><li><strong>Cầu đường/VETC:</strong> cộng theo tuyến đã đi.</li><li><strong>Gửi xe:</strong> khách sạn, điểm tham quan và bãi qua đêm.</li><li><strong>Vượt km/quá giờ:</strong> theo mẫu xe và hợp đồng.</li><li><strong>Vệ sinh hoặc hư hỏng:</strong> chỉ tính khi có căn cứ đối soát.</li></ul>
        <h2>Cách ước tính xăng hoặc sạc</h2><p>Với xe xăng/dầu, lấy quãng đường dự kiến, mức tiêu hao tham khảo của chính xe và giá nhiên liệu tại thời điểm đi; không nên dùng một con số chung cho mọi mẫu. Với xe điện, cộng các hóa đơn sạc thực tế và phí đỗ/chiếm chỗ nếu có. Đọc <a href="/blog/thue-xe-dien-ai-tra-phi-sac">cách đối soát phí sạc</a> nếu chọn xe điện.</p>
        <h2>Ba ngày được tính từ giờ nào?</h2><p>Ngày thuê phụ thuộc giờ nhận và trả theo quy tắc báo giá. Trước khi cọc, hãy ghi rõ ngày giờ thay vì chỉ nói “3 ngày 2 đêm”. Nếu về muộn, xem <a href="/blog/tra-xe-thue-muon-tinh-phi-the-nao">cách tính phí trả xe muộn</a>. Nếu đi xa, dùng <a href="/lap-ke-hoach-chuyen-di">công cụ lập kế hoạch chuyến đi</a> để ước tính quãng đường và chi phí tuyến.</p>
        <h2>Cách lập ngân sách an toàn</h2><ol><li>Chọn mẫu xe theo số người và hành lý.</li><li>Ghi ngày giờ nhận–trả chính xác.</li><li>Ước tính km đi–về và di chuyển tại điểm đến.</li><li>Liệt kê trạm thu phí, bãi đỗ và điểm sạc.</li><li>Chừa khoản dự phòng, nhưng yêu cầu mọi khoản khấu trừ phải có căn cứ.</li></ol>
        <h2>Câu hỏi thường gặp</h2><h3>Thuê càng nhiều ngày có chắc rẻ hơn theo ngày không?</h3><p>Không phải lúc nào cũng vậy. Gói giá phụ thuộc lịch, ngày lễ và xe; cần so báo giá cuối.</p><h3>Tiền cọc có phải là chi phí chuyến đi không?</h3><p>Cọc không phải chi phí nếu được hoàn đầy đủ, nhưng cần chuẩn bị dòng tiền và hiểu điều kiện khấu trừ/hoàn.</p>`,
      seoTitle: 'Chi Phí Thuê Xe 3 Ngày 2 Đêm',
      seoDescription: 'Cách tính chi phí thuê xe tự lái 3 ngày 2 đêm gồm giá xe, giao nhận, nhiên liệu, VETC, gửi xe và phát sinh.',
      ctaTitle: 'Cần báo giá chuyến 3 ngày?',
      ctaDescription: 'Gửi ngày giờ, tuyến đi, số người và hành lý để Car Match kiểm tra xe và tổng chi phí dự kiến.',
      ctaPrimaryLabel: 'Xem danh sách xe',
      ctaPrimaryUrl: '/xe',
      relatedPostSlugs: ['thue-xe-tu-lai-ha-noi-gia-bao-nhieu', 'thue-xe-tu-lai-duoc-di-bao-nhieu-km-moi-ngay'],
      siteUrl,
      brandSocialImage,
    }),
    createPost({
      id: 'static-ev-vs-gas-road-trip',
      title: 'Đi tỉnh nên thuê xe điện hay xe xăng?',
      slug: 'di-tinh-nen-thue-xe-dien-hay-xe-xang',
      publishedAt: '2026-11-09T09:40:00+07:00',
      excerpt: 'So sánh xe điện và xe xăng khi đi tỉnh theo tuyến, thời gian, sạc/nhiên liệu, hành lý và mức độ chủ động.',
      category: 'Kinh nghiệm đi tỉnh',
      bodyHtml: `<p><strong>Câu trả lời ngắn:</strong> xe điện phù hợp chuyến đi tỉnh khi tuyến đã rõ điểm sạc, lịch có thời gian dự phòng và người lái quen theo dõi pin; xe xăng phù hợp hơn khi đi nhiều chặng khó dự đoán, vùng ít lựa chọn sạc hoặc lịch trình cần linh hoạt cao. Không có lựa chọn luôn rẻ hoặc luôn tiện. Hãy so tổng chi phí thuê, năng lượng, cầu đường, thời gian dừng và rủi ro thay đổi tuyến. Với gia đình, số người và hành lý còn quan trọng hơn loại nhiên liệu. Trước khi cọc, gửi Car Match tuyến dự kiến, quãng đường, điểm nghỉ và giờ cần có mặt để kiểm tra mẫu xe. Nếu chọn xe điện, xác nhận pin giao–trả và phương án sạc; nếu chọn xe xăng, ghi mức nhiên liệu lúc nhận và trả.</p>
        <h2>Bảng quyết định nhanh</h2><div class="table-wrap"><table><thead><tr><th>Tình huống</th><th>Nghiêng về xe điện</th><th>Nghiêng về xe xăng/dầu</th></tr></thead><tbody><tr><td>Tuyến có sạc rõ</td><td>Có, nếu thời gian dừng phù hợp.</td><td>Vẫn dùng được nhưng không có lợi thế sạc.</td></tr><tr><td>Lịch trình thay đổi nhiều</td><td>Cần dự phòng kỹ.</td><td>Thường linh hoạt hơn.</td></tr><tr><td>Đi vùng núi/xa</td><td>Chỉ khi đã kiểm tra điểm sạc và độ cao/tuyến.</td><td>Dễ lập kế hoạch tiếp nhiên liệu hơn.</td></tr><tr><td>Đi nội đô + tỉnh gần</td><td>Thường là trường hợp phù hợp.</td><td>Phù hợp nếu ưu tiên quen dùng.</td></tr></tbody></table></div>
        <h2>Khi nào xe điện là lựa chọn tốt?</h2><p>Chọn xe điện khi quãng đường nằm trong kế hoạch an toàn, có ít nhất một phương án sạc chính và một phương án dự phòng, đồng thời thời gian chờ sạc không phá lịch. Xe điện cũng phù hợp khi điểm lưu trú có sạc hoặc chuyến có các khoảng nghỉ tự nhiên. Xem <a href="/thue-xe-dien-ha-noi">các mẫu xe điện tự lái tại Hà Nội</a> để so số chỗ và giá.</p>
        <h2>Khi nào nên chọn xe xăng hoặc dầu?</h2><p>Xe dùng nhiên liệu phù hợp nếu tuyến đi qua nhiều khu vực chưa quen, cần đổi đường theo thời tiết, chở nhiều người và không muốn dành thời gian quản lý pin. Tuy nhiên vẫn cần tính trạm nhiên liệu, mức tiêu hao và điểm dừng; “xe xăng” không đồng nghĩa chuyến đi không cần kế hoạch.</p>
        <h2>Chi phí nào dễ so sai?</h2><p>Đừng chỉ so tiền điện với tiền xăng. Giá thuê hai mẫu có thể khác, thời gian sạc có giá trị đối với lịch trình, còn phí cầu đường và gửi xe gần như độc lập với nhiên liệu. Với xe điện, đọc <a href="/blog/thue-xe-dien-ai-tra-phi-sac">điều kiện phí sạc</a>; với mọi xe, kiểm tra <a href="/blog/thue-xe-tu-lai-duoc-di-bao-nhieu-km-moi-ngay">giới hạn km</a>.</p>
        <h2>Checklist trước khi đi tỉnh</h2><ol><li>Tổng quãng đường và phần dự phòng là bao nhiêu?</li><li>Có bao nhiêu người, vali và ghế trẻ em?</li><li>Điểm sạc/nhiên liệu chính và dự phòng ở đâu?</li><li>Thời tiết hoặc đổi tuyến ảnh hưởng thế nào?</li><li>Giờ trả xe có đủ khoảng đệm không?</li></ol>
        <h2>Câu hỏi thường gặp</h2><h3>Xe điện có đi cao tốc được không?</h3><p>Có nếu xe và tuyến phù hợp, nhưng người thuê phải tính pin, tốc độ, điều hòa và điểm sạc; không dùng phạm vi lý thuyết làm ngân sách duy nhất.</p><h3>Đi Sapa hoặc Mộc Châu nên chọn loại nào?</h3><p>Quyết định phụ thuộc tuyến cụ thể, thời tiết, tải xe và hạ tầng sạc tại thời điểm đi. Hãy dùng trang <a href="/di-dau">Đi đâu</a> làm khung lập kế hoạch rồi xác nhận lại trước chuyến.</p>`,
      seoTitle: 'Đi Tỉnh Nên Thuê Xe Điện Hay Xe Xăng?',
      seoDescription: 'So sánh xe điện và xe xăng khi đi tỉnh theo tuyến, thời gian, sạc, nhiên liệu, hành lý và mức độ linh hoạt.',
      ctaTitle: 'Cần chọn xe cho chuyến đi tỉnh?',
      ctaDescription: 'Gửi tuyến, ngày đi, số người và hành lý để Car Match tư vấn nhóm xe phù hợp.',
      ctaPrimaryLabel: 'Lập kế hoạch chuyến đi',
      ctaPrimaryUrl: '/lap-ke-hoach-chuyen-di',
      relatedPostSlugs: ['thue-xe-dien-ai-tra-phi-sac', 'lap-ke-hoach-sac-xe-dien-khi-di-tinh'],
      siteUrl,
      brandSocialImage,
    }),
    createPost({
      id: 'static-ev-low-battery-roadside',
      title: 'Xe điện thuê bị hết pin giữa đường: nên xử lý thế nào?',
      slug: 'xe-dien-thue-het-pin-giua-duong-lam-gi',
      publishedAt: '2026-11-09T09:30:00+07:00',
      excerpt: 'Các bước an toàn khi xe điện báo pin thấp hoặc không thể tiếp tục: dừng xe, ghi nhận cảnh báo và liên hệ hỗ trợ.',
      category: 'Xử lý sự cố xe điện',
      bodyHtml: `<p><strong>Câu trả lời ngắn:</strong> khi xe điện thuê báo pin thấp, hãy giảm các thay đổi hành trình không cần thiết, tìm điểm dừng an toàn và liên hệ Car Match trước khi pin xuống mức không thể di chuyển. Nếu xe đã mất khả năng vận hành, bật cảnh báo, đặt xe ở vị trí an toàn theo điều kiện thực tế, gửi vị trí cùng ảnh màn hình cảnh báo và không tự kéo, kích điện, tháo pin hoặc can thiệp hệ thống điện. Phương án tiếp theo có thể là hướng dẫn tới điểm sạc gần nhất, hỗ trợ cứu hộ hoặc cách xử lý khác theo xe và hợp đồng. Người thuê không nên dựa vào con số phạm vi còn lại như một cam kết tuyệt đối vì đường, tốc độ, điều hòa, tải và thời tiết đều ảnh hưởng mức tiêu thụ.</p>
        <h2>Nếu xe vẫn còn di chuyển được thì làm gì?</h2><ol><li>Đọc đúng cảnh báo và phần trăm pin trên màn hình.</li><li>Ngừng thêm điểm đến không cần thiết, chọn trạm phù hợp gần tuyến.</li><li>Không tăng tốc hoặc lái bất thường để “cố tới”.</li><li>Gọi đầu mối hỗ trợ, gửi vị trí và mức pin hiện tại.</li><li>Giữ khoảng an toàn thay vì dùng hết phần pin dự phòng.</li></ol>
        <h2>Nếu xe đã dừng hẳn thì làm gì?</h2><p>Ưu tiên an toàn cho người và phương tiện. Bật đèn cảnh báo nếu phù hợp, rời xe tới vị trí an toàn theo điều kiện đường và gọi hỗ trợ. Không đứng ở làn xe chạy để chụp ảnh. Gửi biển số/xe, vị trí ghim, hướng di chuyển, ảnh cảnh báo và mô tả xe còn phản hồi hay không. Chỉ dùng đơn vị cứu hộ và phương thức vận chuyển được hướng dẫn vì xe điện có yêu cầu kỹ thuật riêng.</p>
        <h2>Những việc không nên tự làm</h2><ul><li>Không tháo hoặc chạm vào bộ phận điện cao áp.</li><li>Không dùng dây/kích điện không được hướng dẫn.</li><li>Không kéo xe tùy ý bằng xe khác.</li><li>Không xóa cảnh báo hoặc tiếp tục chạy khi xe báo dừng an toàn.</li><li>Không tự thỏa thuận chi phí cứu hộ rồi mới báo bên cho thuê nếu chưa có tình huống khẩn cấp bắt buộc.</li></ul>
        <h2>Ai chịu chi phí cứu hộ hoặc sạc?</h2><p>Không có một câu trả lời chung. Cần xác định nguyên nhân, điều kiện pin bàn giao, hướng dẫn đã cung cấp và điều khoản hợp đồng. Nếu có chi phí, khách nên yêu cầu hóa đơn và cách đối soát rõ. Bài <a href="/blog/thue-xe-dien-ai-tra-phi-sac">ai trả phí sạc</a> giải thích phần năng lượng; bài <a href="/blog/xe-thue-tu-lai-gap-su-co-tai-nan-hong-xe-lam-gi">xử lý sự cố xe thuê</a> bao quát các tình huống khác.</p>
        <h2>Làm sao tránh hết pin giữa đường?</h2><p>Trước chuyến, ghi mức pin nhận xe, kiểm tra trạm chính và dự phòng, không lên lịch sát phạm vi hiển thị, tính thêm tải, điều hòa và thay đổi tuyến. Khi pin xuống ngưỡng dự phòng do người thuê tự đặt, ưu tiên sạc thay vì tiếp tục lịch trình. Xem <a href="/blog/lap-ke-hoach-sac-xe-dien-khi-di-tinh">hướng dẫn lập kế hoạch sạc khi đi tỉnh</a>.</p>
        <h2>Câu hỏi thường gặp</h2><h3>Có thể gọi bất kỳ xe cứu hộ nào không?</h3><p>Nên liên hệ Car Match trước để xác nhận đơn vị và phương thức vận chuyển phù hợp, trừ trường hợp phải xử lý khẩn cấp để bảo đảm an toàn.</p><h3>Phạm vi còn lại trên màn hình có chính xác tuyệt đối không?</h3><p>Không. Đây là ước tính dựa trên điều kiện vận hành; cần giữ phần dự phòng và theo dõi xu hướng tiêu thụ.</p>`,
      seoTitle: 'Xe Điện Thuê Hết Pin Giữa Đường Làm Gì?',
      seoDescription: 'Cách xử lý an toàn khi xe điện thuê báo pin thấp hoặc hết pin giữa đường: dừng xe, ghi nhận và liên hệ hỗ trợ.',
      ctaTitle: 'Cần tư vấn xe điện và kế hoạch sạc?',
      ctaDescription: 'Gửi tuyến đi để Car Match kiểm tra mẫu xe và các điều kiện pin cần xác nhận.',
      ctaPrimaryLabel: 'Xem xe điện tự lái',
      ctaPrimaryUrl: '/thue-xe-dien-ha-noi',
      relatedPostSlugs: ['thue-xe-dien-ai-tra-phi-sac', 'lap-ke-hoach-sac-xe-dien-khi-di-tinh'],
      siteUrl,
      brandSocialImage,
    }),
    createPost({
      id: 'static-monthly-rental-maintenance',
      title: 'Thuê xe tháng có bao gồm bảo dưỡng không?',
      slug: 'thue-xe-thang-co-bao-gom-bao-duong-khong',
      publishedAt: '2026-11-09T09:20:00+07:00',
      excerpt: 'Bảo dưỡng xe thuê tháng phụ thuộc hợp đồng. Cách phân định bảo dưỡng định kỳ, hao mòn, lốp, sự cố và thời gian xe nằm xưởng.',
      category: 'Thuê xe theo tháng',
      bodyHtml: `<p><strong>Câu trả lời ngắn:</strong> không nên mặc định giá thuê xe tháng đã bao gồm mọi chi phí bảo dưỡng. Hợp đồng cần phân định ít nhất bốn nhóm: bảo dưỡng định kỳ do lịch sử sử dụng xe, hao mòn thông thường, hư hỏng do cách dùng trong thời gian thuê và vật tư tiêu hao như lốp hoặc ắc quy. Cũng phải ghi ai đặt lịch, ai đưa xe tới xưởng, thời gian xe ngừng sử dụng được xử lý thế nào và có xe thay thế hay không. Với Car Match, điều kiện được xác nhận theo mẫu xe, thời hạn, km dự kiến và phương án hợp tác của từng xe; không có cam kết chung “bao hết bảo dưỡng” cho mọi gói. Khách doanh nghiệp nên yêu cầu đầu mối phụ trách và quy trình phê duyệt chi phí bằng văn bản.</p>
        <h2>Những nhóm chi phí nào cần tách rõ?</h2><div class="table-wrap"><table><thead><tr><th>Nhóm</th><th>Ví dụ</th><th>Cần ghi trong hợp đồng</th></tr></thead><tbody><tr><td>Bảo dưỡng định kỳ</td><td>Dầu, lọc, kiểm tra theo km/thời gian.</td><td>Bên đặt lịch và bên thanh toán.</td></tr><tr><td>Hao mòn</td><td>Lốp, phanh, gạt mưa theo quá trình dùng.</td><td>Tiêu chí xác định hao mòn bình thường.</td></tr><tr><td>Hư hỏng phát sinh</td><td>Va quệt, vận hành sai, mất phụ kiện.</td><td>Biên bản, báo giá và trách nhiệm.</td></tr><tr><td>Thời gian nằm xưởng</td><td>Xe không dùng được khi sửa/bảo dưỡng.</td><td>Gia hạn, đổi xe hoặc tính tiền thế nào.</td></tr></tbody></table></div>
        <h2>Ai theo dõi mốc bảo dưỡng?</h2><p>Hai bên nên cùng ghi số km lúc bàn giao và mốc bảo dưỡng tiếp theo. Người thuê có trách nhiệm báo khi xe gần tới mốc hoặc xuất hiện cảnh báo; bên cho thuê cần hướng dẫn địa điểm và lịch. Không tiếp tục dùng xe khi cảnh báo có thể ảnh hưởng an toàn chỉ để tránh gián đoạn lịch.</p>
        <h2>Xe nằm xưởng có được đổi xe khác không?</h2><p>Chỉ coi là quyền lợi khi hợp đồng ghi rõ và còn xe phù hợp. Cần xác định trường hợp bảo dưỡng định kỳ, hư hỏng do xe và hư hỏng do người thuê; mỗi trường hợp có thể có cách xử lý khác. Doanh nghiệp cần xe liên tục nên ưu tiên thỏa thuận SLA phản hồi và phương án thay thế trước khi ký.</p>
        <h2>Khách cần làm gì để tránh tranh chấp?</h2><ol><li>Chụp tình trạng xe, lốp, đồng hồ và cảnh báo lúc nhận.</li><li>Ghi mốc bảo dưỡng tiếp theo trong biên bản.</li><li>Báo ngay tiếng động, đèn cảnh báo hoặc hiện tượng bất thường.</li><li>Không tự sửa hoặc thay vật tư khi chưa được xác nhận, trừ xử lý khẩn cấp an toàn.</li><li>Lưu hóa đơn, báo giá và tin nhắn phê duyệt.</li></ol>
        <h2>Trước khi ký gói tháng nên hỏi gì?</h2><p>Hỏi rõ km/tháng, phí vượt, lịch bảo dưỡng, phạm vi chi phí, xe thay thế, cứu hộ, thời gian phản hồi, điều kiện kết thúc sớm và cách hoàn cọc. Trang <a href="/thue-xe-thang">thuê xe tháng Hà Nội</a> giúp gửi nhu cầu; bài <a href="/blog/thue-xe-thang-hay-mua-xe">thuê tháng hay mua xe</a> hỗ trợ quyết định tài chính.</p>
        <h2>Câu hỏi thường gặp</h2><h3>Rửa xe và vệ sinh có phải bảo dưỡng không?</h3><p>Thường là nhóm vận hành/vệ sinh riêng, cần ghi ai chịu và tiêu chuẩn khi trả xe.</p><h3>Lốp thủng giữa đường xử lý thế nào?</h3><p>Ưu tiên an toàn, liên hệ đầu mối hỗ trợ và không tự quyết sửa/thay lốp nếu chưa thống nhất phương án.</p>`,
      seoTitle: 'Thuê Xe Tháng Có Bao Gồm Bảo Dưỡng?',
      seoDescription: 'Thuê xe tháng có gồm bảo dưỡng không? Cách phân định bảo dưỡng định kỳ, hao mòn, hư hỏng và thời gian xe nằm xưởng.',
      ctaTitle: 'Cần hợp đồng thuê tháng rõ chi phí?',
      ctaDescription: 'Gửi thời hạn và km dự kiến để Car Match kiểm tra gói cùng điều kiện bảo dưỡng phù hợp.',
      ctaPrimaryLabel: 'Xem gói thuê xe tháng',
      ctaPrimaryUrl: '/thue-xe-thang',
      relatedPostSlugs: ['thue-xe-thang-hay-mua-xe', 'xe-thue-tu-lai-gap-su-co-tai-nan-hong-xe-lam-gi'],
      siteUrl,
      brandSocialImage,
    }),
    createPost({
      id: 'static-ev-road-trip-charging-plan',
      title: 'Đi tỉnh bằng xe điện sạc ở đâu? Cách lập kế hoạch không phụ thuộc một trạm',
      slug: 'lap-ke-hoach-sac-xe-dien-khi-di-tinh',
      publishedAt: '2026-11-09T09:10:00+07:00',
      excerpt: 'Cách chọn trạm sạc chính và dự phòng, tính thời gian dừng, phần pin an toàn và xử lý khi trạm thay đổi.',
      category: 'Kinh nghiệm thuê xe điện',
      bodyHtml: `<p><strong>Câu trả lời ngắn:</strong> khi đi tỉnh bằng xe điện, không nên lập kế hoạch chỉ dựa vào một trạm hoặc danh sách cố định trên bài viết. Mạng lưới, trạng thái trụ, ứng dụng và chính sách có thể thay đổi. Hãy xác định trạm chính theo tuyến thực tế trên ứng dụng/bản đồ chính thức gần ngày đi, thêm ít nhất một phương án dự phòng, rồi tính thời gian rời tuyến, chờ và sạc. Giữ phần pin an toàn cho tắc đường, đổi điểm đến hoặc trạm không dùng được; không dùng phạm vi quảng cáo của xe làm quãng đường chắc chắn. Trước khi nhận xe, xác nhận mức pin, tài khoản/cách thanh toán, đầu sạc phù hợp và mức pin cần trả. Nếu chưa quen xe điện, gửi tuyến cho Car Match để kiểm tra mẫu xe và điểm dừng hợp lý.</p>
        <h2>Cách chọn trạm sạc chính</h2><ol><li>Nhập đúng điểm xuất phát, điểm đến và các chặng trung gian.</li><li>Chọn trạm nằm trên hoặc gần tuyến, không chỉ trạm gần nhất theo đường thẳng.</li><li>Kiểm tra loại đầu sạc, giờ hoạt động và điều kiện ra vào.</li><li>Ước tính mức pin khi tới trạm với phần dự phòng.</li><li>Kiểm tra lại trạng thái gần giờ xuất phát.</li></ol>
        <h2>Vì sao luôn cần trạm dự phòng?</h2><p>Trạm có thể bận, bảo trì, khó vào, không phù hợp đầu sạc hoặc yêu cầu tài khoản khác. Trạm dự phòng nên nằm trước khi pin xuống ngưỡng thấp, không phải sau trạm chính quá xa. Nếu tuyến chỉ có một lựa chọn mà lịch không cho phép chờ, hãy cân nhắc xe xăng/dầu hoặc đổi lịch trình.</p>
        <h2>Nên chừa bao nhiêu thời gian?</h2><p>Đừng chỉ tính thời gian sạc lý thuyết. Cộng thời gian rời cao tốc, tìm trụ, chờ, kết nối, sạc, thanh toán và quay lại tuyến. Mức chừa phụ thuộc xe, công suất trụ và lịch; vì vậy bài viết không đưa một con số chung. Hãy xếp sạc cùng bữa ăn hoặc giờ nghỉ nếu phù hợp để giảm ảnh hưởng chuyến đi.</p>
        <h2>Bảng kế hoạch sạc nên ghi gì?</h2><div class="table-wrap"><table><thead><tr><th>Chặng</th><th>Pin dự kiến</th><th>Trạm chính</th><th>Trạm dự phòng</th><th>Thời gian đệm</th></tr></thead><tbody><tr><td>Hà Nội → điểm nghỉ</td><td>Ghi sau khi nhận xe.</td><td>Tên/vị trí trên ứng dụng.</td><td>Một trạm trước ngưỡng pin thấp.</td><td>Chờ + sạc + quay lại tuyến.</td></tr><tr><td>Điểm nghỉ → điểm đến</td><td>Tính lại theo tiêu thụ thực.</td><td>Trạm tại/near điểm đến.</td><td>Trạm trên đường quay về.</td><td>Dự phòng đổi lịch.</td></tr></tbody></table></div>
        <h2>Chi phí sạc được đối soát thế nào?</h2><p>Lưu hóa đơn hoặc lịch sử giao dịch, ghi phí đỗ/chiếm chỗ nếu có và đối chiếu với điều khoản thuê. Không mặc định ưu đãi của chủ xe áp dụng cho người thuê. Đọc <a href="/blog/thue-xe-dien-ai-tra-phi-sac">hướng dẫn phí sạc xe thuê</a> trước khi nhận xe.</p>
        <h2>Nếu trạm dự kiến không dùng được thì làm gì?</h2><p>Không tiếp tục đi sâu vào tuyến khi pin đã thấp. Chuyển sang phương án dự phòng, gửi vị trí/mức pin cho Car Match và ưu tiên an toàn. Nếu xe đã báo pin thấp nghiêm trọng, làm theo <a href="/blog/xe-dien-thue-het-pin-giua-duong-lam-gi">quy trình xử lý xe điện gần hết pin</a>.</p>
        <h2>Câu hỏi thường gặp</h2><h3>Có nên sạc đầy 100% ở mọi trạm?</h3><p>Không nhất thiết. Mức sạc phụ thuộc quãng đường tiếp theo, thời gian và hướng dẫn của xe; cần đủ phần an toàn thay vì cố định một tỷ lệ.</p><h3>Có thể lập kế hoạch trước nhiều tuần không?</h3><p>Có thể lập khung tuyến, nhưng cần kiểm tra lại trạm và điều kiện sát ngày đi vì dữ liệu vận hành có thể thay đổi.</p>`,
      seoTitle: 'Đi Tỉnh Bằng Xe Điện Sạc Ở Đâu?',
      seoDescription: 'Cách lập kế hoạch sạc xe điện khi đi tỉnh: trạm chính, trạm dự phòng, thời gian chờ, pin an toàn và chi phí.',
      ctaTitle: 'Cần kiểm tra xe điện cho tuyến đi tỉnh?',
      ctaDescription: 'Gửi tuyến và ngày thuê để Car Match kiểm tra mẫu xe cùng điều kiện pin giao trả.',
      ctaPrimaryLabel: 'Xem xe điện tại Hà Nội',
      ctaPrimaryUrl: '/thue-xe-dien-ha-noi',
      relatedPostSlugs: ['thue-xe-dien-ai-tra-phi-sac', 'xe-dien-thue-het-pin-giua-duong-lam-gi', 'di-tinh-nen-thue-xe-dien-hay-xe-xang'],
      siteUrl,
      brandSocialImage,
    }),
  ];
}
