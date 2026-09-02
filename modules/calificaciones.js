/* Panorama Docente — módulo de Calificaciones */
(function(){
  const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const gradeOf=id=>String(db.groups.find(g=>g.id===id)?.grade||id||'').replace(/[^0-9]/g,'').slice(0,1);
  const allowed=(groupId,sid)=>!sid||PD_CONFIG.subjectAllowedForGroup(sid,groupId);
  function view(){
    const groups=db.groups.filter(g=>g.active);
    return `<div class="toolbar"><select id="cxGroup"><option value="">Selecciona grupo</option>${groups.map(g=>`<option value="${g.id}">${esc(g.name)}</option>`).join('')}</select><select id="cxSubject" disabled><option value="">Selecciona primero el grupo</option></select><button class="btn primary" id="cxOpen">Abrir calificaciones</button></div><div id="cxTable" class="card"><div class="empty">Selecciona grupo y materia.</div></div>`;
  }
  function subjects(groupId){return PD_CONFIG.subjects.filter(s=>PD_CONFIG.subjectAllowedForGroup(s.id,groupId));}
  function load(){
    const g=document.getElementById('cxGroup')?.value,s=document.getElementById('cxSubject')?.value;
    if(!g)return;
    const sel=document.getElementById('cxSubject');
    sel.innerHTML=subjects(g).map(x=>`<option value="${x.id}">${esc(x.name)}</option>`).join('');
    sel.disabled=false;
    if(s&&subjects(g).some(x=>x.id===s))sel.value=s;
    renderTable(g,sel.value);
  }
  function renderTable(groupId,subjectId){
    const list=studentsOf(groupId),acts=db.activities.filter(a=>a.groupId===groupId&&a.subjectId===subjectId).sort((a,b)=>String(a.date||'').localeCompare(String(b.date||'')));
    const target=document.getElementById('cxTable'); if(!target)return;
    if(!acts.length){target.innerHTML=`<div class="empty">No hay actividades registradas para ${esc(subjectName(subjectId))} en ${esc(groupName(groupId))}. Primero crea el trabajo en <b>Trabajos</b> o desde <b>Impresiones</b>.</div>`;return;}
    target.innerHTML=`<div class="section-title"><div><h2>${esc(groupName(groupId))} · ${esc(subjectName(subjectId))}</h2><small>Captura sobre el valor de cada actividad. Deja vacío si aún no hay calificación.</small></div><button class="btn primary" id="cxSave">Guardar calificaciones</button></div><div class="table-wrap"><table class="table"><thead><tr><th>#</th><th>Alumno</th>${acts.map(a=>`<th title="${esc(a.title)}">${esc(a.title)}<br><small>${esc(a.date)} · máx. ${a.points||10}</small></th>`).join('')}<th>Promedio</th></tr></thead><tbody>${list.map((st,i)=>{
      const vals=acts.map(a=>{const r=db.grades.find(x=>x.activityId===a.id&&x.studentId===st.id);return r?.value??''});
      const nums=vals.filter(v=>v!==''&&Number.isFinite(Number(v))).map(Number); const av=nums.length?nums.reduce((a,b)=>a+b,0)/nums.length:null;
      return `<tr><td>${i+1}</td><td><b>${esc(st.name)}</b></td>${acts.map((a,j)=>`<td><input class="gradeInput cxGrade" data-student="${st.id}" data-activity="${a.id}" data-max="${Number(a.points)||10}" type="number" min="0" max="${Number(a.points)||10}" step="0.1" value="${esc(vals[j])}" inputmode="decimal" style="width:75px"></td>`).join('')}<td><b>${av===null?'—':av.toFixed(1)}</b></td></tr>`;
    }).join('')}</tbody></table></div>`;
    document.getElementById('cxSave').onclick=save;
  }
  function save(){
    let invalid=null;
    document.querySelectorAll('.cxGrade').forEach(el=>{if(invalid||el.value==='')return;const v=Number(el.value),max=Number(el.dataset.max)||10;if(!Number.isFinite(v)||v<0||v>max)invalid=`La calificación debe estar entre 0 y ${max}.`;});
    if(invalid){alert(invalid);return;}
    document.querySelectorAll('.cxGrade').forEach(el=>{const idx=db.grades.findIndex(g=>g.studentId===el.dataset.student&&g.activityId===el.dataset.activity);if(el.value===''){if(idx>=0)db.grades.splice(idx,1);return;}const obj={id:idx>=0?db.grades[idx].id:uid('gr'),studentId:el.dataset.student,activityId:el.dataset.activity,value:Number(el.value)};if(idx>=0)db.grades[idx]=obj;else db.grades.push(obj);});
    saveLocal();
    alert('Calificaciones guardadas.');
    const g=document.getElementById('cxGroup').value,s=document.getElementById('cxSubject').value;renderTable(g,s);
  }
  function saveLocal(){localStorage.setItem('panoramaDocente_v1',JSON.stringify(db));}
  function activate(){
    const c=document.getElementById('content');if(!c)return;
    c.innerHTML=view();
    const g=document.getElementById('cxGroup'),s=document.getElementById('cxSubject');
    g.onchange=()=>{s.innerHTML=subjects(g.value).map(x=>`<option value="${x.id}">${esc(x.name)}</option>`).join('');s.disabled=!g.value;};
    document.getElementById('cxOpen').onclick=()=>renderTable(g.value,s.value);
  }
  const originalSetView=window.setView;
  window.setView=function(v){
    if(v==='calificaciones'){
      view=v;document.querySelectorAll('.nav').forEach(b=>b.classList.toggle('active',b.dataset.view===v));document.getElementById('pageTitle').textContent='Calificaciones';document.getElementById('pageSubtitle').textContent='Evaluación y promedios';activate();return;
    }
    return originalSetView(v);
  };
  window.PD_CALIFICACIONES={activate,renderTable};
})();
