/* ORBE + INTRO GAMIFICADA POR SCROLL (desktop y móvil)
   - El orbe es una SECUENCIA DE IMÁGENES (no vídeo): al hacer scroll se cambia el fotograma
     mostrado → la cara se forma. Esto funciona también en iOS Safari (el scrub de vídeo no).
   - Estado inicial: orbe (frame 1, canica) centrado + "Descubrir". Al bajar: se forma la cara y
     aparecen por fases eyebrow, titular, chat, y los CTAs de esquina.
   - Tras la 1ª respuesta de Monje → modo chat (window.__monjeEnterChat).
   - Reduced-motion: todo visible, cara ya formada. */
(function(){
  var html=document.documentElement;
  var hero=document.getElementById('hero');
  var orb=document.getElementById('mjOrb');          // <img>
  var wrap=document.querySelector('.orb-wrap');
  var glow=wrap&&wrap.querySelector('.orb-glow');
  var hint=document.getElementById('introHint');
  var inner=document.querySelector('.hero-inner');
  var phEls=[].slice.call(document.querySelectorAll('.ph'));
  var corners=[].slice.call(document.querySelectorAll('.corner-cta'));
  if(!hero||!orb||!wrap)return;

  var reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
  var gamified=!reduce;
  var chatting=false;

  /* --- secuencia de frames de la formación --- */
  var N=36, frames=[];
  for(var i=1;i<=N;i++){ var im=new Image(); im.src='assets/orb-seq/f-'+(i<10?'0':'')+i+'.jpg'; frames.push(im); }
  var curFrame=-1;
  function showFrame(idx){ idx=idx<0?0:idx>N-1?N-1:idx; if(idx===curFrame)return; curFrame=idx; orb.src=frames[idx].src; }

  function clamp(x){return x<0?0:x>1?1:x;}
  function rng(p,a,b){return clamp((p-a)/(b-a));}
  function smooth(t){return t*t*(3-2*t);}

  /* --- modo chat (lo llama chat.js tras la 1ª respuesta) --- */
  window.__monjeEnterChat=function(){
    if(chatting)return; chatting=true;
    phEls.concat(corners,[inner,hint]).forEach(function(el){ if(el){ el.style.opacity=''; el.style.transform=''; el.style.pointerEvents=''; } });
    html.classList.remove('gamified'); html.classList.add('chatting');
    window.scrollTo(0,0);
    showFrame(N-1);                 // cara formada en la cabecera
  };

  if(!gamified){
    if(hint) hint.style.display='none';
    showFrame(N-1);                 // reduced-motion: cara ya formada
  } else {
    html.classList.add('gamified');
    if('scrollRestoration' in history) history.scrollRestoration='manual';
    function toTop(){ if(!chatting) window.scrollTo(0,0); }
    toTop();
    // el navegador puede restaurar el scroll tras recargar: forzamos arriba también tras la carga
    window.addEventListener('load',function(){ toTop(); requestAnimationFrame(toTop); setTimeout(toTop,80); });

    var delta=0;
    function measure(){ if(!inner)return; inner.style.transform='none'; var r=wrap.getBoundingClientRect(); delta=(window.innerHeight/2)-(r.top+r.height/2); }
    measure(); window.addEventListener('load',measure);

    var prog=0;
    function readScroll(){ var travel=hero.offsetHeight-window.innerHeight; prog=clamp((-hero.getBoundingClientRect().top)/(travel||1)); }
    window.addEventListener('scroll',readScroll,{passive:true});
    window.addEventListener('resize',function(){ measure(); readScroll(); });
    readScroll();

    function setPh(el,a,b){ var t=smooth(rng(prog,a,b)); el.style.opacity=t; el.style.transform='translateY('+((1-t)*18).toFixed(1)+'px)'; el.style.pointerEvents=t>0.95?'auto':'none'; }
    function frameGame(){
      if(chatting) return;
      showFrame(Math.round(prog*(N-1)));
      if(inner) inner.style.transform='translateY('+((1-prog)*delta).toFixed(1)+'px)';
      if(hint) hint.style.opacity=1-smooth(rng(prog,0,0.12));
      for(var i=0;i<phEls.length;i++){ var el=phEls[i],k=el.getAttribute('data-ph');
        if(k==='eyebrow') setPh(el,0.46,0.60); else if(k==='title') setPh(el,0.60,0.73); else if(k==='stage') setPh(el,0.74,0.90); else if(k==='nav') setPh(el,0.55,0.66); }
      var c=smooth(rng(prog,0.82,0.96));
      for(var j=0;j<corners.length;j++){ corners[j].style.opacity=c; corners[j].style.pointerEvents=c>0.95?'auto':'none'; }
      requestAnimationFrame(frameGame);
    }
    requestAnimationFrame(frameGame);
  }

  /* --- inclinación 3D hacia el cursor (parallax), suave --- */
  var rx=0,ry=0,trx=0,try_=0,gx=0,gy=0,tgx=0,tgy=0,TILT=7,GLOW=16;
  function c1(x){return x<-1?-1:x>1?1:x;}
  wrap.addEventListener('mousemove',function(e){ var r=wrap.getBoundingClientRect(); var nx=c1((e.clientX-(r.left+r.width/2))/(r.width/2)); var ny=c1((e.clientY-(r.top+r.height/2))/(r.height/2)); trx=-ny*TILT; try_=nx*TILT; tgx=nx*GLOW; tgy=ny*GLOW; });
  wrap.addEventListener('mouseleave',function(){ trx=try_=0; tgx=tgy=0; });
  function tickTilt(){ rx+=(trx-rx)*0.1; ry+=(try_-ry)*0.1; gx+=(tgx-gx)*0.1; gy+=(tgy-gy)*0.1;
    orb.style.setProperty('--rx',rx.toFixed(2)+'deg'); orb.style.setProperty('--ry',ry.toFixed(2)+'deg');
    if(glow){ glow.style.setProperty('--gx',gx.toFixed(1)+'px'); glow.style.setProperty('--gy',gy.toFixed(1)+'px'); }
    requestAnimationFrame(tickTilt);
  }
  requestAnimationFrame(tickTilt);

  /* --- tap en logo u orbe → vuelve al inicio (recarga limpia). El orbe, solo en móvil. --- */
  /* flecha "Descubrir" → autoscroll que revela todo (la formación + el chat) */
  var arrow=document.querySelector('.scroll-arrow');
  if(arrow){
    arrow.addEventListener('click',function(){
      if(chatting) return;
      var top=hero.offsetHeight-window.innerHeight;
      window.scrollTo({top: top>0?top:window.innerHeight, behavior:'smooth'});
    });
  }

  function goHome(){ window.location.href='/'; }
  var navLogo=document.querySelector('nav .logo');
  if(navLogo){ navLogo.style.cursor='pointer'; navLogo.addEventListener('click',goHome); }
  wrap.addEventListener('click',function(){ if(window.matchMedia('(max-width:560px)').matches) goHome(); });

  /* --- iOS: el teclado encoge el viewport visible. Ajustamos la altura real (visualViewport)
     para que el chat no se rompa, y ocultamos los CTAs flotantes mientras se escribe. --- */
  var vv=window.visualViewport;
  var keyboardActive=false;
  function px(n){return Math.round(n)+'px';}
  function setVVH(){
    var full=window.innerHeight;
    var h=keyboardActive && vv ? vv.height : full;
    var top=keyboardActive && vv?vv.offsetTop:0;
    var bottom=keyboardActive && vv?Math.max(0,full-h-top):0;
    if(keyboardActive && window.matchMedia('(max-width:760px)').matches && h>window.innerHeight*.72){
      h=Math.round(full*.56);
      top=0;
      bottom=full-h;
    }
    html.style.setProperty('--vvt',top+'px');
    html.style.setProperty('--vvh',h+'px');
    html.style.setProperty('--vvb',bottom+'px');
    if(keyboardActive && window.matchMedia('(max-width:760px)').matches){
      var dock=document.querySelector('.chat-dock');
      var composer=document.getElementById('composer');
      var dockH=dock?dock.offsetHeight:150;
      var cTop=composer?composer.offsetTop:92;
      var cH=composer?composer.offsetHeight:58;
      var target=top+(h*.60);
      var dockTop=target-cTop-(cH/2);
      var minDock=top+8;
      var maxDock=top+h-dockH-6;
      if(maxDock<minDock) maxDock=minDock;
      dockTop=Math.max(minDock,Math.min(maxDock,dockTop));
      var chatTop=top+10;
      var chatH=Math.max(42,dockTop-chatTop-8);
      html.style.setProperty('--dock-top',px(dockTop));
      html.style.setProperty('--chat-top',px(chatTop));
      html.style.setProperty('--chat-h',px(chatH));
    } else {
      html.style.removeProperty('--dock-top');
      html.style.removeProperty('--chat-top');
      html.style.removeProperty('--chat-h');
    }
  }
  function settleVVH(){
    setVVH();
    requestAnimationFrame(setVVH);
    setTimeout(setVVH,80);
    setTimeout(setVVH,260);
    setTimeout(setVVH,520);
    setTimeout(setVVH,900);
  }
  setVVH();
  if(vv){ vv.addEventListener('resize',setVVH); vv.addEventListener('scroll',setVVH); }
  window.addEventListener('resize',setVVH);
  window.addEventListener('orientationchange',setVVH);
  var promptEl=document.getElementById('prompt');
  if(promptEl){
    promptEl.addEventListener('focus',function(){
      keyboardActive=true;
      html.classList.add('kb');
      settleVVH();
      // en táctil (móvil/tablet): al tocar el input entramos ya al layout fijo de chat,
      // así el teclado no descoloca la intro scrollable.
      if((window.matchMedia('(max-width:760px)').matches || window.matchMedia('(pointer:coarse)').matches) && !html.classList.contains('chatting')) window.__monjeEnterChat();
      if(html.classList.contains('chatting')) window.scrollTo(0,0);
    });
    promptEl.addEventListener('blur',function(){ keyboardActive=false; html.classList.remove('kb'); settleVVH(); });
  }
})();

