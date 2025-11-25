// script.js - canvas background, typed text, UI interactions
(function(){
  const canvas = document.getElementById('background');
  const ctx = canvas.getContext('2d');
  let W = innerWidth, H = innerHeight;
  let motionEnabled = true;

  // resize
  function resize(){
    W = canvas.width = innerWidth;
    H = canvas.height = innerHeight;
  }
  addEventListener('resize', resize, {passive:true});
  resize();

  // particle system (network nodes)
  const num = Math.floor(Math.max(30, (W*H) / 50000));
  const nodes = [];

  function rand(min,max){ return Math.random()*(max-min)+min; }

  function Node(){
    this.x = rand(0, W);
    this.y = rand(0, H);
    this.vx = rand(-0.3,0.3);
    this.vy = rand(-0.3,0.3);
    this.r = rand(1.6, 3.6);
    this.hue = rand(150,200); // cyan/greenish
  }
  for(let i=0;i<num;i++) nodes.push(new Node());

  let mouse = {x:-9999,y:-9999,active:false};

  addEventListener('mousemove', (e)=>{ mouse.x=e.clientX; mouse.y=e.clientY; mouse.active=true; });
  addEventListener('mouseleave', ()=>{ mouse.x=-9999; mouse.y=-9999; mouse.active=false; });

  // main loop
  function draw(){
    if(!motionEnabled){ // draw subtle static background if motion disabled
      ctx.fillStyle = 'rgba(4,6,10,0.98)';
      ctx.fillRect(0,0,W,H);
      window.requestAnimationFrame(draw);
      return;
    }

    ctx.clearRect(0,0,W,H);
    // slight gradient
    const g = ctx.createLinearGradient(0,0,0,H);
    g.addColorStop(0, 'rgba(2,6,10,0.9)');
    g.addColorStop(1, 'rgba(3,8,15,0.75)');
    ctx.fillStyle = g;
    ctx.fillRect(0,0,W,H);

    // update nodes
    for(let i=0;i<nodes.length;i++){
      const n = nodes[i];
      n.x += n.vx;
      n.y += n.vy;

      // bounce edges
      if(n.x < -20) n.x = W+20;
      if(n.x > W+20) n.x = -20;
      if(n.y < -20) n.y = H+20;
      if(n.y > H+20) n.y = -20;

      // mouse repulse
      if(mouse.active){
        const dx = n.x - mouse.x;
        const dy = n.y - mouse.y;
        const d = Math.sqrt(dx*dx+dy*dy);
        if(d < 120){
          const factor = (120 - d) / 120;
          n.vx += (dx/d) * 0.6 * factor;
          n.vy += (dy/d) * 0.6 * factor;
        }
      }

      // damp velocities
      n.vx *= 0.98;
      n.vy *= 0.98;

      // draw glow
      ctx.beginPath();
      const grd = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r*8);
      grd.addColorStop(0, `rgba(0,255,153,${0.12})`);
      grd.addColorStop(0.5, `rgba(51,204,255,${0.04})`);
      grd.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grd;
      ctx.fillRect(n.x - n.r*8, n.y - n.r*8, n.r*16, n.r*16);

      // draw node
      ctx.beginPath();
      ctx.fillStyle = `rgba(0,255,153,0.9)`;
      ctx.arc(n.x, n.y, n.r, 0, Math.PI*2);
      ctx.fill();
    }

    // draw lines between nearby nodes
    for(let i=0;i<nodes.length;i++){
      for(let j=i+1;j<nodes.length;j++){
        const a = nodes[i], b = nodes[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const d = Math.sqrt(dx*dx + dy*dy);
        if(d < 130){
          const alpha = (1 - (d / 130)) * 0.12;
          ctx.beginPath();
          ctx.strokeStyle = `rgba(0,255,153,${alpha})`;
          ctx.lineWidth = 1;
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);

  // Typed effect (roles)
  const typedEl = document.getElementById('typed');
  const messages = ['Malware Analysis', 'DFIR', 'CTF / Attack-Defense', 'Platform Automation'];
  let ti = 0, ci = 0, deleting = false;
  function tick(){
    if(!typedEl) return;
    const full = messages[ti];
    if(!deleting){
      typedEl.textContent = full.slice(0, ci+1);
      ci++;
      if(ci >= full.length){ deleting = true; setTimeout(tick, 900); return; }
    } else {
      typedEl.textContent = full.slice(0, ci-1);
      ci--;
      if(ci <= 0){ deleting = false; ti = (ti+1)%messages.length; setTimeout(tick, 400); return; }
    }
    setTimeout(tick, deleting ? 40 : 80);
  }
  tick();

  // animate skill bars on scroll
  function animateBars(){
    const bars = document.querySelectorAll('.progress');
    bars.forEach(b=>{
      const rect = b.getBoundingClientRect();
      if(rect.top < innerHeight - 50){
        const value = b.dataset.value || 60;
        b.querySelector('span').style.width = value + '%';
      }
    });
  }
  addEventListener('scroll', () => requestAnimationFrame(animateBars), {passive:true});
  animateBars();

  // footer year
  document.getElementById('year').textContent = new Date().getFullYear();

  // motion toggle
  const toggle = document.getElementById('toggleMotion');
  toggle.addEventListener('click', ()=>{
    motionEnabled = !motionEnabled;
    toggle.setAttribute('aria-pressed', String(!motionEnabled));
    toggle.textContent = 'Motion: ' + (motionEnabled ? 'On' : 'Off');
  });

  // accessible smooth scroll for nav anchors
  document.querySelectorAll('a[href^="#"]').forEach(a=>{
    a.addEventListener('click', (e)=>{
      const href = a.getAttribute('href');
      if(href === '#') return;
      const el = document.querySelector(href);
      if(el){
        e.preventDefault();
        el.scrollIntoView({behavior:'smooth', block:'start'});
        history.replaceState(null, '', href);
      }
    });
  });

  // Respect prefers-reduced-motion
  const prm = window.matchMedia('(prefers-reduced-motion: reduce)');
  if(prm.matches) {
    motionEnabled = false;
    toggle.textContent = 'Motion: Off';
    toggle.setAttribute('aria-pressed', 'true');
  }

})();