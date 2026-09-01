/* Panorama Docente — núcleo compartido de actividades.
   Una actividad académica tiene un único activityId. Impresiones puede crearla
   y Trabajos/Calificaciones reutilizan ese mismo registro.
*/
(function(){
  function norm(v){return String(v||'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')}
  function find(groupId,title,date,subjectId){
    return (db.activities||[]).find(a=>a.groupId===groupId&&norm(a.title)===norm(title)&&String(a.date||'')===String(date||'')&&(!subjectId||a.subjectId===subjectId))||null;
  }
  function getOrCreate({groupId,title,date,subjectId,points=10,source='trabajo'}){
    db.activities=Array.isArray(db.activities)?db.activities:[];
    let a=find(groupId,title,date,subjectId);
    if(a){if(source==='impresion')a.source=a.source||'impresion';return a}
    a={id:uid('act'),groupId,title:String(title).trim(),date,subjectId:subjectId||null,points:Number(points)||10,source};
    db.activities.push(a);return a;
  }
  function linkPrint(print,opts){const a=getOrCreate({...opts,source:'impresion'});print.activityId=a.id;return a}
  window.PD_WORKS={find,getOrCreate,linkPrint};
})();
