/* Panorama Docente — módulo consolidado de Temas / Bitácora */
(function(){
  function edit(id){const x=db.log.find(v=>v.id===id);if(!x)return;const date=prompt('Fecha (AAAA-MM-DD)',x.date);if(date===null)return;const topic=prompt('Tema visto',x.topic||'');if(topic===null)return;const notes=prompt('Observación',x.notes||'');if(notes===null)return;x.date=date;x.topic=topic;x.notes=notes;save();render()}
  function remove(id){if(!confirm('¿Eliminar este registro de bitácora? Esta acción no se puede deshacer.'))return;db.log=db.log.filter(x=>x.id!==id);save();render()}
  function enhance(){if(typeof view==='undefined'||view!=='bitacora')return;const table=document.querySelector('#content table');if(!table)return;const head=table.querySelector('tr');if(head&&!head.querySelector('[data-log-actions]')){const th=document.createElement('th');th.dataset.logActions='1';th.textContent='Acciones';head.appendChild(th)}table.querySelectorAll('tr').forEach((tr,i)=>{if(i===0||tr.querySelector('.log-actions'))return;const cells=tr.querySelectorAll('td');if(!cells.length)return;const date=cells[0]?.textContent;const topic=cells[3]?.textContent;const x=db.log.find(v=>v.date===date&&v.topic===topic);if(!x)return;const td=document.createElement('td');td.className='log-actions';td.innerHTML=`<button class="btn" onclick="PD_BITACORA.edit('${x.id}')">Editar</button> <button class="btn danger" onclick="PD_BITACORA.remove('${x.id}')">Eliminar</button>`;tr.appendChild(td)})}
  window.PD_BITACORA={edit,remove,enhance};
  const observer=new MutationObserver(enhance);
  observer.observe(document.getElementById('content')||document.body,{childList:true,subtree:true});
})();
