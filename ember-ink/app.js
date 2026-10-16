const $=s=>document.querySelector(s),usd=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(n);
// Keep SVC prices and SZ multipliers in sync with api/checkout.js (the server is the authority).
const SVC=[["Free consultation",0,"15 minutes to plan your idea, placement and a quote."],["Custom design drawing",60,"A one-of-a-kind drawing made for you. No tattoo included."],["Tribal tattoo",120,"Bold flowing black shapes made to follow your muscles and bones."],["Japanese tattoo",180,"Dragons, koi, waves and blossoms in the traditional irezumi style."],["Fine line tattoo",120,"Delicate single-needle work for small, precise designs."],["Blackwork tattoo",150,"Solid black shapes, heavy contrast and negative space."],["Realism & colour",220,"Portraits and lifelike imagery with smooth blends."],["Cover-up",250,"Redesign and hide an old tattoo. Consultation required."],["Lettering & script",90,"Names, quotes and dates in custom or classic lettering."],["Touch-up",50,"Refresh a faded line or patchy area. Free within 6 weeks for our work."]];
const SZ=[["Small, up to 5 cm",1],["Medium, 5 to 10 cm",2],["Large, 10 to 20 cm",3.5],["Extra large, sleeve or back",6]];
const PL=["Forearm","Upper arm","Shoulder","Chest","Back","Ribs","Thigh","Calf","Ankle","Wrist","Hand","Neck","Behind ear","Other"];
const TM=["10:00","11:30","13:00","14:30","16:00","17:00"];
const CATS=[["all","All"],["tribal","Tribal"],["japanese","Japanese"],["fine","Fine line"],["blackwork","Blackwork"],["realism","Realism"],["lettering","Lettering"]];
const ART=[["Marcus Reed","Tribal and blackwork, 14 years"],["Aiko Tan","Japanese and colour, 11 years"],["Lena Ortiz","Fine line and realism, 8 years"]];
const ph=(src,l,c='')=>`<div class="ph ${c}" data-l="${l}"><img src="${src}" alt="${l}" loading="lazy" onerror="this.remove()"></div>`;
const opt=(a,f)=>a.map(f).join('');
$('#sg').innerHTML=SVC.map((s,i)=>`<div class="sv"><h3>${s[0]}</h3><span class="pr">${s[1]?'From '+usd(s[1]):'Free'}</span><p>${s[2]}</p><button data-s="${i}">Book this</button></div>`).join('');
$('#ag').innerHTML=ART.map((a,i)=>`<div class="ar">${ph(`images/artists/${i+1}.jpg`,`images/artists/${i+1}.jpg`)}<div class="i"><h3>${a[0]}</h3><p>${a[1]}</p></div></div>`).join('');
let cat="all";
const gal=()=>{$('#gc').innerHTML=CATS.map(c=>`<button class="chip" data-c="${c[0]}" aria-pressed="${cat==c[0]}">${c[1]}</button>`).join('');
$('#gg').innerHTML=CATS.slice(1).filter(c=>cat=="all"||cat==c[0]).map(c=>[1,2,3].map(n=>{const f=`images/tattoos/${c[0]}-${n}.jpg`;return `<button class="ph" data-l="${f}" data-f="${f}" aria-label="${c[1]} tattoo ${n}"><img src="${f}" alt="${c[1]} tattoo ${n}" loading="lazy" onerror="this.parentNode.disabled=true;this.remove()"></button>`}).join('')).join('')};
$('#gc').onclick=e=>{if(e.target.dataset.c){cat=e.target.dataset.c;gal()}};
$('#gg').onclick=e=>{const b=e.target.closest('[data-f]');if(b&&!b.disabled){$('#li').src=b.dataset.f;$('#lb').showModal()}};
$('#lx').onclick=()=>$('#lb').close();$('#lb').onclick=e=>{if(e.target.id=='lb')$('#lb').close()};
$('#mb').onclick=()=>$('#nav').classList.toggle('open');$('#nav').onclick=()=>$('#nav').classList.remove('open');
$('#fs').innerHTML=opt(SVC,(s,i)=>`<option value="${i}">${s[0]}${s[1]?' (from '+usd(s[1])+')':' (free)'}</option>`);
$('#fz').innerHTML=opt(SZ,(s,i)=>`<option value="${i}">${s[0]}</option>`);$('#fp').innerHTML=opt(PL,p=>`<option>${p}</option>`);
$('#sg').onclick=e=>{if(e.target.dataset.s){$('#fs').value=e.target.dataset.s;calc();$('#book').scrollIntoView()}};
let q={},slot="";
function calc(){const i=+$('#fs').value,s=SVC[i],z=SZ[+$('#fz').value][1],m=i==1?1+(z-1)*.3:z,base=s[1]?Math.round(s[1]*m/5)*5:0,dz=$('#fdz').checked&&s[1]&&i!=1?40:0,tot=base+dz,dep=s[1]?Math.max(30,Math.round(tot*.25)):0;q={tot,dep};
$('#sd').innerHTML=`<dt>Service</dt><dd>${s[0]}</dd><dt>Size</dt><dd>${SZ[$('#fz').value][0].split(',')[0]}</dd><dt>Base price</dt><dd>${usd(base)}</dd>${dz?`<dt>Design drawing</dt><dd>${usd(dz)}</dd>`:''}`;
$('#tt').textContent=s[1]?usd(tot):'Free';$('#dp').textContent=dep?`Deposit today: ${usd(dep)}. Balance of ${usd(tot-dep)} due at your session.`:'No deposit needed.';
$('#pay').textContent=dep?`Pay ${usd(dep)} deposit`:'Request free consultation'}
['fs','fz','fdz'].forEach(i=>$('#'+i).onchange=calc);
const dt=$('#fdt');dt.min=new Date().toISOString().slice(0,10);
dt.onchange=async()=>{slot="";const v=dt.value,el=$('#sl');if(!v)return;if(new Date(v+'T12:00').getDay()==1){el.innerHTML='<small class="mut">Closed on Mondays. Pick another day.</small>';return}
let taken=[];try{taken=(await(await fetch('/api/checkout?date='+v)).json()).taken||[]}catch(x){}
el.innerHTML=TM.map(t=>`<button type="button" data-t="${t}" aria-pressed="false" ${taken.includes(t)?'disabled':''}>${t}</button>`).join('')};
$('#sl').onclick=e=>{const t=e.target.dataset.t;if(!t)return;slot=t;[...$('#sl').children].forEach(b=>b.setAttribute('aria-pressed',b.dataset.t==t))};
$('#bf').onsubmit=async e=>{e.preventDefault();const err=m=>$('#er').textContent=m;
if(!dt.value||!slot)return err('Choose a date and an open time.');if(!$('#fn').value.trim())return err('Enter your full name.');
if(!/^\S+@\S+\.\S+$/.test($('#fe').value))return err('Enter a valid email address.');if(!$('#fph').value.trim())return err('Enter a phone number.');if(!$('#fa').checked)return err('You must be 18 or older to book.');
err('');const btn=$('#pay'),label=btn.textContent;btn.disabled=true;btn.textContent='Please wait...';
try{const r=await fetch('/api/checkout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({service:+$('#fs').value,size:+$('#fz').value,addon:$('#fdz').checked,date:dt.value,slot,name:$('#fn').value,email:$('#fe').value,phone:$('#fph').value,placement:$('#fp').value,design:$('#fd').value,notes:$('#fnt').value,adult:true})}),j=await r.json();
if(!r.ok)throw new Error(j.error||'Something went wrong.');
if(j.url){location.href=j.url;return}
$('#dc').innerHTML=`<p>Reference <b>${j.ref}</b></p><p>Free consultation on ${dt.value} at ${slot}. We will confirm by email at ${$('#fe').value}.</p>`;$('#dl').showModal();btn.textContent=label;btn.disabled=false;dt.onchange()}
catch(x){err(x.message);btn.textContent=label;btn.disabled=false}};
const p=new URLSearchParams(location.search);if(p.get('paid')){const o=$('#paid');o.hidden=false;o.textContent=`Payment received. Your booking ${p.get('ref')||''} is confirmed. A receipt is on its way to your email.`;history.replaceState(null,'','/#book')}
gal();calc();
