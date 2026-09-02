/* Panorama Docente — identidad institucional de documentos */
(function(){
  const SCHOOL=['ESCUELA SECUNDARIA GENERAL “JOSÉ VASCONCELOS”','CLAVES: ES-372-56 Y C.T. 20DES0042C','SAN AGUSTIN LOXICHA, POCHUTLA, OAX'];
  const TEACHER='Profr. Jordy Valencia Cruz';
  const CYCLE='2026-2027';
  function install(){
    const J=window.jspdf?.jsPDF;
    if(!J||J.prototype.__pdInstitutionalBranding)return false;
    const originalSave=J.prototype.save;
    J.prototype.save=function(filename,options){
      try{
        const pages=this.internal.getNumberOfPages();
        for(let p=1;p<=pages;p++){
          this.setPage(p);
          const size=this.internal.pageSize;
          const w=typeof size.getWidth==='function'?size.getWidth():size.width;
          const h=typeof size.getHeight==='function'?size.getHeight():size.height;
          this.setFillColor(255,255,255);this.rect(0,0,w,36,'F');
          this.setTextColor(0,0,0);this.setFont('helvetica','bold');this.setFontSize(11);this.text(SCHOOL[0],w/2,9,{align:'center'});
          this.setFontSize(8.5);this.text(SCHOOL[1],w/2,16,{align:'center'});this.text(SCHOOL[2],w/2,22,{align:'center'});
          this.setFont('helvetica','normal');this.setFontSize(8);this.text(`Profesor encargado: ${TEACHER}`,w/2,29,{align:'center'});
          this.setFontSize(7);this.text(`Ciclo escolar: ${CYCLE}`,w-14,h-8,{align:'right'});this.text(TEACHER,w/2,h-8,{align:'center'});
        }
      }catch(e){console.warn('Identidad institucional:',e)}
      return originalSave.call(this,filename,options);
    };
    J.prototype.__pdInstitutionalBranding=true;
    return true;
  }
  if(!install()){
    let n=0;const t=setInterval(()=>{if(install()||++n>40)clearInterval(t)},250);
  }
  window.PD_IDENTIDAD={school:SCHOOL,teacher:TEACHER,cycle:CYCLE};
})();
