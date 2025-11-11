// // --- Start ---
// await page.goto('http://localhost:5174/sessions', { waitUntil: 'networkidle2' });

// // ✅ Skip "Create New Session"
// await page.waitForSelector('div[role="dialog"]', { visible: true, timeout: 10000 });

// // --- DOM CLICK HELPER (IDE safe) ---
// async function domClick(page, el) {
//   await page.evaluate((element) => {
//     if (!element) return;
//     const rect = element.getBoundingClientRect();
//     const clickEvent = new MouseEvent('click', {
//       bubbles: true,
//       cancelable: true,
//       view: window,
//       button: 0,
//       clientX: rect.x + rect.width / 2,
//       clientY: rect.y + rect.height / 2
//     });
//     element.dispatchEvent(clickEvent);
//   }, el);
//   await page.waitForTimeout(60);
// }

// // --- FAST TYPE HELPER ---
// async function fastType(page, selector, text) {
//   await page.evaluate(
//     (sel, val) => {
//       const el = document.querySelector(sel);
//       if (!el) return;
//       el.value = val;
//       el.dispatchEvent(new Event('input', { bubbles: true }));
//       el.dispatchEvent(new Event('change', { bubbles: true }));
//     },
//     selector,
//     text
//   );
//   await page.waitForTimeout(80);
// }

// // --- COURSE SELECT ---
// {
//   const [trigger] = await page.$x("//div[@role='dialog']//button[contains(., 'Select a course')]");
//   if (!trigger) throw new Error('Course Select trigger not found');
//   await domClick(page, trigger);

//   await page.waitForSelector('[data-radix-popper-content-wrapper]', { visible: true, timeout: 10000 });

//   let opts = await page.$x("//div[@role='option' and normalize-space(.)='CS102']");
//   if (!opts?.length) {
//     opts = await page.$x("//*[contains(@data-radix-popper-content-wrapper,'')]//div[@role='option' and normalize-space(.)='CS102']");
//   }
//   if (!opts?.length) throw new Error('CS102 option not found');
//   await domClick(page, opts[0]);

//   await page.waitForXPath("//div[@role='dialog']//button[contains(., 'CS102')]", { timeout: 5000 });
//   await page.waitForXPath("//label[contains(., 'Students Enrolled in CS102')]", { timeout: 10000 });
//   await page.waitForTimeout(400);
// }

// // --- STUDENT SELECT ---
// {
//   const [studentsTrigger] = await page.$x("//div[@role='dialog']//button[contains(., 'Select students') or contains(., 'selected')]");
//   if (!studentsTrigger) throw new Error('Students popover trigger not found');
//   await domClick(page, studentsTrigger);

//   await page.waitForSelector('[cmdk-list]', { visible: true, timeout: 10000 });
//   await page.waitForFunction(() => document.querySelectorAll('[cmdk-item]').length > 0, { timeout: 10000 });
//   const totalItems = await page.evaluate(() => document.querySelectorAll('[cmdk-item]').length);

//   for (let i = 0; i < totalItems; i++) {
//     if (!(await page.$('[cmdk-list]'))) {
//       await domClick(page, studentsTrigger);
//       await page.waitForSelector('[cmdk-list]', { visible: true, timeout: 10000 });
//       await page.waitForFunction((n) => document.querySelectorAll('[cmdk-item]').length >= n, { timeout: 10000 }, i + 1);
//     }
//     const itemsNow = await page.$$('[cmdk-item]');
//     if (i >= itemsNow.length) break;
//     await itemsNow[i].evaluate(el => el.scrollIntoView({ block: 'nearest' }));
//     await domClick(page, itemsNow[i]);
//   }

//   await domClick(page, studentsTrigger);
//   if (await page.$('[cmdk-list]')) await page.keyboard.press('Escape');
//   await page.waitForTimeout(60);
// }

// // --- LOCATION INPUT ---
// await page.waitForSelector('#session-location', { visible: true, timeout: 10000 });
// // instantly clear and type text (no key-by-key delay)
// await fastType(page, '#session-location', 'SCIS1 SR2-4');

// // --- CALENDAR HELPERS ---
// async function openCalendarByLabel(labelText) {
//   const [button] = await page.$x(`//div[@role='dialog']//label[contains(., '${labelText}')]//following-sibling::button | //div[@role='dialog']//label[contains(., '${labelText}')]/ancestor::div[1]//button`);
//   if (!button) throw new Error(`Calendar button for '${labelText}' not found.`);
//   await domClick(page, button);
//   await page.waitForSelector('[data-slot="calendar"], .rdp, [role="grid"]', { visible: true, timeout: 5000 });
// }

// async function nextMonth() {
//   const next = await page.locator('[data-slot="calendar"] button[aria-label*="Next month"], .rdp button[aria-label*="Next month"]').first();
//   if (await next.isVisible()) {
//     await next.click();
//     await page.waitForTimeout(150);
//     return true;
//   }
//   return false;
// }

// async function pickDate(targetDate) {
//   const targetDay = targetDate.getDate().toString();
//   for (let i = 0; i < 12; i++) {
//     const buttonHandles = await page.$x(`//*[text()='${targetDay}' and (self::button or @role='gridcell' or @role='button')]`);
//     if (buttonHandles.length) {
//       await domClick(page, buttonHandles[0]);
//       return true;
//     }
//     const advanced = await nextMonth();
//     if (!advanced) break;
//   }
//   return false;
// }

// async function closeCalendar() {
//   await page.waitForSelector('[data-slot="calendar"], .rdp', { state: 'hidden', timeout: 3000 }).catch(() => {});
// }

// // --- DATE AND TIME SECTION ---
// const startDate = new Date();
// startDate.setHours(0, 0, 0, 0);

// const endDate = new Date(startDate);
// endDate.setDate(endDate.getDate() + 7);

// await openCalendarByLabel('Start Date');
// await pickDate(startDate);
// await closeCalendar();

// await openCalendarByLabel('End Date');
// await pickDate(endDate);
// await closeCalendar();

// const timeInputs = await page.$$('div[role="dialog"] input[type="time"]');
// if (timeInputs.length < 2) throw new Error('Time inputs not found');
// await timeInputs[0].evaluate((el, v) => { el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })) }, '11:10');
// await timeInputs[1].evaluate((el, v) => { el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })) }, '15:00');

// // --- SUBMISSION ---
// {
//   const [submitBtn] = await page.$x("//div[@role='dialog']//button[contains(., 'Create Session')]");
//   if (!submitBtn) throw new Error('Create Session button not found');
//   console.log('\n--- Submitting form ---');
//   // await domClick(page, submitBtn);
// }

// await page.waitForFunction(() => !document.querySelector('[role="dialog"]'), { timeout: 10000 }).catch(() => {});
// console.log('\nSession creation dialog closed. Script finished.');