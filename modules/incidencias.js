/* Panorama Docente — módulo consolidado de Incidencias */
(function(){
  const esc2=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  function renderIncidencias(){
    const rows=[...(db.incidents||[])].sort((a,b)=>String(b.date||'').localeCompare(String(a.date||''))).map(x=>{
      const st=db.students.find(s=>s.id===x.studentId); const gid=st?.groupId||x.groupId||'';
      return `<tr><td>${esc2(x.date||'')}</td><td><b>${esc2(st?.name||'Alumno eliminado')}</b></td><td>${esc2(groupName(gid))}</td><td>${esc2(x.type||'')}</td><td>${esc2(x.severity||x.gravedad||'')}</td><td>${esc2(x.followup||x.seguimiento||'')}</td><td><button class="btn" onclick="window.openIncidentModal('${x.id}')">Editar</button> <button class="btn danger" onclick="window.deleteIncident('${x.id}')">Eliminar</button></td></tr>`;
    }).join('');
    document.getElementById('content').innerHTML=`<div class="toolbar"><button id="pdNewIncidentBtn" type="button" class="btn primary">＋ Nueva incidencia</button></div><div class="card"><div class="table-wrap"><table class="table"><thead><tr><th>Fecha</th><th>Alumno</th><th>Grupo</th><th>Tipo</th><th>Gravedad</th><th>Seguimiento</th><th>Acciones</th></tr></thead><tbody>${rows||'<tr><td colspan="7" class="empty">No hay incidencias registradas.</td></tr>'}</tbody></table></div></div>`;
    document.getElementById('pdNewIncidentBtn')?.addEventListener('click',openIncidentModal);
  }
  function openIncidentModal(id){
    const old=id?(db.incidents||[]).find(x=>x.id===id):null;
    const oldStudent=old&&db.students.find(s=>s.id===old.studentId);
    const group=old?.groupId||oldStudent?.groupId||db.groups.find(g=>g.active)?.id||db.groups[0]?.id||'';
    const students=()=>db.students.filter(s=>s.groupId===document.getElementById('pdIncGroup')?.value);
    document.getElementById('pdIncidentModal')?.remove();
    const modal=document.createElement('div'); modal.id='pdIncidentModal'; modal.className='modal-backdrop';
    modal.innerHTML=`<div class="modal-card pd-activity-card"><div class="modal-head"><h3>${old?'Editar incidencia':'Nueva incidencia'}</h3><button type="button" aria-label="Cerrar" onclick="this.closest('.modal-backdrop').remove()">×</button></div><div class="form-grid"><label>Grupo<select id="pdIncGroup">${db.groups.map(g=>`<option value="${g.id}" ${g.id===group?'selected':''}>${esc2(g.name)}</option>`).join('')}</select></label><label>Alumno<select id="pdIncStudent"></select></label><label>Fecha<input id="pdIncDate" type="date" value="${old?.date||today()}"></label><label>Tipo<select id="pdIncType"><option value="Académica">Académica</option><option value="Conducta">Conducta</option><option value="Asistencia">Asistencia</option><option value="Otra">Otra</option></select></label><label>Gravedad<select id="pdIncSeverity"><option>Leve</option><option>Moderada</option><option>Grave</option></select></label><label>Seguimiento<input id="pdIncFollowup" maxlength="180" value="${esc2(old?.followup||old?.seguimiento||'')}" placeholder="Ej. Se habló con el alumno"></label><label style="grid-column:1/-1">Observaciones<textarea id="pdIncNotes" maxlength="500" placeholder="Describe brevemente lo ocurrido">${esc2(old?.notes||old?.observacion||'')}</textarea></label></div><div class="pd-modal-actions"><button type="button" class="btn" onclick="this.closest('.modal-backdrop').remove()">Cancelar</button><button type="button" class="btn primary" onclick="window.saveIncidentModal('${id||''}')">Guardar</button></div></div>`;
    document.body.appendChild(modal);
    const fillStudents=()=>{const sel=document.getElementById('pdIncStudent');const list=students();sel.innerHTML=list.map(s=>`<option value="${s.id}">${esc2(s.name)}</option>`).join('')||'<option value="">Sin alumnos en este grupo</option>';if(oldStudent&&list.some(s=>s.id===oldStudent.id))sel.value=oldStudent.id};
    document.getElementById('pdIncGroup').addEventListener('change',fillStudents); fillStudents();
    if(old){document.getElementById('pdIncType').value=old.type||'Académica';document.getElementById('pdIncSeverity').value=old.severity||old.gravedad||'Leve'}
  }
  function saveIncidentModal(id){
    const groupId=document.getElementById('pdIncGroup')?.value,studentId=document.getElementById('pdIncStudent')?.value,date=document.getElementById('pdIncDate')?.value,type=document.getElementById('pdIncType')?.value,severity=document.getElementById('pdIncSeverity')?.value,followup=document.getElementById('pdIncFollowup')?.value.trim(),notes=document.getElementById('pdIncNotes')?.value.trim();
    if(!groupId||!studentId||!date||!type){alert('Completa grupo, alumno, fecha y tipo.');return}
    db.incidents=Array.isArray(db.incidents)?db.incidents:[];
    if(id){const x=db.incidents.find(v=>v.id===id);if(!x)return;x.groupId=groupId;x.studentId=studentId;x.date=date;x.type=type;x.severity=severity;x.followup=followup;x.notes=notes}else db.incidents.push({id:uid('inc'),groupId,studentId,date,type,severity,followup,notes});
    save();document.getElementById('pdIncidentModal')?.remove();renderIncidencias();
  }
  function deleteIncident(id){const x=(db.incidents||[]).find(v=>v.id===id);if(!x)return;if(!confirm(`¿Eliminar la incidencia de «${studentName(x.studentId)}»?`))return;db.incidents=db.incidents.filter(v=>v.id!==id);save();renderIncidencias()}
  const originalSetView=window.setView;
  window.setView=function(v){if(v==='incidencias'){view=v;document.querySelectorAll('.nav').forEach(b=>b.classList.toggle('active',b.dataset.view===v));document.getElementById('pageTitle').textContent='Incidencias';document.getElementById('pageSubtitle').textContent='Seguimiento disciplinario y académico';return renderIncidencias()}return originalSetView(v)};
  window.openIncidentModal=openIncidentModal;window.saveIncidentModal=saveIncidentModal;window.deleteIncident=deleteIncident;window.PD_INCIDENCIAS={render:renderIncidencias};
})();
