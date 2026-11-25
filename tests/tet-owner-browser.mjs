// Open the local built site with playwright-cli, then run this script with --filename.
async (page) => {
  const origin = new URL(page.url()).origin;
  const path = '/hop-tac-chu-xe-cho-thue-tet';
  const output = 'output/playwright/tet-owner-v1-1';
  const failures = [];
  const errors = [];
  const requests = [];
  const analytics = [];
  const check = (condition, message) => {
    if (!condition) throw new Error(message);
  };
  const stats = () => page.locator('.stats b').allTextContents();
  const assertStats = async (expected) => check((await stats()).join(',') === expected, 'Unexpected schedule counts');
  page.on('pageerror', (error) => failures.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error' && !message.text().includes('status of 500')) errors.push({ message: message.text(), url: message.location().url });
  });
  await page.context().route('https://**/*', (route) => {
    if (route.request().url() === 'https://zalo.me/0971163290') {
      return route.fulfill({ status: 200, body: 'Local Zalo fixture' });
    }
    return route.fulfill({ status: 204 });
  });
  await page.route('**/api/conversion-events', async (route) => {
    analytics.push(route.request().postDataJSON());
    await route.fulfill({ json: { ok: true } });
  });
  await page.route('**/api/leads', async (route) => {
    const req = route.request();
    requests.push({ key: req.headers()['idempotency-key'], data: req.postDataJSON() });
    if (requests.length === 1) return route.fulfill({ status: 500, json: { ok: false, error: 'Lỗi CRM giả lập' } });
    if (requests.length === 2) return route.fulfill({ json: { ok: false } });
    if (requests.length === 3) return route.fulfill({ json: { ok: true, duplicate: true } });
    return route.fulfill({ json: { ok: true } });
  });
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write'], { origin });
  const viewportChecks = [];
  for (const [width, height] of [[1440, 900], [834, 1024], [390, 844], [375, 812]]) {
    await page.setViewportSize({ width, height });
    const response = await page.goto(origin + path);
    check((await response.text()).includes('data-prerendered="tet-owner"'), 'Canonical URL did not serve the prerendered HTML');
    await page.locator('.tet-owner h1').waitFor();
    await page.evaluate(() => document.fonts.ready);
    const result = await page.evaluate(async () => {
      await Promise.all(Array.from(document.querySelectorAll('.tet-owner img'), async (img) => {
        img.loading = 'eager';
        await img.decode();
      }));
      return {
        width: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
        scrollY: window.scrollY,
        h1: document.querySelectorAll('h1').length,
        images: Array.from(document.querySelectorAll('.tet-owner img'), (img) => img.naturalWidth).filter(Boolean).length,
        stylesheet: getComputedStyle(document.querySelector('.tet-owner')).fontFamily,
      };
    });
    check(result.width === width && result.scrollWidth === width && result.scrollY === 0, `Viewport ${width} overflow or unexpected scroll`);
    check(result.h1 === 1 && result.images === 7 && result.stylesheet.includes('Be Vietnam Pro Tet'), 'Page styling or assets missing');
    check((await page.locator('#estimatedOwnerShare').innerText()) === '5.040.000đ', 'Default owner share is incorrect');
    await assertStats('9,9,7,0');
    viewportChecks.push({ width, height, ...result });
    if (width === 1440 || width === 390) await page.screenshot({ path: `${output}/carmatch-tet-owner-${width}.png`, fullPage: true, animations: 'disabled' });
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.getByRole('button', { name: /Chọn lịch du xuân/ }).click();
  await assertStats('8,8,3,2');
  await page.getByRole('button', { name: 'Giữ mùng 1–3', exact: true }).click();
  await assertStats('6,4,4,3');
  check((await page.locator('.insight').innerText()).includes('ngắt quãng'), 'Family preset insight is missing');
  await page.getByRole('button', { name: /Giữ cho gia đình/ }).click();
  const manual = page.locator('[data-date="2027-02-09"]');
  await manual.focus();
  await page.keyboard.press('Space');
  await assertStats('5,3,3,4');
  check(await manual.evaluate((element) => element === document.activeElement), 'Date button lost keyboard focus');
  page.once('dialog', (dialog) => dialog.dismiss());
  await page.locator('[data-preset=clear]').click();
  await assertStats('5,3,3,4');
  page.once('dialog', (dialog) => dialog.accept());
  await page.locator('[data-preset=clear]').click();
  await assertStats('0,0,0,0');
  await page.locator('[data-preset=family]').click();
  await page.locator('#dailyRate').fill('1000000');
  await page.locator('#assumedDays').fill('20');
  await page.locator('#ownerSharePct').fill('75');
  await page.locator('#monthlyCost').fill('2500000');
  check(await page.locator('#assumedDays').inputValue() === '6', 'Booked days were not capped');
  check(await page.locator('#estimatedGross').innerText() === '6.000.000đ', 'Gross estimate is incorrect');
  check(await page.locator('#estimatedOwnerShare').innerText() === '4.500.000đ', 'Owner share is incorrect');
  check((await page.locator('.cost-equivalent').innerText()).includes('1,8 tháng'), 'Cost comparison is incorrect');
  const clipboardButton = page.getByRole('button', { name: 'Sao chép lịch Tết đã chọn' });
  await clipboardButton.click();
  await page.getByText('Đã sao chép lịch xe và phương án tính thử.').waitFor();
  check((await page.evaluate(() => navigator.clipboard.readText())).includes('Mùng 4'), 'Clipboard omitted the second interval');
  const checklist = page.getByRole('button', { name: /Xem biên bản đồng kiểm 15 điểm/ });
  await checklist.click();
  const documents = page.getByRole('dialog', { name: /Biên bản đồng kiểm/ });
  await documents.waitFor();
  check(await documents.getByRole('listitem').count() === 15, 'Checklist must contain 15 items');
  await documents.getByRole('button', { name: 'Đóng biên bản' }).focus();
  await page.keyboard.press('Shift+Tab');
  check(await documents.getByRole('link', { name: /Hỏi Car Match/ }).evaluate((element) => element === document.activeElement), 'Checklist did not trap keyboard focus');
  await page.keyboard.press('Escape');
  await documents.waitFor({ state: 'hidden' });
  check(await checklist.evaluate((element) => element === document.activeElement), 'Checklist did not restore focus');
  await page.getByText('Thêm mẫu xe và năm sản xuất').click();
  await page.locator('#carNameCalc').fill('VF6 2025');
  await page.locator('#regionCalc').selectOption({ label: 'Cầu Giấy / Tôn Thất Thuyết' });
  await page.getByRole('button', { name: /Gửi lịch xe để nhận phương án/ }).click();
  check(await page.locator('#ownerRegion').inputValue() === 'Cầu Giấy / Tôn Thất Thuyết', 'Region did not carry over');
  check(await page.locator('#carName').inputValue() === 'VF6 2025', 'Car model did not carry over');
  check(await page.locator('#ownerType').inputValue() === 'flexible', 'Schedule class did not carry over');
  check((await page.locator('#formScheduleSummary').innerText()).includes('4.500.000đ'), 'Calculator did not carry over');
  await page.locator('#ownerName').fill('Chủ xe kiểm thử');
  await page.locator('#ownerPhone').fill('0900000000');
  await page.locator('#carName').fill('VF6 2025');
  await page.locator('#carCount').fill('2');
  await page.locator('#ownerNote').fill('Xe thứ hai có lịch riêng.');
  const reviewButton = page.getByRole('button', { name: /Xem lại đăng ký/ });
  await reviewButton.click();
  check(!await page.locator('#reviewModal').isVisible(), 'Consent was not enforced');
  await page.locator('#consent').check();
  await reviewButton.click();
  const review = page.getByRole('dialog', { name: /Thông tin chủ xe và lịch Tết/ });
  await review.waitFor();
  check((await review.locator('pre').innerText()).includes('Xe thứ hai có lịch riêng.'), 'Review omitted the notes');
  await review.getByRole('button', { name: 'Gửi đăng ký hợp tác Tết' }).click();
  await review.getByText('Lỗi CRM giả lập').waitFor();
  await review.getByRole('button', { name: 'Thử gửi lại' }).click();
  await review.getByText(/Máy chủ chưa xác nhận/).waitFor();
  check(await page.locator('#carName').inputValue() === 'VF6 2025', 'Failed request lost form data');
  await review.getByRole('button', { name: 'Thử gửi lại' }).click();
  await page.getByText(/Car Match đã nhận đăng ký/).waitFor();
  check(requests[0].key && requests[0].key === requests[1].key && requests[1].key === requests[2].key, 'Retry used a fresh idempotency key');
  check(requests[0].data.source === 'partner' && requests[0].data.note.includes('lead_source=partner_tet_2027'), 'CRM campaign tag missing');
  check(requests[0].data.note.includes('"lead_class":"multi"') && requests[0].data.note.includes('"start":"2027-02-09"'), 'CRM details are incomplete');
  await reviewButton.click();
  check(await review.getByRole('button', { name: 'Gửi đăng ký hợp tác Tết' }).isDisabled(), 'Identical submission can be sent again');
  await review.getByRole('button', { name: 'Quay lại chỉnh sửa' }).click();
  await page.locator('#ownerNote').fill('Kiểm thử yêu cầu mới.');
  await reviewButton.click();
  await review.getByRole('button', { name: 'Gửi đăng ký hợp tác Tết' }).click();
  await review.waitFor({ state: 'hidden' });
  check(requests[3].key !== requests[0].key, 'Edited lead must have a new key');
  const tracked = analytics.filter((entry) => entry.event_name === 'cm_lead_submit_success');
  check(tracked.length === 1, 'Analytics recorded a duplicate or failed lead as successful');
  check(!JSON.stringify(analytics).includes('0900000000') && !JSON.stringify(analytics).includes('Chủ xe kiểm thử'), 'PII leaked into analytics');
  const popupPromise = page.waitForEvent('popup');
  await page.getByRole('button', { name: 'Trao đổi trước qua Zalo ↗' }).click();
  const popup = await popupPromise;
  await popup.waitForURL('https://zalo.me/0971163290');
  await popup.close();
  await page.bringToFront();
  check((await page.evaluate(() => navigator.clipboard.readText())).includes('HỢP TÁC CHỦ XE TẾT'), 'Zalo context did not reach the clipboard');
  await page.evaluate(() => {
    navigator.clipboard.writeText = () => Promise.reject(new Error('Unavailable'));
    document.execCommand = () => false;
    window.open = () => null;
  });
  await page.getByRole('button', { name: 'Trao đổi trước qua Zalo ↗' }).click();
  const fallback = page.getByRole('dialog', { name: 'Sao chép thông tin xe và lịch' });
  await fallback.waitFor();
  check((await fallback.getByRole('textbox').inputValue()).includes('4.500.000đ'), 'Manual copy fallback omitted context');
  check(await fallback.getByRole('link', { name: /Mở Zalo/ }).getAttribute('href') === 'https://zalo.me/0971163290', 'Blocked popup did not expose the Zalo link');
  await page.keyboard.press('Escape');
  await page.goto(origin + '/hop-tac');
  const partnerChecklist = page.locator('#openDocs');
  await partnerChecklist.waitFor();
  await partnerChecklist.click();
  await documents.waitFor();
  check(await documents.getByRole('listitem').count() === 15, 'Annual partnership lost the checklist');
  await page.keyboard.press('Escape');
  await documents.waitFor({ state: 'hidden' });
  check(await partnerChecklist.evaluate((element) => element === document.activeElement), 'Annual partnership lost focus after Escape');
  check(await page.locator('#partnerForm').count() === 1, 'Annual partnership form was lost');
  check(await page.getByRole('link', { name: /Hợp tác xe dịp Tết/ }).count() > 0, 'Annual partnership lost the Tet internal link');
  check(failures.length === 0 && errors.length === 0, `Browser errors: ${JSON.stringify({ failures, errors })}`);
  return { viewportChecks, scenarios: 'Calendar, calculator, clipboard, Zalo, confirmation, mock API error and idempotency, analytics privacy, annual partnership', requests: requests.length };
}
