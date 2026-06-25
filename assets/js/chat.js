/* CHAT — conectado a POST /api/chat  ·  {message, pillar, history} -> {reply, offerCall}
   UI y funciones add() / typing() / showCTA() INTACTAS. Tono persona-real (no bot).
   Sin backend (file://, 404, error de red) cae a un mock local on-voice para poder probar. */
(function(){
  var chat=document.getElementById('chat'),form=document.getElementById('composer'),input=document.getElementById('prompt'),pills=document.getElementById('pills');
  var ENDPOINT='/api/chat';
  var stage=0,ctaCard=null,busy=false;
  var history=[];                         // [{role:'user'|'assistant',content}] — contexto para el bot real
  var CTA_TURN=2;
  var WHATSAPP_URL='https://wa.me/34619814199?text=Hola%20Monje%2C%20quiero%20que%20me%20ayudes%20con...';
  var CALL_URL='https://calendly.com/monje-io';

  /* --- guion base = mock local (y tono base del system prompt del backend) --- */
  var openers={
    atraer:"Atraer más está bien, pero atraer gente que no compra es solo <b>coleccionar mirones</b>. ¿Tu problema es que no llega nadie… o que llega y se va sin hacer nada?",
    convertir:"Si entra gente y no compra, no suele ser la web: suele ser el mensaje. ¿Qué quieres que haga quien llega: comprar, reservar o escribirte?",
    automatizar:"Si lo repites cada semana, no es trabajo: es peaje. ¿Qué tarea te está robando más horas ahora mismo?",
    escalar:"Escalar sin sistema es ponerle gasolina al caos. ¿Qué se rompería primero si mañana te entra el triple de clientes?",
    _default:"Te leo. Suena a negocio que funciona, pero comunica por debajo de lo que vale. ¿Dónde notas más el freno ahora mismo?"
  };
  var firstPrefix='Soy Alex, la persona detrás de Monje, y estoy aquí para ir al grano. ';
  var contactOffer='Esto tiene solución y sé por dónde tirar. Dime por dónde te viene mejor:';
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
  // Tarjeta de contacto. Se reutiliza: en cada nueva oferta se reposiciona al final (reaparece).
  function showCTA(){
    if(!ctaCard){ ctaCard=document.createElement('div');ctaCard.className='cta-card';
      ctaCard.innerHTML='<div class="cta-copy"><h3>Elige cómo seguimos.</h3><p>Reviso tu caso y te ofrezco la solución que necesitas</p></div><div class="cta-actions"><a class="cta-btn" href="'+WHATSAPP_URL+'" target="_blank" rel="noopener">Hablamos por WhatsApp</a><a class="cta-btn" href="'+CALL_URL+'" target="_blank" rel="noopener">Reservar mi llamada →</a></div>'; }
    chat.appendChild(ctaCard);scrollChat();}

  /* --- helpers --- */
  function esc(s){return s.replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
  function strip(s){return s.replace(/<[^>]+>/g,'');}
  function sleep(ms){return new Promise(function(r){setTimeout(r,ms);});}
  function replyDelay(text){
    var len=strip(String(text||'')).length;
    return Math.min(3200,Math.max(850,620+len*13));
  }

  /* --- mock local (sin backend): mismo guion y MISMA cadencia que el backend --- */
  var keep=["Eso casi siempre es mensaje, no tráfico. ¿Qué vendes exactamente?","Te sigo. ¿Qué es lo que más te frena ahora mismo?"];
  function mockReply(turn,key){
    if(turn===0) return {reply:firstPrefix+(openers[key]||openers._default),offerCall:false};
    if(turn>=CTA_TURN && (turn-CTA_TURN)%3===0) return {reply:contactOffer,offerCall:true};   // ofrece en 2,5,8…
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
    var min=replyDelay(data.reply);   // mantiene el ritmo "humano" y escala con el largo del texto
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
  var lastSubmit=0;
  function submitPrompt(e){
    if(e) e.preventDefault();
    var v=input.value.trim(); if(!v) return;
    if(Date.now()-lastSubmit<350) return;
    lastSubmit=Date.now();
    input.value='';
    closeKB();
    handle(v,null);
  }
  form.addEventListener('submit',submitPrompt);
  var sendBtn=form.querySelector('.send');
  if(sendBtn) sendBtn.addEventListener('touchstart',submitPrompt,{passive:false});
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
