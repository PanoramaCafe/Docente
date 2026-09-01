/* Panorama Docente — cargador central de módulos
   index.html solo necesita cargar este archivo para los módulos opcionales.
*/
(function(){
  const modules=[
    'sync.js','offline.js','impresiones.js','impresiones-fix.js',
    'asistencia-mejorada.js','materias-fix.js','bitacora-fix.js'
  ];
  function load(src){return new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=reject;document.body.appendChild(s)})}
  window.PD_MODULES={version:window.PD_CONFIG?.version||'unknown',list:[...modules]};
  (async()=>{for(const m of modules){try{await load(m)}catch(e){console.warn('Módulo no disponible:',m,e)}}})();
})();
