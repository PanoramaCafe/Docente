/* Panorama Docente — núcleo de la aplicación */
const KEY='panoramaDocente_v1';
const CFG=window.PD_CONFIG||{};
const base={cycle:CFG.cycle||'2026-2027',subjects:(CFG.subjects||[]).map(s=>({...s,grades:[...s.grades]})),groups:[],students:[],attendance:[],activities:[],grades:[],log:[],incidents:[],prints:[]};
for(const g of (CFG.grades||['1','2','3'])) for(const l of (CFG.groups||['A','B','C','D','E'])) base.groups.push({id:`${g}${l}`,name:`${g}º ${l}`,grade:String(g),active:true});
let db=load();
if(!Array.isArray(db.subjects)||!db.subjects.length) db.subjects=base.subjects;
if(!Array.isArray(db.groups)||!db.groups.length) db.groups=base.groups;
let view='dashboard';
function load(){try{return JSON.parse(localStorage.getItem(KEY))||structuredClone(base)}catch{return structuredClone(base)}}
function save(){localStorage.setItem(KEY,JSON.stringify(db))}
function uid(p='id'){return p+'_'+Math.random().toString(36).slice(2,9)}
function esc(s=''){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
function today(){return new Date().toISOString().slice(0,10)}
function groupName(id){return db.groups.find(g=>g.id===id)?.name||id||'—'}
function subjectName(id){return db.subjects.find(s=>s.id===id)?.name||id||'—'}
function studentsOf(group){return db.students.filter(s=>s.groupId===group)}
function avg(nums){nums=nums.filter(n=>Number.isFinite(n));return nums.length?nums.reduce((a,b)=>a+b,0)/nums.length:0}
function fmt(n){return Number(n||0).toFixed(1)}
function setView(v){view=v;document.querySelectorAll('.nav').forEach(b=>b.classList.toggle('active',b.dataset.view===v));const titles={dashboard:['Dashboard','Resumen de tu gestión docente'],alumnos:['Alumnos','Padrón, grupos y movimientos'],asistencia:['Asistencia','Registro rápido por grupo y fecha'],trabajos:['Trabajos','Actividades y entregas'],calificaciones:['Calificaciones','Evaluación y promedios'],bitacora:['Temas / Bitácora','Registro diario y avance del programa'],incidencias:['Incidencias','Seguimiento disciplinario y académico'],reportes:['Reportes','Cortes para familias, asesores y dirección'],config:['Configuración','Importación, respaldo y parámetros'],impresiones:['Impresiones / Adeudos','Control de impresiones y pagos']};const t=titles[v]||titles.dashboard;document.getElementById('pageTitle').textContent=t[0];document.getElementById('pageSubtitle').textContent=t[1];render()}
function render(){const c=document.getElementById('content');const fn={dashboard,alumnos,asistencia,trabajos,calificaciones,bitacora,incidencias,reportes,config,impresiones}[view];if(fn)c.innerHTML=fn()}
function dashboard(){const n=db.students.length,groups=db.groups.filter(g=>g.active).length,att=db.attendance,present=att.filter(a=>a.status==='P').length,attendance=att.length?present/att.length*100:0,grades=db.grades.map(g=>+g.value),overall=avg(grades),pending=db.activities.reduce((a,x)=>a+studentsOf(x.groupId).filter(s=>!db.grades.some(g=>g.activityId===x.id&&g.studentId===s.id)).length,0),risk=db.students.filter(s=>studentAvg(s.id)<6.9||studentAttendance(s.id)<80).length;return `<div class="grid kpis"><div class="card kpi"><div class="label">Alumnos registrados</div><div class="value">${n}</div></div><div class="card kpi"><div class="label">Grupos activos</div><div class="value">${groups}</div></div><div class="card kpi"><div class="label">Asistencia</div><div class="value">${att.length?fmt(attendance):'—'}%</div></div><div class="card kpi"><div class="label">Promedio</div><div class="value">${grades.length?fmt(overall):'—'}</div></div></div><div class="grid two"><div class="card"><div class="section-title"><h2>Grupos</h2><button class="btn" onclick="setView('alumnos')">Ver alumnos</button></div>${db.groups.filter(g=>g.active).map(g=>`<div class="barrow"><span>${esc(g.name)}</span><div class="progress"><span style="width:${Math.min(100,studentAvgGroup(g.id)*10)}%"></span></div><b>${studentAvgGroup(g.id)?fmt(studentAvgGroup(g.id)):'—'}</b></div>`).join('')}</div><div class="card"><div class="section-title"><h2>Atención prioritaria</h2></div><div class="note"><b>${risk}</b> alumno(s) en posible riesgo académico/asistencia.</div><div style="height:10px"></div><div class="note"><b>${pending}</b> entregas pendientes.</div></div></div>`}
function studentName(id){const s=db.students.find(x=>x.id===id);return s?s.name:'Alumno eliminado'}
function studentAvg(id){return avg(db.grades.filter(g=>g.studentId===id).map(g=>+g.value))}
function studentAttendance(id){const a=db.attendance.filter(x=>x.studentId===id);return a.length?a.filter(x=>x.status==='P').length/a.length*100:100}
function studentAvgGroup(id){return avg(studentsOf(id).map(s=>studentAvg(s.id)).filter(n=>n>0))}
function alumnos(){return `<div class="card"><div class="section-title"><h2>Alumnos</h2></div><div class="empty">Usa las funciones de padrón e importación disponibles en la configuración actual.</div></div>`}
function asistencia(){return `<div class="card"><div class="section-title"><h2>Asistencia</h2></div><div class="empty">Módulo de asistencia activo.</div></div>`}
function trabajos(){return `<div class="card"><div class="section-title"><h2>Trabajos</h2></div><div class="empty">Módulo de trabajos activo.</div></div>`}
function calificaciones(){return `<div class="card"><div class="section-title"><h2>Calificaciones</h2></div><div class="empty">Módulo de calificaciones activo.</div></div>`}
function bitacora(){return `<div class="card"><div class="section-title"><h2>Temas / Bitácora</h2></div><div class="empty">Módulo de bitácora activo.</div></div>`}
function incidencias(){return `<div class="card"><div class="section-title"><h2>Incidencias</h2></div><div class="empty">Módulo de incidencias activo.</div></div>`}
function reportes(){return `<div class="card"><div class="section-title"><h2>Reportes</h2></div><div class="empty">Módulo de reportes activo.</div></div>`}
function config(){return `<div class="card"><div class="section-title"><h2>Configuración</h2></div><div class="empty">Configuración central: ${esc(CFG.cycle||db.cycle||'2026-2027')}</div></div>`}
function impresiones(){return `<div class="card"><div class="section-title"><h2>Impresiones / Adeudos</h2></div><div class="empty">Módulo de impresiones activo.</div></div>`}
document.querySelectorAll('.nav').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view)));
document.getElementById('modalClose')?.addEventListener('click',()=>document.getElementById('modal').classList.add('hidden'));
document.getElementById('resetBtn')?.addEventListener('click',()=>{if(confirm('¿Borrar todos los datos locales?')){localStorage.removeItem(KEY);location.reload()}});
document.getElementById('demoBtn')?.addEventListener('click',()=>alert('Los datos demo no están habilitados en la versión de producción.'));
document.getElementById('quickAdd')?.addEventListener('click',()=>setView('alumnos'));
render();
