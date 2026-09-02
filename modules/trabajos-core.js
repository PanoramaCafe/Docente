/* Panorama Docente — núcleo compartido de actividades. */
(function(){
  function norm(v){return String(v||'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')}
  function groupGrade(groupId){const g=(db.groups||[]).find(x=>x.id===groupId);if(g?.grade)return String(g.grade);const m=String(groupId||'').match(/^(1|2|3)/);return m?m[1]:''}
  function inferSubject(groupId,subjectId){const grade=groupGrade(groupId);if(subjectId&&window.PD_CONFIG?.subjectAllowedForGroup?.(subjectId,groupId))return subjectId;if(grade==='2'||grade==='3')return 'vida23';return subjectId||null}
  function find(groupId,title,date,subjectId){return (db.activities||[]).find(a=>a.groupId===groupId&&norm(a.title)===norm(title)&&String(a.date||'')===String(date||'')&&(!subjectId||a.subjectId===subjectId))||null}
  function getOrCreate({groupId,title,date,subjectId,points=10,source='trabajo'}){db.activities=Array.isArray(db.activities)?db.activities:[];subjectId=inferSubject(groupId,subjectId);let a=find(groupId,title,date,subjectId);if(a){if(source==='impresion')a.source=a.source||'impresion';if(subjectId&&!a.subjectId)a.subjectId=subjectId;return a}a={id:uid('act'),groupId,title:String(title).trim(),date,subjectId,points:Number(points)||10,source};db.activities.push(a);return a}
  function linkPrint(print,opts){const a=getOrCreate({...opts,source:'impresion'});print.activityId=a.id;return a}
  window.PD_WORKS={find,getOrCreate,linkPrint,inferSubject,gradeOfGroup:groupGrade};
})();
