const CACHE='panorama-docente-v12';
const VERSION='2026.09.01.5';
const SHELL=['./','./index.html','./styles.css','./app-config.js','./app.js','./modules.js','./sync.js','./offline.js','./impresiones.js','./asistencia-mejorada.js','./modules/bitacora.js'];
const EXTERNAL=['https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js','https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js','https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(async c=>{for(const u of SHELL){try{await c.add(`${u}?v=${VERSION}`)}catch(err){}}for(const u of EXTERNAL){try{await c.add(u)}catch(err){}}}).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET')return;e.respondWith(caches.match(r).then(c=>c||fetch(r).then(res=>{if(res&&(res.ok||res.type==='opaque')){const cp=res.clone();caches.open(CACHE).then(x=>x.put(r,cp)).catch(()=>{})}return res}).catch(()=>caches.match('./index.html'))))});