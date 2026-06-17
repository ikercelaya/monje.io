/* CHAT — conectado a POST /api/chat  ·  {message, pillar, history} -> {reply, offerCall}
   UI y funciones add() / typing() / showCTA() INTACTAS. Tono persona-real (no bot).
   Sin backend (file://, 404, error de red) cae a un mock local on-voice para poder probar. */
(function(){
  var chat=document.getElementById('chat'),form=document.getElementById('composer'),input=document.getElementById('prompt'),pills=document.getElementById('pills');
  var ENDPOINT='/api/chat';
  var stage=0,ctaCard=null,busy=false;
  var history=[];                         // [{role:'user'|'assistant',content}] — contexto para el bot real

  /* --- guion base = mock local (y tono base del system prompt del backend) --- */
  var openers={
    atraer:"Atraer está sobrevalorado si luego no se quedan. ¿Tu problema es que no llega gente… o que llega y no engancha?",
    convertir:"Si entra gente y no compra, no es la web: es el mensaje. ¿Qué quieres que haga el que llega —comprar, reservar, escribirte?",
    automatizar:"Lo que repites cada semana lo puede hacer la IA por ti. ¿Qué es lo que más horas te roba ahora mismo?",
    escalar:"Crecer sin sistema es solo currar más. ¿Qué se rompería si mañana te entra el triple de clientes?",
    _default:"Te leo. Suena a producto bueno con una comunicación que no está a su altura. ¿Qué es lo que más te frena ahora mismo?"
  };
  var second="Lo tengo. Esto no se arregla con posts sueltos, sino con marketing e IA trabajando juntos —y se ve clarísimo en una llamada de 20 minutos. Te la regalo: sales con un plan, fiches a Monje o no.";
  var labels={atraer:'Quiero atraer más clientes.',convertir:'Tengo visitas pero no convierten.',automatizar:'Quiero automatizar y dejar de perder horas.',escalar:'Quiero escalar sin morir en el intento.'};

  /* --- UI --- */
  // Mini-avatar (foto de Monje) junto a cada burbuja del bot → refuerza "hay una persona detrás".
  function scrollChat(){requestAnimationFrame(function(){chat.scrollTop=chat.scrollHeight;});}
  function botRow(node){var r=document.createElement('div');r.className='row bot-row';
    var a=document.createElement('span');a.className='bubble-ava';a.innerHTML='<img src="assets/img/avatar.jpg" alt="Monje">';
    r.appendChild(a);r.appendChild(node);return r;}
  function safeBotHtml(s){
    return esc(String(s || '')).replace(/&lt;(\/?)b&gt;/g,'<$1b>');
  }
  function add(t,w){var m=document.createElement('div');m.className='msg '+w;
    if(w==='bot') m.innerHTML=safeBotHtml(t); else m.textContent=t;
    var node=(w==='bot')?botRow(m):m;chat.appendChild(node);scrollChat();}
  function typing(){var d=document.createElement('div');d.className='typing';d.innerHTML='<span></span><span></span><span></span>';
    var row=botRow(d);chat.appendChild(row);scrollChat();return row;}
  // Tarjeta de reserva. Se reutiliza: en cada nueva oferta se reposiciona al final (reaparece).
  function showCTA(){
    if(!ctaCard){ ctaCard=document.createElement('div');ctaCard.className='cta-card';
      ctaCard.innerHTML='<div><h3>Sigamos tú y yo, 20 minutos.</h3><p>Hablas con quien va a estar en tu negocio · gratis · sin compromiso</p></div><a class="cta-btn" href="https://calendly.com/monje-io" target="_blank" rel="noopener">Reservar mi llamada →</a>'; }
    chat.appendChild(ctaCard);scrollChat();}

  /* --- helpers --- */
  function esc(s){return s.replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
  function strip(s){return s.replace(/<[^>]+>/g,'');}
  function sleep(ms){return new Promise(function(r){setTimeout(r,ms);});}

  /* --- mock local (sin backend): mismo guion y MISMA cadencia que el backend --- */
  var keep=["Te sigo. ¿Qué has probado ya que no te haya terminado de funcionar?","Vale. Y de todo esto, ¿qué es lo que más te urge resolver ahora?"];
  function mockReply(turn,key){
    if(turn===0) return {reply:'Soy <b>Alex</b> —una persona de verdad, no un bot. Vamos al grano para no hacerte perder el tiempo. '+(openers[key]||openers._default),offerCall:false};
    if(turn>=1 && (turn-1)%3===0) return {reply:second,offerCall:true};   // ofrece en 1,4,7…
    return {reply:keep[turn%keep.length],offerCall:false};
  }

  /* --- pide la respuesta al endpoint real; si falla, usa el mock --- */
  async function ask(text,key,turn){
    try{
      var r=await fetch(ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({message:text,pillar:key||null,history:history})});
      if(!r.ok) throw new Error('http '+r.status);
      var data=await r.json();
      if(!data||typeof data.reply!=='string') throw new Error('payload');
      return {reply:data.reply,offerCall:!!data.offerCall};
    }catch(e){
      return mockReply(turn,key);
    }
  }

  /* --- un turno de conversación --- */
  async function handle(text,key){
    if(busy||!text) return; busy=true;
    add(text,'user');
    history.push({role:'user',content:text});
    var turn=stage;
    var d=typing(),t0=Date.now();
    var data=await ask(text,key,turn);
    var min=Math.min(1400,650+data.reply.length*7);   // mantiene el ritmo "humano" aunque la respuesta sea instantánea
    var rest=min-(Date.now()-t0); if(rest>0) await sleep(rest);
    d.remove();
    add(data.reply,'bot');
    history.push({role:'assistant',content:strip(data.reply)});
    if(data.offerCall) showCTA();
    if(turn===0 && window.__monjeEnterChat) window.__monjeEnterChat();   // 1ª respuesta de Monje → modo chat
    stage++; busy=false;
  }

  function isTouch(){return window.matchMedia('(max-width:760px)').matches||window.matchMedia('(pointer:coarse)').matches;}
  function closeKB(){
    if(!isTouch()) return;
    try{ input.blur(); }catch(_){}
    var ae=document.activeElement;
    if(ae && ae!==document.body && typeof ae.blur==='function'){ try{ ae.blur(); }catch(_){} }
  }
  form.addEventListener('submit',function(e){
    e.preventDefault();
    var v=input.value.trim(); if(!v) return;
    input.value='';
    closeKB();
    handle(v,null);
  });
  // En móvil, el ciclo touch → blur(input) → cambio de layout → click hacía que el primer toque
  // en un pill no enganchara. Disparamos en touchstart con preventDefault para cortar ese ciclo;
  // el click sigue activo en desktop.
  var lastTap=0;
  function tapPill(e){
    var b=e.target&&e.target.closest?e.target.closest('.pill'):null;
    if(!b) return;
    if(Date.now()-lastTap<350) return;   // debounce: evita doble disparo touch+click sintético
    lastTap=Date.now();
    e.preventDefault();
    closeKB();
    handle(labels[b.dataset.k]||'', b.dataset.k);
  }
  pills.addEventListener('touchstart', tapPill, {passive:false});
  pills.addEventListener('click', tapPill);
})();
