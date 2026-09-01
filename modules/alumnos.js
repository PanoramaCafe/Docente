/* Panorama Docente — módulo de Alumnos
   Funciones propias de la sección: eliminar con confirmación y evitar duplicados al importar.
*/
(function(){
  const KEY='panoramaDocente_v1';
  const normalize=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase().replace(/\s+/g,' ');
  const normalizeCurp=v=>String(v??'').trim().toUpperCase().replace(/\s+/g,'');
  function read(){try{return JSON.parse(localStorage.getItem(KEY))||null}catch{return null}}
  function write(data){localStorage.setItem(KEY,JSON.stringify(data))}
  function deleteStudent(id){
    const data=read();
    if(!data||!Array.isArray(data.students))return;
    const student=data.students.find(x=>x.id===id);
    if(!student)return;
    if(!confirm(`¿Eliminar al alumno “${student.name}”?\n\nTambién se eliminarán sus asistencias, calificaciones e incidencias asociadas.`))return;
    data.students=data.students.filter(x=>x.id!==id);
    data.attendance=(data.attendance||[]).filter(x=>x.studentId!==id);
    data.grades=(data.grades||[]).filter(x=>x.studentId!==id);
    data.incidents=(data.incidents||[]).filter(x=>x.studentId!==id);
    write(data);
    location.reload();
  }
  function addDeleteButtons(){
    document.querySelectorAll('#studentRows tr').forEach(row=>{
      if(row.querySelector('.pd-delete-student'))return;
      const edit=row.querySelector('button[onclick*="openStudentModal"]');
      if(!edit)return;
      const match=(edit.getAttribute('onclick')||'').match(/openStudentModal\(['"]([^'"]+)['"]\)/);
      if(!match)return;
      const button=document.createElement('button');
      button.type='button';
      button.className='btn danger pd-delete-student';
      button.textContent='Eliminar';
      button.addEventListener('click',()=>deleteStudent(match[1]));
      edit.parentElement.append(' ',button);
    });
  }
  function observe(){
    const target=document.getElementById('content')||document.body;
    new MutationObserver(addDeleteButtons).observe(target,{childList:true,subtree:true});
    addDeleteButtons();
    requestAnimationFrame(addDeleteButtons);
  }
  function importExcel(){
    const file=document.getElementById('xlsxFile')?.files?.[0];
    if(!file)return alert('Selecciona un archivo.');
    const reader=new FileReader();
    reader.onload=e=>{
      try{
        const wb=XLSX.read(e.target.result,{type:'array'});
        const data=read();
        if(!data)return alert('No se encontraron datos locales.');
        data.students=Array.isArray(data.students)?data.students:[];
        const existingKeys=new Set(data.students.map(s=>`${normalize(s.name)}|${normalize(s.groupId)}`));
        const existingCurps=new Set(data.students.map(s=>normalizeCurp(s.curp)).filter(Boolean));
        let added=0,duplicates=0,invalid=0,rowsRead=0;
        wb.SheetNames.forEach(sheetName=>{
          const sheet=wb.Sheets[sheetName];
          const rows=XLSX.utils.sheet_to_json(sheet,{defval:''});
          rows.forEach(row=>{
            rowsRead++;
            const keys=Object.keys(row).map(k=>[k,k.toLowerCase().trim()]);
            const get=(...names)=>{const found=keys.find(([a,b])=>names.includes(b));return found?row[found[0]]:''};
            let name=get('nombre completo','nombre','alumno','estudiante');
            if(!name)name=[get('apellido paterno','paterno'),get('apellido materno','materno'),get('nombres')].filter(Boolean).join(' ');
            if(!name)return;
            const raw=String(get('grupo')||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
            const grade=raw.match(/[123]/)?.[0]||'';
            const letter=raw.match(/[ABCDE]/)?.[0]||'';
            const groupId=grade+letter;
            if(!/^[123][ABCDE]$/.test(groupId)||!data.groups.some(g=>g.id===groupId)){invalid++;return;}
            const curp=normalizeCurp(get('curp'));
            const duplicateKey=`${normalize(name)}|${normalize(groupId)}`;
            if(existingKeys.has(duplicateKey)||(curp&&existingCurps.has(curp))){duplicates++;return;}
            data.students.push({id:'stu_'+Math.random().toString(36).slice(2,9),name:String(name).trim(),curp,groupId});
            existingKeys.add(duplicateKey);
            if(curp)existingCurps.add(curp);
            added++;
          });
        });
        write(data);
        alert(`Importación terminada.\n\nFilas revisadas: ${rowsRead}\nAgregados: ${added}\nDuplicados omitidos: ${duplicates}\nFilas sin grupo válido: ${invalid}`);
        location.reload();
      }catch(err){alert('No se pudo leer el archivo: '+err.message)}
    };
    reader.readAsArrayBuffer(file);
  }
  window.PD_ALUMNOS={deleteStudent,addDeleteButtons};
  window.importExcel=importExcel;
  observe();
})();
