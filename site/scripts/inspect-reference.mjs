import {chromium} from '@playwright/test';
const browser=await chromium.launch({headless:true});
try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  await page.goto('https://hairora.framer.website/',{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForTimeout(4500);
  await page.screenshot({path:'test-results/reference-hero.png'});
  await page.mouse.wheel(0,950);await page.waitForTimeout(2000);
  await page.screenshot({path:'test-results/reference-scroll.png'});
  console.log(await page.evaluate(()=>({title:document.title,scrollY,animated:document.querySelectorAll('[style*="transform"]').length,headings:[...document.querySelectorAll('h1,h2')].slice(0,10).map(e=>e.textContent)})));
}catch(e){console.log('Live reference unavailable:',e.message);}finally{await browser.close();}
