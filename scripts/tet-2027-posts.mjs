function renderList(items) {
  return `<ul>${items.map((item) => `<li>${item}</li>`).join('')}</ul>`;
}

function createTetPost(item, { siteUrl, brandSocialImage }) {
  const owner = item.audience === 'owner';
  const landingPath = owner ? '/hop-tac-chu-xe-cho-thue-tet' : '/thue-xe-tu-lai-tet-ha-noi';
  const landingLabel = owner ? 'trang hợp tác chủ xe dịp Tết' : 'trang thuê xe tự lái Tết tại Hà Nội';
  const process = owner
    ? ['Gửi thông tin xe, hồ sơ cơ bản, khu vực đỗ và lịch rảnh.', 'Chờ Car Match kiểm tra điều kiện xe và nhu cầu phù hợp.', 'Đối chiếu phương án vận hành, giao nhận, chi phí và đối soát.', 'Chỉ ký và bàn giao khi các trách nhiệm đã được ghi bằng văn bản.']
    : ['Gửi ngày nhận–trả, số người, hành lý, tuyến đi và khu vực nhận xe.', 'So sánh xe theo không gian thực tế, quãng đường và thói quen lái.', 'Nhận báo giá cùng điều kiện cho đúng xe và đúng khoảng ngày.', 'Kiểm tra giấy tờ, chụp tình trạng xe và giữ xác nhận khi giao nhận.'];

  const bodyHtml = `<p><strong>Câu trả lời ngắn:</strong> ${item.answer}</p>
    <p>Nội dung này giúp bạn ra quyết định cho mùa Tết 2027 nhưng không thay thế báo giá, hợp đồng hoặc xác nhận của một booking cụ thể. Nguồn xe, nhu cầu, giá và điều kiện có thể thay đổi theo mẫu xe, lịch thực tế và phương án hai bên thống nhất. Hãy dùng <a href="${landingPath}">${landingLabel}</a> làm trang bắt đầu và xác nhận lại bằng văn bản trước khi chuyển cọc hoặc bàn giao xe.</p>
    <h2>Nên quyết định thế nào?</h2>
    <p>${item.decision}</p>
    <p>Một quyết định tốt phải trả lời được ba câu hỏi: lịch có đủ rõ để thực hiện không, tổng chi phí hoặc lợi ích có được tính trên cùng một cơ sở không, và ai chịu trách nhiệm nếu tình huống khác kế hoạch. Nếu một trong ba câu hỏi còn mơ hồ, nên bổ sung thông tin trước khi chốt.</p>
    <h2>Checklist cần chuẩn bị</h2>
    ${renderList(item.checklist)}
    <p>Nên gửi các thông tin này trong cùng một cuộc trao đổi để tránh nhầm xe, nhầm ngày hoặc bỏ sót điều kiện. Ảnh chụp và tin nhắn cần giữ nguyên bản cho tới khi chuyến đi hoặc kỳ đối soát kết thúc.</p>
    <h2>Quy trình đề xuất</h2>
    ${renderList(process)}
    <p>Car Match không coi việc gửi thông tin là cam kết xe chắc chắn được nhận khai thác hoặc chắc chắn còn trống. Trạng thái chỉ nên được xem là đã xác nhận khi có phản hồi gắn với đúng xe, đúng người, đúng khoảng thời gian và các điều kiện liên quan.</p>
    <h2>Những rủi ro cần kiểm tra trước</h2>
    ${renderList(item.risks)}
    <p>Đặc biệt trong dịp cao điểm, không nên suy ra điều kiện từ một chuyến trước hoặc từ giá tham khảo trên bài viết. Nếu có thay đổi lịch, tuyến, người lái, điểm giao nhận hoặc thời gian trả, hãy báo sớm và chờ xác nhận mới.</p>
    <h2>Cách Car Match hỗ trợ</h2>
    <p>${owner
      ? 'Car Match tiếp nhận hồ sơ xe và lịch rảnh, đánh giá khả năng phù hợp với nhu cầu, rồi trao đổi phương án vận hành và đối soát. Mức doanh thu chỉ có thể ước tính sau khi biết mẫu xe, tình trạng, lịch và điều kiện hợp tác; không có một mức cam kết chung cho mọi chủ xe.'
      : 'Car Match tiếp nhận lịch trình, số người, hành lý và khu vực nhận xe để gợi ý nhóm xe phù hợp. Giá, tiền cọc, giới hạn km, giao nhận và điều kiện thay đổi lịch cần được xác nhận cho đúng booking; bài viết không thể hiện tồn xe theo thời gian thực.'}</p>
    <p>Khi cần kiểm tra trường hợp cụ thể, nhắn Zalo hoặc hotline 0971 163 290 và gửi đủ thông tin ngay từ đầu. Bạn cũng có thể xem <a href="/chinh-sach">chính sách thuê xe</a>, <a href="/faq">câu hỏi thường gặp</a> và <a href="/xe">danh sách xe</a> để đối chiếu trước.</p>
    <h2>Câu hỏi thường gặp</h2>
    ${item.faq.map(({ question, answer }) => `<h3>${question}</h3><p>${answer}</p>`).join('')}`;

  return {
    _id: `static-tet-2027-${item.slug}`,
    title: item.title,
    slug: { current: item.slug },
    publishedAt: item.publishedAt,
    updatedAt: item.publishedAt,
    excerpt: item.excerpt,
    mainImageUrl: brandSocialImage,
    categories: [owner ? 'Hợp tác chủ xe' : 'Thuê xe Tết'],
    author: 'Car Match',
    body: [],
    bodyHtml,
    seoTitle: item.seoTitle || item.title,
    seoDescription: item.excerpt,
    canonicalUrl: `${siteUrl}/blog/${item.slug}`,
    ctaEnabled: true,
    ctaTitle: owner ? 'Có xe nhàn rỗi dịp Tết?' : 'Đang lên lịch thuê xe Tết?',
    ctaDescription: owner
      ? 'Gửi mẫu xe, khu vực đỗ và lịch rảnh để Car Match thẩm định phương án hợp tác.'
      : 'Gửi ngày nhận–trả, số người, hành lý và tuyến đi để Car Match kiểm tra xe phù hợp.',
    ctaPrimaryLabel: owner ? 'Xem hướng dẫn hợp tác' : 'Xem trang thuê xe Tết',
    ctaPrimaryUrl: landingPath,
    ctaZaloLabel: 'Nhắn Zalo Car Match',
    ctaZaloUrl: 'https://zalo.me/0971163290',
    relatedDestinationSlugs: [],
    relatedVehicleLinks: [],
    relatedPostSlugs: item.related,
  };
}

const ownerPosts = [
  {
    title: 'Xe nhàn rỗi dịp Tết có nên cho thuê không?', slug: 'xe-nhan-roi-dip-tet-co-nen-cho-thue-khong', publishedAt: '2026-11-10T20:00:00+07:00',
    excerpt: 'Cách chủ xe đánh giá lịch rảnh, chi phí, rủi ro và hợp đồng trước khi quyết định cho thuê xe dịp Tết 2027.',
    answer: 'Có thể cân nhắc nếu xe thực sự rảnh, hồ sơ đầy đủ, tình trạng tốt và bạn chấp nhận quy trình giao nhận, kiểm tra khách, theo dõi xe và đối soát. Không nên cho thuê chỉ vì thấy nhu cầu cao nếu lịch gia đình chưa chắc chắn hoặc trách nhiệm khi phát sinh chưa được ghi rõ.',
    decision: 'Hãy so sánh lợi ích dự kiến với chi phí cơ hội khi không có xe sử dụng, công sức chuẩn bị và rủi ro vận hành. Chỉ tiếp tục khi lịch bàn giao–nhận lại có khoảng đệm, xe đủ điều kiện và hợp đồng mô tả được cách xử lý các tình huống thường gặp.',
    checklist: ['Ngày xe rảnh và thời điểm phải nhận lại.', 'Đăng kiểm, bảo hiểm, giấy tờ và lịch bảo dưỡng.', 'Ảnh/video hiện trạng, km, nhiên liệu hoặc pin.', 'Điều kiện về tuyến, người lái, VETC và phụ kiện.'],
    risks: ['Lịch gia đình thay đổi sau khi đã xác nhận khách.', 'Không có bằng chứng hiện trạng trước giao xe.', 'Chỉ nhìn doanh thu gộp mà bỏ qua chi phí và thời gian.', 'Điều khoản chậm trả, hư hỏng hoặc phạt nguội chưa rõ.'],
    faq: [{ question: 'Xe chỉ rảnh vài ngày có hợp tác được không?', answer: 'Có thể gửi lịch để thẩm định, nhưng khả năng phù hợp phụ thuộc khoảng ngày, nhu cầu và điều kiện giao nhận.' }, { question: 'Car Match có cam kết thu nhập không?', answer: 'Không. Chỉ có thể ước tính sau khi thẩm định xe, lịch và phương án cụ thể.' }],
    related: ['hop-tac-chu-xe-cho-thue-tet-can-gi', 'doanh-thu-xe-nhan-roi-dip-tet-tinh-the-nao'], audience: 'owner',
  },
  {
    title: 'Hợp tác chủ xe cho thuê Tết cần gì?', slug: 'hop-tac-chu-xe-cho-thue-tet-can-gi', publishedAt: '2026-11-10T19:50:00+07:00',
    excerpt: 'Checklist thông tin xe, hồ sơ, lịch rảnh và điều kiện chủ xe cần chuẩn bị khi gửi hợp tác cho thuê dịp Tết.',
    answer: 'Tối thiểu cần thông tin chủ xe, mẫu xe và năm sản xuất, tình trạng hiện tại, hồ sơ xe, khu vực đỗ và lịch rảnh cụ thể. Sau bước kiểm tra sơ bộ, hai bên mới trao đổi phương án vận hành, giao nhận và đối soát.',
    decision: 'Chuẩn bị thông tin đầy đủ ngay từ đầu giúp Car Match đánh giá đúng khả năng khai thác và tránh báo một phương án không phù hợp. Không che giấu lỗi xe, lịch bảo dưỡng hoặc ràng buộc giấy tờ vì chúng ảnh hưởng trực tiếp tới an toàn và hợp đồng.',
    checklist: ['CCCD/thông tin liên hệ của chủ xe.', 'Đăng ký, đăng kiểm và bảo hiểm đang có.', 'Ảnh ngoại thất, nội thất, lốp và đồng hồ.', 'Lịch rảnh, khu vực đỗ và cách bàn giao chìa khóa.'],
    risks: ['Hồ sơ hết hạn trong thời gian dự kiến khai thác.', 'Xe có cảnh báo kỹ thuật chưa được xử lý.', 'Lịch rảnh chỉ nói chung chung, không có giờ cụ thể.', 'Người ký hợp đồng không đủ quyền quyết định với xe.'],
    faq: [{ question: 'Có cần mang xe đến ngay không?', answer: 'Nên gửi thông tin và ảnh để kiểm tra sơ bộ trước; lịch kiểm tra thực tế sẽ được thống nhất sau.' }, { question: 'Xe đang trả góp có gửi hợp tác được không?', answer: 'Cần kiểm tra quyền sử dụng, giấy tờ và các ràng buộc liên quan trước khi kết luận.' }],
    related: ['xe-nhan-roi-dip-tet-co-nen-cho-thue-khong', 'chuan-bi-xe-truoc-khi-cho-thue-tet'], audience: 'owner',
  },
  {
    title: 'Cho thuê xe cá nhân ngày Tết có an toàn không?', slug: 'cho-thue-xe-ca-nhan-ngay-tet-co-an-toan-khong', publishedAt: '2026-11-10T19:40:00+07:00',
    excerpt: 'Các lớp kiểm soát giúp giảm rủi ro khi chủ xe cá nhân hợp tác cho thuê xe ngày Tết.',
    answer: 'Không có phương án nào loại bỏ hoàn toàn rủi ro. Mức an toàn phụ thuộc vào việc xác minh người thuê, hợp đồng, đặt cọc, giới hạn sử dụng, biên bản hiện trạng, thiết bị theo dõi hợp pháp và quy trình hỗ trợ khi có sự cố.',
    decision: 'Chỉ giao xe khi biết rõ ai nhận, ai được phép lái, xe đi trong phạm vi nào và bằng chứng nào dùng để đối soát. Nếu quy trình dựa chủ yếu vào trao đổi miệng hoặc không có biên bản hiện trạng, chủ xe nên dừng để hoàn thiện trước.',
    checklist: ['Xác minh người thuê và người lái thực tế.', 'Hợp đồng gắn với đúng biển số và thời gian.', 'Biên bản, ảnh/video có mốc thời gian.', 'Đầu mối liên hệ khi có va chạm hoặc xe không vận hành.'],
    risks: ['Giao xe cho người không có tên trong hồ sơ.', 'Tự thỏa thuận ngoài quy trình đã thống nhất.', 'Không quy định tuyến, km hoặc thời gian trả.', 'Sửa chữa phát sinh nhưng không giữ hóa đơn và bằng chứng.'],
    faq: [{ question: 'Có GPS thì đã đủ an toàn chưa?', answer: 'Không. GPS chỉ là một công cụ; vẫn cần xác minh, hợp đồng, bàn giao và quy trình xử lý sự cố.' }, { question: 'Ảnh xe qua tin nhắn có đủ không?', answer: 'Nên có ảnh/video rõ từng khu vực và biên bản ghi nhận km, nhiên liệu/pin, phụ kiện, lỗi có sẵn.' }],
    related: ['hop-dong-hop-tac-cho-thue-xe-can-dieu-khoan-gi', 'phat-nguoi-vetc-hu-hong-xe-hop-tac-xu-ly-the-nao'], audience: 'owner',
  },
  {
    title: 'Hợp đồng hợp tác cho thuê xe cần điều khoản gì?', slug: 'hop-dong-hop-tac-cho-thue-xe-can-dieu-khoan-gi', publishedAt: '2026-11-10T19:30:00+07:00',
    excerpt: 'Danh sách điều khoản chủ xe nên kiểm tra: lịch, giá, giao nhận, hư hỏng, phạt nguội, VETC và đối soát.',
    answer: 'Hợp đồng cần xác định đúng chủ thể, xe, thời hạn, quyền sử dụng, cách tính doanh thu và chi phí, quy trình giao nhận, trách nhiệm với vi phạm–hư hỏng, chậm trả, bảo mật dữ liệu và chấm dứt hợp tác.',
    decision: 'Đọc hợp đồng theo các tình huống xấu có thể xảy ra thay vì chỉ nhìn tỷ lệ doanh thu. Mỗi điều khoản quan trọng cần nêu bằng chứng dùng để xác định sự việc, thời hạn thông báo và cách hai bên đối soát.',
    checklist: ['Thông tin xe, phụ kiện và tình trạng ban đầu.', 'Lịch khai thác, quyền từ chối và cách thay đổi lịch.', 'Doanh thu gộp, khoản khấu trừ và kỳ thanh toán.', 'Tai nạn, hư hỏng, phạt nguội, VETC và chậm trả.'],
    risks: ['Dùng từ chung chung như “mọi chi phí” không có phạm vi.', 'Không có thời hạn xử lý phạt nguội phát sinh muộn.', 'Không nêu ai được phép ký biên bản nhận–trả.', 'Phụ lục xe và hiện trạng không đi kèm hợp đồng.'],
    faq: [{ question: 'Có nên ký khi còn chỗ trống trong hợp đồng?', answer: 'Không. Các trường thông tin và phụ lục cần hoàn thiện, được đọc lại và mỗi bên giữ bản có giá trị đối chiếu.' }, { question: 'Tin nhắn có thay hợp đồng không?', answer: 'Tin nhắn có thể ghi nhận thay đổi cụ thể, nhưng không nên mặc định thay toàn bộ điều khoản đã ký.' }],
    related: ['cho-thue-xe-ca-nhan-ngay-tet-co-an-toan-khong', 'phat-nguoi-vetc-hu-hong-xe-hop-tac-xu-ly-the-nao'], audience: 'owner',
  },
  {
    title: 'Doanh thu xe nhàn rỗi dịp Tết tính thế nào?', slug: 'doanh-thu-xe-nhan-roi-dip-tet-tinh-the-nao', publishedAt: '2026-11-10T19:20:00+07:00',
    excerpt: 'Công thức tính doanh thu ròng cho xe nhàn rỗi dịp Tết mà không dựa vào cam kết thu nhập chung.',
    answer: 'Nên tính từ doanh thu của các ngày thực sự được xác nhận, trừ các khoản đã thỏa thuận như vận hành, giao nhận, vệ sinh, gửi xe hoặc chi phí khác. Không lấy giá một ngày nhân toàn bộ kỳ nghỉ nếu chưa có booking và lịch bàn giao cụ thể.',
    decision: 'Lập ba kịch bản thận trọng, cơ sở và thuận lợi; mỗi kịch bản ghi số ngày có khách, giá áp dụng, khoản khấu trừ và thời điểm tiền được đối soát. Chỉ so sánh các phương án khi cùng dùng doanh thu ròng.',
    checklist: ['Số ngày xe sẵn sàng và số ngày đã xác nhận.', 'Giá của từng booking, không chỉ giá niêm yết.', 'Danh mục chi phí và bên chịu từng khoản.', 'Kỳ đối soát, chứng từ và điều kiện giữ lại khoản chờ xử lý.'],
    risks: ['Nhầm doanh thu gộp thành số tiền chủ xe nhận.', 'Không dự phòng ngày trống giữa hai chuyến.', 'Bỏ qua vệ sinh, giao nhận hoặc thời gian chuẩn bị.', 'Coi ước tính là cam kết thanh toán.'],
    faq: [{ question: 'Có bảng giá chung cho mọi xe không?', answer: 'Không. Mẫu xe, tình trạng, lịch và nhu cầu thực tế khác nhau nên cần thẩm định riêng.' }, { question: 'Khi nào biết con số chính xác?', answer: 'Khi đã có điều kiện hợp tác và booking cụ thể; trước đó chỉ nên coi là kịch bản ước tính.' }],
    related: ['xe-nhan-roi-dip-tet-co-nen-cho-thue-khong', 'uy-thac-xe-theo-ngay-hay-cho-thue-theo-thang'], audience: 'owner',
  },
  {
    title: 'Ủy thác xe theo ngày hay cho thuê theo tháng?', slug: 'uy-thac-xe-theo-ngay-hay-cho-thue-theo-thang', publishedAt: '2026-11-10T19:10:00+07:00',
    excerpt: 'So sánh ủy thác theo ngày và hợp tác theo thời hạn để chủ xe chọn theo nhu cầu sử dụng thực tế.',
    answer: 'Ủy thác theo ngày phù hợp khi chủ xe vẫn cần dùng xe và có thể cập nhật lịch rảnh; hợp tác theo thời hạn phù hợp khi xe dư trong một khoảng liên tục và chủ xe muốn giảm việc tham gia vận hành. Phương án tốt nhất phụ thuộc lịch, không chỉ doanh thu dự kiến.',
    decision: 'Nếu lịch gia đình biến động, ưu tiên phương án linh hoạt và chỉ mở những ngày chắc chắn. Nếu xe không dùng trong thời gian dài, so sánh phương án theo kỳ dựa trên quyền lấy lại xe, giới hạn km và trách nhiệm bảo dưỡng.',
    checklist: ['Tần suất chủ xe cần lấy xe đột xuất.', 'Khả năng hỗ trợ giao nhận theo từng chuyến.', 'Khoảng thời gian xe có thể bàn giao liên tục.', 'Cách đối soát, quyền thay đổi lịch và chấm dứt.'],
    risks: ['Mở lịch rồi hủy sát ngày khách nhận.', 'Cho thuê dài hạn nhưng không rõ quyền lấy lại xe.', 'So sánh tỷ lệ mà không so công việc phải làm.', 'Không quy định bảo dưỡng khi km tăng theo thời gian.'],
    faq: [{ question: 'Có thể đổi hình thức sau Tết không?', answer: 'Có thể đề xuất, nhưng cần thẩm định và lập xác nhận hoặc hợp đồng phù hợp cho giai đoạn mới.' }, { question: 'Hình thức nào chắc chắn nhiều tiền hơn?', answer: 'Không có câu trả lời chung; cần tính theo xe, lịch, booking và chi phí thực tế.' }],
    related: ['doanh-thu-xe-nhan-roi-dip-tet-tinh-the-nao', 'hop-tac-chu-xe-cho-thue-tet-can-gi'], audience: 'owner',
  },
  {
    title: 'Xe nào phù hợp khai thác dịp Tết?', slug: 'xe-nao-phu-hop-khai-thac-dip-tet', publishedAt: '2026-11-10T19:00:00+07:00',
    excerpt: 'Tiêu chí đánh giá xe 5 chỗ, 7 chỗ và xe điện trước khi đưa vào phương án khai thác dịp Tết.',
    answer: 'Xe phù hợp là xe hồ sơ hợp lệ, vận hành ổn định, lịch bảo dưỡng đảm bảo, nội ngoại thất đủ tốt và có nhóm nhu cầu phù hợp. Số chỗ hoặc thương hiệu không tự quyết định khả năng được nhận hợp tác.',
    decision: 'Đánh giá xe theo an toàn, độ tin cậy, không gian, chi phí vận hành và khả năng hỗ trợ trên tuyến khách thường đi. Một mẫu xe hấp dẫn nhưng sắp đến kỳ bảo dưỡng hoặc lốp kém không nên đưa vào lịch cao điểm.',
    checklist: ['Đăng kiểm, bảo hiểm và lịch bảo dưỡng.', 'Lốp, phanh, ắc quy/pin và đèn cảnh báo.', 'Điều hòa, khóa, camera và phụ kiện bàn giao.', 'Không gian ghế–cốp so với nhu cầu dự kiến.'],
    risks: ['Chỉ kiểm tra vẻ ngoài mà bỏ qua kỹ thuật.', 'Không có chìa khóa dự phòng hoặc đầu mối cứu hộ.', 'Xe điện không có kế hoạch sạc giữa các chuyến.', 'Lịch bảo dưỡng trùng thời gian đã mở xe.'],
    faq: [{ question: 'Xe cũ có thể hợp tác không?', answer: 'Cần thẩm định tình trạng và hồ sơ thực tế; đời xe không phải tiêu chí duy nhất.' }, { question: 'Xe điện có khó khai thác dịp Tết?', answer: 'Cần tính quãng đường, thời gian sạc và tuyến; phù hợp hay không phụ thuộc phương án cụ thể.' }],
    related: ['chuan-bi-xe-truoc-khi-cho-thue-tet', 'xe-nhan-roi-dip-tet-co-nen-cho-thue-khong'], audience: 'owner',
  },
  {
    title: 'Chuẩn bị xe trước khi cho thuê Tết', slug: 'chuan-bi-xe-truoc-khi-cho-thue-tet', publishedAt: '2026-11-10T18:50:00+07:00',
    excerpt: 'Checklist kỹ thuật, vệ sinh, hồ sơ, phụ kiện và bằng chứng chủ xe cần chuẩn bị trước khi bàn giao xe dịp Tết.',
    answer: 'Nên hoàn tất kiểm tra kỹ thuật, vệ sinh, hồ sơ, phụ kiện và biên bản hiện trạng trước ngày giao. Không chờ đến sát giờ mới xử lý lốp, phanh, ắc quy, pin, đèn cảnh báo hoặc giấy tờ sắp hết hạn.',
    decision: 'Chốt một mốc kiểm tra trước chuyến và để khoảng đệm cho sửa chữa. Mọi lỗi đang tồn tại phải được xử lý hoặc ghi rõ; không nên giao xe với cảnh báo mà người thuê không hiểu.',
    checklist: ['Áp suất và độ mòn lốp, lốp dự phòng/bộ vá.', 'Dầu, nước làm mát, phanh, đèn và gạt mưa.', 'Đăng ký, đăng kiểm, bảo hiểm và hướng dẫn xe.', 'Ảnh/video, km, nhiên liệu/pin, phụ kiện.'],
    risks: ['Rửa xe che mất vết xước chưa chụp trước đó.', 'Thiếu cáp sạc, thẻ ETC hoặc dụng cụ đi kèm.', 'Không ghi lỗi nhỏ dẫn tới tranh cãi khi trả.', 'Bảo dưỡng quá sát giờ nhưng chưa chạy kiểm tra.'],
    faq: [{ question: 'Có cần quay video không?', answer: 'Nên quay toàn cảnh và chụp chi tiết các vị trí dễ tranh cãi, kèm biên bản hiện trạng.' }, { question: 'Nên để bao nhiêu nhiên liệu hoặc pin?', answer: 'Theo mức hai bên thống nhất và ghi lại rõ khi giao để đối chiếu khi trả.' }],
    related: ['chu-xe-can-chuan-bi-gi-khi-ban-giao-xe-tet', 'xe-nao-phu-hop-khai-thac-dip-tet'], audience: 'owner',
  },
  {
    title: 'Phạt nguội, VETC, hư hỏng xe hợp tác xử lý thế nào?', slug: 'phat-nguoi-vetc-hu-hong-xe-hop-tac-xu-ly-the-nao', publishedAt: '2026-11-10T18:40:00+07:00',
    excerpt: 'Nguyên tắc bằng chứng và đối soát phạt nguội, VETC, hư hỏng khi xe được đưa vào hợp tác cho thuê.',
    answer: 'Cần xử lý theo hợp đồng, dữ liệu thời gian sử dụng, biên bản giao nhận, ảnh/video và chứng từ thực tế. Không nên quy trách nhiệm chỉ dựa trên thời điểm thông báo vì phạt nguội có thể xuất hiện sau khi chuyến đã kết thúc.',
    decision: 'Hợp đồng nên có thời hạn thông báo, cách giữ liên hệ với người thuê và quy trình xác minh cho từng loại chi phí. Với hư hỏng, cần so sánh hiện trạng trước–sau và chỉ sửa theo quy trình đã thống nhất, trừ trường hợp khẩn cấp bảo vệ người và tài sản.',
    checklist: ['Mốc giờ nhận–trả và người lái đã xác nhận.', 'Ảnh/video trước–sau, km và dữ liệu hành trình hợp pháp.', 'Sao kê VETC, thông báo vi phạm hoặc hóa đơn sửa chữa.', 'Tin nhắn về sự cố và hướng dẫn đã được chấp thuận.'],
    risks: ['Đối soát VETC chỉ bằng số dư đầu–cuối.', 'Sửa xe trước khi các bên ghi nhận tình trạng.', 'Không giữ liên hệ đủ lâu để xử lý phạt nguội.', 'Gộp hao mòn tự nhiên với hư hỏng do sự kiện cụ thể.'],
    faq: [{ question: 'Phạt nguội đến muộn thì sao?', answer: 'Áp dụng quy trình và thời hạn đã thỏa thuận, đối chiếu thời gian vi phạm với lịch người thuê sử dụng xe.' }, { question: 'Ai quyết định nơi sửa xe?', answer: 'Phải theo hợp đồng và xác nhận của các bên; trường hợp khẩn cấp cần ưu tiên an toàn và giữ chứng từ.' }],
    related: ['hop-dong-hop-tac-cho-thue-xe-can-dieu-khoan-gi', 'cho-thue-xe-ca-nhan-ngay-tet-co-an-toan-khong'], audience: 'owner',
  },
  {
    title: 'Chủ xe cần chuẩn bị gì khi bàn giao xe Tết?', slug: 'chu-xe-can-chuan-bi-gi-khi-ban-giao-xe-tet', publishedAt: '2026-11-10T18:30:00+07:00',
    excerpt: 'Quy trình bàn giao xe Tết: người nhận, giấy tờ, hiện trạng, phụ kiện, hướng dẫn và xác nhận cuối cùng.',
    answer: 'Chủ xe cần chuẩn bị xe đúng tình trạng đã thống nhất, hồ sơ và phụ kiện đầy đủ, biên bản hiện trạng, ảnh/video và hướng dẫn các điểm đặc thù của xe. Chỉ giao chìa khóa cho đúng người đã được xác nhận.',
    decision: 'Dành đủ thời gian để đối chiếu thay vì giao vội. Nếu người nhận, lịch hoặc tuyến khác thông tin đã duyệt, dừng bàn giao và yêu cầu xác nhận mới trước khi xe rời điểm giao.',
    checklist: ['Đối chiếu người nhận và người được phép lái.', 'Ghi km, nhiên liệu/pin, VETC và cảnh báo.', 'Kiểm đủ chìa khóa, giấy tờ, cáp sạc, dụng cụ.', 'Ký/xác nhận biên bản và đầu mối hỗ trợ.'],
    risks: ['Giao cho người đến thay nhưng chưa được khai báo.', 'Không thử khóa, camera hoặc các tính năng chính.', 'Bỏ qua vết xước nhỏ vì nghĩ không đáng kể.', 'Không thống nhất cách liên hệ khi xe có cảnh báo.'],
    faq: [{ question: 'Bàn giao ở sảnh có cần biên bản không?', answer: 'Có. Địa điểm thuận tiện không làm giảm nhu cầu ghi nhận người nhận và hiện trạng.' }, { question: 'Có nên giữ bản chụp giấy tờ người thuê?', answer: 'Việc thu thập và lưu trữ phải theo quy trình hợp pháp, đúng mục đích và phạm vi cần thiết.' }],
    related: ['chuan-bi-xe-truoc-khi-cho-thue-tet', 'hop-tac-chu-xe-cho-thue-tet-can-gi'], audience: 'owner',
  },
];

const customerPosts = [
  {
    title: 'Thuê xe tự lái Tết 2027 nên đặt trước bao lâu?', slug: 'thue-xe-tu-lai-tet-2027-nen-dat-truoc-bao-lau', publishedAt: '2026-11-10T18:20:00+07:00',
    excerpt: 'Mốc chuẩn bị thuê xe Tết 2027 theo độ chắc chắn của lịch, loại xe, số người và hành lý.',
    answer: 'Nên bắt đầu tìm xe ngay khi ngày đi, số người và tuyến đã tương đối chắc chắn; xe 7 chỗ, xe có cốp lớn hoặc lịch dài nên kiểm tra sớm hơn. Không có một số ngày cố định bảo đảm còn xe, vì khả dụng phụ thuộc từng mẫu và khoảng thuê.',
    decision: 'Đừng chỉ hỏi “còn xe không”. Hãy gửi đủ lịch, số người, hành lý và tuyến để nhận phương án đúng; sau đó đọc điều kiện đổi/hủy trước khi đặt cọc. Nếu lịch chưa chắc, hỏi rõ mức linh hoạt thay vì chốt một booking khó thay đổi.',
    checklist: ['Ngày và giờ nhận–trả dự kiến.', 'Số người lớn, trẻ em và người lái.', 'Số vali lớn, xe đẩy hoặc đồ cồng kềnh.', 'Điểm đến, quãng đường và khu vực nhận xe.'],
    risks: ['Chờ đủ mọi chi tiết mới bắt đầu kiểm tra xe.', 'Chọn xe theo ảnh mà không đối chiếu hành lý.', 'Chuyển cọc khi chưa có điều kiện đổi/hủy.', 'Mặc định giá ngày thường áp dụng cho cao điểm.'],
    faq: [{ question: 'Đặt sớm có chắc chắn rẻ hơn không?', answer: 'Không nên mặc định. Lợi ích chính của việc kiểm tra sớm là có thêm lựa chọn và thời gian đọc điều kiện.' }, { question: 'Lịch chưa chốt có nên hỏi xe?', answer: 'Có thể hỏi phương án, nhưng cần nói rõ mức độ linh hoạt và chỉ đặt khi hiểu điều kiện thay đổi.' }],
    related: ['goi-thue-xe-tet-7-ngay-hay-10-ngay', 'thue-xe-tet-ha-noi-di-tinh-can-bao-truoc-gi'], audience: 'customer',
  },
  {
    title: 'Gói thuê xe Tết 7 ngày hay 10 ngày?', slug: 'goi-thue-xe-tet-7-ngay-hay-10-ngay', publishedAt: '2026-11-10T18:10:00+07:00',
    excerpt: 'Cách so sánh kỳ thuê 7 ngày và 10 ngày theo lịch thực tế, giờ nhận trả, tổng km và điều kiện thay đổi.',
    answer: 'Chọn theo khoảng thời gian thực sự cần xe và khoảng đệm hợp lý, không chọn chỉ vì tên gói. So sánh tổng tiền, giờ nhận–trả, km, phí trả muộn và khả năng gia hạn của đúng báo giá.',
    decision: 'Lập lịch theo ngày giờ: đi, về, thăm họ hàng và ngày dự phòng. Nếu 7 ngày khiến giờ trả quá sát hoặc có nguy cơ gia hạn đắt và không còn xe, phương án dài hơn có thể dễ vận hành; nếu xe nằm im nhiều ngày, kỳ ngắn hơn hợp lý hơn.',
    checklist: ['Ngày giờ xe bắt đầu thực sự cần dùng.', 'Ngày giờ có thể trả an toàn sau hành trình.', 'Tổng km và số ngày xe ít sử dụng.', 'Giá tổng, điều kiện gia hạn và trả sớm.'],
    risks: ['So sánh đơn giá/ngày nhưng bỏ qua tổng tiền.', 'Không tính thời gian kẹt xe ngày về.', 'Mặc định có thể gia hạn sát giờ.', 'Thuê dài hơn nhưng không hỏi giới hạn km tổng.'],
    faq: [{ question: 'Trả sớm có được hoàn tiền không?', answer: 'Phụ thuộc điều kiện booking; cần hỏi và nhận xác nhận trước khi đặt.' }, { question: 'Gia hạn một ngày có dễ không?', answer: 'Không chắc, vì xe có thể đã có lịch tiếp theo. Hãy báo sớm và chờ xác nhận.' }],
    related: ['thue-xe-tu-lai-tet-2027-nen-dat-truoc-bao-lau', 'nhan-tra-xe-tu-lai-dip-tet-can-luu-y-gi'], audience: 'customer',
  },
  {
    title: 'Thuê xe về quê ăn Tết nên chọn xe nào?', slug: 'thue-xe-ve-que-an-tet-nen-chon-xe-nao', publishedAt: '2026-11-10T18:00:00+07:00',
    excerpt: 'Chọn xe về quê ăn Tết theo số người, hành lý, quãng đường, loại đường và kinh nghiệm người lái.',
    answer: 'Chọn xe theo số người cộng với hành lý và tuyến thực tế. Xe 5 chỗ phù hợp nhóm nhỏ, hành lý gọn; xe 7 chỗ phù hợp nhóm đông hơn nhưng phải kiểm tra cốp khi dùng đủ hàng ghế. Người lái nên ưu tiên mẫu xe quen điều khiển.',
    decision: 'Lập danh sách người và hành lý trước, sau đó kiểm tra không gian cốp, ghế trẻ em, quãng đường và loại đường. Không nâng hạng chỉ vì “xe to tốt hơn” nếu người lái không quen kích thước hoặc điểm đỗ ở quê hạn chế.',
    checklist: ['Số người ngồi thực tế ở từng chặng.', 'Vali, quà Tết, xe đẩy và ghế trẻ em.', 'Đường cao tốc, quốc lộ, đèo hoặc đường làng.', 'Nhiên liệu/sạc, điểm dừng và người lái thay.'],
    risks: ['Dùng đủ 7 ghế rồi mới phát hiện cốp không đủ.', 'Xếp hành lý che kính hoặc không cố định.', 'Chọn xe điện nhưng không kiểm tra điểm sạc.', 'Chọn xe quá lớn so với kỹ năng và chỗ đỗ.'],
    faq: [{ question: '5 người có nên thuê xe 7 chỗ?', answer: 'Có thể hợp lý khi nhiều hành lý, nhưng cần kiểm tra cấu hình ghế–cốp và tổng chi phí.' }, { question: 'Đi đường đèo cần ưu tiên gì?', answer: 'Ưu tiên tình trạng xe tốt, người lái quen, lốp/phanh đảm bảo và lịch dừng nghỉ hợp lý.' }],
    related: ['thue-xe-tet-cho-gia-dinh-5-7-nguoi', 'thue-xe-tet-co-nhieu-hanh-ly-chon-xe-nao'], audience: 'customer',
  },
  {
    title: 'Thuê xe Tết cho gia đình 5–7 người', slug: 'thue-xe-tet-cho-gia-dinh-5-7-nguoi', publishedAt: '2026-11-10T17:50:00+07:00',
    excerpt: 'Cách chọn xe 7 chỗ dịp Tết cho gia đình 5–7 người dựa trên ghế, cốp, trẻ em và hành trình.',
    answer: 'Gia đình 5–7 người thường nên so sánh xe 7 chỗ, nhưng cần xem không gian khi dùng hàng ghế ba và số vali thực tế. Với 7 người cùng nhiều hành lý, số ghế trên giấy chưa đủ để kết luận xe phù hợp.',
    decision: 'Yêu cầu ảnh hoặc thông tin cấu hình ghế–cốp của đúng mẫu xe. Tính cả ghế trẻ em, người lớn tuổi và nhu cầu lên xuống; một xe rộng hơn có thể giảm mệt mỏi trên chuyến dài nhưng phải phù hợp người lái.',
    checklist: ['Tuổi và thể trạng của từng hành khách.', 'Số ghế trẻ em hoặc người cần hỗ trợ.', 'Vali lớn, túi mềm và quà mang theo.', 'Số chặng dài, người lái và chỗ đỗ.'],
    risks: ['Để người lớn ngồi hàng ba quá lâu mà không dừng.', 'Không thử cách xếp hành lý trước chuyến.', 'Chỉ nhìn “7 chỗ” mà bỏ qua tải và cốp.', 'Không hỏi phụ kiện ghế trẻ em có sẵn hay không.'],
    faq: [{ question: 'Xe 7 chỗ nào cũng chở 7 người và vali như nhau?', answer: 'Không. Kích thước hàng ghế ba và cốp khác nhau đáng kể giữa các mẫu.' }, { question: 'Có nên gập một ghế để tăng cốp?', answer: 'Chỉ khi vẫn đủ chỗ ngồi hợp pháp, an toàn cho toàn bộ hành khách.' }],
    related: ['thue-xe-ve-que-an-tet-nen-chon-xe-nao', 'thue-xe-tet-co-nhieu-hanh-ly-chon-xe-nao'], audience: 'customer',
  },
  {
    title: 'Thuê xe Tết có nhiều hành lý chọn xe nào?', slug: 'thue-xe-tet-co-nhieu-hanh-ly-chon-xe-nao', publishedAt: '2026-11-10T17:40:00+07:00',
    excerpt: 'Chọn xe Tết khi có nhiều vali và quà: đo hành lý, kiểm tra cốp, ghế và cách xếp an toàn.',
    answer: 'Hãy đếm và ước lượng kích thước hành lý trước khi chọn xe. Nhóm ít người nhưng nhiều vali có thể cần xe cốp lớn; nhóm 7 người không nên mặc định một xe 7 chỗ vẫn đủ chỗ cho toàn bộ hành lý.',
    decision: 'Gửi số vali lớn, túi xách, xe đẩy và đồ cồng kềnh cho Car Match. Ưu tiên xếp hành lý trong cốp, dưới tấm che và được cố định; không để đồ nặng tự do trong khoang hành khách.',
    checklist: ['Số vali theo cỡ cabin/lớn.', 'Túi mềm, thùng quà và đồ dễ vỡ.', 'Ghế trẻ em, xe đẩy hoặc thiết bị y tế.', 'Khả năng gập ghế mà vẫn đủ chỗ ngồi.'],
    risks: ['Xếp đồ cao che kính sau.', 'Đặt vật nặng trên ghế không cố định.', 'Đến giờ nhận mới mang thêm hành lý.', 'Gập ghế làm thiếu vị trí ngồi an toàn.'],
    faq: [{ question: 'Có thể buộc đồ trên nóc xe không?', answer: 'Không tự ý. Cần đúng giá nóc, giới hạn tải, cách cố định và được xác nhận cho đúng xe.' }, { question: 'Túi mềm có giúp tiết kiệm chỗ không?', answer: 'Thường linh hoạt hơn vali cứng, nhưng vẫn phải xếp chắc chắn và không che tầm nhìn.' }],
    related: ['thue-xe-tet-cho-gia-dinh-5-7-nguoi', 'thue-xe-ve-que-an-tet-nen-chon-xe-nao'], audience: 'customer',
  },
  {
    title: 'Thuê xe điện đi Tết có phù hợp không?', slug: 'thue-xe-dien-di-tet-co-phu-hop-khong', publishedAt: '2026-11-10T17:30:00+07:00',
    excerpt: 'Cách quyết định thuê xe điện đi Tết theo quãng đường, điểm sạc, thời gian dừng và phương án dự phòng.',
    answer: 'Phù hợp khi quãng đường, điểm sạc và thời gian dừng được lên kế hoạch, người lái hiểu cách sử dụng xe và có phương án dự phòng. Không nên chọn chỉ dựa trên tầm hoạt động quảng cáo hoặc giả định mọi trạm sạc đều trống.',
    decision: 'Tính phạm vi theo xe thực tế, tải, tốc độ, thời tiết và điều hòa; lập điểm sạc chính và dự phòng. Với lịch di chuyển dày hoặc tuyến xa nơi sạc, xe xăng có thể đơn giản hơn dù chi phí năng lượng khác.',
    checklist: ['Dung lượng/tầm hoạt động hiển thị khi nhận.', 'Ứng dụng, cổng sạc và cáp đi kèm.', 'Điểm sạc chính, dự phòng và thời gian chờ.', 'Kế hoạch nếu trạm lỗi, đông hoặc tuyến thay đổi.'],
    risks: ['Dựa vào con số quảng cáo thay vì xe thực tế.', 'Đến trạm với mức pin quá thấp và không có dự phòng.', 'Không tính thời gian chờ trong lịch Tết.', 'Trả xe sai mức pin đã thỏa thuận.'],
    faq: [{ question: 'Đi tỉnh bằng xe điện có được không?', answer: 'Có thể nếu đúng xe được chấp thuận cho tuyến và kế hoạch sạc khả thi.' }, { question: 'Ai trả phí sạc?', answer: 'Theo điều kiện booking; cần xác nhận cách ghi nhận và mức pin khi nhận–trả.' }],
    related: ['thue-xe-tet-ha-noi-di-tinh-can-bao-truoc-gi', 'nhan-tra-xe-tu-lai-dip-tet-can-luu-y-gi'], audience: 'customer',
  },
  {
    title: 'Nhận trả xe tự lái dịp Tết cần lưu ý gì?', slug: 'nhan-tra-xe-tu-lai-dip-tet-can-luu-y-gi', publishedAt: '2026-11-10T17:20:00+07:00',
    excerpt: 'Checklist nhận trả xe Tết: người lái, ảnh hiện trạng, km, nhiên liệu/pin, VETC, giờ và xác nhận bàn giao.',
    answer: 'Dành đủ thời gian đối chiếu người lái, giấy tờ, hiện trạng, km, nhiên liệu/pin, VETC và phụ kiện. Khi trả, chụp lại cùng các góc và giữ xác nhận thời điểm, địa điểm, tình trạng đã bàn giao.',
    decision: 'Không nhận xe vội vì đông hoặc muộn. Nếu xe khác thông tin, có cảnh báo hoặc vết xước chưa ghi, báo ngay trước khi rời điểm giao. Khi trả, đến sớm để tránh tranh cãi về giờ và có thời gian kiểm tra chung.',
    checklist: ['Ảnh bốn góc, cản, kính, mâm/lốp và nội thất.', 'Đồng hồ km, nhiên liệu/pin và đèn cảnh báo.', 'Chìa khóa, giấy tờ, VETC, cáp sạc, dụng cụ.', 'Tin nhắn/biên bản xác nhận nhận và trả.'],
    risks: ['Chụp ảnh tối hoặc thiếu chi tiết.', 'Không lái thử ngắn trước khi đi xa.', 'Trả xe không có người/không có xác nhận.', 'Xóa ảnh trước khi hoàn tất đối soát.'],
    faq: [{ question: 'Nhận xe ban đêm có được không?', answer: 'Phụ thuộc xác nhận booking; cần nơi đủ sáng để kiểm tra và ghi nhận tình trạng.' }, { question: 'Có cần chụp cả nội thất?', answer: 'Có, gồm ghế, taplo, trần, khoang hành lý và phụ kiện có thể đối soát.' }],
    related: ['goi-thue-xe-tet-7-ngay-hay-10-ngay', 'thue-xe-tet-ha-noi-di-tinh-can-bao-truoc-gi'], audience: 'customer',
  },
  {
    title: 'Thuê xe Tết Hà Nội đi tỉnh cần báo trước gì?', slug: 'thue-xe-tet-ha-noi-di-tinh-can-bao-truoc-gi', publishedAt: '2026-11-10T17:10:00+07:00',
    excerpt: 'Thông tin tuyến, km, người lái, VETC, sạc/nhiên liệu và cứu hộ cần báo khi thuê xe Tết từ Hà Nội đi tỉnh.',
    answer: 'Cần báo điểm đến, tuyến chính, ngày giờ, tổng km dự kiến, số người lái và các đoạn đèo, phà hoặc đường đặc biệt. Chỉ đi khi đúng xe và phạm vi sử dụng đã được xác nhận.',
    decision: 'Gửi lịch trình đủ cụ thể để kiểm tra giới hạn km, bảo dưỡng, VETC, nhiên liệu/sạc và hỗ trợ khi xa Hà Nội. Nếu đổi tuyến đáng kể trong chuyến, báo lại trước thay vì chờ tới lúc trả xe.',
    checklist: ['Tỉnh/thành, điểm dừng và tuyến dự kiến.', 'Tổng km, số ngày và người lái thay.', 'Đèo, phà, đường xấu hoặc khu vực hạn chế.', 'Điểm sạc/nạp, VETC và đầu mối hỗ trợ.'],
    risks: ['Chỉ nói “đi tỉnh” mà không nêu điểm đến.', 'Tự đổi tuyến dài hơn hoặc khó hơn.', 'Không hỏi phạm vi cứu hộ và xử lý lốp.', 'Không dự phòng giờ về khi đường đông.'],
    faq: [{ question: 'Tuyến phổ biến có cần báo không?', answer: 'Có. Mỗi xe và booking có điều kiện riêng, nên vẫn phải xác nhận đúng tuyến.' }, { question: 'Có thể thêm điểm đến giữa chuyến?', answer: 'Nên cập nhật và chờ chấp thuận nếu làm thay đổi đáng kể km, thời gian hoặc loại đường.' }],
    related: ['thue-xe-dien-di-tet-co-phu-hop-khong', 'thue-xe-tu-lai-tet-2027-nen-dat-truoc-bao-lau'], audience: 'customer',
  },
];

export function createTet2027Posts(config) {
  return [...ownerPosts, ...customerPosts].map((item) => createTetPost(item, config));
}
