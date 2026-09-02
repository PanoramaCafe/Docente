/* Panorama Docente — módulo de Reportes */
(function(){
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const avg=xs=>{const a=xs.map(Number).filter(Number.isFinite);return a.length?a.reduce((x,y)=>x+y,0)/a.length:null};
  const pct=n=>Number.isFinite(n)?`${n.toFixed(1)}%`:'—';
  const studentsOf=g=>db.students.filter(s=>s.groupId===g);
  const gradeOf=g=>String(db.groups.find(x=>x.id===g)?.grade||g||'').replace(/[^0-9]/g,'').slice(0,1);
  const actsOf=g=>db.activities.filter(a=>a.groupId===g).sort((a,b)=>String(a.date||'').localeCompare(String(b.date||''))||String(a.title||'').localeCompare(String(b.title||'')));
  const val=(sid,aid)=>{const x=db.grades.find(g=>g.studentId===sid&&g.activityId===aid);return x?.value??''};
  const studentAvg=(sid,acts)=>avg(acts.map(a=>val(sid,a.id)).filter(v=>v!==''));
  const attendance=(sid,from,to)=>{const a=db.attendance.filter(x=>x.studentId===sid&&(!from||x.date>=from)&&(!to||x.date<=to));return a.length?(a.filter(x=>x.status==='P'||x.status==='R').length/a.length)*100:null};

  function renderReportes(){
    const active=db.groups.filter(g=>g.active);
    document.getElementById('content').innerHTML=`
      <div class="card">
        <div class="section-title"><div><h2>Reporte de calificaciones</h2><span class="note">Consulta todas las calificaciones registradas, por grupo o por alumno.</span></div></div>
        <div class="form-grid">
          <label>Tipo de reporte<select id="pdRepType"><option value="group">Todas las calificaciones del grupo</option><option value="student">Todas las calificaciones de un alumno</option></select></label>
          <label>Grupo<select id="pdRepGroup">${active.map(g=>`<option value="${g.id}">${esc(g.name)}</option>`).join('')}</select></label>
          <label id="pdRepStudentWrap">Alumno<select id="pdRepStudent"></select></label>
          <label>Desde<input id="pdRepFrom" type="date"></label>
          <label>Hasta<input id="pdRepTo" type="date" value="${today()}"></label>
        </div>
        <div class="pd-modal-actions" style="margin-top:14px">
          <button class="btn primary" type="button" id="pdRepPreview">Mostrar reporte</button>
          <button class="btn" type="button" id="pdRepPdf">Exportar PDF</button>
          <button class="btn" type="button" id="pdRepExcel">Exportar Excel</button>
        </div>
      </div>
      <div id="pdRepSummary" style="margin-top:16px"></div>`;

    const group=document.getElementById('pdRepGroup');
    const student=document.getElementById('pdRepStudent');
    const type=document.getElementById('pdRepType');
    function fillStudents(){const list=studentsOf(group.value);student.innerHTML=list.map(s=>`<option value="${s.id}">${esc(s.name)}</option>`).join('')||'<option value="">Sin alumnos</option>';document.getElementById('pdRepStudentWrap').style.display=type.value==='student'?'':'none';}
    group.onchange=fillStudents;type.onchange=()=>{fillStudents();preview()};fillStudents();
    document.getElementById('pdRepPreview').onclick=preview;
    document.getElementById('pdRepPdf').onclick=reportPdf;
    document.getElementById('pdRepExcel').onclick=reportExcel;
    preview();
  }

  function getData(){
    const gid=document.getElementById('pdRepGroup').value,type=document.getElementById('pdRepType').value,sid=document.getElementById('pdRepStudent')?.value,from=document.getElementById('pdRepFrom').value,to=document.getElementById('pdRepTo').value;
    const acts=actsOf(gid).filter(a=>(!from||a.date>=from)&&(!to||a.date<=to));
    const students=type==='student'?studentsOf(gid).filter(s=>s.id===sid):studentsOf(gid);
    return {gid,type,sid,from,to,acts,students};
  }

  function preview(){
    const d=getData(),target=document.getElementById('pdRepSummary');if(!target)return;
    if(!d.students.length){target.innerHTML='<div class="card empty">No hay alumnos para este reporte.</div>';return;}
    const title=d.type==='student'?`Calificaciones de ${d.students[0].name}`:`Todas las calificaciones · ${groupName(d.gid)}`;
    const headers=d.acts.map(a=>`<th title="${esc(a.title)}">${esc(a.title)}<br><small>${esc(subjectName(a.subjectId))} · ${esc(a.date)} · máx. ${a.points||10}</small></th>`).join('');
    const body=d.students.map((s,i)=>`<tr><td>${i+1}</td><td><b>${esc(s.name)}</b></td>${d.acts.map(a=>`<td>${val(s.id,a.id)===''?'—':esc(val(s.id,a.id))}</td>`).join('')}<td><b>${studentAvg(s.id,d.acts)===null?'—':studentAvg(s.id,d.acts).toFixed(1)}</b></td><td>${pct(attendance(s.id,d.from,d.to))}</td></tr>`).join('');
    target.innerHTML=`<div class="card"><div class="section-title"><div><h2>${esc(title)}</h2><span class="note">${d.acts.length} actividad(es) · ${d.students.length} alumno(s) · ${d.from||'Inicio'} → ${d.to||'Sin límite'}</span></div></div><div class="table-wrap"><table class="table"><thead><tr><th>#</th><th>Alumno</th>${headers}<th>Promedio</th><th>Asistencia</th></tr></thead><tbody>${body}</tbody></table></div></div>`;
  }

  function reportPdf(){
    const d=getData();if(!window.jspdf?.jsPDF)return alert('No está disponible el generador PDF.');if(!d.students.length)return alert('No hay alumnos para exportar.');
    const {jsPDF}=window.jspdf,doc=new jsPDF({orientation:'landscape'});const title=d.type==='student'?`Calificaciones · ${d.students[0].name}`:`Calificaciones · ${groupName(d.gid)}`;
    doc.setFontSize(16);doc.text('Panorama Docente',14,15);doc.setFontSize(11);doc.text(title.slice(0,100),14,23);doc.setFontSize(8);doc.text(`Ciclo ${db.cycle} · Periodo: ${d.from||'Inicio'} a ${d.to||'Actualidad'}`,14,29);
    let y=38;const cols=Math.min(d.acts.length,10);doc.setFontSize(7);doc.text('Alumno',8,y);d.acts.slice(0,cols).forEach((a,i)=>doc.text(String(a.title).slice(0,16),48+i*22,y));doc.text('Prom.',48+cols*22,y);doc.text('Asist.',72+cols*22,y);y+=5;
    d.students.forEach(s=>{if(y>190){doc.addPage();y=18}doc.text(String(s.name).slice(0,28),8,y);d.acts.slice(0,cols).forEach((a,i)=>doc.text(String(val(s.id,a.id)===''?'—':val(s.id,a.id)).slice(0,7),48+i*22,y));const av=studentAvg(s,d.acts),at=attendance(s.id,d.from,d.to);doc.text(av===null?'—':av.toFixed(1),48+cols*22,y);doc.text(at===null?'—':at.toFixed(0)+'%',72+cols*22,y);y+=5});
    if(d.acts.length>10){doc.setFontSize(7);doc.text('Nota: el PDF muestra las primeras 10 actividades; el Excel contiene todas.',8,198)}doc.save(`Calificaciones_${d.gid}_${today()}.pdf`);
  }

  function reportExcel(){
    const d=getData();if(!window.XLSX)return alert('No está disponible el exportador Excel.');if(!d.students.length)return alert('No hay alumnos para exportar.');
    const rows=d.students.map(s=>{const r={Alumno:s.name,Grupo:groupName(d.gid)};d.acts.forEach(a=>r[`${a.date} · ${a.title} · ${subjectName(a.subjectId)}`]=val(s.id,a.id)===''?'':Number(val(s.id,a.id)));r.Promedio=studentAvg(s.id,d.acts)===null?'':Number(studentAvg(s.id,d.acts).toFixed(2));r.Asistencia=attendance(s.id,d.from,d.to)===null?'':Number(attendance(s.id,d.from,d.to).toFixed(2));return r});
    const ws=XLSX.utils.json_to_sheet(rows);ws['!cols']=Object.keys(rows[0]).map((k,i)=>({wch:i<2?28:Math.min(32,Math.max(12,k.length+2))}));const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,'Calificaciones');XLSX.writeFile(wb,`Calificaciones_${d.gid}_${today()}.xlsx`);
  }

  const originalSetView=window.setView;
  window.setView=function(v){if(v==='reportes'){view=v;document.querySelectorAll('.nav').forEach(b=>b.classList.toggle('active',b.dataset.view===v));document.getElementById('pageTitle').textContent='Reportes';document.getElementById('pageSubtitle').textContent='Cortes para familias, asesores y dirección';return renderReportes()}return originalSetView(v)};
  window.PD_REPORTES={render:renderReportes};
})();
