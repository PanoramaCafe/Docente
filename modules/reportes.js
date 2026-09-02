/* Panorama Docente — módulo de Reportes */
(function(){
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const avg=xs=>{const a=xs.map(Number).filter(Number.isFinite);return a.length?a.reduce((x,y)=>x+y,0)/a.length:null};
  const pct=n=>Number.isFinite(n)?`${n.toFixed(1)}%`:'—';
  const studentsOf=g=>db.students.filter(s=>s.groupId===g);
  const actsOf=g=>db.activities.filter(a=>a.groupId===g).sort((a,b)=>String(a.date||'').localeCompare(String(b.date||''))||String(a.title||'').localeCompare(String(b.title||'')));
  const val=(sid,aid)=>{const x=db.grades.find(g=>g.studentId===sid&&g.activityId===aid);return x?.value??''};
  const studentAvg=(sid,acts)=>avg(acts.map(a=>val(sid,a.id)).filter(v=>v!==''));
  const attendance=(sid,from,to)=>{const a=db.attendance.filter(x=>x.studentId===sid&&(!from||x.date>=from)&&(!to||x.date<=to));return a.length?(a.filter(x=>x.status==='P'||x.status==='R').length/a.length)*100:null};
  const incidentsOf=(gid,from,to)=> (db.incidents||[]).filter(i=>i.groupId===gid&&(!from||i.date>=from)&&(!to||i.date<=to));
  const attOf=(gid,from,to)=>db.attendance.filter(a=>a.groupId===gid&&(!from||a.date>=from)&&(!to||a.date<=to));

  function renderReportes(){
    const active=db.groups.filter(g=>g.active);
    document.getElementById('content').innerHTML=`
      <style>
        .pd-reports-card{margin-bottom:16px}
        .pd-reports-controls{display:grid;grid-template-columns:minmax(210px,1.25fr) minmax(150px,.8fr) minmax(150px,.8fr) minmax(150px,.8fr);gap:14px;align-items:end}
        .pd-reports-controls label{display:flex;flex-direction:column;gap:6px;font-weight:600;min-width:0}
        .pd-reports-controls select,.pd-reports-controls input{width:100%;box-sizing:border-box}
        .pd-reports-actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:16px;align-items:center}
        .pd-report-table{width:100%;border-collapse:collapse}
        .pd-report-table th,.pd-report-table td{white-space:nowrap}
        .pd-report-scroll{overflow:auto}
        .pd-report-subtitle{margin:0;color:#667085;font-size:.9rem}
        @media(max-width:800px){.pd-reports-controls{grid-template-columns:1fr 1fr}.pd-reports-controls label:first-child{grid-column:1/-1}}
        @media(max-width:520px){.pd-reports-controls{grid-template-columns:1fr}}
      </style>
      <div class="card pd-reports-card">
        <div class="section-title"><div><h2>Reportes</h2><span class="note">Selecciona el tipo de reporte que necesitas generar.</span></div></div>
        <div class="pd-reports-controls">
          <label>Tipo de reporte<select id="pdRepType">
            <option value="summary">Resumen del grupo</option>
            <option value="gradesGroup">Todas las calificaciones por grupo</option>
            <option value="gradesStudent">Todas las calificaciones por alumno</option>
            <option value="incidents">Incidencias</option>
            <option value="attendance">Asistencia</option>
          </select></label>
          <label>Grupo<select id="pdRepGroup">${active.map(g=>`<option value="${g.id}">${esc(g.name)}</option>`).join('')}</select></label>
          <label id="pdRepStudentWrap" style="display:none">Alumno<select id="pdRepStudent"></select></label>
          <label>Desde<input id="pdRepFrom" type="date"></label>
          <label>Hasta<input id="pdRepTo" type="date" value="${today()}"></label>
        </div>
        <div class="pd-reports-actions">
          <button class="btn primary" type="button" id="pdRepPreview">Mostrar reporte</button>
          <button class="btn" type="button" id="pdRepPdf">Exportar PDF</button>
          <button class="btn" type="button" id="pdRepExcel">Exportar Excel</button>
        </div>
      </div>
      <div id="pdRepSummary"></div>`;

    const group=document.getElementById('pdRepGroup'),student=document.getElementById('pdRepStudent'),type=document.getElementById('pdRepType');
    function fillStudents(){const list=studentsOf(group.value);student.innerHTML=list.map(s=>`<option value="${s.id}">${esc(s.name)}</option>`).join('')||'<option value="">Sin alumnos</option>';document.getElementById('pdRepStudentWrap').style.display=type.value==='gradesStudent'?'flex':'none';}
    group.onchange=()=>{fillStudents();preview()}; type.onchange=()=>{fillStudents();preview()};
    document.getElementById('pdRepPreview').onclick=preview; document.getElementById('pdRepPdf').onclick=reportPdf; document.getElementById('pdRepExcel').onclick=reportExcel;
    fillStudents(); preview();
  }

  function getData(){
    const gid=document.getElementById('pdRepGroup').value,type=document.getElementById('pdRepType').value,sid=document.getElementById('pdRepStudent')?.value,from=document.getElementById('pdRepFrom').value,to=document.getElementById('pdRepTo').value;
    const acts=actsOf(gid).filter(a=>(!from||a.date>=from)&&(!to||a.date<=to));
    const students=type==='gradesStudent'?studentsOf(gid).filter(s=>s.id===sid):studentsOf(gid);
    return {gid,type,sid,from,to,acts,students};
  }
  function preview(){const d=getData(),target=document.getElementById('pdRepSummary');if(!target)return;if(d.type==='summary')return renderSummary(d,target);if(d.type==='gradesGroup'||d.type==='gradesStudent')return renderGrades(d,target);if(d.type==='incidents')return renderIncidents(d,target);return renderAttendance(d,target)}

  function renderSummary(d,target){
    const grades=d.students.flatMap(s=>d.acts.map(a=>val(s.id,a.id)).filter(v=>v!==''));const at=attOf(d.gid,d.from,d.to),inc=incidentsOf(d.gid,d.from,d.to),av=avg(grades),att=at.length?(at.filter(x=>x.status==='P'||x.status==='R').length/at.length)*100:null;
    target.innerHTML=`<div class="grid kpis"><div class="card kpi"><div class="label">Alumnos</div><div class="value">${d.students.length}</div><div class="hint">${esc(groupName(d.gid))}</div></div><div class="card kpi"><div class="label">Promedio</div><div class="value">${av===null?'—':av.toFixed(1)}</div><div class="hint">Actividades del periodo</div></div><div class="card kpi"><div class="label">Asistencia</div><div class="value">${pct(att)}</div><div class="hint">P + R / registros</div></div><div class="card kpi"><div class="label">Incidencias</div><div class="value">${inc.length}</div><div class="hint">En el periodo</div></div></div><div class="card"><div class="section-title"><div><h2>Resumen del grupo</h2><p class="pd-report-subtitle">${d.from||'Inicio'} → ${d.to||'Sin límite'}</p></div></div><div class="pd-report-scroll"><table class="table pd-report-table"><thead><tr><th>Alumno</th><th>Promedio</th><th>Asistencia</th><th>Incidencias</th></tr></thead><tbody>${d.students.map(s=>{const si=incidentsOf(d.gid,d.from,d.to).filter(i=>i.studentId===s.id).length;return `<tr><td><b>${esc(s.name)}</b></td><td>${studentAvg(s.id,d.acts)===null?'—':studentAvg(s.id,d.acts).toFixed(1)}</td><td>${pct(attendance(s.id,d.from,d.to))}</td><td>${si}</td></tr>`}).join('')||'<tr><td colspan="4" class="empty">No hay alumnos.</td></tr>'}</tbody></table></div></div>`;
  }

  function renderGrades(d,target){
    if(!d.students.length){target.innerHTML='<div class="card empty">No hay alumnos para este reporte.</div>';return}
    const title=d.type==='gradesStudent'?`Calificaciones de ${d.students[0].name}`:`Todas las calificaciones · ${groupName(d.gid)}`;
    const headers=d.acts.map(a=>`<th title="${esc(a.title)}">${esc(a.title)}<br><small>${esc(subjectName(a.subjectId))} · ${esc(a.date)} · máx. ${a.points||10}</small></th>`).join('');
    const body=d.students.map((s,i)=>`<tr><td>${i+1}</td><td><b>${esc(s.name)}</b></td>${d.acts.map(a=>`<td>${val(s.id,a.id)===''?'—':esc(val(s.id,a.id))}</td>`).join('')}<td><b>${studentAvg(s.id,d.acts)===null?'—':studentAvg(s.id,d.acts).toFixed(1)}</b></td><td>${pct(attendance(s.id,d.from,d.to))}</td></tr>`).join('');
    target.innerHTML=`<div class="card"><div class="section-title"><div><h2>${esc(title)}</h2><span class="note">${d.acts.length} actividad(es) · ${d.students.length} alumno(s) · ${d.from||'Inicio'} → ${d.to||'Sin límite'}</span></div></div><div class="pd-report-scroll"><table class="table pd-report-table"><thead><tr><th>#</th><th>Alumno</th>${headers}<th>Promedio</th><th>Asistencia</th></tr></thead><tbody>${body}</tbody></table></div></div>`;
  }

  function renderIncidents(d,target){
    const rows=incidentsOf(d.gid,d.from,d.to).sort((a,b)=>String(b.date).localeCompare(String(a.date)));
    target.innerHTML=`<div class="card"><div class="section-title"><div><h2>Reporte de incidencias · ${esc(groupName(d.gid))}</h2><span class="note">${rows.length} incidencia(s) · ${d.from||'Inicio'} → ${d.to||'Sin límite'}</span></div></div><div class="pd-report-scroll"><table class="table pd-report-table"><thead><tr><th>Fecha</th><th>Alumno</th><th>Tipo</th><th>Gravedad</th><th>Seguimiento</th><th>Observaciones</th></tr></thead><tbody>${rows.map(i=>{const s=db.students.find(x=>x.id===i.studentId);return `<tr><td>${esc(i.date||'')}</td><td><b>${esc(s?.name||'Alumno eliminado')}</b></td><td>${esc(i.type||'')}</td><td>${esc(i.severity||i.gravedad||'')}</td><td>${esc(i.followUp||i.followup||i.seguimiento||'')}</td><td>${esc(i.notes||i.observations||i.observacion||'')}</td></tr>`}).join('')||'<tr><td colspan="6" class="empty">No hay incidencias en el periodo.</td></tr>'}</tbody></table></div></div>`;
  }

  function renderAttendance(d,target){
    const dates=[...new Set(attOf(d.gid,d.from,d.to).map(a=>a.date))].sort();const status=(sid,date)=>db.attendance.find(x=>x.studentId===sid&&x.date===date)?.status||'·';
    const head=dates.map(x=>`<th>${esc(x)}</th>`).join('');const body=d.students.map(s=>`<tr><td><b>${esc(s.name)}</b></td>${dates.map(date=>`<td style="text-align:center">${status(s.id,date)}</td>`).join('')}<td>${pct(attendance(s.id,d.from,d.to))}</td></tr>`).join('');
    target.innerHTML=`<div class="card"><div class="section-title"><div><h2>Reporte de asistencia · ${esc(groupName(d.gid))}</h2><span class="note">P=Presente · F=Falta · J=Justificada · R=Retardo · ·=Sin registro</span></div></div><div class="pd-report-scroll"><table class="table pd-report-table"><thead><tr><th>Alumno</th>${head}<th>% asistencia</th></tr></thead><tbody>${body||'<tr><td colspan="2" class="empty">No hay alumnos.</td></tr>'}</tbody></table></div></div>`;
  }

  function reportPdf(){
    const d=getData();if(!window.jspdf?.jsPDF)return alert('No está disponible el generador PDF.');const {jsPDF}=window.jspdf,doc=new jsPDF({orientation:'landscape'});doc.setFontSize(16);doc.text('Panorama Docente',14,15);doc.setFontSize(11);
    const titles={summary:`Resumen · ${groupName(d.gid)}`,gradesGroup:`Calificaciones · ${groupName(d.gid)}`,gradesStudent:`Calificaciones · ${d.students[0]?.name||'Alumno'}`,incidents:`Incidencias · ${groupName(d.gid)}`,attendance:`Asistencia · ${groupName(d.gid)}`};doc.text(titles[d.type],14,23);doc.setFontSize(8);doc.text(`Ciclo ${db.cycle} · ${d.from||'Inicio'} a ${d.to||'Actualidad'}`,14,29);
    if(d.type==='summary')pdfSummary(doc,d);else if(d.type==='gradesGroup'||d.type==='gradesStudent')pdfGrades(doc,d);else if(d.type==='incidents')pdfIncidents(doc,d);else pdfAttendance(doc,d);doc.save(`Reporte_${d.gid}_${d.type}_${today()}.pdf`);
  }
  function pdfSummary(doc,d){let y=40;doc.setFontSize(9);doc.text(`Alumnos: ${d.students.length}`,14,y);doc.text(`Actividades: ${d.acts.length}`,70,y);doc.text(`Incidencias: ${incidentsOf(d.gid,d.from,d.to).length}`,125,y);y+=10;doc.text('Alumno',14,y);doc.text('Promedio',135,y);doc.text('Asistencia',170,y);doc.text('Incidencias',215,y);y+=6;d.students.forEach(s=>{if(y>190){doc.addPage();y=18}const a=studentAvg(s.id,d.acts),at=attendance(s.id,d.from,d.to),inc=incidentsOf(d.gid,d.from,d.to).filter(i=>i.studentId===s.id).length;doc.text(String(s.name).slice(0,55),14,y);doc.text(a===null?'—':a.toFixed(1),135,y);doc.text(at===null?'—':at.toFixed(1)+'%',170,y);doc.text(String(inc),215,y);y+=6})}
  function pdfGrades(doc,d){let y=40;const cols=Math.min(d.acts.length,9);doc.setFontSize(7);doc.text('Alumno',8,y);d.acts.slice(0,cols).forEach((a,i)=>doc.text(String(a.title).slice(0,14),48+i*24,y));doc.text('Prom.',48+cols*24,y);doc.text('Asist.',78+cols*24,y);y+=5;d.students.forEach(s=>{if(y>190){doc.addPage();y=18}doc.text(String(s.name).slice(0,27),8,y);d.acts.slice(0,cols).forEach((a,i)=>doc.text(String(val(s.id,a.id)===''?'—':val(s.id,a.id)).slice(0,7),48+i*24,y));const av=studentAvg(s.id,d.acts),at=attendance(s.id,d.from,d.to);doc.text(av===null?'—':av.toFixed(1),48+cols*24,y);doc.text(at===null?'—':at.toFixed(0)+'%',78+cols*24,y);y+=5});if(d.acts.length>cols){doc.setFontSize(7);doc.text('Nota: por espacio, el PDF muestra las primeras 9 actividades; el Excel contiene todas.',8,198)}}
  function pdfIncidents(doc,d){let y=40;doc.setFontSize(8);['Fecha','Alumno','Tipo','Gravedad','Seguimiento'].forEach((x,i)=>doc.text(x,[10,35,105,145,175][i],y));y+=6;incidentsOf(d.gid,d.from,d.to).sort((a,b)=>String(b.date).localeCompare(String(a.date))).forEach(i=>{if(y>190){doc.addPage();y=18}const s=db.students.find(x=>x.id===i.studentId);doc.text(String(i.date||'').slice(0,10),10,y);doc.text(String(s?.name||'Alumno eliminado').slice(0,28),35,y);doc.text(String(i.type||'').slice(0,25),105,y);doc.text(String(i.severity||i.gravedad||'').slice(0,20),145,y);doc.text(String(i.followUp||i.followup||i.seguimiento||'').slice(0,30),175,y);y+=6})}
  function pdfAttendance(doc,d){const dates=[...new Set(attOf(d.gid,d.from,d.to).map(a=>a.date))].sort();let y=40;doc.setFontSize(7);doc.text('Alumno',8,y);dates.slice(0,12).forEach((x,i)=>doc.text(x.slice(5),48+i*18,y));doc.text('%',48+Math.min(dates.length,12)*18,y);y+=5;d.students.forEach(s=>{if(y>190){doc.addPage();y=18}doc.text(String(s.name).slice(0,27),8,y);dates.slice(0,12).forEach((date,i)=>{const a=db.attendance.find(x=>x.studentId===s.id&&x.date===date);doc.text(a?.status||'·',48+i*18,y)});const at=attendance(s.id,d.from,d.to);doc.text(at===null?'—':at.toFixed(0)+'%',48+Math.min(dates.length,12)*18,y);y+=5});if(dates.length>12){doc.setFontSize(7);doc.text('Nota: el PDF muestra las primeras 12 fechas; el Excel contiene todas.',8,198)}}

  function reportExcel(){
    const d=getData();if(!window.XLSX)return alert('No está disponible el exportador Excel.');let rows=[];
    if(d.type==='summary')rows=d.students.map(s=>({Alumno:s.name,Grupo:groupName(d.gid),Promedio:studentAvg(s.id,d.acts)===null?'':Number(studentAvg(s.id,d.acts).toFixed(2)),Asistencia:attendance(s.id,d.from,d.to)===null?'':Number(attendance(s.id,d.from,d.to).toFixed(2)),Incidencias:incidentsOf(d.gid,d.from,d.to).filter(i=>i.studentId===s.id).length}));
    else if(d.type==='gradesGroup'||d.type==='gradesStudent')rows=d.students.map(s=>{const r={Alumno:s.name,Grupo:groupName(d.gid)};d.acts.forEach(a=>r[`${a.date} · ${a.title} · ${subjectName(a.subjectId)}`]=val(s.id,a.id)===''?'':Number(val(s.id,a.id)));r.Promedio=studentAvg(s.id,d.acts)===null?'':Number(studentAvg(s.id,d.acts).toFixed(2));r.Asistencia=attendance(s.id,d.from,d.to)===null?'':Number(attendance(s.id,d.from,d.to).toFixed(2));return r});
    else if(d.type==='incidents')rows=incidentsOf(d.gid,d.from,d.to).map(i=>{const s=db.students.find(x=>x.id===i.studentId);return {Fecha:i.date||'',Alumno:s?.name||'Alumno eliminado',Grupo:groupName(d.gid),Tipo:i.type||'',Gravedad:i.severity||i.gravedad||'',Seguimiento:i.followUp||i.followup||i.seguimiento||'',Observaciones:i.notes||i.observations||i.observacion||''}});
    else {const dates=[...new Set(attOf(d.gid,d.from,d.to).map(a=>a.date))].sort();rows=d.students.map(s=>{const r={Alumno:s.name,Grupo:groupName(d.gid)};dates.forEach(date=>{const a=db.attendance.find(x=>x.studentId===s.id&&x.date===date);r[date]=a?.status||'·'});r.Asistencia=attendance(s.id,d.from,d.to)===null?'':Number(attendance(s.id,d.from,d.to).toFixed(2));return r})}
    const ws=XLSX.utils.json_to_sheet(rows.length?rows:[{Mensaje:'Sin registros para los filtros seleccionados'}]);ws['!cols']=Object.keys(rows[0]||{Mensaje:''}).map((k,i)=>({wch:i<2?28:Math.min(38,Math.max(12,k.length+2))}));const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,'Reporte');XLSX.writeFile(wb,`Reporte_${d.gid}_${d.type}_${today()}.xlsx`);
  }

  const originalSetView=window.setView;window.setView=function(v){if(v==='reportes'){view=v;document.querySelectorAll('.nav').forEach(b=>b.classList.toggle('active',b.dataset.view===v));document.getElementById('pageTitle').textContent='Reportes';document.getElementById('pageSubtitle').textContent='Cortes para familias, asesores y dirección';return renderReportes()}return originalSetView(v)};
  window.PD_REPORTES={render:renderReportes};
})();
