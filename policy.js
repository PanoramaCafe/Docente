/* Panorama Docente — política central de materias */
(function(){
  const CFG=window.PD_CONFIG;
  if(!CFG || !window.db) return;

  const subjects=CFG.subjects.map(s=>({id:s.id,name:s.name,grades:[...s.grades]}));
  db.subjects=subjects;

  function gradeOf(groupId){
    const g=db.groups?.find(x=>x.id===groupId);
    return String(g?.grade||groupId||'').replace(/[^0-9]/g,'').slice(0,1);
  }
  function allowed(groupId){
    const grade=gradeOf(groupId);
    return db.subjects.filter(s=>s.grades.includes(grade));
  }
  function escP(s=''){return typeof esc==='function'?esc(s):String(s)}
  function fix(groupId,select){
    if(!select)return;
    const list=allowed(groupId), old=select.value;
    select.innerHTML=list.map(s=>`<option value="${s.id}">${escP(s.name)}</option>`).join('');
    if(list.some(s=>s.id===old)) select.value=old;
  }
  function bind(){
    [['attGroup','attSubject'],['gradeGroup','gradeSubject'],['printGroup','printSubject'],['pdGroup','pdSubject'],['axGroup','axSub']]
      .forEach(([gid,sid])=>{
        const g=document.getElementById(gid), s=document.getElementById(sid);
        if(!g||!s||g.dataset.pdSubjectPolicy)return;
        g.dataset.pdSubjectPolicy='1';
        g.addEventListener('change',()=>fix(g.value,s));
        fix(g.value,s);
      });
  }
  window.PD_SUBJECT_POLICY={allowed,fix,subjects};
  bind();
  setInterval(bind,500);
})();
