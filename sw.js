if(!self.define){let s,e={};const l=(l,i)=>(l=new URL(l+".js",i).href,e[l]||new Promise((e=>{if("document"in self){const s=document.createElement("script");s.src=l,s.onload=e,document.head.appendChild(s)}else s=l,importScripts(l),e()})).then((()=>{let s=e[l];if(!s)throw new Error(`Module ${l} didn’t register its module`);return s})));self.define=(i,n)=>{const r=s||("document"in self?document.currentScript.src:"")||location.href;if(e[r])return;let u={};const t=s=>l(s,r),o={module:{uri:r},exports:u,require:t};e[r]=Promise.all(i.map((s=>o[s]||t(s)))).then((s=>(n(...s),u)))}}define(["./workbox-e3490c72"],(function(s){"use strict";self.addEventListener("message",(s=>{s.data&&"SKIP_WAITING"===s.data.type&&self.skipWaiting()})),s.precacheAndRoute([{url:"assets/aRO-bsWT0zU3.js",revision:null},{url:"assets/bRO-CpIqPvXj.js",revision:null},{url:"assets/cRO-BaVC26uK.js",revision:null},{url:"assets/fRO-DvbP9Jnt.js",revision:null},{url:"assets/GGH-0K0f8D0F.js",revision:null},{url:"assets/idRO-0K0f8D0F.js",revision:null},{url:"assets/index-4zsE39vW.js",revision:null},{url:"assets/index-n3XE60AU.css",revision:null},{url:"assets/iRO-CwIwArIp.js",revision:null},{url:"assets/iROC-0K0f8D0F.js",revision:null},{url:"assets/jRO-Dsr_4vXJ.js",revision:null},{url:"assets/kROM-Df2O5XBe.js",revision:null},{url:"assets/kROZ-0K0f8D0F.js",revision:null},{url:"assets/kROZS-0K0f8D0F.js",revision:null},{url:"assets/ruRO-m_DMS6aW.js",revision:null},{url:"assets/thROG-0K0f8D0F.js",revision:null},{url:"assets/twRO-qZGjcARU.js",revision:null},{url:"assets/vendor-80aDZC_2.js",revision:null},{url:"index.html",revision:"5994b659bb7dd9c8840015fbe0a12ee3"},{url:"manifest.webmanifest",revision:"9c8ddd5ac642d28d51db29ef5ef8ea88"}],{}),s.cleanupOutdatedCaches(),s.registerRoute(new s.NavigationRoute(s.createHandlerBoundToURL("index.html")))}));
