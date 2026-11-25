export const partnerContact = {
  company: 'CÔNG TY TNHH CAR MATCH',
  taxCode: '0110692385',
  registeredAddress: 'Số 3, ngõ 52 Lương Yên, phường Hai Bà Trưng, Hà Nội',
  handoverAreas: ['Tôn Thất Thuyết (Cầu Giấy)', 'Nguyễn Xiển (Thanh Xuân)', 'Vinhomes Ocean Park (Gia Lâm)'],
  phone: '0971163290',
  phoneLabel: '0971 163 290',
  email: 'info@carmatch.vn',
  zalo: 'https://zalo.me/0971163290',
} as const;

export const checklistDocument = '/tai-lieu/checklist-ban-giao-xe-15-diem.html';

export const inspectionItems = [
  '8 ảnh ngoại thất: trước, sau, trái, phải và 4 góc xe',
  'Thân vỏ: vết xước, móp có ảnh đối chiếu',
  'Kính chắn gió, gương và đèn ngoại thất',
  'Lốp và mâm: tình trạng trước chuyến',
  'Nội thất: ghế, trần, sàn và vệ sinh',
  'Mùi nội thất và tình trạng hút thuốc',
  'Điều hòa, cửa kính và màn hình',
  'ODO lúc giao và nhận xe',
  'Mức pin/nhiên liệu khi giao xe',
  'Dây sạc/phụ kiện theo xe nếu có',
  'Chìa khóa và số lượng chìa bàn giao',
  'Giấy tờ theo quy trình giao nhận',
  'Ảnh/video khoang hành lý và cốp',
  'Mốc giờ, địa điểm và người bàn giao',
  'Chữ ký/xác nhận và ghi chú phát sinh',
] as const;

export function makeIdempotencyKey() {
  return globalThis.crypto?.randomUUID?.() || `partner-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export async function copyToClipboard(value: string) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch { /* Try selection-based clipboard access. */ }

  const previousFocus = document.activeElement;
  const input = document.createElement('textarea');
  input.value = value;
  input.readOnly = true;
  input.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
  const openDialog = document.querySelector('dialog[open]');
  (openDialog ?? document.body).appendChild(input);
  try {
    input.select();
    return document.execCommand('copy');
  } catch {
    return false;
  } finally {
    input.remove();
    if (previousFocus instanceof HTMLElement) previousFocus.focus({ preventScroll: true });
  }
}

export async function copyZaloContext(value: string) {
  const popup = window.open('about:blank', '_blank');
  if (popup) popup.opener = null;
  const copied = await copyToClipboard(value);
  if (popup) popup.location.replace(partnerContact.zalo);
  return { copied, opened: Boolean(popup) };
}
