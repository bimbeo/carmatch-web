import { forwardRef, useState, type ComponentPropsWithoutRef, type KeyboardEvent } from 'react';
import { checklistDocument, copyToClipboard, inspectionItems, partnerContact } from '@/lib/ownerPartnership';
import './partnerDialog.css';

function trapTab(event: KeyboardEvent<HTMLDialogElement>) {
  if (event.key !== 'Tab') return;
  const options = Array.from(event.currentTarget.querySelectorAll<HTMLElement>(
    'a[href], button:not(:disabled), textarea:not(:disabled)',
  )).filter((element) => element.getClientRects().length > 0);
  const first = options[0];
  const last = options[options.length - 1];
  if (event.shiftKey && document.activeElement === first && last) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last && first) {
    event.preventDefault();
    first.focus();
  }
}

export const PartnerDialog = forwardRef<HTMLDialogElement, ComponentPropsWithoutRef<'dialog'>>(
  function PartnerDialog({ className, children, ...props }, ref) {
    return <dialog {...props} ref={ref} className={`partner-dialog ${className ?? ''}`}
      onKeyDown={trapTab}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) {
          if (event.currentTarget.getAttribute('aria-busy') !== 'true') {
            event.currentTarget.close();
          }
        }
      }}>
      {children}
    </dialog>;
  },
);

export const PartnerChecklistDialog = forwardRef<HTMLDialogElement, { onDocument?: () => void }>(
  function PartnerChecklistDialog({ onDocument }, ref) {
    const [message, setMessage] = useState('');
    return <PartnerDialog ref={ref} id="docsModal" className="partner-checklist" aria-labelledby="partner-checklist-title" onClose={() => setMessage('')}>
      <div className="partner-dialog-top">
        <div><div className="partner-dialog-kicker">Mẫu tham khảo quy trình</div><h3 id="partner-checklist-title">Biên bản đồng kiểm xe trước và sau chuyến</h3></div>
        <form method="dialog"><button className="partner-dialog-close" aria-label="Đóng biên bản">×</button></form>
      </div>
      <p>15 điểm để đối chiếu hiện trạng khi nhận và trả xe. Hai bên thống nhất biên bản áp dụng theo xe và hợp đồng.</p>
      <ol className="partner-checklist-items">{inspectionItems.map((item) => <li key={item}>{item}</li>)}</ol>
      <h4>5 điều khoản nên xem trước khi ký</h4>
      <p>Đối tượng điều khiển xe · quyền sử dụng và GPS nếu có · xử lý va chạm và bảo hiểm · phạt nguội và ETC · kỳ đối soát và thời hạn thanh toán.</p>
      <div className="partner-dialog-actions">
        <a className="partner-dialog-primary" href={checklistDocument} target="_blank" rel="noopener noreferrer" onClick={onDocument}>Mở tài liệu checklist ↗</a>
        <button type="button" onClick={async () => {
          const content = inspectionItems.map((item, index) => `${index + 1}. ${item}`).join('\n');
          setMessage(await copyToClipboard(content) ? 'Đã sao chép checklist.' : 'Chưa thể sao chép. Bạn có thể chọn nội dung để sao chép thủ công.');
        }}>Sao chép checklist</button>
        <a href={partnerContact.zalo} target="_blank" rel="noopener noreferrer">Hỏi Car Match ↗</a>
      </div>
      <p role="status">{message}</p>
    </PartnerDialog>;
  },
);
