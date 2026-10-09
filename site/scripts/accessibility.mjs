import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
const browser=await chromium.launch();
const results=[];
try{
  for(const width of [320,768,1440]){
    const context=await browser.newContext({viewport:{width,height:1000},reducedMotion:'reduce'});
    const page=await context.newPage();
    await page.addInitScript(()=>{window.layoutShifts=[];new PerformanceObserver(list=>{for(const e of list.getEntries())if(!e.hadRecentInput)window.layoutShifts.push(e.value);}).observe({type:'layout-shift',buffered:true});});
    await page.goto('http://127.0.0.1:4173',{waitUntil:'networkidle'});
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`Overflow at ${width}`);
    const audit=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
    results.push({width,violations:audit.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))})),layoutShift:await page.evaluate(()=>window.layoutShifts.reduce((a,b)=>a+b,0))});
    await page.locator('.menu-toggle').click();
    for(let i=0;i<10;i++){await page.keyboard.press('Tab');assert.ok(await page.evaluate(()=>document.querySelector('#menu-dialog').contains(document.activeElement)),'Focus stays in modal');}
    await page.keyboard.press('Escape');
    await page.locator('#booking').scrollIntoViewIfNeeded();
    await page.locator('input[value="Hair & styling"]').focus();await page.keyboard.press('ArrowRight');await page.keyboard.press('ArrowRight');
    assert.equal(await page.locator('#booking-call').getAttribute('href'),'tel:+21620082569');
    await context.close();
  }
  writeFileSync('test-results/accessibility.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));
}finally{await browser.close();}
