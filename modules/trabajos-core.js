/* Panorama Docente — núcleo compartido de actividades */
(function(){
  function norm(v){return String(v||'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')}
  function gradeFromGroup(groupId){const m=String(groupId||'').match(/^(1|2|3)/);return m?m[1]:''}
  function inferSubject(groupId,requested){if(requested&&PD_CONFIG.subjectAllowed(requested,gradeFromGroup(groupId)))return requested;const grade=gradeFromGroup(groupId),allowed=(PD_CONFIG.subjects||[]).filter(s=>s.grades.includes(grade));return allowed.length===1?allowed[0].id:null}
  function find(groupId,title,date,subjectId){return (db.activities||[]).find(a=>a.groupId===groupId&&norm(a.title)===norm(title)&&String(a.date||'')===String(date||'')&&(!subjectId||a.subjectId===subjectId))||null}
  function getOrCreate({groupId,title,date,subjectId,points=10,source='trabajo'}){db.activities=Array.isArray(db.activities)?db.activities:[];subjectId=inferSubject(groupId,subjectId);let a=find(groupId,title,date,subjectId);if(a){if(source==='impresion')a.source=a.source||'impresion';return a}a={id:uid('act'),groupId,title:String(title).trim(),date,subjectId:subjectId||null,points:Number(points)||10,source};db.activities.push(a);return a}
  function linkPrint(print,opts){const a=getOrCreate({...opts,source:'impresion'});print.activityId=a.id;return a}
  window.PD_WORKS={find,getOrCreate,linkPrint,inferSubject};
})();
