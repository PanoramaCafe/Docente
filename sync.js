/* Panorama Docente — sincronización segura con Supabase */
(function(){
  const SUPABASE_URL='https://dtmhffgpwxzdncbuoohb.supabase.co';
  const SUPABASE_KEY='sb_publishable_S_wZkfLNvx0mnHBLGHcfgg_Q_SkycdW';
  const APP_KEY='panoramaDocente_v1';
  const { createClient } = window.supabase || {};
  if(!createClient){ console.error('Supabase JS no cargó'); return; }
  const client=createClient(SUPABASE_URL,SUPABASE_KEY);
  let syncing=false, timer=null, lastCloudAt=null;

  const style=document.createElement('style');
  style.textContent=`#pdAuth{position:fixed;inset:0;background:rgba(12,28,42,.72);backdrop-filter:blur(5px);z-index:99999;display:flex;align-items:center;justify-content:center;padding:18px}#pdAuth .box{width:min(420px,100%);background:#fff;border-radius:18px;padding:22px;box-shadow:0 20px 60px rgba(0,0,0,.25);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#183044}#pdAuth h2{margin:0 0 6px}#pdAuth p{color:#687784;font-size:13px;line-height:1.45}#pdAuth input{width:100%;padding:12px;border:1px solid #dce3e8;border-radius:10px;margin:6px 0;font:inherit}#pdAuth button{width:100%;padding:12px;border:0;border-radius:10px;background:#245b7a;color:#fff;font-weight:600;margin-top:8px}#pdAuth button.alt{background:#eef2f5;color:#183044}#pdAuth .err{color:#b94a48;font-size:13px;margin-top:8px;min-height:18px}#pdSync{position:fixed;right:12px;bottom:12px;z-index:9998;background:#fff;border:1px solid #dce3e8;border-radius:999px;padding:7px 11px;font:12px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;box-shadow:0 4px 18px rgba(0,0,0,.1);color:#687784}`;
  document.head.appendChild(style);

  function authUI(){
    if(document.getElementById('pdAuth')) return;
    const el=document.createElement('div'); el.id='pdAuth';
    el.innerHTML=`<div class="box"><h2>Panorama Docente</h2><p>Inicia sesión para que tus datos se guarden en la nube y puedas usarlos desde iPad, computadora o teléfono.</p><input id="pdEmail" type="email" placeholder="Correo electrónico" autocomplete="email"><input id="pdPass" type="password" placeholder="Contraseña" autocomplete="current-password"><button id="pdLogin">Iniciar sesión</button><button id="pdSignup" class="alt">Crear cuenta</button><div id="pdErr" class="err"></div></div>`;
    document.body.appendChild(el);
    const msg=x=>document.getElementById('pdErr').textContent=x||'';
    document.getElementById('pdLogin').onclick=async()=>{msg('');const email=document.getElementById('pdEmail').value.trim(),password=document.getElementById('pdPass').value;if(!email||!password)return msg('Escribe correo y contraseña.');const {error}=await client.auth.signInWithPassword({email,password});if(error)msg(error.message)};
    document.getElementById('pdSignup').onclick=async()=>{msg('');const email=document.getElementById('pdEmail').value.trim(),password=document.getElementById('pdPass').value;if(!email||password.length<6)return msg('Usa un correo válido y una contraseña de al menos 6 caracteres.');const {data,error}=await client.auth.signUp({email,password});if(error)msg(error.message);else if(!data.session)msg('Cuenta creada. Revisa tu correo si se requiere confirmar la cuenta y después inicia sesión.');};
  }
  function hideAuth(){document.getElementById('pdAuth')?.remove()}
  function syncBadge(text){let b=document.getElementById('pdSync');if(!b){b=document.createElement('div');b.id='pdSync';document.body.appendChild(b)}b.textContent=text}
  async function upload(){
    if(syncing)return; const {data:{session}}=await client.auth.getSession(); if(!session)return;
    let raw=localStorage.getItem(APP_KEY); if(!raw)return; let data; try{data=JSON.parse(raw)}catch{return}
    syncing=true; syncBadge('☁️ Guardando…');
    const {error}=await client.from('docente_app_state').upsert({user_id:session.user.id,data,updated_at:new Date().toISOString()},{onConflict:'user_id'});
    syncing=false; syncBadge(error?'⚠️ Sin sincronizar':'☁️ Sincronizado');
    if(error)console.error('Supabase sync:',error);
  }
  async function download(){
    const {data:{session}}=await client.auth.getSession(); if(!session)return false;
    const {data,error}=await client.from('docente_app_state').select('data,updated_at').eq('user_id',session.user.id).maybeSingle();
    if(error){console.error('Supabase load:',error);syncBadge('⚠️ Error nube');return false}
    const local=localStorage.getItem(APP_KEY);
    if(data?.data){
      localStorage.setItem(APP_KEY,JSON.stringify(data.data));lastCloudAt=data.updated_at;syncBadge('☁️ Datos en nube');return true;
    }
    if(local) await upload();
    return false;
  }
  function patchStorage(){
    const original=Storage.prototype.setItem;
    if(original.__pdPatched)return;
    function patched(k,v){original.call(this,k,v);if(k===APP_KEY){clearTimeout(timer);timer=setTimeout(upload,700)}}
    patched.__pdPatched=true;Storage.prototype.setItem=patched;
  }
  async function start(session){
    hideAuth();patchStorage();syncBadge('☁️ Conectando…');
    const hadCloud=await download();
    if(hadCloud){ location.reload(); return; }
    syncBadge('☁️ Sincronizado');
    setInterval(async()=>{if(document.hidden)return;await download();},10000);
    client.channel('docente_state_watch').on('postgres_changes',{event:'*',schema:'public',table:'docente_app_state',filter:`user_id=eq.${session.user.id}`},async()=>{await download()}).subscribe();
  }
  client.auth.onAuthStateChange((event,session)=>{if(session) setTimeout(()=>start(session),0); else {authUI();syncBadge('🔒 Sin sesión')}});
  client.auth.getSession().then(({data:{session}})=>{if(session)start(session);else authUI()});
})();