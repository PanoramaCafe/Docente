/* Fix central: navegación de Impresiones + edición de Trabajos + campos de calificación visibles */
(function(){
  const originalSetView=window.setView;
  window.setView=function(v){
    if(v==='impresiones'){
      window.view='impresiones';
      document.querySelectorAll('.nav').forEach(b=>b.classList.toggle('active',b.dataset.view==='impresiones'));
      document.getElementById('pageTitle').textContent='Impresiones / Adeudos';
      document.getElementById('pageSubtitle').textContent='Control de impresiones, pagos y calificaciones';
      if(typeof window.renderPrints==='function') window.renderPrints();
      else if(typeof window.pdRender==='function') window.pdRender();
      return;
    }
    return originalSetView(v);
  };
  function addWorkActions(){
    if(window.view!=='trabajos')return;
    document.querySelectorAll('#content table.table tr').forEach((tr,i)=>{
      if(i===0||tr.querySelector('.work-actions'))return;
      const cells=tr.querySelectorAll('td'); if(!cells.length)return;
      const name=(cells[1]?.innerText||'').trim();
      const activity=db.activities.find(a=>a.title===name.split('\n')[0]&&a.groupId===db.groups.find(g=>g.name===cells[2]?.innerText)?.id);
      if(!activity)return;
      const td=document.createElement('td');td.className='work-actions';td.innerHTML='<button class="btn" type="button">Editar</button> <button class="btn danger" type="button">Eliminar</button>';
      td.children[0].onclick=()=>editWork(activity.id);
      td.children[1].onclick=()=>deleteWork(activity.id);
      tr.appendChild(td);
    });
  }
  window.editWork=function(id){const a=db.activities.find(x=>x.id===id);if(!a)return;const title=prompt('Nombre de la actividad',a.title);if(title===null)return;const date=prompt('Fecha (AAAA-MM-DD)',a.date)||a.date;const points=Number(prompt('Valor de la actividad',a.points??10));if(!title.trim()||!Number.isFinite(points))return; a.title=title.trim();a.topic=a.topic===a.title?a.title:a.topic;a.date=date;a.points=points;save();setView('trabajos');};
  window.deleteWork=function(id){const a=db.activities.find(x=>x.id===id);if(!a)return;if(!confirm('¿Eliminar esta actividad? También se eliminarán sus calificaciones.'))return;db.activities=db.activities.filter(x=>x.id!==id);db.grades=db.grades.filter(x=>x.activityId!==id);if(Array.isArray(db.prints))db.prints=db.prints.filter(x=>x.activityId!==id);save();setView('trabajos');};
  const oldRender=window.render;
  window.render=function(){oldRender();setTimeout(addWorkActions,0);setTimeout(styleGrades,0)};
  function styleGrades(){document.querySelectorAll('.gradeInput').forEach(x=>{x.style.cssText='width:86px!important;min-width:86px;height:40px!important;padding:7px 8px!important;border:2px solid #245b7a!important;border-radius:8px!important;background:#fff!important;color:#183044!important;font-size:16px!important;font-weight:600!important;text-align:center!important;box-shadow:inset 0 0 0 1px rgba(0,0,0,.04)!important;'});}
  document.addEventListener('click',e=>{const b=e.target.closest('.nav[data-view="trabajos"]');if(b)setTimeout(addWorkActions,30);const c=e.target.closest('.nav[data-view="calificaciones"]');if(c)setTimeout(styleGrades,100)});
  setInterval(()=>{if(window.view==='trabajos')addWorkActions();if(window.view==='calificaciones')styleGrades()},800);
})();
