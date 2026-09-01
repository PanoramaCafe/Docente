/* Panorama Docente — registro central de módulos */
(function(){
  const modules=['sync.js','impresiones.js','asistencia-mejorada.js','modules/bitacora.js'];
  window.PD_MODULES={version:window.PD_CONFIG?.version||'unknown',list:[...modules]};
  async function load(src){return new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=`${src}?v=${encodeURIComponent(window.PD_CONFIG?.version||Date.now())}`;s.onload=resolve;s.onerror=reject;document.body.appendChild(s)})}
  (async()=>{for(const m of modules){try{await load(m)}catch(e){console.warn('Módulo no disponible:',m,e)}}})();
})();
