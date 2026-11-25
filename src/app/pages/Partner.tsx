import { useEffect, useRef } from 'react';
import { submitLead } from '@/hooks/useLeads';
import { trackEvent, trackLeadSubmit, trackZaloClick } from '@/lib/analytics';
import { useSEO } from '@/hooks/useSEO';
import { PARTNER_PREVIEW_BODY } from './partnerPreviewBody';
import './partner.css';

const ZALO_LINK = 'https://zalo.me/0971163290';
const SIMULATION_START = '[BẮT ĐẦU MÔ PHỎNG]';
const SIMULATION_END = '[KẾT THÚC MÔ PHỎNG]';

const PARTNER_RESPONSIBILITY_MARKUP = `
<section class="section partner-ops-section" id="trach-nhiem"><div class="wrap"><div class="tag eyeline">07 / Trách nhiệm &amp; xử lý tình huống</div><h2 class="heading">Phân định trách nhiệm &amp; xử lý tình huống.</h2><p class="lede">Thống nhất rõ cách đối soát, xử lý sự cố và quyền khai thác trước khi ký.</p><div class="responsibility-grid"><article class="responsibility-card"><span class="step-num">01</span><h3>Đối soát ODO, lộ trình, nhiên liệu/pin &amp; chi phí phát sinh</h3><p>Ghi nhận khi giao và nhận xe; đối chiếu VETC/ePass, phí sạc, vệ sinh, vượt định mức và các khoản phát sinh theo thỏa thuận.</p></article><article class="responsibility-card"><span class="step-num">02</span><h3>Xử lý trầy xước, va chạm và sự cố kỹ thuật</h3><p>Dùng ảnh, biên bản và bảo hiểm để xác định tình trạng, phương án xử lý và trách nhiệm chi phí của từng bên.</p></article><article class="responsibility-card"><span class="step-num">03</span><h3>Xe trả góp, xe công ty hoặc đồng sở hữu</h3><p>Xác nhận quyền cho thuê, giấy ủy quyền và điều kiện liên quan trước khi chốt phương án khai thác.</p></article></div><div class="section-cta"><div><b>Phương án này phù hợp với xe của bạn?</b><span>Gửi thông tin cơ bản để Car Match trao đổi trực tiếp.</span></div><a class="btn dark" href="#dang-ky">Đăng ký tư vấn ↗</a></div></div></section>
<section class="section soft partner-docs-section" id="ho-so-tham-dinh"><div class="wrap"><div class="tag eyeline">08 / Chuẩn bị trước khi thẩm định</div><h2 class="heading">Hồ sơ &amp; thông tin cần chuẩn bị.</h2><p class="lede">Chuẩn bị bốn nhóm thông tin để Car Match tư vấn đúng ngay từ đầu.</p><ul class="prep-list"><li><b>Thông tin &amp; hiện trạng xe</b><span>Mẫu xe, năm sản xuất, số km, hiện trạng và lịch bảo dưỡng gần nhất.</span></li><li><b>Giấy tờ xe &amp; bảo hiểm</b><span>Đăng ký, đăng kiểm, bảo hiểm và giấy tờ về quyền sử dụng xe.</span></li><li><b>Lịch rảnh &amp; khu vực giao nhận</b><span>Ngày có thể khai thác, nơi đỗ xe và điểm giao nhận thuận tiện.</span></li><li><b>Kỳ vọng &amp; điều kiện riêng</b><span>Mức thu mong muốn, ngày cần giữ xe và các giới hạn cần trao đổi.</span></li></ul></div></section>`;

function makeIdempotencyKey() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `partner-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

async function copyToClipboard(value: string) {
  try {
    if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(value); return true; }
  } catch { /* fallback below */ }
  try {
    const node = document.createElement('textarea'); node.value = value; node.style.position = 'fixed'; node.style.left = '-9999px';
    document.body.appendChild(node); node.focus(); node.select(); const copied = document.execCommand('copy'); node.remove(); return copied;
  } catch { return false; }
}

export default function Partner() {
  useSEO({
    title: 'Hợp tác chủ xe Hà Nội — Car Match | Khai thác xe nhàn rỗi',
    description: 'Chủ xe tại Hà Nội tìm hiểu hai hình thức hợp tác với Car Match: thuê theo tháng và ủy thác theo lịch rảnh. Tự mô phỏng phương án thu nhập, xem quy trình và gửi thông tin xe để thẩm định.',
    canonical: 'https://www.carmatch.vn/hop-tac',
  });
  const rootRef = useRef<HTMLDivElement>(null);
  let previewMarkup = PARTNER_PREVIEW_BODY.replace(
    'pattern="[0-9+().\\- ]{9,18}"',
    'pattern=".{9,18}"',
  ).replace(
    '<a aria-label="Car Match, về trang chủ" class="logo" href="https://www.carmatch.vn/"><span class="logo-mark">C</span>Car <strong>Match</strong></a>',
    '<a aria-label="Car Match, về trang chủ" class="logo" href="https://www.carmatch.vn/"><img class="partner-logo-image" src="/brand/carmatch-lockup-navy.png" alt="Car Match" width="288" height="66" /></a>',
  ).replace(
    '<a class="logo" href="https://www.carmatch.vn/"><span class="logo-mark">C</span>Car <strong>Match</strong></a>',
    '<a aria-label="Car Match, về trang chủ" class="logo" href="https://www.carmatch.vn/"><img class="partner-logo-image" src="/brand/carmatch-lockup-white.png" alt="Car Match" width="288" height="66" decoding="async" loading="lazy" /></a>',
  );
  previewMarkup = previewMarkup
    .replace('<div class="faq-aside">', '<p class="small"><a href="/hop-tac-chu-xe-cho-thue-tet">Xem điều kiện hợp tác cho thuê xe dịp Tết</a></p><div class="faq-aside">')
    .replace(/<div aria-label="Vị trí ảnh quy trình vận hành Car Match" class="proof-gallery">[\s\S]*?<div class="document-teaser">/, '<div class="document-teaser">')
    .replace('<p class="muted small" style="margin-top:7px">Thông tin chỉ được lưu sau khi API xác nhận thành công.</p>', '')
    .replace('<p class="small muted" style="margin-top:12px">Không báo “đã đăng ký thành công” cho đến khi hệ thống lưu yêu cầu thực tế.</p>', '')
    .replace('<p class="small muted" style="margin:9px 0 17px">Đây là bản xem trước. Chưa lưu lead hoặc tạo hồ sơ trên hệ thống Car Match.</p>', '<p class="small muted" style="margin:9px 0 17px">Kiểm tra lại thông tin trước khi gửi yêu cầu hợp tác.</p>')
    .replace(/tình trạngg/gi, 'tình trạng')
    .replace(/tình trạn(?!g)/gi, 'tình trạng')
    .replace(/Chi phí tiền mặt cần bù \/ tháng/g, 'Dòng tiền theo kỳ thử')
    .replace(/Khả năng bù chi phí hàng tháng/g, 'Lợi nhuận kinh tế')
    .replace(/Dòng tiền sau các khoản bạn nhập \/ tháng/g, 'Dòng tiền sau chi phí và trả góp / tháng')
    .replace('<span>Dòng tiền sau chi phí và trả góp / tháng</span><strong id="netValue">', '<span id="metricLabel">Dòng tiền sau chi phí và trả góp / tháng</span><strong id="netValue">')
    .replace(/Mức thu trước chi phí tự nhập/g, 'Mức thu kỳ vọng / tháng')
    .replace(/Chi phí nuôi xe \/ tháng/g, 'Chi phí nuôi xe nhập / tháng')
    .replace(/Chi phí theo ngày thuê/g, 'Chi phí phát sinh theo lịch thuê / tháng')
    .replace(/Dòng tiền &amp; điểm hòa vốn/g, 'Đối chiếu dòng tiền')
    .replace(/Chi phí nuôi xe hàng tháng \(đ\)/g, 'Chi phí nuôi xe nhập / tháng (đ)')
    .replace(/Mức chủ xe muốn nhận\/tháng \(đ\)/g, 'Mức thu kỳ vọng / tháng (đ)')
    .replace(/Tổng theo thời hạn thử/g, 'Dòng tiền sau chi phí vận hành / tháng')
    .replace(/Khả năng bù chi phí/g, 'Lợi nhuận kinh tế')
    .replace('<span>Dòng tiền theo kỳ thử</span><b id="totalOutValue">', '<span id="secondaryLabel">Dòng tiền theo kỳ thử</span><b id="totalOutValue">')
    .replace('<b id="periodValue">19.500.000đ</b>', '<b id="periodValue">6.500.000đ</b>')
    .replace('<b id="totalOutValue">2.500.000đ</b>', '<b id="totalOutValue">19.500.000đ</b>')
    .replace('<b id="breakEvenValue">360%</b>', '<b id="breakEvenValue">Chưa tính</b>')
    .replace('Mức thu đang thử bằng 360% tổng chi phí cố định đã nhập. Có thể đối chiếu với việc tự cho thuê lẻ theo đơn giá/ngày giả định.', 'Lợi nhuận kinh tế chưa được tính vì công cụ không định lượng khấu hao, thuế và rủi ro vận hành.')
    .replace('Kết quả chỉ là mô phỏng trên các thông số bạn nhập; chưa phản ánh đầy đủ khấu hao, thuế, nhu cầu thuê thực tế và các điều kiện hợp đồng.', 'Mức thu là kỳ vọng do bạn tự nhập, không phải dự báo của Car Match. Dòng tiền chỉ trừ các khoản đã nhập; lợi nhuận kinh tế còn phụ thuộc khấu hao, thuế, nhu cầu thuê thực tế và điều kiện hợp đồng.')
    .replace(/07 \/ Câu hỏi thực tế/g, '09 / Câu hỏi thực tế')
    .replace(/08 \/ Gửi thông tin xe/g, '10 / Gửi thông tin xe')
    .replace('Phí gửi xe, bảo dưỡng và các khoản chăm xe vẫn phát sinh dù bạn ít sử dụng. Car Match giúp chủ xe tại Hà Nội tìm hiểu phương án hợp tác theo tháng hoặc theo lịch rảnh, với quy trình bàn giao và đối soát được thống nhất rõ ràng.', 'Hợp tác cho thuê ô tô nhàn rỗi tại Hà Nội theo tháng hoặc lịch rảnh. Bạn có thể thử phương án dòng tiền, xem quy trình bàn giao và gửi xe để Car Match thẩm định.')
    .replace('Tính thử phương án xe ↗', 'Kiểm tra phương án hợp tác cho xe của tôi')
    .replace('Ước tính thu nhập', 'Thử phương án')
    .replace('Mô phỏng thu nhập', 'Thử phương án')
    .replace('Bạn không cần quyết định ngay. Chọn một hình thức để xem mô phỏng thu nhập và thông tin đăng ký tương ứng.', 'Bạn không cần quyết định ngay. Chọn hình thức sát với tần suất sử dụng xe để xem mô phỏng dòng tiền và gửi thông tin trao đổi với Car Match.')
    .replace('Phù hợp khi bạn sẵn sàng giao xe trong một thời hạn đã thống nhất và muốn lập kế hoạch thu nhập theo kỳ.', 'Phù hợp khi bạn sẵn sàng giao xe trong thời hạn đã thống nhất và muốn lập kế hoạch thu nhập theo từng kỳ đối soát.')
    .replace('Phù hợp khi bạn vẫn cần xe cho gia đình hoặc công việc. Đăng ký các ngày có thể cho thuê và đối soát theo giao dịch.', 'Phù hợp khi bạn vẫn cần xe cho gia đình hoặc công việc. Bạn đăng ký các ngày có thể cho thuê; Car Match phối hợp theo từng lịch chuyến và đối soát theo giao dịch.')
    .replace('<tr><th>Thu nhập</th><td>Thỏa thuận theo thời hạn, xe và điều kiện</td><td>Phụ thuộc đơn giá, chuyến thuê và tỷ lệ đối soát</td></tr>', '<tr><th>Cách tính &amp; kỳ đối soát</th><td>Thỏa thuận theo thời hạn, dòng xe và điều kiện hợp đồng</td><td>Phụ thuộc đơn giá, số ngày/chuyến thực tế phát sinh và tỷ lệ/điều khoản đối soát đã ký</td></tr>')
    .replace('<tr><th>Vận hành</th><td>Thống nhất trách nhiệm bàn giao và khai thác</td><td>Cập nhật lịch và phối hợp giao nhận theo hợp đồng</td></tr>', '')
    .replace('<tr><th>Ai giữ xe &amp; chìa khóa?</th><td>Điểm quản lý và người giữ chìa khóa được ghi rõ khi giao xe theo kỳ</td><td>Chủ xe giữ xe khi chưa có chuyến; quy trình bàn giao theo chuyến được thống nhất</td></tr>', '')
    .replace('<tr><th>Tần suất bàn giao</th><td>Thường theo đầu/cuối kỳ hoặc các mốc quy định trong hợp đồng</td><td>Theo lịch chuyến phát sinh và cách giao nhận đã thống nhất</td></tr>', '<tr><th>Tần suất bàn giao &amp; chìa khóa</th><td>Thống nhất điểm quản lý, người giữ chìa khóa và mốc giao nhận theo kỳ</td><td>Chủ xe giữ xe khi chưa có chuyến; bàn giao và nhận lại theo từng lịch chuyến đã xác nhận</td></tr>')
    .replace('<tr><th>Quyền dùng xe</th><td>Theo thời hạn giao xe đã thỏa thuận</td><td>Giữ những ngày bạn không đăng ký cho thuê</td></tr>', '<tr><th>Quyền sử dụng xe của chủ xe</th><td>Giao xe khai thác theo kỳ hạn đã thống nhất trong hợp đồng</td><td>Giữ lại các ngày không mở lịch; lịch sử dụng của chủ xe được khóa/thống nhất theo quy định báo trước</td></tr>')
    .replace('<tr><th>Phù hợp nhất</th><td>Xe thứ hai ít đi, chủ xe công tác dài ngày, chủ đội xe</td><td>Xe gia đình còn cần dùng cuối tuần hoặc các ngày cố định</td></tr>', '<tr><th>Phù hợp nhất với ai</th><td>Xe ít đi, xe dự phòng, chủ xe công tác dài ngày, chủ đội xe</td><td>Xe gia đình còn dùng cuối tuần hoặc các ngày cố định trong tuần/tháng</td></tr>')
    .replace('Đối chiếu CCCD, giấy phép lái xe, thông tin chuyến đi và điều kiện nhận xe trước khi bàn giao.', 'Đối chiếu CCCD, giấy phép lái xe hợp lệ, thông tin hành trình và các điều kiện bàn giao trước khi giao xe.')
    .replace('Ghi nhận ảnh ngoại thất, nội thất, ODO, mức pin/xăng, phụ kiện, thời gian và người bàn giao ở đầu và cuối chuyến.', 'Ghi nhận ảnh ngoại thất, nội thất, mâm/lốp, ODO, mức pin/xăng, phụ kiện, thời gian và người bàn giao ở đầu và cuối chuyến; lập biên bản có xác nhận của các bên.')
    .replace('Rà soát phí đường bộ VETC/ePass, phạt nguội và phát sinh. Trạng thái định vị được kiểm tra với xe có thiết bị, theo quy định sử dụng dữ liệu.', 'Kiểm tra phí đường bộ VETC/ePass, phạt nguội, phụ phí vượt định mức (nếu có) và trạng thái thiết bị định vị/giám sát hành trình nếu xe có trang bị, theo đúng quy định và phạm vi thỏa thuận.')
    .replace('Thử nhiều kịch bản theo mẫu xe, số ngày có thể cho thuê và chi phí bạn đang trả mỗi tháng. Kết quả giúp bạn chuẩn bị câu hỏi trước khi trao đổi với Car Match.', 'Thử nhanh mức thu, số ngày khai thác và chi phí hàng tháng. Kết quả chỉ để tham khảo trước khi trao đổi.')
    .replace('Chủ xe cần hiểu ai làm gì, nhận tiền ra sao và những tình huống phát sinh được xử lý theo nguyên tắc nào.', 'Xem rõ từng bước từ gửi thông tin đến bàn giao và đối soát.')
    .replace('Chủ xe cần nhìn được công việc thực tế phía sau mỗi chuyến thuê: tìm khách, kiểm tra, bàn giao và đối soát.', 'So sánh nhanh việc tự vận hành với phương án phối hợp cùng Car Match.')
    .replace('Một vài thông tin giúp hai bên biết liệu xe có phù hợp trước khi trao đổi chi tiết. Car Match sẽ trao đổi và thẩm định theo thông tin từng xe.', 'Car Match kiểm tra hồ sơ, hiện trạng, lịch rảnh và khu vực của từng xe.')
    .replace('Car Match phối hợp kiểm tra khách thuê, ghi nhận tình trạng xe, đối soát chuyến và tiếp nhận sự cố qua quy trình minh bạch, có đầu mối phụ trách.', 'Bốn bước kiểm soát giúp việc bàn giao, đối soát và xử lý sự cố rõ ràng hơn.')
    .replace('Đọc những điều ảnh hưởng trực tiếp đến tài sản và lịch sử dụng xe của bạn.', 'Giải đáp ngắn gọn các vấn đề chủ xe thường quan tâm.')
    .replace('Chọn xe và thử mức thu dự kiến; mọi thông số đều có thể điều chỉnh theo xe và lịch của bạn.', 'Điều chỉnh mức thu kỳ vọng, thời hạn và chi phí nuôi xe để ước tính dòng tiền tham khảo trước khi trao đổi với Car Match.')
    .replace('<p class="muted small" id="calc-intro">Điều chỉnh mức thu kỳ vọng, thời hạn và chi phí nuôi xe để ước tính dòng tiền tham khảo trước khi trao đổi với Car Match.</p>', '<p class="muted small" id="calc-intro">Điều chỉnh mức thu kỳ vọng, thời hạn và chi phí nuôi xe để xem dòng tiền tham khảo.</p><div class="calc-explainer"><p><b>Mức thu kỳ vọng:</b> số tiền bạn tự nhập để thử phương án.</p><p><b>Chi phí nuôi xe:</b> khoản bạn đang chi mỗi tháng.</p><p><b>Trả góp:</b> dòng tiền trả ngân hàng, không đồng nghĩa toàn bộ là chi phí kế toán.</p></div>')
    .replace('Các mức tự điền là giả định để lập kế hoạch. Car Match sẽ trao đổi doanh thu, tỷ lệ chia sẻ và khoản chi áp dụng trước khi ký.', 'Ở chế độ theo ngày, bạn có thể điều chỉnh số ngày, đơn giá, tỷ lệ chia sẻ và chi phí theo chuyến.')
    .replace('<p class="lede">Chỉ cần thông tin cơ bản về xe, khu vực đỗ và số điện thoại. Car Match sẽ liên hệ để thảo luận mô hình hợp tác, rồi mới trao đổi hồ sơ chi tiết nếu phù hợp.</p>', '<p class="lede">Gửi thông tin hoàn toàn miễn phí. Car Match trao đổi và thẩm định phương án trước khi bàn giao hồ sơ chi tiết.</p>')
    .replace('<button class="btn white" data-zalo-context="form" style="margin-top:30px" type="button">Trao đổi trước qua Zalo ↗</button>', '<div class="direct-contact" style="margin-top:30px"><a class="btn white" href="tel:0971163290">Gọi 0971 163 290</a><button class="btn outline" data-zalo-context="form" type="button">Nhắn Zalo 0971 163 290 ↗</button></div>')
    .replace('<button class="btn outline" data-zalo-context="form" type="button">Nhắn Zalo</button>', '<button class="btn outline" data-zalo-context="form" type="button">Nhắn Zalo 0971 163 290</button>')
    .replace('<label for="carModel">Mẫu xe *</label><input id="carModel" name="car_model" placeholder="Ví dụ: VinFast VF5" required=""/>', '<label for="carModel">Mẫu xe (nếu đã xác định)</label><input id="carModel" name="car_model" placeholder="Gợi ý: VinFast VF5"/>')
    .replace('<label for="year">Năm sản xuất *</label><input id="year" max="2027" min="2000" name="car_year" placeholder="2022" required="" type="number"/>', '<label for="year">Năm sản xuất (tùy chọn)</label><input id="year" max="2027" min="2000" name="car_year" placeholder="Ví dụ: 2022" type="number"/>')
    .replace('<h3 style="margin-top:8px">Thông tin xe của bạn</h3>', '<h3 style="margin-top:8px">Thông tin xe của bạn</h3><p class="form-helper">Chỉ cần họ tên, số điện thoại/Zalo và khu vực đỗ xe.</p>')
    .replace(/<div class="field"><label for="fleetCount">[\s\S]*?<\/select><\/div>/, '')
    .replace('<label for="availability">Khả năng cho thuê</label>', '<label for="availability">Lịch có thể khai thác (tùy chọn)</label>')
    .replace('<option value="Có thể trao đổi sau">Chưa xác định, cần tư vấn</option>', '<option value="Có thể trao đổi sau">Chưa xác định, cần trao đổi</option>')
    .replace('<div class="field wide"><label for="comment">Điều muốn trao đổi thêm (tùy chọn)</label>', '<div class="field"><label for="readiness">Tình trạng sẵn sàng</label><select id="readiness" name="readiness"><option value="Đang tìm hiểu">Đang tìm hiểu</option><option value="Cần trao đổi thêm">Cần trao đổi thêm</option><option value="Sẵn sàng bàn giao">Xe đã có thể bàn giao</option></select></div><div class="field wide"><label for="comment">Điều muốn trao đổi thêm (tùy chọn)</label>')
    .replace('Tôi đồng ý để Car Match liên hệ theo thông tin đã cung cấp nhằm tư vấn hợp tác; thông tin chỉ được sử dụng để xử lý yêu cầu này.', 'Tôi đồng ý để Car Match dùng các thông tin cần thiết tôi cung cấp để xử lý yêu cầu tư vấn. Xem <a href="/chinh-sach">chính sách quyền riêng tư</a>; bạn có thể yêu cầu chỉnh sửa hoặc xóa thông tin qua <a href="mailto:info@carmatch.vn">info@carmatch.vn</a>.')
    .replace('Gửi xe để nhận phương án cụ thể ↗', 'Đăng ký tư vấn với phương án này ↗')
    .replace('Xe VinFast VF5 trong khu vực để xe, minh họa nguồn xe cho thuê', 'Xe VinFast VF5 trong danh mục hình ảnh thực tế Car Match')
    .replace('Xe VinFast VF3 được chụp tại điểm đỗ, minh họa kiểm tra xe trước khai thác', 'Xe VinFast VF3 trong danh mục hình ảnh thực tế Car Match')
    .replace('<img alt="Xe VinFast VF5 trong danh mục Car Match" height="195"', '<img alt="Xe VinFast VF5 trong danh mục Car Match" decoding="async" loading="lazy" height="195"')
    .replace(/loading="lazy" src="\/partner-v21-/g, 'decoding="async" loading="lazy" src="/partner-v21-')
    .replace('<div class="modal-actions"><button class="btn dark" id="copyChecklist" type="button">Sao chép checklist</button>', '<div class="modal-actions"><a class="btn dark" href="/tai-lieu/checklist-ban-giao-xe-15-diem.html" id="openChecklistDocument" rel="noopener" target="_blank">Mở tài liệu checklist</a><button class="btn outline" id="copyChecklist" type="button">Sao chép checklist</button>')
    .replace('Hỗ trợ phối hợp giao nhận: Tôn Thất Thuyết (Cầu Giấy) · Nguyễn Xiển (Thanh Xuân) · Vinhomes Ocean Park (Gia Lâm)', 'Hỗ trợ phối hợp giao nhận: Tôn Thất Thuyết (Cầu Giấy) - Nguyễn Xiển (Thanh Xuân) - Vinhomes Ocean Park (Gia Lâm)')
    .replace(/Thấm định/g, 'Thẩm định')
    .replace(/mô phòng/g, 'mô phỏng')
    .replace(/Vân hành/g, 'Vận hành')
    .replace(/Thứ mức thu/g, 'Thử mức thu')
    .replace(/nhấm tỉnh/g, 'nhắm tính')
    .replace(/Tháp - 7,2 triệu/g, 'Thấp - 7,2 triệu')
    .replace(/Chỉ phí nuôi xe/g, 'Chi phí nuôi xe')
    .replace(/đang chỉ/g, 'đang chi')
    .replace(/tỉnh trạng xe/g, 'tình trạng xe')
    .replace(/Ban tư tìm khách/g, 'Bạn tự tìm khách')
    .replace(/nhân lịch, giao nhân/g, 'nhận lịch, giao nhận')
    .replace(/05 \/ ĐÁNH GIÁ HU VỰC/g, '05 / ĐÁNH GIÁ KHU VỰC')
    .replace(/với có thiết bị/g, 'nếu xe có trang bị thiết bị định vị')
    .replace(/phạm vì hợp đồng/g, 'phạm vi hợp đồng')
    .replace(/cần chuẩn bi/g, 'cần chuẩn bị')
    .replace(/hiểu nhẩm/g, 'hiểu nhầm')
    .replace(/thời gian rãnh/g, 'thời gian rảnh')
    .replace(/nhầm tư vấn hợp tác/g, 'nhằm tư vấn hợp tác')
    .replace(/Mô phòng thu nhập/g, 'Mô phỏng thu nhập')
    .replace(/tỷ lệ chia sẻ và khoản chỉ áp dụng trước khi ký/g, 'tỷ lệ chia sẻ và các điều khoản chỉ áp dụng khi hai bên thống nhất ký hợp đồng')
    .replace(/05\s*\/\s*0\s*VỰC/gi, '05 / ĐÁNH GIÁ KHU VỰC')
    .replace(/05 \/ Đánh giá xe &amp; khu vực/g, '05 / Đánh giá khu vực')
    .replace(/07 \/ TRÁCH NHIỆM &amp; XỬ TÌNH HUỐNG/gi, '07 / TRÁCH NHIỆM &amp; XỬ LÝ TÌNH HUỐNG')
    .replace(/08 \/ CHUẨN BỊ TRƯỚC THẨM ĐỊNH/gi, '08 / CHUẨN BỊ TRƯỚC KHI THẨM ĐỊNH')
    .replace(/Hồ sơ thông tin cần chuẩn hi/gi, 'Hồ sơ &amp; thông tin cần chuẩn bị')
    .replace(/>\s*TCH PHỐI HỢP\s*</g, '><')
    .replace(/không mờ lịch/gi, 'không mở lịch')
    .replace(/ngày đã mờ lịch/gi, 'ngày đã mở lịch')
    .replace(/chình lại/gi, 'chỉnh lại')
    .replace(/Quy đồi/gi, 'Quy đổi')
    .replace(/lân cân/gi, 'lân cận')
    .replace(/Đồng kiếm/gi, 'Đồng kiểm')
    .replace(/đù ngày/gi, 'đủ ngày')
    .replace('</div></section>\n<section class="section" id="van-hanh">', '<div class="section-cta"><div><b>Đã có phương án phù hợp?</b><span>Gửi thông tin để được trao đổi theo đúng xe và khu vực của bạn.</span></div><a class="btn dark" href="#dang-ky">Gửi thông tin xe ↗</a></div></div></section>\n<section class="section" id="van-hanh">')
    .replace('<section class="section soft" id="cau-hoi">', `${PARTNER_RESPONSIBILITY_MARKUP}<section class="section soft" id="cau-hoi">`)
    .replace('<details><summary>Tôi giới thiệu một chủ xe khác thì có quyền lợi gì?</summary>', '<details><summary>Tôi giới thiệu một chủ xe khác thì có quyền lợi gì?</summary>')
    .replace('</div><div class="faq-micro">', '<details><summary>Trách nhiệm và điều kiện hợp tác được xác nhận ở đâu?</summary><p>Phạm vi công việc, quyền sử dụng xe, cách bàn giao, đối soát, bảo hiểm và xử lý phát sinh cần được ghi trong xác nhận hoặc hợp đồng áp dụng cho phương án cụ thể.</p></details><details><summary>Tôi cần chuẩn bị gì trước khi gửi thông tin?</summary><p>Bạn nên chuẩn bị thông tin hiện trạng xe, giấy tờ và bảo hiểm, lịch rảnh, khu vực giao nhận cùng các kỳ vọng hoặc điều kiện riêng để Car Match thẩm định đầy đủ hơn.</p></details><details><summary>Nếu đột xuất cần dùng xe vào ngày đã mở lịch thì sao?</summary><p>Việc đổi hoặc giữ lịch cần tuân theo thời hạn báo trước, giao dịch đã xác nhận và điều khoản trong hợp đồng hoặc biên bản bàn giao. Car Match sẽ phối hợp trao đổi khi nhận được thông tin.</p></details><details><summary>Xe cần những điều kiện bảo hiểm nào?</summary><p>Xe cần có đăng ký, đăng kiểm và bảo hiểm trách nhiệm dân sự bắt buộc còn hiệu lực. Bảo hiểm vật chất và trách nhiệm khi khai thác cho thuê cần được hai bên trao đổi, xác nhận trước khi ký.</p></details><details><summary>Sau khi gửi form bao lâu tôi được phản hồi?</summary><p>Car Match sẽ kiểm tra thông tin xe và khu vực, sau đó liên hệ qua điện thoại hoặc Zalo 0971 163 290 trong khung giờ hỗ trợ để trao đổi bước tiếp theo.</p></details></div><div class="faq-micro">');

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const controller = new AbortController();
    const signal = controller.signal;
    const query = <T extends Element>(selector: string) => root.querySelector<T>(selector);
    const queryAll = <T extends Element>(selector: string) => Array.from(root.querySelectorAll<T>(selector));
    const listen = (target: EventTarget | null, type: string, handler: EventListener) => target?.addEventListener(type, handler, { signal });
    const format = (value: number) => `${Math.round(Number.isFinite(value) ? value : 0).toLocaleString('vi-VN')}đ`;
    const safe = (id: string, limit = 200_000_000) => Math.min(limit, Math.max(0, Number(query<HTMLInputElement>(`#${id}`)?.value) || 0));
    const text = (id: string, value: string) => { const node = query<HTMLElement>(`#${id}`); if (node) node.textContent = value; };
    const setHidden = (id: string, hidden: boolean) => { const node = query<HTMLElement>(`#${id}`); if (node) node.hidden = hidden; };
    const notify = (message: string) => { const toast = query<HTMLElement>('#toast'); if (!toast) return; toast.textContent = message; toast.classList.add('show'); window.setTimeout(() => toast.classList.remove('show'), 3800); };
    const models: Record<string, [number, number]> = {
      'VinFast VF3': [6_000_000, 550_000], 'VinFast VF5': [9_000_000, 800_000], 'VinFast VF6': [12_000_000, 950_000],
      'VinFast VF7 / VF8': [16_000_000, 1_300_000], 'VinFast Fadil': [6_500_000, 600_000], 'Mazda 3': [9_500_000, 850_000],
      'Mazda CX-5': [13_000_000, 1_150_000], 'Hyundai Accent': [7_800_000, 700_000], 'Toyota Vios': [7_500_000, 680_000],
      'Honda City': [8_500_000, 750_000], 'Mitsubishi Xpander': [12_000_000, 1_000_000], 'Kia Carnival': [18_000_000, 1_550_000],
    };
    const tiers = [{ label: 'Thấp', ratio: 0.8 }, { label: 'Tiêu chuẩn', ratio: 1 }, { label: 'Cao', ratio: 1.25 }];
    let mode: 'monthly' | 'daily' = 'monthly';
    let outcome = { gross: 0, afterOperating: 0, afterLoan: 0, expenses: 0, loan: 0, period: 0, variableTotal: 0, breakEven: null as number | null };
    let calcCarryover = '';
    let requestText = '';
    let pendingLead: Record<string, string> | null = null;
    let pendingIdempotencyKey = makeIdempotencyKey();
    let calculatorTracked = false;
    let formOpenTracked = false;
    const journey = new Set<string>(['Mở trang /hop-tac']);
    const addJourney = (step: string) => journey.add(step);
    const trackCalculatorUse = (action: string) => {
      addJourney(`Dùng bộ mô phỏng (${mode === 'monthly' ? 'theo tháng' : 'ngày rảnh'})`);
      if (calculatorTracked) return;
      calculatorTracked = true;
      trackEvent('cm_partner_calculator_use', { action, lead_source: 'partner_landing', form_type: mode });
    };
    const trackFormOpen = (source: string) => {
      addJourney(`Mở form từ ${source}`);
      if (formOpenTracked) return;
      formOpenTracked = true;
      trackEvent('cm_partner_form_open', { source, lead_source: 'partner_landing', form_type: mode });
    };

    const refreshQuickButtons = () => {
      const model = models[query<HTMLSelectElement>('#carModelCalc')?.value || ''] || [safe('monthlyTarget'), safe('dayPrice')];
      ([['monthlyTarget', model[0], 100_000], ['dayPrice', model[1], 50_000]] as [string, number, number][]).forEach(([id, base, step]) => {
        const current = safe(id);
        queryAll<HTMLButtonElement>(`[data-quick="${id}"] .mini-quick`).forEach((button, index) => {
          const value = Math.round(base * tiers[index].ratio / step) * step;
          button.dataset.val = String(value);
          button.textContent = `${tiers[index].label} · ${value >= 1_000_000 ? `${(value / 1_000_000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} triệu` : `${Math.round(value / 1000).toLocaleString('vi-VN')}k`}`;
          button.setAttribute('aria-pressed', String(value === current));
        });
      });
      queryAll<HTMLButtonElement>('[data-quick="daysAvailable"] .mini-quick').forEach((button) => button.setAttribute('aria-pressed', String(Number(button.dataset.val) === safe('daysAvailable', 31))));
    };

    const render = () => {
      const expenses = safe('expenses');
      const loan = query<HTMLInputElement>('#loanEnabled')?.checked ? safe('loanPayment') : 0;
      const variable = safe('variableCost', 5_000_000);
      let gross = 0; let count = safe('months', 12);
      if (mode === 'monthly') gross = safe('monthlyTarget');
      else { gross = safe('daysAvailable', 31) * safe('dayPrice', 10_000_000) * safe('ownerShare', 100) / 100; count = 1; }
      const variableTotal = mode === 'daily' ? safe('daysAvailable', 31) * variable : 0;
      const operatingCost = expenses + variableTotal;
      const afterOperating = gross - operatingCost;
      const afterLoan = afterOperating - loan;
      const period = afterLoan * count;
      const contribution = safe('dayPrice', 10_000_000) * safe('ownerShare', 100) / 100 - variable;
      const breakEven = mode === 'daily' && contribution > 0 ? Math.ceil((expenses + loan) / contribution) : null;
      outcome = { gross, afterOperating, afterLoan, expenses, loan, period, variableTotal, breakEven };
      text('resultHeadline', mode === 'monthly' ? 'Hợp tác theo tháng' : 'Ủy thác theo ngày'); text('resultDescription', 'Kết quả theo các đầu vào bạn đang điều chỉnh.');
      text('grossValue', format(gross)); text('expenseValue', format(expenses)); text('variableValue', format(variableTotal)); text('netValue', format(afterLoan));
      text('metricLabel', loan > 0 ? 'Dòng tiền sau chi phí và trả góp / tháng' : 'Dòng tiền sau chi phí vận hành / tháng'); text('periodValue', format(afterOperating)); text('loanValue', format(loan));
      setHidden('variableRow', mode !== 'daily'); setHidden('cashWarning', afterLoan >= 0);
      if (mode === 'daily') {
        text('secondaryLabel', 'Dòng tiền sau chi phí và trả góp / tháng');
        text('totalOutValue', format(afterLoan));
        text('breakEvenLabel', 'Số ngày thuê cần để bù chi phí'); text('breakEvenValue', breakEven === null ? 'Chưa tính được' : `${breakEven} ngày/tháng`);
        text('breakEvenHelp', breakEven === null ? 'Khoản thu còn lại mỗi ngày chưa đủ dương theo giả định.' : `Bạn thử ${safe('daysAvailable', 31)} ngày thuê/tháng. ${breakEven <= safe('daysAvailable', 31) ? 'Mức thử này có thể bù các khoản chi đã nhập.' : 'Số ngày đang thử chưa bù các khoản chi và trả góp đã nhập.'}`);
      } else {
        text('secondaryLabel', `Dòng tiền theo kỳ thử (${count} tháng)`);
        text('totalOutValue', format(period));
        text('breakEvenLabel', 'Lợi nhuận kinh tế'); text('breakEvenValue', 'Chưa tính');
        text('breakEvenHelp', 'Lợi nhuận kinh tế chưa tính vì công cụ không định lượng khấu hao, thuế, nhu cầu thuê và rủi ro vận hành.');
      }
      ['monthlyTarget', 'dayPrice', 'expenses', 'loanPayment', 'variableCost'].forEach((id) => text(`${id}Display`, format(safe(id)))); refreshQuickButtons();
    };
    const setMode = (next: string) => {
      mode = next === 'daily' ? 'daily' : 'monthly';
      queryAll<HTMLElement>('.mode').forEach((element) => { const active = element.dataset.mode === mode; element.classList.toggle('active', active); element.setAttribute('aria-pressed', String(active)); });
      setHidden('monthlyFields', mode !== 'monthly'); setHidden('dailyFields', mode !== 'daily'); setHidden('dailyVariableWrap', mode !== 'daily');
      text('calc-title', mode === 'monthly' ? 'Thử phương án theo tháng' : 'Thử phương án theo ngày rảnh'); text('calc-intro', mode === 'monthly' ? 'Điều chỉnh mức thu kỳ vọng, thời hạn và chi phí nuôi xe để xem dòng tiền tham khảo.' : 'Điều chỉnh số ngày khai thác, đơn giá, tỷ lệ và chi phí phát sinh để xem một kịch bản tham khảo.');
      const requestMode = query<HTMLSelectElement>('#requestMode'); if (requestMode) requestMode.value = mode; render();
    };
    const renderModelDefaults = () => {
      const values = models[query<HTMLSelectElement>('#carModelCalc')?.value || ''];
      if (values) { const monthly = query<HTMLInputElement>('#monthlyTarget'); const daily = query<HTMLInputElement>('#dayPrice'); if (monthly) monthly.value = String(values[0]); if (daily) daily.value = String(values[1]); }
      render();
    };
    const modelDraft = () => {
      const model = query<HTMLSelectElement>('#carModelCalc')?.value || ''; const region = query<HTMLSelectElement>('#regionCalc')?.value || '';
      const lines = [`MÔ PHỎNG KHAI THÁC XE`, `Hình thức: ${mode === 'monthly' ? 'Theo tháng' : 'Ủy thác ngày rảnh'}`, `Xe: ${model}`, `Khu vực: ${region}`, `Mức thu kỳ vọng/tháng: ${format(outcome.gross)}`, `Chi phí nuôi xe nhập/tháng: ${format(outcome.expenses)}`, `Chi phí phát sinh theo lịch thuê/tháng: ${format(outcome.variableTotal)}`, `Dòng tiền sau chi phí vận hành/tháng: ${format(outcome.afterOperating)}`, `Trả góp mỗi tháng: ${format(outcome.loan)}`, `Dòng tiền sau chi phí và trả góp/tháng: ${format(outcome.afterLoan)}`];
      if (mode === 'monthly') lines.push(`Thời hạn thử: ${query<HTMLSelectElement>('#months')?.value} tháng`, `Mức thu kỳ vọng/tháng: ${format(safe('monthlyTarget'))}`);
      else lines.push(`Giá thuê giả định/ngày: ${format(safe('dayPrice'))}`, `Ngày thuê giả định: ${query<HTMLInputElement>('#daysAvailable')?.value}`, `Lịch ưu tiên giữ xe: ${query<HTMLSelectElement>('#daysText')?.value || 'Lịch linh hoạt'}`, `Tỷ lệ giả định: ${query<HTMLInputElement>('#ownerShare')?.value}%`, `Chi phí mỗi ngày thuê: ${format(safe('variableCost'))}`, `Điểm hòa vốn mô phỏng: ${outcome.breakEven === null ? 'chưa tính được' : `${outcome.breakEven} ngày/tháng`}`);
      lines.push('Đây là dòng tiền theo đầu vào tự điều chỉnh, không phải dự báo doanh thu hay lợi nhuận kinh tế. Phương án áp dụng sẽ được trao đổi theo xe và hợp đồng.'); return lines.join('\n');
    };
    const formDraft = () => {
      const car = query<HTMLInputElement>('#carModel')?.value.trim() || ''; const region = query<HTMLSelectElement>('#location')?.value || query<HTMLSelectElement>('#regionCalc')?.value || '';
      const availability = query<HTMLSelectElement>('#availability')?.value || ''; const readiness = query<HTMLSelectElement>('#readiness')?.value || '';
      const parts = ['HỎI HỢP TÁC CHỦ XE CAR MATCH', `Hình thức: ${mode === 'monthly' ? 'Theo tháng' : 'Theo ngày rảnh'}`]; const year = query<HTMLInputElement>('#year')?.value; const name = query<HTMLInputElement>('#name')?.value.trim(); const phone = query<HTMLInputElement>('#phone')?.value.trim(); const comment = query<HTMLTextAreaElement>('#comment')?.value.trim();
      if (car) parts.push(`Xe: ${car}`); if (year) parts.push(`Năm sản xuất: ${year}`); if (region) parts.push(`Khu vực: ${region}`); if (availability) parts.push(`Lịch có thể khai thác: ${availability}`); if (readiness) parts.push(`Tình trạng sẵn sàng: ${readiness}`); if (name) parts.push(`Họ tên: ${name}`); if (phone) parts.push(`Số điện thoại: ${phone}`); if (comment) parts.push(`Ghi chú: ${comment}`); return parts.join('\n');
    };
    const openModal = (modal: HTMLElement, trigger: HTMLElement | null) => { modal.classList.add('show'); modal.hidden = false; document.body.style.overflow = 'hidden'; (modal.querySelector('button') as HTMLElement | null)?.focus(); if (trigger) modal.dataset.returnFocus = trigger.id; };
    const closeModal = (modal: HTMLElement) => { modal.classList.remove('show'); modal.hidden = true; document.body.style.overflow = ''; const returnId = modal.dataset.returnFocus; if (returnId) query<HTMLElement>(`#${returnId}`)?.focus(); };
    const docs = query<HTMLElement>('#docsModal'); const review = query<HTMLElement>('#reviewModal'); const reviewBody = query<HTMLElement>('#reviewBody');
    const ensureConfirmButton = () => {
      const actions = query<HTMLElement>('#reviewModal .modal-actions'); if (!actions || query('#submitLeadConfirm')) return;
      const button = document.createElement('button'); button.type = 'button'; button.id = 'submitLeadConfirm'; button.className = 'btn dark'; button.textContent = 'Gửi yêu cầu thực tế'; actions.prepend(button);
      listen(button, 'click', async () => {
        if (!pendingLead || button.disabled) return; button.disabled = true; button.textContent = 'Đang lưu…';
        const response = await submitLead({ ...pendingLead, source: 'partner', idempotency_key: pendingIdempotencyKey } as Parameters<typeof submitLead>[0]);
        trackLeadSubmit(response.ok ? 'success' : 'error', { lead_source: 'partner_landing', form_type: pendingLead.form_type, car_model: pendingLead.car_model, error_message: response.error });
        if (!response.ok) { button.disabled = false; button.textContent = 'Thử lưu lại'; notify(response.error || 'Chưa lưu được yêu cầu. Vui lòng thử lại.'); return; }
        closeModal(review!); notify('Đã lưu yêu cầu. Car Match sẽ liên hệ sau khi tiếp nhận và kiểm tra sơ bộ.'); pendingLead = null; pendingIdempotencyKey = makeIdempotencyKey();
      });
    };

    ['monthlyTarget', 'dayPrice', 'expenses', 'loanPayment', 'variableCost', 'months', 'daysAvailable', 'ownerShare'].forEach((id) => listen(query(`#${id}`), 'input', () => { trackCalculatorUse(`input_${id}`); render(); }));
    listen(query('#loanEnabled'), 'change', () => { trackCalculatorUse('toggle_loan'); setHidden('loanDetails', !(query<HTMLInputElement>('#loanEnabled')?.checked)); render(); });
    listen(query('#carModelCalc'), 'change', () => { trackCalculatorUse('select_model'); renderModelDefaults(); });
    listen(query('#regionCalc'), 'change', () => trackCalculatorUse('select_region'));
    queryAll<HTMLButtonElement>('.mini-quick').forEach((button) => listen(button, 'click', () => { trackCalculatorUse('quick_select'); const input = query<HTMLInputElement>(`#${button.parentElement?.dataset.quick || ''}`); if (input && button.dataset.val) input.value = button.dataset.val; render(); }));
    queryAll<HTMLElement>('.mode').forEach((element) => listen(element, 'click', () => { setMode(element.dataset.mode || 'monthly'); addJourney(`Chọn hình thức ${mode === 'monthly' ? 'theo tháng' : 'ngày rảnh'}`); trackEvent('cm_partner_mode_select', { lead_source: 'partner_landing', form_type: mode }); query('#thu-nhap')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }));
    listen(query('#requestMode'), 'change', (event) => setMode((event.target as HTMLSelectElement).value));
    listen(query('#calcCTA'), 'click', () => {
      const model = query<HTMLSelectElement>('#carModelCalc')?.value || ''; const region = query<HTMLSelectElement>('#regionCalc')?.value || ''; const car = query<HTMLInputElement>('#carModel'); const location = query<HTMLSelectElement>('#location'); const availability = query<HTMLSelectElement>('#availability'); const readiness = query<HTMLSelectElement>('#readiness'); const comment = query<HTMLTextAreaElement>('#comment');
      const dayPreference = query<HTMLSelectElement>('#daysText')?.value || 'Lịch linh hoạt';
      const syncedAvailability = dayPreference === 'Cuối tuần' || dayPreference === 'Ngày thường' ? dayPreference : 'Lịch thay đổi';
      if (car) car.value = model; if (location) location.value = region; if (availability) availability.value = mode === 'monthly' ? 'Trọn tháng' : syncedAvailability; if (readiness && !readiness.value) readiness.value = 'Đang tìm hiểu'; calcCarryover = modelDraft(); setHidden('calcCarryover', false); text('calcCarryoverText', `${model} · ${region} · ${format(outcome.afterLoan)}/tháng sau các khoản đã nhập`);
      if (comment) comment.value = `${comment.value.replace(new RegExp(`\\n?${SIMULATION_START}[\\s\\S]*?${SIMULATION_END}`, 'g'), '').trim()}${comment.value.trim() ? '\n\n' : ''}${SIMULATION_START}\n${calcCarryover}\n${SIMULATION_END}`;
      trackCalculatorUse('calc_to_form'); trackFormOpen('calculator_result');
    });
    listen(query('#clearCarryover'), 'click', () => { calcCarryover = ''; setHidden('calcCarryover', true); const comment = query<HTMLTextAreaElement>('#comment'); if (comment) comment.value = comment.value.replace(new RegExp(`\\n?${SIMULATION_START}[\\s\\S]*?${SIMULATION_END}`, 'g'), '').trim(); });
    listen(query('#copyCalc'), 'click', async (event) => { trackCalculatorUse('copy_result'); const button = event.currentTarget as HTMLButtonElement; const original = button.textContent; button.textContent = (await copyToClipboard(modelDraft())) ? 'Đã sao chép ✓' : 'Chưa thể sao chép'; window.setTimeout(() => { button.textContent = original; }, 1600); });
    listen(query('#partnerForm'), 'submit', (event) => {
      event.preventDefault(); const form = event.currentTarget as HTMLFormElement; if (!form.reportValidity()) return; const data = new FormData(form); const comment = String(data.get('comment') || '');
      const carModel = String(data.get('car_model') || '').trim(); const carYear = String(data.get('car_year') || '').trim(); const availability = String(data.get('availability') || '').trim(); const readiness = String(data.get('readiness') || '').trim();
      const requestLines = ['YÊU CẦU TƯ VẤN HỢP TÁC CHỦ XE CAR MATCH', `Hình thức: ${data.get('form_type') === 'monthly' ? 'Theo tháng' : 'Ủy thác ngày rảnh'}`, `Họ tên: ${data.get('name')}`, `SĐT: ${data.get('phone')}`];
      if (carModel) requestLines.push(`Mẫu xe: ${carModel}`); if (carYear) requestLines.push(`Năm: ${carYear}`); requestLines.push(`Khu vực: ${data.get('location')}`); if (availability) requestLines.push(`Lịch có thể khai thác: ${availability}`); if (readiness) requestLines.push(`Tình trạng sẵn sàng: ${readiness}`); requestLines.push(`Ghi chú: ${comment || 'Không có'}`); requestText = requestLines.join('\n');
      addJourney('Xem lại và xác nhận yêu cầu');
      pendingLead = { name: String(data.get('name')), phone: String(data.get('phone')), form_type: String(data.get('form_type')), car_model: carModel, building: String(data.get('location')), duration: mode === 'monthly' ? `${query<HTMLSelectElement>('#months')?.value || ''} tháng` : `${query<HTMLInputElement>('#daysAvailable')?.value || ''} ngày/tháng`, note: [`lead_source=partner_landing`, `partner_mode=${mode}`, comment, carYear ? `Đời xe: ${carYear}` : '', availability ? `Lịch có thể khai thác: ${availability}` : '', readiness ? `Tình trạng sẵn sàng: ${readiness}` : '', `Hành trình: ${Array.from(journey).join(' → ')}`].filter(Boolean).join('\n') };
      if (reviewBody) reviewBody.textContent = requestText; ensureConfirmButton(); openModal(review!, (event as SubmitEvent).submitter as HTMLElement | null); trackLeadSubmit('attempt', { lead_source: 'partner_landing', form_type: String(data.get('form_type')), car_model: String(data.get('car_model')) });
    });
    listen(query('#closeModal'), 'click', () => closeModal(review!)); listen(query('#closeDocs'), 'click', () => closeModal(docs!));
    listen(query('#reviewModal'), 'click', (event) => { if (event.target === review) closeModal(review!); }); listen(query('#docsModal'), 'click', (event) => { if (event.target === docs) closeModal(docs!); });
    const openDocumentModal = (event: Event) => { addJourney('Mở checklist 15 điểm'); trackEvent('cm_partner_document_open', { document: 'checklist_15_diem', lead_source: 'partner_landing' }); openModal(docs!, event.currentTarget as HTMLElement); };
    listen(query('#openDocs'), 'click', openDocumentModal); listen(query('#openDocsFaq'), 'click', openDocumentModal);
    listen(query('#openChecklistDocument'), 'click', () => { addJourney('Mở tài liệu checklist đầy đủ'); trackEvent('cm_partner_document_open', { document: 'checklist_15_diem_full', lead_source: 'partner_landing' }); });
    listen(query('#copyChecklist'), 'click', async (event) => { const button = event.currentTarget as HTMLButtonElement; const original = button.textContent; const content = queryAll<HTMLElement>('.inspection-list li').map((item) => item.textContent?.trim()).join('\n'); button.textContent = (await copyToClipboard(content)) ? 'Đã sao chép ✓' : 'Chưa thể sao chép'; window.setTimeout(() => { button.textContent = original; }, 1600); });
    listen(query('#copyRequest'), 'click', async (event) => { const button = event.currentTarget as HTMLButtonElement; const original = button.textContent; button.textContent = (await copyToClipboard(requestText)) ? 'Đã sao chép ✓' : 'Chưa thể sao chép'; window.setTimeout(() => { button.textContent = original; }, 1600); });
    listen(query('#copyPageLink'), 'click', async () => notify((await copyToClipboard('https://www.carmatch.vn/hop-tac')) ? 'Đã sao chép link trang.' : 'Chưa thể sao chép link trang.'));
    queryAll<HTMLButtonElement>('[data-zalo-context]').forEach((button) => listen(button, 'click', async () => { const type = button.dataset.zaloContext; addJourney(`Mở Zalo (${type || 'unknown'})`); const content = type === 'review' && requestText ? requestText : type === 'form' ? formDraft() : modelDraft(); const popup = window.open('about:blank', '_blank'); const copied = await copyToClipboard(content); notify(copied ? 'Đã sao chép thông tin xe. Bạn chỉ cần dán vào Zalo để được tư vấn.' : 'Trình duyệt chưa cho phép sao chép tự động. Hãy dùng nút Sao chép rồi dán vào Zalo.'); trackZaloClick(`partner_${type || 'unknown'}`, { lead_source: 'partner_landing', form_type: mode }); if (popup) popup.location.href = ZALO_LINK; else window.location.href = ZALO_LINK; }));
    queryAll<HTMLAnchorElement>('a[href="#dang-ky"]').forEach((anchor) => listen(anchor, 'click', () => trackFormOpen(anchor.id || anchor.textContent?.trim() || 'anchor')));
    queryAll<HTMLAnchorElement>('a[href^="tel:"]').forEach((anchor) => listen(anchor, 'click', () => trackEvent('cm_phone_click', { source: 'partner_form', lead_source: 'partner_landing' })));
    listen(query('#partnerForm'), 'focusin', () => trackFormOpen('form_focus'));
    const faqColumn = query<HTMLElement>('#cau-hoi .faq-grid > div:nth-child(2)');
    if (faqColumn && !faqColumn.querySelector(':scope > .faq-more')) {
      const faqItems = Array.from(faqColumn.querySelectorAll<HTMLDetailsElement>(':scope > details'));
      if (faqItems.length > 6) {
        const more = document.createElement('details'); more.className = 'faq-more';
        const summary = document.createElement('summary'); summary.textContent = `Xem thêm ${faqItems.length - 6} câu hỏi`;
        const list = document.createElement('div'); list.className = 'faq-more-list'; faqItems.slice(6).forEach((item) => list.appendChild(item));
        more.append(summary, list); faqColumn.appendChild(more);
      }
    }
    const mobileCta = query<HTMLElement>('.mobile-cta'); const formSection = query<HTMLElement>('#dang-ky');
    const formObserver = mobileCta && formSection && 'IntersectionObserver' in window
      ? new IntersectionObserver(([entry]) => mobileCta.classList.toggle('is-hidden', entry.isIntersecting), { threshold: 0.08 })
      : null;
    if (formObserver && formSection) formObserver.observe(formSection);
    listen(document, 'keydown', (event) => { const modal = docs?.classList.contains('show') ? docs : review?.classList.contains('show') ? review : null; if (!modal) return; const keyboard = event as KeyboardEvent; if (keyboard.key === 'Escape') { closeModal(modal); return; } if (keyboard.key === 'Tab') { const focusable = queryAll<HTMLElement>('.modal.show a[href], .modal.show button:not([disabled]), .modal.show input:not([disabled]), .modal.show textarea:not([disabled])').filter((item) => item.getClientRects().length); if (!focusable.length) return; const first = focusable[0]; const last = focusable[focusable.length - 1]; if (keyboard.shiftKey && document.activeElement === first) { keyboard.preventDefault(); last.focus(); } else if (!keyboard.shiftKey && document.activeElement === last) { keyboard.preventDefault(); first.focus(); } } });
    setMode('monthly'); renderModelDefaults();
    return () => { controller.abort(); formObserver?.disconnect(); document.body.style.overflow = ''; };
  }, []);

  return <div ref={rootRef} className="partner-preview-root" dangerouslySetInnerHTML={{ __html: previewMarkup }} />;
}
