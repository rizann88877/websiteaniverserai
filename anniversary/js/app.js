const $ = s => document.querySelector(s);
const pad2 = n => String(n).padStart(2,"0");
let sb = null, db = MEMORIES;
$("#dots").innerHTML="<i></i>".repeat(CONFIG.PIN_LENGTH);

/* ---------- Placeholder foto (SVG) jika img kosong ---------- */
function ph(m,i){
  const h=[210,222,200,232,195,215][i%6];
  const svg=`<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='hsl(${h},70%,72%)'/><stop offset='1' stop-color='hsl(${h+15},65%,28%)'/></linearGradient></defs><rect width='400' height='400' fill='url(#g)'/><text x='200' y='215' font-size='90' text-anchor='middle'>💙</text></svg>`;
  return "data:image/svg+xml;utf8,"+encodeURIComponent(svg);
}

/* ---------- Path foto/video (nama file → folder per tahun) ---------- */
const abs=u=>/^(https?:|data:|blob:|\/)/.test(u);
function pic(m,i){const s=m.img?(abs(m.img)?m.img:CONFIG.PHOTO_DIR+"tahun"+m.y+"/"+m.img):"";return s||ph(m,i)}
function vidSrc(m){return abs(m.vid)?m.vid:CONFIG.VIDEO_DIR+m.vid}

/* ---------- PIN GATE ---------- */
let pin="", tries=+sessionStorage.getItem("tries")||0;
const padEl=$("#pad");
["1","2","3","4","5","6","7","8","9","⌫","0","✓"].forEach(k=>{
  const b=document.createElement("button");b.textContent=k;b.onclick=()=>key(k);padEl.appendChild(b);
});
document.addEventListener("keydown",e=>{ if($("#gate").style.display==="none")return; if(/^\d$/.test(e.key))key(e.key); else if(e.key==="Backspace")key("⌫"); });
function dots(){document.querySelectorAll("#dots i").forEach((d,i)=>d.classList.toggle("on",i<pin.length));}
async function sha(s){const b=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(s));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,"0")).join("");}
async function key(k){
  const lockUntil=+localStorage.getItem("lock")||0;
  if(Date.now()<lockUntil){$("#gmsg").textContent="Terkunci, coba lagi "+Math.ceil((lockUntil-Date.now())/1000)+" dtk";return;}
  if(k==="⌫"){pin=pin.slice(0,-1);dots();return;}
  if(k==="✓")return;
  if(pin.length>=CONFIG.PIN_LENGTH)return;
  pin+=k;dots();
  if(pin.length<CONFIG.PIN_LENGTH)return;
  let ok=false;
  try{
    if(CONFIG.SUPABASE_URL){
      sb=sb||supabase.createClient(CONFIG.SUPABASE_URL,CONFIG.SUPABASE_ANON_KEY);
      // password Supabase min 6 karakter → PIN + salt
      const {error}=await sb.auth.signInWithPassword({email:CONFIG.COUPLE_EMAIL,password:CONFIG.PIN_SALT+pin});
      ok=!error;
    }else{ ok=(await sha(CONFIG.PIN_SALT+pin))===CONFIG.PIN_HASH; }
  }catch(e){ok=false}
  if(ok){sessionStorage.removeItem("tries");unlock();}
  else{
    tries++;sessionStorage.setItem("tries",tries);
    if(tries>=5){localStorage.setItem("lock",Date.now()+30000*Math.min(tries-4,10));$("#gmsg").textContent="Terlalu banyak percobaan. Terkunci sementara.";}
    else $("#gmsg").textContent="PIN salah 💔 ("+(5-tries)+" percobaan lagi)";
    $("#dots").classList.add("shake");setTimeout(()=>$("#dots").classList.remove("shake"),400);
    pin="";dots();
  }
}
async function unlock(){
  if(sb){ try{
    const {data}=await sb.from("memories").select("*").order("y").order("id");
    if(data&&data.length){
      db=await Promise.all(data.map(async r=>{
        const sign=async p=>p?(await sb.storage.from("media").createSignedUrl(p,3600)).data?.signedUrl||"":"";
        return {y:r.y,t:r.title,c:r.caption,img:await sign(r.image_path),vid:await sign(r.video_path)};
      }));
    }
  }catch(e){console.warn(e)} }
  $("#gate").style.display="none";$("#app").style.display="block";
  initApp();
}

/* ---------- Countdown durasi ---------- */
function tick(){
  const s=CONFIG.START,n=new Date();
  let y=n.getFullYear()-s.getFullYear(),mo=n.getMonth()-s.getMonth(),d=n.getDate()-s.getDate(),
      h=n.getHours()-s.getHours(),mi=n.getMinutes()-s.getMinutes(),se=n.getSeconds()-s.getSeconds();
  if(se<0){se+=60;mi--} if(mi<0){mi+=60;h--} if(h<0){h+=24;d--}
  if(d<0){d+=new Date(n.getFullYear(),n.getMonth(),0).getDate();mo--}
  if(mo<0){mo+=12;y--}
  const v=[["Tahun",y],["Bulan",mo],["Hari",d],["Jam",h],["Menit",mi],["Detik",se]];
  $("#count").innerHTML=v.map(([l,x])=>`<div><b>${pad2(x)}</b><span>${l}</span></div>`).join("");
}

/* ---------- Galeri ---------- */
let curY=0;
function renderGallery(){
  $("#filters").innerHTML=[0,1,2,3].map(y=>`<button class="${y===curY?"on":""}" data-y="${y}">${y?"Tahun "+y:"Semua"}</button>`).join("");
  $("#filters").querySelectorAll("button").forEach(b=>b.onclick=()=>{curY=+b.dataset.y;renderGallery()});
  const list=db.map((m,i)=>({m,i})).filter(o=>!curY||o.m.y===curY);
  $("#grid").innerHTML=list.map(o=>`<div class="ph card pop" data-i="${o.i}"><img loading="lazy" src="${pic(o.m,o.i)}" onerror="this.onerror=null;this.src=ph(null,${o.i})" alt="${o.m.t}"><em>${o.m.t}</em></div>`).join("");
  $("#grid").querySelectorAll(".ph").forEach(el=>el.onclick=()=>openLb(+el.dataset.i));
}
function openLb(i){const m=db[i];const im=$("#lbImg");im.onerror=()=>{im.onerror=null;im.src=ph(m,i)};im.src=pic(m,i);$("#lbCap").innerHTML="<b>"+m.t+"</b><br>"+m.c;$("#lbYr").textContent="Tahun ke-"+m.y;$("#lb").classList.add("open");}
$("#lbX").onclick=()=>$("#lb").classList.remove("open");
$("#lb").onclick=e=>{if(e.target.id==="lb")$("#lb").classList.remove("open")};
document.addEventListener("keydown",e=>{if(e.key==="Escape")$("#lb").classList.remove("open")});

/* ---------- Memory Gacha ---------- */
$("#gBtn").onclick=()=>{
  const i=Math.floor(Math.random()*db.length),m=db[i];
  const media=m.vid?`<video src="${vidSrc(m)}" controls playsinline autoplay muted></video>`:`<img src="${pic(m,i)}" onerror="this.onerror=null;this.src=ph(null,${i})" alt="">`;
  $("#gOut").innerHTML=`<div class="pop">${media}<h3>${m.t}</h3><p style="margin-top:8px;opacity:.9">${m.c}</p><small style="color:var(--gold)">Tahun ke-${m.y}</small></div>`;
  burst();
};

/* ---------- Surat (efek ketik) ---------- */
let typed=false;
$("#env").onclick=()=>{
  $("#env").classList.add("open");$("#letter").classList.add("show");
  if(typed)return;typed=true;
  const t=CONFIG.LETTER,el=$("#letterTxt");let i=0;
  (function w(){el.textContent=t.slice(0,i++);if(i<=t.length)setTimeout(w,38)})();
};

/* ---------- Music player ---------- */
const aud=$("#aud");let ti=0;
function load(i){ti=(i+PLAYLIST.length)%PLAYLIST.length;aud.src=PLAYLIST[ti].src;$("#mpTitle").textContent=PLAYLIST[ti].t;}
function play(){aud.play().then(()=>{$("#mpPlay").textContent="⏸";$("#mpFab").classList.add("spin")}).catch(()=>{$("#mpTitle").textContent="⚠ File musik tidak ditemukan"})}
function pause(){aud.pause();$("#mpPlay").textContent="▶";$("#mpFab").classList.remove("spin")}
$("#mpFab").onclick=()=>$("#mpPanel").classList.toggle("open");
$("#mpPlay").onclick=()=>aud.paused?play():pause();
$("#mpNext").onclick=()=>{load(ti+1);play()};
$("#mpPrev").onclick=()=>{load(ti-1);play()};
$("#mpMute").onclick=()=>{aud.muted=!aud.muted;$("#mpMute").textContent=aud.muted?"🔇":"🔊"};
aud.ontimeupdate=()=>{if(aud.duration)$("#mpBar").value=aud.currentTime/aud.duration*100};
$("#mpBar").oninput=e=>{if(aud.duration)aud.currentTime=e.target.value/100*aud.duration};
aud.onended=()=>{load(ti+1);play()};
load(0);

/* ---------- Efek kelopak & bintang (canvas) ---------- */
const cv=$("#fx"),cx=cv.getContext("2d");let P=[],W,H;
function size(){W=cv.width=innerWidth;H=cv.height=innerHeight}
addEventListener("resize",size);size();
function mk(burstAt){
  const star=Math.random()<.3;
  return {x:burstAt?burstAt.x:Math.random()*W,y:burstAt?burstAt.y:-20,r:3+Math.random()*7,vy:.6+Math.random()*1.4,vx:(Math.random()-.5)*(burstAt?6:1),a:Math.random()*6,va:(Math.random()-.5)*.04,star,life:burstAt?90:1e9};
}
for(let i=0;i<(innerWidth<600?18:34);i++){const p=mk();p.y=Math.random()*H;P.push(p)}
function burst(){const r=$("#gOut").getBoundingClientRect();for(let i=0;i<40;i++)P.push(mk({x:r.left+r.width/2,y:r.top+40}))}
(function loop(){
  cx.clearRect(0,0,W,H);
  P=P.filter(p=>p.life>0);
  P.forEach(p=>{
    p.x+=p.vx+Math.sin(p.a)*.5;p.y+=p.vy;p.a+=p.va;p.life--;
    if(p.life>1e8&&p.y>H+20){p.y=-20;p.x=Math.random()*W}
    cx.save();cx.translate(p.x,p.y);cx.rotate(p.a);
    if(p.star){cx.fillStyle="rgba(127,182,255,.8)";cx.beginPath();for(let i=0;i<5;i++){cx.lineTo(Math.cos(i*1.2566)*p.r,Math.sin(i*1.2566)*p.r);cx.lineTo(Math.cos(i*1.2566+.628)*p.r/2.2,Math.sin(i*1.2566+.628)*p.r/2.2)}cx.fill()}
    else{cx.fillStyle="rgba(188,220,255,.7)";cx.beginPath();cx.ellipse(0,0,p.r,p.r*.55,0,0,6.3);cx.fill()}
    cx.restore();
  });
  requestAnimationFrame(loop);
})();

function initApp(){
  $("#title").textContent=CONFIG.TITLE;document.querySelector(".badge").textContent=CONFIG.BADGE;
  $("#since").textContent="Sejak "+CONFIG.START.toLocaleDateString("id-ID",{day:"numeric",month:"long",year:"numeric"});
  tick();setInterval(tick,1000);renderGallery();
}
