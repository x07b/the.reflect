import { copyFileSync, mkdirSync } from 'node:fs';
mkdirSync('dist/vendor', { recursive: true });
for (const [source, name] of [['gsap/dist/gsap.min.js','gsap.min.js'],['gsap/dist/ScrollTrigger.min.js','ScrollTrigger.min.js'],['lenis/dist/lenis.min.js','lenis.min.js']]) copyFileSync(`node_modules/${source}`, `dist/vendor/${name}`);
console.log('Local motion dependencies prepared. Static site ready.');
