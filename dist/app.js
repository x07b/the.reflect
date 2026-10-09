(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const systemMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const desktop = matchMedia('(min-width: 901px) and (pointer: fine)');
  let manualOff = false;
  try { manualOff = localStorage.getItem('reflect-motion') === 'off'; } catch {}
  let lenis, media, heroPlayed = false, menuTween, quoteTween;
  const motionOff = () => systemMotion.matches || manualOff;
  const hasGSAP = !!(window.gsap && window.ScrollTrigger);
  const dialog = $('#menu-dialog');
  const menuButton = $('.menu-toggle');
  let previousFocus;
  if (hasGSAP) gsap.registerPlugin(ScrollTrigger);

  // Native document scroll remains the source of truth. Smoothing is desktop-only.
  function updateSmoothScroll() {
    if (lenis) { lenis.destroy(); lenis = null; }
    if (!motionOff() && desktop.matches && window.Lenis) {
      lenis = new Lenis({ duration: 1.05, smoothWheel: true, syncTouch: false, anchors: false, autoRaf: false });
      if (hasGSAP) lenis.on('scroll', ScrollTrigger.update);
    }
  }
  function raf(time) { lenis?.raf(time); requestAnimationFrame(raf); }
  requestAnimationFrame(raf);

  function initMotion() {
    media?.revert();
    document.documentElement.dataset.motion = motionOff() ? 'off' : 'on';
    $('#motion-toggle').textContent = motionOff() ? 'Motion: off' : 'Motion: on';
    $('#motion-toggle').setAttribute('aria-pressed', String(motionOff()));
    $('#motion-toggle').setAttribute('aria-label', systemMotion.matches ? 'Motion is off to respect your system preference' : (motionOff() ? 'Turn motion on' : 'Turn motion off'));
    updateSmoothScroll();
    if (!hasGSAP || motionOff()) return;
    media = gsap.matchMedia();
    media.add({wide: '(min-width: 701px)', narrow: '(max-width: 700px)'}, context => {
      const wide = context.conditions.wide;
      const revealDistance = wide ? 112 : 105;
      // One orchestration; no CSS-hidden fallback state or loading-screen dependency.
      if (!heroPlayed && window.scrollY < 80 && !location.hash) {
        heroPlayed = true;
        gsap.timeline({defaults:{ease:'power3.out'}, onComplete:() => document.documentElement.dataset.heroReady = 'true'})
          .from('.hero-title > span', {yPercent:104, rotation:2, duration:1.35, stagger:.09, clearProps:'transform'}, 0)
          .from('.hero-image', {clipPath:'inset(100% 0 0 0)', duration:1.35, clearProps:'clipPath'}, .16)
          .from('.hero-image img', {scale:1.16, duration:1.7, clearProps:'transform'}, .16)
          .from('.hero-copy .line > span', {yPercent:112, rotation:2, duration:1.1, stagger:.12, clearProps:'transform'}, .48)
          .from('.hero-small', {clipPath:'inset(0 0 100% 0)', duration:1.1, clearProps:'clipPath'}, .62)
          .from('.hero-detail, .hero-aside p, .vertical-label, .hero-bottom', {opacity:0, duration:.85, stagger:.065, clearProps:'opacity'}, .7);
      }
      $$('.reveal-lines').forEach(heading => {
        gsap.from($$('.line > span', heading), {yPercent:revealDistance, rotation:wide ? 2 : 0, duration:1.15, stagger:.12, ease:'power3.out', clearProps:'transform', scrollTrigger:{trigger:heading,start:'top 89%',once:true}});
      });
      $$('.service-card').forEach((card, i) => {
        const photo = $('.service-photo', card);
        const sequence = gsap.timeline({scrollTrigger:{trigger:card,start:'top 88%',once:true}});
        sequence.from(photo, {clipPath:`inset(${i === 1 ? '0 0 100% 0' : '100% 0 0 0'})`, duration:1.15,ease:'power3.inOut',clearProps:'clipPath'},0)
          .from($('img',card),{scale:1.13,rotation:i===1?-2:2,duration:1.45,ease:'power3.out',clearProps:'transform'},.08)
          .from($('.service-title',card),{x:wide?(i%2?-24:24):12,opacity:0,duration:.8,clearProps:'transform,opacity'},.45);
      });
      $$('.editorial-photo').forEach((figure,i)=>{
        gsap.from($('img',figure),{clipPath:i%2?'inset(0 100% 0 0)':'inset(0 0 100% 0)',duration:1.25,ease:'power3.inOut',clearProps:'clipPath',scrollTrigger:{trigger:figure,start:'top 90%',once:true}});
      });
      if(wide){
        gsap.to('.hero-image img',{yPercent:7,scale:1.08,ease:'none',scrollTrigger:{trigger:'.hero-image',start:'top 30%',end:'bottom top',scrub:.8}});
        const reflection = gsap.timeline({scrollTrigger:{trigger:'.manifesto',start:'top top',end:'bottom bottom',scrub:1,invalidateOnRefresh:true}});
        reflection.to('.manifesto-word',{x:()=>-Math.max(0,$('.manifesto-word').scrollWidth-innerWidth*.83),ease:'none'},0)
          .fromTo('.manifesto-photo',{rotation:-6,scale:.88},{rotation:5,scale:1.13,ease:'none'},0)
          .fromTo('.manifesto-stage',{backgroundColor:'#9d5535'},{backgroundColor:'#77472f',ease:'none'},0);
      }else{
        gsap.fromTo('.manifesto-photo',{rotation:-5,scale:.94},{rotation:3,scale:1.03,ease:'none',scrollTrigger:{trigger:'.manifesto-stage',start:'top bottom',end:'bottom top',scrub:.5}});
      }
      gsap.from('.booking-cta',{clipPath:'inset(0 100% 0 0)',duration:1,ease:'power3.inOut',clearProps:'clipPath',scrollTrigger:{trigger:'.booking-panel',start:'top 85%',once:true}});
    });
    ScrollTrigger.refresh();
  }
  initMotion();
  systemMotion.addEventListener('change', initMotion);
  desktop.addEventListener('change', updateSmoothScroll);
  $('#motion-toggle').addEventListener('click', () => {
    if (systemMotion.matches) return;
    manualOff = !manualOff;
    try { localStorage.setItem('reflect-motion', manualOff ? 'off' : 'on'); } catch {}
    initMotion();
  });
  document.fonts.ready.then(() => { if(hasGSAP) ScrollTrigger.refresh(); });
  window.addEventListener('load',()=>{ if(hasGSAP) ScrollTrigger.refresh(); });
  window.addEventListener('pageshow',()=>{ lenis?.resize(); if(hasGSAP) ScrollTrigger.refresh(); });

  function openMenu() {
    if(dialog.open) return;
    previousFocus = document.activeElement;
    menuTween?.kill();
    dialog.showModal();
    document.body.classList.add('modal-open');
    lenis?.stop();
    menuButton.setAttribute('aria-expanded','true');
    if(hasGSAP && !motionOff()){
      menuTween = gsap.timeline().fromTo(dialog,{clipPath:'inset(0 0 100% 0)'},{clipPath:'inset(0 0 0% 0)',duration:.6,ease:'power3.inOut',clearProps:'clipPath'})
        .fromTo($$('nav a',dialog),{y:28,opacity:0},{y:0,opacity:1,duration:.65,stagger:.065,ease:'power3.out',clearProps:'transform,opacity'},.23);
    }
    $('.menu-close').focus();
  }
  function closeMenu(after) {
    if(!dialog.open){after?.();return;}
    menuTween?.kill();
    const finish=()=>{
      dialog.close();
      document.body.classList.remove('modal-open');
      menuButton.setAttribute('aria-expanded','false');
      lenis?.start();
      dialog.style.clipPath='';
      if(!after) previousFocus?.focus({preventScroll:true});
      after?.();
    };
    if(hasGSAP && !motionOff()) menuTween=gsap.to(dialog,{clipPath:'inset(0 0 100% 0)',duration:.42,ease:'power3.inOut',onComplete:finish});
    else finish();
  }
  menuButton.addEventListener('click',openMenu);
  $('.menu-close').addEventListener('click',()=>closeMenu());
  dialog.addEventListener('cancel',event=>{event.preventDefault();closeMenu();});
  dialog.addEventListener('keydown',event=>{
    if(event.key!=='Tab')return;
    const focusable=$$('button:not([disabled]), a[href]',dialog);
    const first=focusable[0],last=focusable[focusable.length-1];
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
  });

  // Preserve URL history, keyboard focus, modified clicks and native touch behavior.
  function navigateTo(id, push=true) {
    const target=document.getElementById(id);
    if(!target) return;
    if(push && location.hash!==`#${id}`) history.pushState(null,'',`#${id}`);
    target.setAttribute('tabindex','-1');
    target.focus({preventScroll:true});
    const offset=id==='home'?0:30;
    if(lenis) lenis.scrollTo(id==='home'?0:target,{offset:-offset,duration:1.15});
    else target.scrollIntoView({behavior:motionOff()?'instant':'smooth',block:'start'});
  }
  $$('a[href^="#"]').forEach(link=>link.addEventListener('click',event=>{
    if(event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||event.button!==0)return;
    const id=link.getAttribute('href').slice(1);
    if(!document.getElementById(id))return;
    event.preventDefault();
    if(link.dataset.service){ const input=$$('input[name="ritual"]').find(input=>input.value===link.dataset.service); if(input){input.checked=true; updateBooking();} }
    if(dialog.open)closeMenu(()=>navigateTo(id));else navigateTo(id);
  }));
  window.addEventListener('popstate',()=>{if(location.hash)navigateTo(location.hash.slice(1),false);else window.scrollTo({top:0,behavior:'instant'});});

  const faqAnimations=new WeakMap();
  $$('.faq details').forEach(details=>{
    const summary=$('summary',details), content=$('.faq-answer',details);
    summary.addEventListener('click',event=>{
      if(!hasGSAP || motionOff())return;
      event.preventDefault();
      const old=faqAnimations.get(details);
      const opening=old ? !old.opening : !details.open;
      old?.tween.kill();
      const from=details.open?content.getBoundingClientRect().height:0;
      details.open=true;
      content.style.height='auto';
      const to=opening?content.getBoundingClientRect().height:0;
      const tween=gsap.fromTo(content,{height:from},{height:to,duration:.42,ease:'power2.inOut',onUpdate:()=>lenis?.resize(),onComplete:()=>{details.open=opening;content.style.height='';faqAnimations.delete(details);lenis?.resize();ScrollTrigger.refresh();}});
      faqAnimations.set(details,{tween,opening});
    });
  });

  const quotes=[
    ['“The most beautiful version<br>of you is <em>still you.</em>”','01 / INDIVIDUALITY, ALWAYS'],
    ['“Good hair. Quiet confidence.<br><em>A moment of your own.</em>”','02 / TIME, WELL SPENT'],
    ['“Beauty lives<br>in <em>the details.</em>”','03 / THOUGHTFULLY FINISHED']
  ];
  let quoteIndex=0;
  $$('[data-quote-step]').forEach(button=>button.addEventListener('click',()=>{
    quoteIndex=(quoteIndex+Number(button.dataset.quoteStep)+quotes.length)%quotes.length;
    quoteTween?.kill();
    const windowEl=$('.quote-window');
    const change=()=>{
      $('#house-quote').innerHTML=quotes[quoteIndex][0];$('#quote-caption').textContent=quotes[quoteIndex][1];
      $('.quote-count').textContent=`0${quoteIndex+1} — 03`;
    };
    if(hasGSAP&&!motionOff()) quoteTween=gsap.timeline().to(windowEl,{opacity:0,x:-12,duration:.18,onComplete:change}).fromTo(windowEl,{x:12},{x:0,opacity:1,duration:.45,ease:'power3.out',clearProps:'transform,opacity'});
    else change();
  }));

  function updateBooking(){
    const nails=$('input[name="ritual"]:checked').value==='Nails & details';
    $('#booking-call').href=nails?'tel:+21620082569':'tel:+21650677903';
    $('#booking-number').textContent=nails?'+216 20 082 569':'+216 50 677 903';
    $('#booking-department').textContent=nails?'NAILS & DETAILS':'HAIR · COLOR · BALAYAGE';
    if(hasGSAP&&!motionOff())gsap.fromTo('.booking-contact',{opacity:.3},{opacity:1,duration:.35,overwrite:true,clearProps:'opacity'});
  }
  $$('input[name="ritual"]').forEach(input=>input.addEventListener('change',updateBooking));
  $('#year').textContent=new Date().getFullYear();
})();
