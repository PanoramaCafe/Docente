/* Reglas de materias: 1.º = Biología + Vida Saludable; 2.º/3.º = solo Vida Saludable */
(function(){
function gradeOfGroup(id){const g=db?.groups?.find(x=>x.id===id);return String(g?.grade||id||'').replace(/[^0-9]/g,'').slice(0,1)}
function allowed(groupId){const grade=gradeOfGroup(groupId);return db.subjects.filter(s=>grade==='1'?true:s.name.toLowerCase()!=='biología'&&s.name.toLowerCase()!=='biologia')}
function fixSelect(id,groupId){const el=document.getElementById(id);if(!el)return;const list=allowed(groupId),old=el.value;el.innerHTML=list.map(s=>`<option value="${s.id}">${esc(s.name)}</option>`).join('');if(list.some(s=>s.id===old))el.value=old}
function run(){if(!window.db)return;const pairs=[['attGroup','attSubject'],['gradeGroup','gradeSubject'],['printGroup','printSubject'],['pdGroup','pdSubject']];pairs.forEach(([g,s])=>{const ge=document.getElementById(g),se=document.getElementById(s);if(ge&&se&&!ge.dataset.materiaFix){ge.dataset.materiaFix='1';ge.addEventListener('change',()=>fixSelect(s,ge.value));fixSelect(s,ge.value)}})}
setInterval(run,500);document.addEventListener('DOMContentLoaded',run);})();
