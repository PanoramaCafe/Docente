const CACHE='panorama-docente-v27';
const VERSION='2026.09.01.34';
const SHELL=['./','./index.html','./styles.css','./app-config.js','./app.js','./modules.js','./policy.js','./sync.js','./impresiones.js','./asistencia-mejorada.js','./modules/trabajos-core.js','./modules/trabajos.js','./modules/bitacora.js','./modules/alumnos.js','./modules/incidencias.js','./modules/reportes.js','./modules/calificaciones.js'];
const EXTERNAL=['https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js','https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js','https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'];
const SHELL_SET=new Set(SHELL.map(x=>new URL(x,self.location).pathname));

async function putShell(cache,url,response){
  if(response&&response.ok){
    try{await cache.put(new Request(new URL(url,self.location).href),response.clone())}catch(e){}
  }
  return response;
}

self.addEventListener('install',e=>e.waitUntil((async()=>{
  const c=await caches.open(CACHE);
  for(const u of SHELL){
    try{const r=await fetch(new Request(new URL(u,self.location).href,{cache:'no-store'}));await putShell(c,u,r)}catch(err){}
  }
  for(const u of EXTERNAL){try{await c.add(u)}catch(err){}}
  await self.skipWaiting();
})()));

self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));

self.addEventListener('fetch',e=>{
  const r=e.request;
  if(r.method!=='GET')return;
  const url=new URL(r.url);
  const isNavigation=r.mode==='navigate';
  const isShell=url.origin===self.location.origin&&SHELL_SET.has(url.pathname);

  if(isNavigation||isShell){
    e.respondWith((async()=>{
      const c=await caches.open(CACHE);
      const cached=await c.match(new Request(url.href),{ignoreSearch:true}) || await c.match(new Request(new URL('./index.html',self.location).href));
      try{
        const fresh=await fetch(r,{cache:'no-store'});
        if(fresh&&fresh.ok) await putShell(c,url.href,fresh);
        return fresh;
      }catch(err){
        return cached || new Response('Sin conexión y sin copia local disponible.',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}});
      }
    })());
    return;
  }

  e.respondWith((async()=>{
    const c=await caches.open(CACHE);
    const cached=await c.match(r,{ignoreSearch:true});
    if(cached)return cached;
    try{
      const fresh=await fetch(r);
      if(fresh&&(fresh.ok||fresh.type==='opaque')){try{await c.put(r,fresh.clone())}catch(e){}}
      return fresh;
    }catch(err){
      return await c.match(new Request(new URL('./index.html',self.location).href)) || new Response('',{status:503});
    }
  })());
});