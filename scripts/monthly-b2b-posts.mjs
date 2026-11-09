function list(items, tag = 'ul') {
  return `<${tag}>${items.map((item) => `<li>${item}</li>`).join('')}</${tag}>`;
}

function comparisonTable(rows) {
  return `<div class="table-wrap"><table><thead><tr><th>Tiêu chí</th><th>Cần xác nhận</th><th>Cách ra quyết định</th></tr></thead><tbody>${rows.map((row) => `<tr><td>${row.criterion}</td><td>${row.confirm}</td><td>${row.decision}</td></tr>`).join('')}</tbody></table></div>`;
}

function createPost({
  id,
  title,
  slug,
  publishedAt,
  excerpt,
  category,
  directAnswer,
  audience,
  decisionQuestion,
  decisionAnswer,
  comparisonRows,
  quoteChecklist,
  workflow,
  contractChecks,
  risks,
  scenario,
  faq,
  sourceNote = '',
  seoTitle,
  seoDescription,
  relatedPostSlugs,
  siteUrl,
  brandSocialImage,
}) {
  const relatedLinks = relatedPostSlugs
    .slice(0, 3)
    .map((relatedSlug) => `<a href="/blog/${relatedSlug}">${relatedSlug.replaceAll('-', ' ')}</a>`)
    .join(', ');

  const bodyHtml = `<p><strong>Câu trả lời ngắn:</strong> ${directAnswer}</p>
    <p>Bài này dành cho ${audience}. Với thuê xe dài hạn, một mức giá tháng chỉ có ý nghĩa khi đi cùng đúng mẫu xe, thời hạn sử dụng, số ngày được giữ xe, giới hạn km, người lái, điểm giao nhận và cách xử lý bảo dưỡng. Car Match chỉ xác nhận phương án sau khi kiểm tra lịch xe thực tế; nội dung dưới đây là khung chuẩn bị và không thay thế báo giá hoặc hợp đồng của booking cụ thể.</p>
    <h2>${decisionQuestion}</h2>
    <p>${decisionAnswer}</p>
    ${comparisonTable(comparisonRows)}
    <p>Đừng so hai báo giá chỉ bằng dòng “giá/tháng”. Hãy đưa chúng về cùng phạm vi: cùng số ngày giữ xe, cùng tổng km, cùng điểm giao nhận, cùng nhóm xe và cùng trách nhiệm khi xe cần bảo dưỡng. Nếu một báo giá chưa nêu rõ khoản nào, hãy coi đó là dữ liệu còn thiếu chứ không mặc định khoản đó đã bao gồm.</p>
    <h2>Thông tin cần gửi để nhận báo giá đúng nhu cầu</h2>
    ${list(quoteChecklist)}
    <p>Thông tin càng cụ thể, phương án càng ít phải sửa. Khách có thể bắt đầu tại <a href="/thue-xe-thang">trang thuê xe theo tháng tại Hà Nội</a>, xem <a href="/xe">danh sách xe tự lái</a> rồi gửi yêu cầu qua <a href="/lien-he">kênh liên hệ Car Match</a>. Không cần chọn chính xác biển số ngay từ đầu; nhóm xe, số người, hành lý, tuyến chạy và ngân sách thường hữu ích hơn cho bước lọc ban đầu.</p>
    <h2>Quy trình nên chốt trước khi nhận xe</h2>
    ${list(workflow, 'ol')}
    <p>Khi bàn giao, hai bên nên ghi nhận ngoại thất, nội thất, mức nhiên liệu hoặc pin, số km đồng hồ, lốp, chìa khóa, giấy tờ và phụ kiện. Ảnh có mốc thời gian và biên bản ký nhận giúp tách tình trạng có trước với phát sinh trong kỳ thuê. Nếu người lái hoặc điểm sử dụng thay đổi, cần báo lại và được chấp thuận thay vì tự suy rộng từ thỏa thuận ban đầu.</p>
    <h2>Điều khoản hoặc chứng từ phải đọc kỹ</h2>
    ${list(contractChecks)}
    <p>Mọi cam kết về hóa đơn, xe thay thế, thời gian phản hồi, bảo dưỡng, hoàn cọc hoặc miễn phí phát sinh chỉ nên được xem là có hiệu lực khi đã ghi trong báo giá, phụ lục, hợp đồng hoặc xác nhận bằng văn bản cho đúng booking. Trang <a href="/chinh-sach">chính sách thuê xe</a> cung cấp nguyên tắc chung; hợp đồng đã ký và xác nhận cụ thể là căn cứ đối soát.</p>
    <h2>Rủi ro thường bị bỏ sót</h2>
    ${list(risks)}
    <p>Một gói rẻ hơn ở dòng tiền thuê có thể đắt hơn nếu thiếu km, không phù hợp lịch dùng hoặc khiến doanh nghiệp phải tự xử lý nhiều đầu việc. Ngược lại, không phải điều kiện dự phòng nào cũng cần mua thêm. Cách hợp lý là xếp hạng các rủi ro theo mức ảnh hưởng tới công việc rồi chỉ yêu cầu SLA hoặc phương án thay thế cho những tình huống thật sự quan trọng.</p>
    <h2>Ví dụ áp dụng</h2>
    <p>${scenario}</p>
    <p>Trong ví dụ này, quyết định không đến từ một con số quảng cáo mà từ phạm vi sử dụng có thể kiểm chứng. Trước khi chuyển cọc, người phụ trách nên lưu một bản báo giá cuối, danh sách người lái, lịch sử trao đổi và đầu mối xử lý sự cố. Với doanh nghiệp, nên chỉ định rõ ai được quyền yêu cầu đổi lịch, gia hạn hoặc chấp thuận chi phí.</p>
    ${sourceNote ? `<h2>Nguồn quy định cần đối chiếu</h2><p>${sourceNote}</p>` : ''}
    <h2>Câu hỏi thường gặp</h2>
    ${faq.map((item) => `<h3>${item.question}</h3><p>${item.answer}</p>`).join('')}
    <h2>Đọc tiếp để hoàn thiện phương án thuê tháng</h2>
    <p>Các hướng dẫn liên quan: ${relatedLinks}. Nếu câu hỏi thuộc giấy tờ, đặt cọc hoặc bàn giao, xem thêm <a href="/faq">FAQ thuê xe</a>. Khi cần báo giá, hãy gửi thời hạn, số km dự kiến, khu vực nhận xe và yêu cầu chứng từ ngay từ tin nhắn đầu tiên để Car Match kiểm tra đúng phạm vi.</p>`;

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
    ctaTitle: 'Cần phương án thuê xe tháng theo nhu cầu thật?',
    ctaDescription: 'Gửi số xe, thời hạn, km dự kiến, khu vực nhận xe và yêu cầu chứng từ để Car Match kiểm tra lịch xe cùng điều kiện phù hợp.',
    ctaPrimaryLabel: 'Xem gói thuê xe tháng',
    ctaPrimaryUrl: '/thue-xe-thang',
    ctaZaloLabel: 'Nhắn Zalo nhận báo giá',
    ctaZaloUrl: 'https://zalo.me/0971163290',
    relatedDestinationSlugs: [],
    relatedVehicleLinks: [],
    relatedPostSlugs,
  };
}

export function createMonthlyB2bPosts({ siteUrl, brandSocialImage }) {
  const shared = { siteUrl, brandSocialImage };

  return [
    createPost({
      id: 'static-monthly-b2b-small-business',
      title: 'Thuê xe tháng cho doanh nghiệp nhỏ: cần tính những gì?',
      slug: 'thue-xe-thang-cho-doanh-nghiep-nho',
      publishedAt: '2026-11-09T18:40:00+07:00',
      excerpt: 'Khung chọn xe tháng cho doanh nghiệp nhỏ theo số ngày dùng, km, người lái, chứng từ, bảo dưỡng và tổng chi phí thay vì chỉ nhìn giá thuê.',
      category: 'Thuê xe doanh nghiệp',
      directAnswer: 'Doanh nghiệp nhỏ nên thuê xe tháng khi nhu cầu có thời hạn, cần giữ vốn hoặc chưa muốn sở hữu xe. Trước khi ký, hãy chuẩn hóa năm biến: số ngày cần giữ xe, km dự kiến, danh sách người lái, yêu cầu chứng từ và mức gián đoạn chấp nhận được khi bảo dưỡng. Sau đó mới so tổng chi phí giữa các phương án.',
      audience: 'chủ doanh nghiệp nhỏ, người phụ trách hành chính hoặc đội bán hàng cần một đến vài xe tại Hà Nội',
      decisionQuestion: 'Doanh nghiệp nhỏ có nên thuê xe theo tháng không?',
      decisionAnswer: 'Thuê tháng phù hợp khi xe phục vụ một dự án, đội sales, đi công tác hoặc tiếp khách trong vài tháng và doanh nghiệp muốn chi phí dễ dự trù. Mua xe phù hợp hơn khi nhu cầu ổn định nhiều năm, có nơi đỗ và sẵn sàng quản lý tài sản. Thuê ngày phù hợp khi lịch dùng rời rạc. Hãy tính chi phí trên mỗi ngày xe thực sự tạo giá trị, không chỉ chia giá thuê cho 30 ngày.',
      comparisonRows: [
        { criterion: 'Tần suất dùng', confirm: 'Số ngày và khung giờ xe phải sẵn sàng', decision: 'Dùng đều nhiều ngày có thể phù hợp gói tháng; dùng ít nên so thuê ngày.' },
        { criterion: 'Dòng tiền', confirm: 'Cọc, kỳ thanh toán và chi phí vận hành', decision: 'So với tiền mua/trả trước và chi phí sở hữu, không chỉ giá thuê.' },
        { criterion: 'Quản trị', confirm: 'Ai nhận xe, giữ chìa, duyệt phát sinh', decision: 'Chọn một đầu mối nội bộ để tránh yêu cầu mâu thuẫn.' },
        { criterion: 'Gián đoạn', confirm: 'Lịch bảo dưỡng và phương án khi xe dừng', decision: 'Chỉ yêu cầu SLA xe thay thế nếu công việc thật sự không thể dừng.' },
      ],
      quoteChecklist: ['Số lượng xe và nhóm xe 5 chỗ, 7 chỗ hoặc xe điện.', 'Ngày bắt đầu, số tháng dự kiến và số ngày cần giữ xe mỗi tháng.', 'Tổng km, tuyến nội thành/đi tỉnh và nơi đỗ qua đêm.', 'Danh sách hoặc nhóm người lái được doanh nghiệp cho phép.', 'Thông tin pháp nhân, nhu cầu hợp đồng, thanh toán và hóa đơn.', 'Mức ưu tiên cho xe thay thế, bảo dưỡng và đầu mối hỗ trợ.'],
      workflow: ['Lập bảng nhu cầu theo từng đội hoặc dự án.', 'Nhận phương án xe và chuẩn hóa phạm vi giữa các báo giá.', 'Kiểm tra lịch xe, giấy tờ, km, cọc và chứng từ.', 'Thống nhất người ký, người nhận xe và người duyệt phát sinh.', 'Bàn giao có ảnh, số km và danh mục phụ kiện.', 'Đối soát định kỳ theo một biểu mẫu thống nhất.'],
      contractChecks: ['Chủ thể ký và người được phép lái xe.', 'Thời hạn, gia hạn, trả sớm và kỳ thanh toán.', 'Km đã gồm, cách ghi nhận đồng hồ và đơn giá vượt km.', 'Bảo dưỡng, hao mòn, hư hỏng và thời gian xe dừng.', 'Hóa đơn/chứng từ, thời điểm xuất và thông tin người mua.', 'Phạt nguội, VETC, nhiên liệu/pin và quy trình kết thúc hợp đồng.'],
      risks: ['Thuê xe lớn hơn nhu cầu chỉ để “phòng khi cần”.', 'Không tách chi phí xe khỏi xăng/sạc, cầu đường và đỗ xe.', 'Nhiều nhân viên tự liên hệ làm thay đổi lịch hoặc chi phí.', 'Tin rằng thuê tháng mặc định có xe thay thế tương đương ngay lập tức.'],
      scenario: 'Một công ty sáu người cần xe cho đội sales ba tháng. Xe chạy nội thành bốn ngày/tuần và đi tỉnh hai chuyến/tháng. Phương án phù hợp phải ghi số ngày giữ xe, km đủ cho lịch này, hai người lái được chấp thuận và cách xử lý ngày bảo dưỡng. Nếu chỉ so giá tháng, công ty có thể chọn nhầm gói ít km hoặc phải trả cho nhiều ngày xe không dùng.',
      faq: [{ question: 'Doanh nghiệp nhỏ có phải thuê nhiều xe mới được báo giá?', answer: 'Không nên mặc định. Một xe vẫn có thể là nhu cầu doanh nghiệp; hãy gửi thời hạn, km và chứng từ cần thiết để kiểm tra phương án.' }, { question: 'Có thể đổi nhóm xe giữa các kỳ không?', answer: 'Có thể đề nghị, nhưng phụ thuộc lịch xe và thỏa thuận cho kỳ tiếp theo. Không tự coi quyền đổi xe là mặc định nếu hợp đồng chưa ghi.' }],
      seoTitle: 'Thuê Xe Tháng Cho Doanh Nghiệp Nhỏ',
      seoDescription: 'Cách doanh nghiệp nhỏ chọn xe tháng theo số ngày dùng, km, chứng từ, người lái, bảo dưỡng và tổng chi phí cần kiểm soát.',
      relatedPostSlugs: ['goi-thue-xe-22-ngay-va-30-ngay-khac-gi-nhau', 'thue-xe-thang-co-xuat-hoa-don-khong', 'hop-dong-thue-xe-thang-can-dieu-khoan-gi'],
      ...shared,
    }),
    createPost({
      id: 'static-monthly-b2b-foreign-expert',
      title: 'Thuê xe tháng cho chuyên gia nước ngoài cần chuẩn bị gì?',
      slug: 'thue-xe-thang-cho-chuyen-gia-nuoc-ngoai',
      publishedAt: '2026-11-09T18:30:00+07:00',
      excerpt: 'Checklist cho chuyên gia nước ngoài thuê xe tháng: người ký, người lái, giấy phép phù hợp, điểm giao nhận, ngôn ngữ bàn giao và đầu mối doanh nghiệp.',
      category: 'Thuê xe doanh nghiệp',
      directAnswer: 'Doanh nghiệp cần tách rõ người ký hợp đồng, người trực tiếp lái và người phụ trách thanh toán. Trước khi giữ xe, Car Match cần kiểm tra giấy tờ nhận dạng và giấy phép lái xe có giá trị sử dụng tại Việt Nam của từng người lái; không nên mặc định bằng lái nước ngoài hoặc giấy phép quốc tế nào cũng được chấp nhận.',
      audience: 'chuyên gia nước ngoài, bộ phận HR/Admin và doanh nghiệp bố trí phương tiện làm việc tại Hà Nội',
      decisionQuestion: 'Nên để chuyên gia tự ký hay doanh nghiệp đứng tên?',
      decisionAnswer: 'Doanh nghiệp đứng tên có thể thuận tiện cho phê duyệt, chứng từ và quản lý nhiều người dùng; cá nhân đứng tên có thể đơn giản hơn khi chỉ một người sử dụng và tự thanh toán. Dù chọn cách nào, người trực tiếp lái phải được ghi nhận và giấy phép phải được kiểm tra trước. Người ký không tự động trở thành người lái hợp lệ, và đồng nghiệp không có tên không nên tự nhận xe.',
      comparisonRows: [
        { criterion: 'Chủ thể hợp đồng', confirm: 'Cá nhân hay pháp nhân, ai chịu thanh toán', decision: 'Chọn theo quy trình nội bộ và nhu cầu chứng từ.' },
        { criterion: 'Người lái', confirm: 'Danh sách người trực tiếp sử dụng xe', decision: 'Chỉ bàn giao khi từng người được chấp thuận.' },
        { criterion: 'Giấy phép', confirm: 'Loại giấy phép, quốc gia cấp, thời hạn và bản gốc', decision: 'Kiểm tra giá trị sử dụng tại Việt Nam trước khi cọc.' },
        { criterion: 'Bàn giao', confirm: 'Ngôn ngữ, địa điểm và người hỗ trợ', decision: 'Dùng checklist song ngữ nếu người lái không đọc tốt tiếng Việt.' },
      ],
      quoteChecklist: ['Quốc tịch, giấy tờ nhận dạng và thời hạn lưu trú liên quan.', 'Ảnh hai mặt giấy phép lái xe và bản gốc để đối chiếu khi nhận xe.', 'Tên tất cả người dự kiến lái trong thời gian thuê.', 'Đơn vị đứng tên hợp đồng và thông tin xuất chứng từ.', 'Địa chỉ ở/làm việc, điểm nhận xe và nơi đỗ qua đêm.', 'Tuyến đi tỉnh, km dự kiến và ngôn ngữ cần hỗ trợ khi bàn giao.'],
      workflow: ['HR/Admin gửi hồ sơ sơ bộ của người ký và người lái.', 'Car Match kiểm tra phạm vi giấy tờ trước khi xác nhận xe.', 'Hai bên chốt báo giá, người lái, km và điểm giao nhận.', 'Chuẩn bị checklist bàn giao dễ hiểu cho người sử dụng.', 'Đối chiếu bản gốc, chụp tình trạng xe và ký nhận.', 'Lưu đầu mối hỗ trợ cho sự cố, phạt nguội và gia hạn.'],
      contractChecks: ['Tên pháp nhân/cá nhân và người đại diện ký.', 'Danh sách người lái được chấp thuận, không chỉ người thanh toán.', 'Ngôn ngữ ưu tiên của hợp đồng hoặc bản giải thích.', 'Phạm vi đi tỉnh, VETC, phạt nguội và liên hệ khẩn cấp.', 'Quy trình khi giấy phép/hộ chiếu hết hạn trong kỳ thuê.', 'Điều kiện đổi người lái hoặc chuyển địa điểm sử dụng.'],
      risks: ['Chỉ kiểm tra hộ chiếu mà bỏ qua giá trị sử dụng của giấy phép lái xe.', 'Dùng bản dịch hoặc ảnh chụp như bản gốc mà chưa được xác nhận.', 'Cho đồng nghiệp khác lái vì cùng một doanh nghiệp.', 'Bàn giao hoàn toàn bằng tiếng Việt khi người dùng chưa hiểu trách nhiệm.'],
      scenario: 'Một chuyên gia làm việc sáu tháng, công ty thanh toán nhưng chuyên gia trực tiếp lái. Hồ sơ nên ghi công ty là bên thanh toán/người ký nếu phù hợp, đồng thời ghi chuyên gia là người lái đã được kiểm tra giấy phép. Nếu vợ/chồng hoặc đồng nghiệp cũng cần lái, phải khai báo từ đầu thay vì bổ sung sau khi đã nhận xe.',
      sourceNote: 'Giá trị sử dụng giấy phép lái xe cần đối chiếu theo <a href="https://vanban.chinhphu.vn/?classid=2629&docid=217295&pageid=27160">Văn bản hợp nhất 55/VBHN-VPQH về trật tự, an toàn giao thông đường bộ</a> và quy định cấp, sử dụng giấy phép lái xe quốc tế hiện hành. Bài không thay thế tư vấn pháp lý hoặc kiểm tra hồ sơ gốc.',
      faq: [{ question: 'Chỉ có giấy phép lái xe nước ngoài có thuê được không?', answer: 'Không thể kết luận chỉ từ tên giấy phép. Cần kiểm tra quốc gia cấp, loại giấy phép, thời hạn, giấy phép quốc tế hoặc thủ tục liên quan và hồ sơ gốc.' }, { question: 'Công ty ký thì bất kỳ nhân viên nào cũng được lái?', answer: 'Không. Danh sách người lái vẫn phải được Car Match chấp thuận và ghi nhận theo booking/hợp đồng.' }],
      seoTitle: 'Thuê Xe Tháng Cho Chuyên Gia Nước Ngoài',
      seoDescription: 'Checklist thuê xe tháng cho chuyên gia nước ngoài: người ký, người lái, giấy phép, bàn giao, km và chứng từ doanh nghiệp.',
      relatedPostSlugs: ['nguoi-nuoc-ngoai-thue-xe-tu-lai-can-giay-to-gi', 'co-duoc-cho-nguoi-khac-lai-xe-thue-khong', 'hop-dong-thue-xe-thang-can-dieu-khoan-gi'],
      ...shared,
    }),
    createPost({
      id: 'static-monthly-b2b-business-travel',
      title: 'Thuê xe tháng cho nhân viên đi công tác: cách quản lý chi phí',
      slug: 'thue-xe-thang-cho-nhan-vien-di-cong-tac',
      publishedAt: '2026-11-09T18:20:00+07:00',
      excerpt: 'Cách thiết kế gói xe tháng cho nhân viên công tác theo lịch chạy, km, người lái, phê duyệt chuyến, VETC và đối soát cuối kỳ.',
      category: 'Thuê xe doanh nghiệp',
      directAnswer: 'Gói xe tháng cho nhân viên công tác nên bắt đầu từ lịch chạy và quy tắc sử dụng nội bộ, không bắt đầu từ mẫu xe. Doanh nghiệp cần ước lượng km, xác định ai được lái, tuyến nào cần duyệt, khoản nào nhân viên tự trả và cách đối soát VETC, nhiên liệu, đỗ xe, phạt nguội trước khi chọn gói.',
      audience: 'doanh nghiệp có nhân viên sales, kỹ thuật, khảo sát hoặc quản lý dự án phải di chuyển thường xuyên',
      decisionQuestion: 'Khi nào xe tháng phù hợp hơn thanh toán từng chuyến?',
      decisionAnswer: 'Xe tháng phù hợp khi nhiều chuyến phát sinh đều đặn, cần chủ động giờ đi và một nhóm người lái ổn định. Taxi hoặc thuê ngày có thể hợp lý hơn nếu chuyến ít và lịch rời rạc. Hãy so tổng chi phí trên mỗi chuyến hoàn thành, thời gian nhân viên chờ xe và khối lượng quản trị hóa đơn, không chỉ so giá/km.',
      comparisonRows: [
        { criterion: 'Lịch công tác', confirm: 'Số chuyến, ngày dùng và thời gian giữ xe', decision: 'Lịch đều giúp tận dụng gói tháng; lịch ít nên so từng chuyến.' },
        { criterion: 'Km', confirm: 'Tổng km nội thành, đi tỉnh và km rỗng', decision: 'Chọn gói đủ km thay vì trả vượt thường xuyên.' },
        { criterion: 'Người lái', confirm: 'Một người hay luân phiên trong đội', decision: 'Danh sách lái phải được duyệt và cập nhật có kiểm soát.' },
        { criterion: 'Đối soát', confirm: 'VETC, nhiên liệu, đỗ xe, phạt nguội', decision: 'Dùng biểu mẫu theo chuyến và chốt mốc hàng tháng.' },
      ],
      quoteChecklist: ['Danh sách tỉnh/khu vực thường đi và số chuyến mỗi tháng.', 'Số người, hành lý hoặc dụng cụ phải mang theo.', 'Km ước tính theo lịch công tác, cộng quãng đường nội thành.', 'Danh sách người lái và đầu mối phê duyệt thay đổi.', 'Nơi xe đỗ qua đêm và người giữ chìa khóa.', 'Yêu cầu hợp đồng, hóa đơn và mã dự án/phòng ban để đối soát.'],
      workflow: ['Tổng hợp dữ liệu chuyến đi gần nhất hoặc kế hoạch dự án.', 'Chọn nhóm xe theo tải người/hành lý và đường đi.', 'Chốt hạn mức km cùng quy tắc duyệt tuyến ngoài kế hoạch.', 'Bàn giao xe cho người chịu trách nhiệm chính.', 'Ghi nhật ký km, nhiên liệu/pin, VETC và sự cố theo chuyến.', 'Đối soát cuối kỳ và điều chỉnh gói cho kỳ tiếp theo.'],
      contractChecks: ['Người lái được phép và cách bổ sung người lái.', 'Phạm vi địa lý, đi tỉnh và thời gian sử dụng.', 'Km đã gồm, vượt km và số km khi bàn giao.', 'Trách nhiệm VETC, nhiên liệu/pin, gửi xe và phạt nguội.', 'Bảo dưỡng định kỳ và quy trình khi xe báo lỗi.', 'Biên bản trả xe, đối soát và thời điểm kết thúc trách nhiệm.'],
      risks: ['Ước lượng km chỉ theo quãng đường Hà Nội–điểm đến, bỏ km nội vùng.', 'Giao chìa khóa luân phiên nhưng không cập nhật người lái.', 'Không có quy tắc ai được chấp thuận đổi lịch hoặc đi ngoài tuyến.', 'Đợi cuối tháng mới thu thập VETC và hóa đơn nên khó xác minh.'],
      scenario: 'Đội kỹ thuật có tám chuyến/tháng tới ba tỉnh, mỗi chuyến chở ba người và dụng cụ. Xe tháng chỉ đáng cân nhắc nếu tổng ngày sử dụng, km và nhu cầu chủ động vượt phương án thuê lẻ. Doanh nghiệp nên đặt một người giữ xe, hai người lái dự phòng đã được chấp thuận và nhật ký km theo chuyến để đối soát dễ hơn.',
      faq: [{ question: 'Có thể để nhiều nhân viên luân phiên lái không?', answer: 'Chỉ khi những người đó được khai báo, đủ điều kiện và được Car Match chấp thuận. Cần có danh sách cập nhật, không giao chìa tự do.' }, { question: 'Km công tác nên tính thế nào?', answer: 'Cộng km đi–về, km di chuyển tại điểm đến, km lấy/trả xe nếu có và một biên độ hợp lý; sau đó so với hạn mức hợp đồng.' }],
      seoTitle: 'Thuê Xe Tháng Cho Nhân Viên Đi Công Tác',
      seoDescription: 'Quản lý xe tháng cho nhân viên công tác theo lịch chạy, km, người lái, VETC, chi phí chuyến và quy trình đối soát.',
      relatedPostSlugs: ['thue-xe-thang-co-gioi-han-km-khong', 'phi-vetc-xe-thue-thanh-toan-the-nao', 'co-duoc-di-xe-thue-ra-ngoai-ha-noi-khong'],
      ...shared,
    }),
    createPost({
      id: 'static-monthly-b2b-22-vs-30-days',
      title: 'Gói thuê xe 22 ngày và 30 ngày khác gì nhau?',
      slug: 'goi-thue-xe-22-ngay-va-30-ngay-khac-gi-nhau',
      publishedAt: '2026-11-09T18:10:00+07:00',
      excerpt: 'So sánh gói thuê 22 ngày và 30 ngày theo quyền giữ xe, ngày sử dụng, km, giá mỗi ngày dùng và lịch bảo dưỡng thay vì chỉ so đơn giá.',
      category: 'Thuê xe theo tháng',
      directAnswer: 'Gói 22 ngày thường phù hợp lịch làm việc có ngày nghỉ hoặc xe được trả lại khi không dùng; gói 30 ngày phù hợp nhu cầu giữ xe liên tục. Tuy nhiên tên gói không đủ để kết luận: phải xác nhận 22 ngày là ngày sử dụng hay ngày giữ xe, cách chọn ngày, km được cấp và quyền dùng xe trong tám ngày còn lại.',
      audience: 'cá nhân và doanh nghiệp đang so hai cấu trúc gói thuê dài ngày',
      decisionQuestion: 'Nên chọn 22 ngày hay giữ xe đủ 30 ngày?',
      decisionAnswer: 'Hãy lập lịch thật trên một tháng và đánh dấu ngày bắt buộc có xe. Nếu chỉ dùng ngày làm việc, 22 ngày có thể sát nhu cầu hơn; nếu cần tối, cuối tuần, đi tỉnh đột xuất hoặc xe phải luôn ở chỗ khách, giữ 30 ngày có thể giảm rủi ro thiếu xe. Công thức so đơn giản là tổng chi phí hợp đồng chia cho số ngày thực sự dùng được, sau đó cộng chi phí và thời gian giao nhận giữa các đợt nếu có.',
      comparisonRows: [
        { criterion: 'Quyền giữ xe', confirm: 'Giữ liên tục hay trả xe vào ngày không dùng', decision: 'Nhu cầu đột xuất cần quyền giữ xe rõ ràng.' },
        { criterion: 'Ngày sử dụng', confirm: '22 ngày cố định, linh hoạt hay theo lịch làm việc', decision: 'Chọn gói khớp lịch thay vì cố dùng đủ ngày.' },
        { criterion: 'Km', confirm: 'Cấp theo ngày dùng hay theo cả kỳ', decision: 'So tổng km, không suy ra bằng phép nhân.' },
        { criterion: 'Giao nhận', confirm: 'Có bao nhiêu lần giao/trả và chi phí', decision: 'Nhiều lần bàn giao có thể làm mất lợi thế giá.' },
      ],
      quoteChecklist: ['Lịch sử dụng theo ngày trong tháng, kể cả tối và cuối tuần.', 'Gói có cho giữ xe liên tục tại chỗ khách không.', 'Ngày không dùng có được chuyển sang kỳ sau hay không.', 'Tổng km của cả kỳ và quy tắc vượt km.', 'Số lần giao nhận, điểm bàn giao và chi phí liên quan.', 'Cách xử lý lễ Tết, bảo dưỡng hoặc gia hạn giữa kỳ.'],
      workflow: ['Đánh dấu ngày bắt buộc phải có xe.', 'Tính tổng km cho những ngày đó.', 'Yêu cầu hai báo giá cùng mẫu xe và cùng trách nhiệm.', 'Tính chi phí trên mỗi ngày dùng và mỗi km đã gồm.', 'Kiểm tra quyền giữ xe ở ngày nghỉ.', 'Chọn gói có tổng phạm vi phù hợp, không chỉ đơn giá thấp.'],
      contractChecks: ['Định nghĩa “ngày thuê”, “ngày dùng” và thời điểm bắt đầu/kết thúc.', 'Quyền giữ xe ngoài 22 ngày và trách nhiệm trong thời gian giữ.', 'Cách đăng ký/đổi ngày sử dụng.', 'Km cấp theo kỳ, cộng dồn và vượt km.', 'Giao nhận nhiều lần, kiểm tra xe và nhiên liệu/pin.', 'Ngày lễ, trả sớm, gia hạn và ngày xe bảo dưỡng.'],
      risks: ['Hiểu 22 ngày là được giữ xe 30 ngày nhưng chỉ tính tiền 22 ngày.', 'Lấy giá gói chia 22/30 mà bỏ phí giao nhận.', 'Mặc định km/ngày được cộng dồn cho toàn kỳ.', 'Chọn gói 22 ngày nhưng thường xuyên cần xe cuối tuần.'],
      scenario: 'Một nhân viên đi làm từ thứ Hai đến thứ Sáu nhưng mỗi tháng có hai cuối tuần về quê. Gói 22 ngày chỉ phù hợp nếu những cuối tuần đó được đăng ký trong 22 ngày và cách giữ xe đã rõ. Nếu phải trả xe vào ngày nghỉ hoặc phát sinh nhiều lần giao nhận, gói 30 ngày có thể thực tế hơn dù đơn giá niêm yết cao hơn.',
      faq: [{ question: 'Gói 22 ngày có phải luôn rẻ hơn 30 ngày?', answer: 'Không thể kết luận. Cần so cùng xe, km, quyền giữ xe, giao nhận và lịch dùng thực tế.' }, { question: 'Ngày không dùng có được cộng dồn không?', answer: 'Chỉ khi báo giá/hợp đồng ghi rõ. Không mặc định ngày hoặc km được chuyển sang kỳ sau.' }],
      seoTitle: 'Gói Thuê Xe 22 Ngày Và 30 Ngày Khác Gì?',
      seoDescription: 'So gói thuê xe 22 và 30 ngày theo quyền giữ xe, lịch dùng, tổng km, giao nhận và chi phí trên mỗi ngày thực tế.',
      relatedPostSlugs: ['thue-xe-thang-cho-doanh-nghiep-nho', 'thue-vf5-theo-ngay-hay-theo-thang', 'thue-xe-thang-co-gioi-han-km-khong'],
      ...shared,
    }),
    createPost({
      id: 'static-monthly-b2b-invoice',
      title: 'Thuê xe tháng có xuất hóa đơn không?',
      slug: 'thue-xe-thang-co-xuat-hoa-don-khong',
      publishedAt: '2026-11-09T18:00:00+07:00',
      excerpt: 'Doanh nghiệp cần xác nhận khả năng xuất hóa đơn, chủ thể cung cấp, thông tin người mua, thời điểm lập và các khoản nằm trong chứng từ trước khi cọc.',
      category: 'Thuê xe doanh nghiệp',
      directAnswer: 'Khách doanh nghiệp không nên mặc định mọi xe hoặc mọi khoản phát sinh đều được xuất trên cùng một hóa đơn. Trước khi đặt cọc, hãy yêu cầu Car Match xác nhận bằng văn bản chủ thể cung cấp, khả năng xuất hóa đơn điện tử, thông tin cần nhận, thời điểm lập và khoản nào thuộc hóa đơn/chứng từ của booking.',
      audience: 'kế toán, hành chính và người mua dịch vụ thuê xe tháng cho doanh nghiệp',
      decisionQuestion: 'Cần hỏi gì trước khi ký để không thiếu chứng từ?',
      decisionAnswer: 'Bắt đầu từ mục đích hạch toán và quy trình thanh toán của doanh nghiệp. Gửi đầy đủ tên đơn vị, mã số thuế, địa chỉ và email nhận hóa đơn; đồng thời yêu cầu báo giá tách tiền thuê, giao nhận và phát sinh. Nếu VETC, nhiên liệu, gửi xe hoặc sửa chữa do bên khác cung cấp, chứng từ có thể không cùng một nguồn. Kế toán nên duyệt mẫu báo giá và luồng chứng từ trước khi chuyển cọc.',
      comparisonRows: [
        { criterion: 'Chủ thể cung cấp', confirm: 'Tên đơn vị/cá nhân ký và phát hành chứng từ', decision: 'Phải phù hợp quy trình mua hàng của doanh nghiệp.' },
        { criterion: 'Thông tin người mua', confirm: 'Tên, mã số thuế, địa chỉ, email', decision: 'Gửi trước và kiểm tra lại trong hợp đồng.' },
        { criterion: 'Phạm vi hóa đơn', confirm: 'Tiền thuê và khoản nào được ghi nhận', decision: 'Tách khoản do bên thứ ba cung cấp.' },
        { criterion: 'Thời điểm', confirm: 'Kỳ thanh toán và thời điểm lập hóa đơn', decision: 'Khớp với quy trình kế toán và quy định hiện hành.' },
      ],
      quoteChecklist: ['Tên pháp lý, mã số thuế, địa chỉ và email nhận hóa đơn.', 'Người đại diện/đầu mối ký hợp đồng và người phụ trách kế toán.', 'Kỳ thuê, kỳ thanh toán và yêu cầu tách theo dự án/phòng ban.', 'Danh sách khoản cần thể hiện trên báo giá và hóa đơn.', 'Cách xử lý cọc, hoàn cọc và khoản phát sinh cuối kỳ.', 'Yêu cầu biên bản bàn giao, nghiệm thu hoặc đối soát đi kèm.'],
      workflow: ['Kế toán gửi bộ thông tin người mua chuẩn.', 'Car Match xác nhận chủ thể và phạm vi chứng từ của đúng phương án xe.', 'Hai bên duyệt báo giá và điều khoản thanh toán.', 'Ký hợp đồng/đặt cọc sau khi luồng hóa đơn đã rõ.', 'Lưu biên bản bàn giao và đối soát phát sinh.', 'Kiểm tra hóa đơn điện tử ngay khi nhận và phản hồi sai lệch sớm.'],
      contractChecks: ['Chủ thể hợp đồng và chủ thể phát hành hóa đơn.', 'Giá đã gồm/không gồm thuế theo báo giá.', 'Kỳ thanh toán, thời hạn và phương thức chuyển khoản.', 'Khoản cọc được ghi nhận và hoàn trả thế nào.', 'VETC, nhiên liệu, giao nhận, sửa chữa và bên cung cấp chứng từ.', 'Biên bản đối soát khi phát sinh hoặc kết thúc kỳ thuê.'],
      risks: ['Chuyển cọc rồi mới hỏi khả năng xuất hóa đơn.', 'Gửi sai tên/mã số thuế hoặc đổi thông tin quá muộn.', 'Gộp chi phí bên thứ ba vào kỳ vọng hóa đơn tiền thuê.', 'Chỉ lưu hóa đơn mà thiếu hợp đồng, bàn giao và chứng từ thanh toán.'],
      scenario: 'Một doanh nghiệp thuê xe ba tháng và cần phân bổ cho dự án A. Trước khi cọc, kế toán gửi thông tin pháp nhân, yêu cầu kỳ hóa đơn, nội dung báo giá và danh mục chứng từ. VETC cùng gửi xe được đối soát riêng theo giao dịch thực tế. Nhờ vậy người đặt xe không phải sửa hồ sơ sau khi kỳ kế toán đã đóng.',
      sourceNote: 'Quy định hóa đơn điện tử hiện hành cần đối chiếu theo <a href="https://vanban.chinhphu.vn/?docid=218689&pageid=27160&typegroupid=4">Nghị định 254/2026/NĐ-CP</a>. Khả năng xuất hóa đơn và cách thể hiện từng khoản vẫn phải được Car Match xác nhận cho đúng chủ thể và booking; bài này không phải tư vấn thuế.',
      faq: [{ question: 'Hóa đơn có gồm tiền VETC và gửi xe không?', answer: 'Không nên mặc định. Đây có thể là khoản đối soát theo giao dịch hoặc chứng từ của bên thứ ba; cần hỏi rõ trước khi ký.' }, { question: 'Cá nhân thuê rồi công ty lấy hóa đơn sau có được không?', answer: 'Không nên tự suy đoán. Hãy thống nhất chủ thể hợp đồng, người thanh toán và thông tin người mua trước khi đặt cọc.' }],
      seoTitle: 'Thuê Xe Tháng Có Xuất Hóa Đơn Không?',
      seoDescription: 'Cách xác nhận hóa đơn khi thuê xe tháng: chủ thể cung cấp, thông tin người mua, thời điểm lập và các khoản cần tách rõ.',
      relatedPostSlugs: ['thue-xe-thang-cho-doanh-nghiep-nho', 'hop-dong-thue-xe-thang-can-dieu-khoan-gi', 'phi-vetc-xe-thue-thanh-toan-the-nao'],
      ...shared,
    }),
    createPost({
      id: 'static-monthly-b2b-contract',
      title: 'Hợp đồng thuê xe tháng cần có những điều khoản gì?',
      slug: 'hop-dong-thue-xe-thang-can-dieu-khoan-gi',
      publishedAt: '2026-11-09T17:50:00+07:00',
      excerpt: 'Checklist hợp đồng thuê xe tháng: đúng xe, người lái, thời hạn, km, cọc, bảo dưỡng, hư hỏng, phạt nguội, chấm dứt và đối soát.',
      category: 'Thuê xe theo tháng',
      directAnswer: 'Hợp đồng thuê xe tháng tối thiểu cần làm rõ chủ thể, xe bàn giao, người lái, thời hạn, giá và cọc, giới hạn km, giao nhận, bảo dưỡng, hư hỏng/bảo hiểm, VETC/phạt nguội, chấm dứt sớm và quy trình đối soát. Phụ lục bàn giao phải khớp đúng xe thực nhận.',
      audience: 'cá nhân, doanh nghiệp và người phụ trách duyệt hợp đồng thuê xe dài hạn',
      decisionQuestion: 'Điều khoản nào ảnh hưởng nhiều nhất tới tổng rủi ro?',
      decisionAnswer: 'Ba nhóm thường ảnh hưởng lớn nhất là phạm vi sử dụng, trách nhiệm khi xe dừng và cách kết thúc hợp đồng. Giá thuê thấp không bù được việc thiếu km, người lái không được ghi nhận hoặc không rõ ai trả chi phí khi xe hỏng. Hãy đọc hợp đồng cùng báo giá và biên bản bàn giao như một bộ hồ sơ, không đọc từng tài liệu riêng lẻ.',
      comparisonRows: [
        { criterion: 'Phạm vi dùng', confirm: 'Người lái, tuyến, ngày giữ xe, km', decision: 'Phải khớp cách xe được dùng thật.' },
        { criterion: 'Chi phí', confirm: 'Giá, cọc, giao nhận, vượt km, phát sinh', decision: 'Mỗi khoản có công thức hoặc bằng chứng đối soát.' },
        { criterion: 'Vận hành', confirm: 'Bảo dưỡng, sửa chữa, xe thay thế', decision: 'Ghi đầu mối, thời gian thông báo và phương án.' },
        { criterion: 'Kết thúc', confirm: 'Trả sớm, gia hạn, thanh lý, hoàn cọc', decision: 'Có mốc thời gian và hồ sơ cần hoàn tất.' },
      ],
      quoteChecklist: ['Thông tin đầy đủ của bên thuê và bên cho thuê.', 'Tên xe/nhóm xe, biển số hoặc cách xác định xe bàn giao.', 'Danh sách người lái, phạm vi và mục đích sử dụng.', 'Ngày giờ bắt đầu/kết thúc, gia hạn và trả sớm.', 'Giá, cọc, km, giao nhận và phương thức thanh toán.', 'Yêu cầu bảo dưỡng, chứng từ, xe thay thế và đầu mối xử lý.'],
      workflow: ['Đối chiếu báo giá với nhu cầu đã gửi.', 'Đánh dấu điều khoản chưa có số liệu hoặc cách tính.', 'Yêu cầu phụ lục cho người lái, xe, km và bàn giao.', 'Kiểm tra điều khoản hư hỏng, bảo hiểm và sự cố.', 'Hai bên ký/đóng dấu theo thẩm quyền và lưu bản cuối.', 'Khi nhận xe, kiểm tra phụ lục khớp xe thực tế.'],
      contractChecks: ['Chủ thể, thẩm quyền ký và thông tin liên hệ.', 'Mô tả xe, giấy tờ, tình trạng và phụ kiện.', 'Giá thuê, cọc, kỳ thanh toán và khoản phát sinh.', 'Km, nhiên liệu/pin, VETC và phạt nguội.', 'Bảo dưỡng, hư hỏng, bảo hiểm và nghĩa vụ thông báo.', 'Gia hạn, chấm dứt, trả xe, thanh lý và giải quyết tranh chấp.'],
      risks: ['Hợp đồng ghi nhóm xe nhưng bàn giao xe khác mà không có phụ lục.', 'Người lái thực tế không có trong hồ sơ.', 'Phí vượt km hoặc trả sớm không có công thức rõ.', 'Biên bản nhận/trả xe thiếu ảnh và số km đồng hồ.'],
      scenario: 'Khách thuê sáu tháng nhưng có thể kết thúc dự án sau bốn tháng. Hợp đồng cần ghi điều kiện trả sớm, thời gian báo trước, đối soát cọc và chi phí đã cam kết. Nếu chỉ có thời hạn sáu tháng mà không nói cách chấm dứt, hai bên dễ hiểu khác nhau khi dự án thay đổi.',
      faq: [{ question: 'Báo giá có thay cho hợp đồng không?', answer: 'Không nên mặc định. Báo giá mô tả phương án và chi phí; hợp đồng cùng phụ lục xác lập quyền, nghĩa vụ và cách xử lý tình huống.' }, { question: 'Có cần biên bản bàn giao riêng?', answer: 'Nên có. Biên bản ghi đúng xe, tình trạng, km, nhiên liệu/pin, giấy tờ và phụ kiện tại thời điểm nhận/trả.' }],
      seoTitle: 'Hợp Đồng Thuê Xe Tháng Cần Điều Khoản Gì?',
      seoDescription: 'Checklist hợp đồng thuê xe tháng về người lái, xe, thời hạn, giá, cọc, km, bảo dưỡng, hư hỏng, phạt nguội và thanh lý.',
      relatedPostSlugs: ['bien-ban-ban-giao-xe-thue-can-co-gi', 'thue-xe-thang-co-gioi-han-km-khong', 'xe-thay-the-khi-bao-duong-xu-ly-the-nao'],
      ...shared,
    }),
    createPost({
      id: 'static-monthly-b2b-km-limit',
      title: 'Thuê xe tháng có giới hạn km không?',
      slug: 'thue-xe-thang-co-gioi-han-km-khong',
      publishedAt: '2026-11-09T17:40:00+07:00',
      excerpt: 'Giới hạn km thuê xe tháng phải xác nhận theo đúng xe và hợp đồng; hướng dẫn ước lượng km, đọc đồng hồ, tính vượt và tránh chọn sai gói.',
      category: 'Thuê xe theo tháng',
      directAnswer: 'Thuê xe tháng có thể có giới hạn km, nhưng không nên áp một mức chung cho mọi xe hoặc mọi hợp đồng. Khách cần hỏi tổng km đã gồm trong kỳ, cách ghi nhận đồng hồ đầu–cuối, km có cộng dồn không, đơn giá vượt km và cách xử lý khi dự báo sẽ vượt.',
      audience: 'khách cá nhân, doanh nghiệp và đội công tác có quãng đường sử dụng khác nhau mỗi tháng',
      decisionQuestion: 'Làm sao chọn hạn mức km sát nhu cầu?',
      decisionAnswer: 'Lấy lịch chạy một tuần điển hình, cộng km đi làm, đi tỉnh, việc gia đình và km ngoài kế hoạch; nhân theo số tuần rồi thêm biên độ hợp lý. Không chỉ lấy quãng đường một chiều. Nếu dữ liệu cũ có sẵn, dùng số km đồng hồ hoặc nhật ký chuyến thay cho ước lượng cảm tính. Sau đó so tổng km của gói và chi phí vượt km trong kịch bản thấp, cơ sở và cao.',
      comparisonRows: [
        { criterion: 'Tổng km', confirm: 'Km đã gồm cho cả kỳ', decision: 'So với ba kịch bản sử dụng, không chỉ mức trung bình.' },
        { criterion: 'Cách đo', confirm: 'Đồng hồ đầu–cuối và ảnh bàn giao', decision: 'Dùng số đo có bằng chứng thay vì ước lượng sau kỳ.' },
        { criterion: 'Cộng dồn', confirm: 'Km theo ngày hay theo tháng, có chuyển kỳ không', decision: 'Chỉ tính cộng dồn khi văn bản ghi rõ.' },
        { criterion: 'Vượt km', confirm: 'Đơn giá, mốc báo trước và cách thanh toán', decision: 'Tính trước chi phí nếu nhu cầu tăng 10–20%.' },
      ],
      quoteChecklist: ['Km đi làm hai chiều và số ngày đi làm.', 'Số chuyến đi tỉnh, quãng đường nội vùng và đường vòng.', 'Km dùng cho gia đình hoặc việc phát sinh ngoài công việc.', 'Tổng km dự kiến thấp/cơ sở/cao.', 'Khả năng sạc hoặc tiếp nhiên liệu theo hành trình.', 'Yêu cầu thay đổi hạn mức nếu dự án kéo dài.'],
      workflow: ['Chụp số km lúc nhận xe cùng biên bản.', 'Theo dõi km theo tuần hoặc theo chuyến.', 'So số thực tế với đường ngân sách km giữa kỳ.', 'Thông báo sớm nếu dự báo vượt hạn mức.', 'Chỉ thay đổi gói khi có xác nhận bằng văn bản.', 'Chụp số km lúc trả và đối chiếu công thức hợp đồng.'],
      contractChecks: ['Tổng km đã gồm và đơn vị tính theo kỳ.', 'Ngày bắt đầu/kết thúc dùng để tính km.', 'Quy tắc cộng dồn ngày, tháng hoặc nhiều xe.', 'Đơn giá vượt km và thuế/chứng từ liên quan.', 'Cách xử lý thay xe giữa kỳ để không tính trùng km.', 'Nguồn số liệu khi đồng hồ hoặc biên bản có sai lệch.'],
      risks: ['Lấy km Google Maps mà bỏ quãng đường nội thành và đi vòng.', 'Mặc định km chưa dùng của tháng trước được chuyển sang.', 'Không chụp đồng hồ khi thay xe hoặc bảo dưỡng.', 'Đợi tới ngày trả mới phát hiện vượt nhiều km.'],
      scenario: 'Một khách đi làm 30 km/ngày trong 22 ngày, thêm hai chuyến 300 km và nhu cầu gia đình khoảng 200 km. Kịch bản cơ sở không phải 660 km mà khoảng 1.460 km trước khi thêm đường vòng. Gửi con số này từ đầu giúp so gói đúng hơn và giảm nguy cơ vượt km bị động.',
      faq: [{ question: 'Km thuê tháng có tính theo ngày không?', answer: 'Tùy hợp đồng. Có gói nêu tổng theo kỳ, có gói có cấu trúc khác; phải đọc đúng cách cộng và đối soát.' }, { question: 'Có thể mua thêm km giữa kỳ không?', answer: 'Có thể đề nghị nhưng không mặc định được chấp thuận. Hãy báo sớm và lấy xác nhận về hạn mức cùng chi phí mới.' }],
      seoTitle: 'Thuê Xe Tháng Có Giới Hạn Km Không?',
      seoDescription: 'Cách đọc giới hạn km thuê xe tháng, ước lượng nhu cầu, ghi nhận đồng hồ, tính vượt km và kiểm tra quy tắc cộng dồn.',
      relatedPostSlugs: ['thue-xe-thang-cho-nhan-vien-di-cong-tac', 'hop-dong-thue-xe-thang-can-dieu-khoan-gi', 'xe-thue-tu-lai-gioi-han-km-va-phi-vuot-km'],
      ...shared,
    }),
    createPost({
      id: 'static-monthly-b2b-replacement-car',
      title: 'Xe thay thế khi xe thuê tháng bảo dưỡng được xử lý thế nào?',
      slug: 'xe-thay-the-khi-bao-duong-xu-ly-the-nao',
      publishedAt: '2026-11-09T17:30:00+07:00',
      excerpt: 'Cách chốt lịch bảo dưỡng, thời gian báo trước, tiêu chí xe thay thế, bàn giao, km và chi phí để giảm gián đoạn khi thuê xe tháng.',
      category: 'Thuê xe theo tháng',
      directAnswer: 'Không nên mặc định thuê xe tháng luôn có xe thay thế ngay và cùng mẫu. Trước khi ký, khách cần xác nhận lịch bảo dưỡng dự kiến, thời gian thông báo, điều kiện được bố trí xe khác, tiêu chí tương đương, điểm đổi xe, cách tính km/chi phí và phương án nếu chưa có xe phù hợp.',
      audience: 'khách thuê dài hạn và doanh nghiệp có công việc phụ thuộc vào xe hoạt động liên tục',
      decisionQuestion: 'Xe thay thế cần “giống hệt” hay chỉ cần đáp ứng công việc?',
      decisionAnswer: 'Tiêu chí thực tế nên là đủ chỗ, đủ tải hành lý/dụng cụ, phù hợp tuyến, giấy tờ hợp lệ và thời gian có xe. Cùng màu hoặc cùng phiên bản có thể không quan trọng bằng việc không gián đoạn công việc. Nếu yêu cầu đúng mẫu là bắt buộc, phải ghi rõ và chấp nhận rằng thời gian chờ hoặc chi phí có thể khác.',
      comparisonRows: [
        { criterion: 'Bảo dưỡng kế hoạch', confirm: 'Ngày dự kiến và thời gian xe dừng', decision: 'Đổi lịch công việc hoặc đặt xe thay thế trước.' },
        { criterion: 'Sự cố đột xuất', confirm: 'Đầu mối, bước an toàn và thời gian phản hồi', decision: 'Ưu tiên người/xe an toàn trước SLA thương mại.' },
        { criterion: 'Xe tương đương', confirm: 'Số chỗ, tải, nhiên liệu, phạm vi dùng', decision: 'Định nghĩa theo nhu cầu cốt lõi, không chỉ tên model.' },
        { criterion: 'Đối soát', confirm: 'Km, nhiên liệu/pin, cọc và ngày thuê', decision: 'Chụp số liệu cả hai xe tại thời điểm đổi.' },
      ],
      quoteChecklist: ['Ngày nào xe tuyệt đối không thể gián đoạn.', 'Số chỗ, hành lý/dụng cụ và tuyến bắt buộc.', 'Thời gian tối đa doanh nghiệp có thể chờ.', 'Điểm đổi xe và người được quyền nhận xe thay thế.', 'Yêu cầu về xe điện/xăng, thẻ sạc hoặc VETC.', 'Cách tính phí nếu xe thay thế thuộc nhóm khác.'],
      workflow: ['Car Match thông báo lịch bảo dưỡng khi có thể.', 'Hai bên thống nhất thời gian và điểm đưa xe vào kiểm tra.', 'Xác nhận phương án xe thay thế bằng văn bản nếu áp dụng.', 'Bàn giao hai xe với ảnh, km, nhiên liệu/pin và phụ kiện.', 'Cập nhật danh sách người lái và phạm vi sử dụng cho xe mới.', 'Khi nhận lại xe chính, đối soát thời gian và số liệu của cả hai xe.'],
      contractChecks: ['Trường hợp nào được xem xét bố trí xe thay thế.', 'Mức tương đương về chỗ ngồi, nhóm xe và công năng.', 'Thời gian thông báo/phản hồi là mục tiêu hay cam kết.', 'Chi phí giao đổi, nhiên liệu/pin, km và ngày thuê.', 'Trách nhiệm khi xe chính hỏng do sử dụng hoặc do kỹ thuật.', 'Cách xử lý nếu không có xe phù hợp tại thời điểm cần.'],
      risks: ['Cam kết miệng “luôn có xe thay” nhưng hợp đồng không ghi.', 'Chỉ yêu cầu cùng model mà bỏ tiêu chí công việc cốt lõi.', 'Đổi xe không chụp km, xăng/pin và tình trạng hai xe.', 'Tiếp tục lái khi có cảnh báo an toàn chỉ để tránh gián đoạn.'],
      scenario: 'Doanh nghiệp thuê xe 7 chỗ chở kỹ thuật và dụng cụ. Xe cần bảo dưỡng một ngày. Xe thay thế 5 chỗ dù cùng giá không đáp ứng tải; ngược lại, một MPV 7 chỗ khác model có thể đáp ứng. Vì vậy hợp đồng nên định nghĩa “tương đương” bằng số chỗ, khả năng chở đồ và phạm vi chạy thay vì chỉ tên xe.',
      faq: [{ question: 'Xe bảo dưỡng có được trừ tiền thuê không?', answer: 'Phụ thuộc hợp đồng, thời gian dừng, nguyên nhân và phương án thay thế. Không có quy tắc chung nếu chưa được xác nhận.' }, { question: 'Có thể tự thuê xe khác rồi yêu cầu hoàn tiền không?', answer: 'Không nên tự quyết trừ trường hợp khẩn cấp về an toàn. Hãy liên hệ, nhận hướng dẫn và xác nhận chi phí trước.' }],
      seoTitle: 'Xe Thay Thế Khi Bảo Dưỡng Xử Lý Thế Nào?',
      seoDescription: 'Cách chốt xe thay thế khi xe thuê tháng bảo dưỡng: thời gian báo trước, tiêu chí tương đương, bàn giao, km và chi phí.',
      relatedPostSlugs: ['thue-xe-thang-co-bao-gom-bao-duong-khong', 'hop-dong-thue-xe-thang-can-dieu-khoan-gi', 'xe-thue-khong-khoi-dong-can-lam-gi'],
      ...shared,
    }),
  ];
}
