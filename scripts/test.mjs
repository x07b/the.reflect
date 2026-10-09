import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
mkdirSync('test-results', {recursive:true});
const browser=await chromium.launch({headless:true});
const results=[];
try {
  for (const mode of ['desktop','mobile','reduced']) {
    const context=await browser.newContext({viewport:mode==='mobile'?{width:390,height:844}:{width:1440,height:1000},isMobile:mode==='mobile',hasTouch:mode==='mobile',reducedMotion:mode==='reduced'?'reduce':'no-preference'});
    const page=await context.newPage();
    const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://127.0.0.1:4173',{waitUntil:'networkidle'});
    await page.waitForTimeout(2200);
    assert.equal(await page.title(),'THE REFLECT — Private Beauty House');
    await page.locator('img').evaluateAll(async imgs=>{await Promise.all(imgs.map(i=>{i.loading='eager';return i.decode();}));});
    assert.equal(await page.locator('img').evaluateAll(imgs=>imgs.every(i=>i.complete&&i.naturalWidth>0)),true,'All photos load');
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'No horizontal overflow');
    await page.screenshot({path:`test-results/${mode}-hero.png`});
    await page.locator('.menu-toggle').click();
    await page.waitForTimeout(900);
    assert.equal(await page.locator('#menu-dialog').evaluate(d=>d.open),true);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(550);
    assert.equal(await page.locator('#menu-dialog').evaluate(d=>d.open),false);
    assert.equal(await page.locator('.menu-toggle').evaluate(e=>e===document.activeElement),true,'Menu restores focus');
    await page.locator('.menu-toggle').click();
    await page.waitForTimeout(900);
    await page.locator('#menu-dialog a[href="#rituals"]').click();
    await page.waitForTimeout(1800);
    assert.equal(new URL(page.url()).hash,'#rituals');
    assert.equal(await page.locator('#menu-dialog').evaluate(d=>d.open),false);
    await page.screenshot({path:`test-results/${mode}-rituals.png`});
    await page.locator('[data-service="Nails & details"]').click();
    await page.waitForTimeout(1600);
    assert.equal(await page.locator('#booking-call').getAttribute('href'),'tel:+21620082569');
    assert.equal(await page.locator('input[value="Nails & details"]').isChecked(),true);
    await page.locator('label:has(input[value="Hair & styling"])').click();
    assert.equal(await page.locator('#booking-call').getAttribute('href'),'tel:+21650677903');
    await page.waitForTimeout(450);
    await page.screenshot({path:`test-results/${mode}-booking.png`});
    const summary=page.locator('.faq summary').first();
    await summary.scrollIntoViewIfNeeded();
    await summary.click();await page.waitForTimeout(550);
    assert.equal(await page.locator('.faq details').first().getAttribute('open'),'');
    await summary.click();await page.waitForTimeout(550);
    assert.equal(await page.locator('.faq details').first().getAttribute('open'),null);
    await summary.click();await page.waitForTimeout(70);await summary.click();await page.waitForTimeout(70);await summary.click();await page.waitForTimeout(600);
    assert.equal(await page.locator('.faq details').first().getAttribute('open'),'','Rapid FAQ reversal finishes open');
    const next=page.locator('[data-quote-step="1"]');
    await next.scrollIntoViewIfNeeded();await next.click();await page.waitForTimeout(800);
    assert.ok((await page.locator('#house-quote').textContent()).includes('Quiet confidence'));
    await page.locator('.manifesto').scrollIntoViewIfNeeded();await page.waitForTimeout(1200);
    await page.screenshot({path:`test-results/${mode}-manifesto.png`});
    if(mode==='reduced'){
      assert.equal(await page.evaluate(()=>ScrollTrigger.getAll().length),0);
      assert.equal(await page.locator('html').getAttribute('data-motion'),'off');
    }
    if(mode==='desktop'){
      await page.locator('#motion-toggle').click();await page.waitForTimeout(200);
      assert.equal(await page.evaluate(()=>ScrollTrigger.getAll().length),0);
      await page.locator('#motion-toggle').click();await page.waitForTimeout(200);
      assert.ok(await page.evaluate(()=>ScrollTrigger.getAll().length>0));
      await page.setViewportSize({width:390,height:844});await page.waitForTimeout(700);
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Resizing does not overflow');
    }
    assert.deepEqual(errors,[],'No browser runtime errors');
    results.push({mode,status:'passed',runtimeErrors:errors});
    await context.close();
  }
  const context=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}});
  const page=await context.newPage();await page.goto('http://127.0.0.1:4173');
  assert.equal(await page.locator('h1').isVisible(),true);
  await page.locator('.faq summary').first().click();
  assert.equal(await page.locator('.faq details').first().getAttribute('open'),'');
  results.push({mode:'no-javascript',status:'passed'});
  writeFileSync('test-results/results.json',JSON.stringify(results,null,2));
  console.log(JSON.stringify(results,null,2));
} finally {await browser.close();}
