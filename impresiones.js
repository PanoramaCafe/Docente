/* Panorama Docente — Impresiones / Adeudos · control sencillo por grupo */
(function(){
  function init(){
    if(typeof db==="undefined"||!Array.isArray(db.activities))return setTimeout(init,250);
    db.prints=Array.isArray(db.prints)?db.prints:[];
    var nav=document.getElementById("nav");
    if(nav){
      var b=nav.querySelector('[data-view="impresiones"]');
      if(!b){b=document.createElement("button");b.className="nav";b.dataset.view="impresiones";b.textContent="🖨️ Impresiones / Adeudos";nav.appendChild(b);}
      if(!b.dataset.pdPrintBound){b.dataset.pdPrintBound="1";b.addEventListener("click",open);}
    }
  }
  function esc(v){return typeof window.esc==="function"?window.esc(String(v==null?"":v)):String(v==null?"":v).replace(/[&<>"']/g,function(m){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m];});}
  function money(v){return "$"+Number(v||0).toFixed(2);}
  function activeGroups(){return (db.groups||[]).filter(function(g){return g.active;});}
  function open(){
    window.view="impresiones";window.pdCurrentGroup=null;
    document.querySelectorAll(".nav").forEach(function(b){b.classList.toggle("active",b.dataset.view==="impresiones");});
    document.getElementById("pageTitle").textContent="Impresiones / Adeudos";
    document.getElementById("pageSubtitle").textContent="Control de pagos por grupo";
    render();
  }
  function stats(){
    var total=0,paid=0,owing={};
    (db.prints||[]).forEach(function(p){(p.students||[]).forEach(function(s){total+=Number(p.cost||0);if(s.paid)paid+=Number(p.cost||0);else owing[s.studentId]=true;});});
    return '<div class="grid kpis"><div class="card kpi"><div class="label">Generado</div><div class="value">'+money(total)+'</div></div><div class="card kpi"><div class="label">Cobrado</div><div class="value">'+money(paid)+'</div></div><div class="card kpi"><div class="label">Pendiente</div><div class="value">'+money(total-paid)+'</div></div><div class="card kpi"><div class="label">Alumnos con adeudo</div><div class="value">'+Object.keys(owing).length+'</div></div></div>';
  }
  function form(){
    var groups=activeGroups();
    return '<div class="card"><div class="section-title"><h2>Nueva impresión</h2></div><div class="toolbar"><input id="pdDate" type="date" value="'+today()+'"><select id="pdGroup" onchange="pdUpdateCopies();pdUpdateSubject()">'+groups.map(function(g){return '<option value="'+esc(g.id)+'">'+esc(g.name)+'</option>';}).join("")+'</select><select id="pdSubject"></select><input id="pdTitle" placeholder="Nombre o descripción"><input id="pdCost" type="number" min="1" step="1" value="1" oninput="pdUpdateCopies()"><div class="card" style="padding:10px 14px;min-width:180px"><b>📄 Copias necesarias</b><div id="pdCopies" style="font-size:20px;margin-top:3px">0</div><small class="hint">Precio = hojas por alumno</small></div><button class="btn primary" onclick="pdCreate()">Registrar impresión</button></div><small class="hint">$1 = 1 hoja por alumno; $2 = 2 hojas; $3 = 3 hojas.</small></div>';
  }
  function render(){
    var c=document.getElementById("content");
    c.innerHTML=stats()+form()+'<div class="card"><div class="section-title"><h2>Selecciona un grupo</h2><span class="hint">Entra al grupo para verificar los pagos de sus impresiones en una sola tabla.</span></div><div class="pd-groups">'+activeGroups().map(function(g){
      var students=(db.students||[]).filter(function(s){return s.groupId===g.id;});
      var jobs=(db.prints||[]).filter(function(p){return p.groupId===g.id;});
      var debt=0,jobsPending=0;
      jobs.forEach(function(p){(p.students||[]).forEach(function(x){if(!x.paid){debt+=Number(p.cost||0);jobsPending++;}});});
      return '<button class="card pd-group-card" onclick="pdOpenGroup(\''+esc(g.id)+'\')"><strong>'+esc(g.name)+'</strong><span>'+students.length+' alumnos · '+jobs.length+' impresiones</span><b>'+(jobsPending?money(debt)+' pendiente':'✓ Sin adeudos')+'</b></button>';
    }).join("")+'</div></div>';
    pdUpdateSubject();pdUpdateCopies();
  }
  window.pdUpdateSubject=function(){
    var g=document.getElementById("pdGroup"),s=document.getElementById("pdSubject");if(!g||!s)return;
    var opts=((window.PD_CONFIG&&PD_CONFIG.subjects)||[]).filter(function(x){return PD_CONFIG.subjectAllowedForGroup(x.id,g.value);}),old=s.value;
    s.innerHTML=opts.map(function(o){return '<option value="'+esc(o.id)+'">'+esc(o.name)+'</option>';}).join("");
    if(opts.some(function(o){return o.id===old;}))s.value=old;
  };
  window.pdUpdateCopies=function(){
    var g=document.getElementById("pdGroup"),cost=document.getElementById("pdCost"),out=document.getElementById("pdCopies");if(!g||!cost||!out)return;
    var n=(db.students||[]).filter(function(s){return s.groupId===g.value;}).length,hojas=Math.max(1,Math.round(Number(cost.value)||1));
    out.textContent=(n*hojas)+" copias ("+n+" alumnos × "+hojas+" hoja"+(hojas===1?"":"s")+")";
  };
  window.pdCreate=function(){
    var date=document.getElementById("pdDate").value,g=document.getElementById("pdGroup").value,title=document.getElementById("pdTitle").value.trim(),cost=Number(document.getElementById("pdCost").value),subjectId=document.getElementById("pdSubject").value;
    if(!title||!Number.isFinite(cost)||cost<1||Math.round(cost)!==cost)return alert("Escribe una descripción y un precio entero válido ($1, $2, $3…).");
    var ids=(db.students||[]).filter(function(x){return x.groupId===g;}).map(function(x){return x.id;});
    if(!ids.length)return alert("Ese grupo no tiene alumnos registrados.");
    var activity=null;
    try{if(window.PD_WORKS&&typeof PD_WORKS.linkPrint==="function")activity=PD_WORKS.linkPrint({}, {groupId:g,title:title,date:date,subjectId:subjectId,points:10});}catch(e){console.warn("No se pudo vincular el trabajo",e);}
    db.prints.push({id:uid("print"),activityId:activity&&activity.id||null,date:date,groupId:g,title:title,cost:cost,students:ids.map(function(id){return {studentId:id,paid:false};})});
    save();render();alert("Impresión registrada. Necesitas sacar "+(ids.length*cost)+" copias.");
  };
  window.pdOpenGroup=function(groupId){
    window.pdCurrentGroup=groupId;
    var g=(db.groups||[]).find(function(x){return x.id===groupId;}),students=(db.students||[]).filter(function(s){return s.groupId===groupId;}).slice().sort(function(a,b){return String(a.name).localeCompare(String(b.name),"es");});
    var jobs=(db.prints||[]).filter(function(p){return p.groupId===groupId;}).slice().sort(function(a,b){return String(a.date).localeCompare(String(b.date))||String(a.title).localeCompare(String(b.title),"es");});
    var debt=0,pending=0;
    jobs.forEach(function(p){(p.students||[]).forEach(function(x){if(!x.paid){debt+=Number(p.cost||0);pending++;}});});
    document.getElementById("pageTitle").textContent="Pagos · "+(g&&g.name||"Grupo");
    document.getElementById("pageSubtitle").textContent="Marca la casilla cuando el alumno pague cada impresión.";
    var c=document.getElementById("content"),kpi=stats();
    c.innerHTML=kpi+'<div class="toolbar"><button class="btn" onclick="pdBackToGroups()">← Todos los grupos</button><div class="card" style="padding:10px 14px"><b>'+students.length+' alumnos</b><span class="hint"> · '+jobs.length+' impresiones · '+pending+' pendientes · '+money(debt)+'</span></div></div><div class="card"><div class="section-title"><h2>'+esc(g&&g.name||"Grupo")+' · Control de pagos</h2><span class="hint">Casilla marcada = pagado · vacía = pendiente · — = no incluido</span></div>'+
    (jobs.length?'<div class="pd-matrix-wrap"><table class="table pd-matrix"><thead><tr><th class="pd-sticky-name">Alumno</th>'+jobs.map(function(p,i){var n=(p.students||[]).length,paid=(p.students||[]).filter(function(x){return x.paid;}).length;return '<th><div>'+(i+1)+'. '+esc(p.title)+'</div><small>'+esc(p.date||"")+'</small><small>'+money(p.cost)+' por alumno</small><small>'+paid+'/'+n+' pagados</small><button class="btn pd-small" onclick="pdFocusJob(\''+esc(p.id)+'\')">Ver trabajo</button></th>';}).join("")+'<th>Total pendiente</th></tr></thead><tbody>'+students.map(function(s){var owing=0;var cells=jobs.map(function(p){var rec=(p.students||[]).find(function(x){return x.studentId===s.id;});if(!rec)return '<td class="pd-not-included">—</td>';if(!rec.paid)owing+=Number(p.cost||0);return '<td><label class="pd-check-label"><input type="checkbox" '+(rec.paid?"checked":"")+' aria-label="'+esc(s.name)+' · '+esc(p.title)+'" onchange="pdPaid(\''+esc(p.id)+'\',\''+esc(s.id)+'\',this.checked)"><span>'+(rec.paid?"Pagado":"Pendiente")+'</span></label></td>';}).join("");return '<tr><td class="pd-sticky-name"><strong>'+esc(s.name)+'</strong></td>'+cells+'<td><strong>'+money(owing)+'</strong></td></tr>';}).join("")+'</tbody></table></div>':'<p class="empty">Este grupo todavía no tiene impresiones registradas.</p>')+'</div>';
  };
  window.pdBackToGroups=function(){window.pdCurrentGroup=null;document.getElementById("pageTitle").textContent="Impresiones / Adeudos";document.getElementById("pageSubtitle").textContent="Control de pagos por grupo";render();};
  window.pdFocusJob=function(id){var th=document.querySelector('.pd-matrix th button[onclick*="'+id+'"]');if(th)th.closest("th").scrollIntoView({behavior:"smooth",block:"nearest",inline:"center"});};
  window.pdPaid=function(j,s,v){
    var p=(db.prints||[]).find(function(x){return x.id===j;});
    var rec=p&&(p.students||[]).find(function(x){return x.studentId===s;});
    if(rec){rec.paid=!!v;rec.paidAt=v?new Date().toISOString():null;save();window.pdOpenGroup(p.groupId);}
  };
  window.pdDelete=function(id){
    var j=(db.prints||[]).find(function(x){return x.id===id;});if(!j)return;
    if(!confirm('¿Eliminar la impresión "'+j.title+'"? Esta acción también puede eliminar el Trabajo vinculado y sus calificaciones si no está asociado a otra impresión.'))return;
    var linked=j.activityId,other=(db.prints||[]).some(function(p){return p.id!==id&&p.activityId&&p.activityId===linked;});
    db.prints=db.prints.filter(function(p){return p.id!==id;});
    if(linked&&!other){db.grades=(db.grades||[]).filter(function(x){return x.activityId!==linked;});db.activities=(db.activities||[]).filter(function(x){return x.id!==linked;});}
    save();if(window.pdCurrentGroup)window.pdOpenGroup(window.pdCurrentGroup);else render();
  };
  var style=document.createElement("style");
  style.textContent='.pd-groups{display:grid;grid-template-columns:repeat(auto-fit,minmax(145px,1fr));gap:12px}.pd-group-card{display:flex;flex-direction:column;align-items:flex-start;gap:8px;text-align:left;cursor:pointer;min-height:110px}.pd-group-card strong{font-size:23px}.pd-group-card span{font-size:13px;color:var(--muted,#667085)}.pd-matrix-wrap{max-width:100%;overflow:auto;border:1px solid var(--border,#dbe2ea);border-radius:10px}.pd-matrix{border-collapse:separate;border-spacing:0;min-width:100%;width:max-content}.pd-matrix th,.pd-matrix td{min-width:105px;text-align:center;padding:9px 10px;border-bottom:1px solid var(--border,#e1e6ed)}.pd-matrix .pd-sticky-name{position:sticky;left:0;z-index:2;min-width:175px;max-width:230px;text-align:left;background:var(--card,#fff)}.pd-matrix thead th{vertical-align:top;background:var(--surface,#f7f9fc);white-space:normal}.pd-matrix thead th small{display:block;font-weight:400;color:var(--muted,#667085);margin-top:4px}.pd-check-label{display:flex;flex-direction:column;align-items:center;gap:4px;cursor:pointer;font-size:11px}.pd-check-label input{width:23px;height:23px;accent-color:#17834d;cursor:pointer}.pd-not-included{color:#98a2b3;background:#f8fafc}.pd-small{margin-top:6px;font-size:12px;padding:5px 8px}@media(max-width:800px){.pd-matrix .pd-sticky-name{min-width:145px}.pd-matrix th,.pd-matrix td{padding:8px 7px}}';
  document.head.appendChild(style);
  window.renderPrints=render;
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();