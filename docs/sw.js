if(!self.define){let s,e={};const i=(i,n)=>(i=new URL(i+".js",n).href,e[i]||new Promise((e=>{if("document"in self){const s=document.createElement("script");s.src=i,s.onload=e,document.head.appendChild(s)}else s=i,importScripts(i),e()})).then((()=>{let s=e[i];if(!s)throw new Error(`Module ${i} didn’t register its module`);return s})));self.define=(n,r)=>{const l=s||("document"in self?document.currentScript.src:"")||location.href;if(e[l])return;let o={};const u=s=>i(s,l),t={module:{uri:l},exports:o,require:u};e[l]=Promise.all(n.map((s=>t[s]||u(s)))).then((s=>(r(...s),o)))}}define(["./workbox-e3490c72"],(function(s){"use strict";self.addEventListener("message",(s=>{s.data&&"SKIP_WAITING"===s.data.type&&self.skipWaiting()})),s.precacheAndRoute([{url:"assets/aRO-bsWT0zU3.js",revision:null},{url:"assets/bRO-CpIqPvXj.js",revision:null},{url:"assets/cRO-BaVC26uK.js",revision:null},{url:"assets/fRO-DvbP9Jnt.js",revision:null},{url:"assets/GGH-0K0f8D0F.js",revision:null},{url:"assets/idRO-0K0f8D0F.js",revision:null},{url:"assets/index-C-svCfrt.js",revision:null},{url:"assets/index-n3XE60AU.css",revision:null},{url:"assets/iRO-CwIwArIp.js",revision:null},{url:"assets/iROC-0K0f8D0F.js",revision:null},{url:"assets/jRO-Dsr_4vXJ.js",revision:null},{url:"assets/kROM-Df2O5XBe.js",revision:null},{url:"assets/kROZ-0K0f8D0F.js",revision:null},{url:"assets/kROZS-0K0f8D0F.js",revision:null},{url:"assets/ruRO-m_DMS6aW.js",revision:null},{url:"assets/thROG-0K0f8D0F.js",revision:null},{url:"assets/twRO-qZGjcARU.js",revision:null},{url:"assets/vendor-80aDZC_2.js",revision:null},{url:"index.html",revision:"382431b315cfea80dbf46d0ccf7bbace"},{url:"icons/android-chrome-192x192.png",revision:"1d7c1bca6a6aefb99f324ee7dde12e01"},{url:"icons/android-chrome-256x256.png",revision:"86d65adf427d62d87f7af324eb239ff0"},{url:"icons/favicon-16x16.png",revision:"67f3979f3005320778f023c3bbe292ac"},{url:"icons/favicon-32x32.png",revision:"49f6badd49f59d3fe02a0b38eac14843"},{url:"manifest.webmanifest",revision:"78827d37f476ce67f71f39feb106dd26"}],{}),s.cleanupOutdatedCaches(),s.registerRoute(new s.NavigationRoute(s.createHandlerBoundToURL("index.html")))}));
