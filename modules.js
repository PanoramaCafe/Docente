/* Panorama Docente — cargador central de módulos */
(function(){
  const modules=Array.isArray(window.PD_CONFIG?.modules)&&window.PD_CONFIG.modules.length?window.PD_CONFIG.modules:['sync.js','asistencia-mejorada.js','impresiones.js','modules/trabajos-core.js','modules/trabajos.js','modules/bitacora.js','modules/alumnos.js','modules/incidencias.js','modules/reportes.js','modules/calificaciones.js','modules/identidad.js'];
  const baseSetView=window.setView;
  window.PD_MODULES={version:window.PD_CONFIG?.version||'unknown',list:[...modules]};
  async function load(src){return new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=`${src}?v=${encodeURIComponent(window.PD_CONFIG?.version||Date.now())}`;s.onload=resolve;s.onerror=reject;document.body.appendChild(s)})}
  function installStableRouter(){
    window.setView=function(v){
      if(v==='calificaciones'&&window.PD_CALIFICACIONES?.activate){
        view=v;
        document.querySelectorAll('.nav').forEach(b=>b.classList.toggle('active',b.dataset.view===v));
        document.getElementById('pageTitle').textContent='Calificaciones';
        document.getElementById('pageSubtitle').textContent='Evaluación y promedios';
        return window.PD_CALIFICACIONES.activate();
      }
      if(v==='reportes'&&window.PD_REPORTES?.render){
        view=v;
        document.querySelectorAll('.nav').forEach(b=>b.classList.toggle('active',b.dataset.view===v));
        document.getElementById('pageTitle').textContent='Reportes';
        document.getElementById('pageSubtitle').textContent='Cortes para familias, asesores y dirección';
        return window.PD_REPORTES.render();
      }
      if(v==='incidencias'&&window.PD_INCIDENCIAS?.render){
        view=v;
        document.querySelectorAll('.nav').forEach(b=>b.classList.toggle('active',b.dataset.view===v));
        document.getElementById('pageTitle').textContent='Incidencias';
        document.getElementById('pageSubtitle').textContent='Seguimiento disciplinario y académico';
        return window.PD_INCIDENCIAS.render();
      }
      return baseSetView(v);
    };
  }
  (async()=>{for(const m of modules){try{await load(m)}catch(e){console.warn('Módulo no disponible:',m,e)}}installStableRouter()})();
})();
