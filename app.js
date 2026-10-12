const ICONS={prej:'assets/prej.png',leto:'assets/letnica.png',meja:'assets/sosed.png',obris:'assets/obris.png',kje:'assets/kje.png'};
function iconImg(id,label){return `<img src="${ICONS[id]}" alt="${label||''}" loading="lazy">`}
const GAMES=[{id:'prej',name:'Prej?',desc:'Kaj se je zgodilo prej?',kind:'Zgodovina'},
{id:'leto',name:'Letnica',desc:'Izberi pravilno leto.',kind:'Zgodovina'},
{id:'meja',name:'Sosed',desc:'Katera država meji?',kind:'Geografija'},
{id:'obris',name:'Obris',desc:'Prepoznaj državo.',kind:'Geografija'},
{id:'kje',name:'Kje?',desc:'Označi kraj na zemljevidu.',kind:'Geografija + zgodovina'}];
const ROUNDS=3, MAX_SCORE=15, QUESTION_MS=30000;
function localDate(){const p=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Ljubljana',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date()).filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));return `${p.year}-${p.month}-${p.day}`}
const TODAY=localDate();
function formatDay(s){const d=new Date(s+'T12:00:00Z');const months=['januarja','februarja','marca','aprila','maja','junija','julija','avgusta','septembra','oktobra','novembra','decembra'];return `${d.getUTCDate()}. ${months[d.getUTCMonth()]} ${d.getUTCFullYear()}`}
function hash(s){let h=2166136261;for(let i=0;i<s.length;i++)h=Math.imul(h^s.charCodeAt(i),16777619);return h>>>0}
function shuffle(arr,seed){let a=[...arr],x=seed>>>0;for(let i=a.length-1;i>0;i--){x^=x<<13;x^=x>>>17;x^=x<<5;let j=(x>>>0)%(i+1);[a[i],a[j]]=[a[j],a[i]]}return a}
const ESC=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function yearTxt(y){return y<0?`${-y} pr. n. št.`:`${y}`}
function makeDaily(){
 const config=CALENDAR[TODAY];
 if(!config)return null;
 const pairs=config.prej.map(([a,b],i)=>{
   const p=[DATA.history[a],DATA.history[b]];
   const labels=hash(TODAY+'flip'+i)%2?[p[1],p[0]]:p;
   return {text:'Kaj se je zgodilo prej?',options:labels.map(e=>e[1]),correct:labels[0][0]<labels[1][0]?0:1};
 });
 const years=config.leto.map((index,i)=>{
   const e=DATA.history[index];
   const offsets=shuffle([-55,-40,-30,-23,-16,-11,-7,7,11,16,23,30,40,55],hash(TODAY+'offset'+i)).slice(0,3);
   const years=shuffle([e[0],...offsets.map(x=>e[0]+x)],hash(TODAY+'years'+i));
   return {text:e[1],options:years.map(yearTxt),correct:years.indexOf(e[0])};
 });
 const borders=config.meja.map((index,i)=>{
   const [code,target,neighbors,nonNeighbors]=DATA.borders[index];
   const answer=shuffle(neighbors,hash(TODAY+'neighbor'+i))[0];
   const wrong=shuffle(nonNeighbors,hash(TODAY+'decoys'+i)).slice(0,3);
   const codes=shuffle([answer,...wrong],hash(TODAY+'bordersort'+i));
   return {text:`Katera država meji na državo ${target}?`,options:codes.map(code=>DATA.labels[code]),correct:codes.indexOf(answer)};
 });
 const silhouettes=config.obris.map((index,i)=>{
   const shape=DATA.shapes[index];
   const pool=DATA.shapes.filter(s=>s[2]===shape[2]&&s[0]!==shape[0]&&s[1]!==shape[1]);
   const opt=shuffle([shape,...shuffle(pool,hash(TODAY+'distractors'+i)).slice(0,3)],hash(TODAY+'shapesort'+i));
   return {text:'Katera država je to?',shape:shape,options:opt.map(x=>x[1]),correct:opt.findIndex(x=>x[0]===shape[0])};
 });
 const locations=config.kje.map(index=>{const p=DATA.places[index];return {text:p[0],lat:p[1],lon:p[2]}});
 return {prej:pairs,leto:years,meja:borders,obris:silhouettes,kje:locations};
}
const QUEST=makeDaily();
const storageKey='bokstery-v4:'+TODAY;
function fresh(){return Object.fromEntries(GAMES.map(g=>[g.id,{i:0,answer:null,scores:[],startedAt:null}]))}
function load(){try{const o=JSON.parse(localStorage.getItem(storageKey));if(o&&GAMES.every(g=>o[g.id]&&Number.isInteger(o[g.id].i)&&Array.isArray(o[g.id].scores)&&Object.prototype.hasOwnProperty.call(o[g.id],'startedAt')))return o}catch(e){}return fresh()}
let state=load(), view=null;
function save(){try{localStorage.setItem(storageKey,JSON.stringify(state))}catch(e){}}
function done(id){return state[id].i>=ROUNDS}
function allScore(){return GAMES.reduce((sum,g)=>sum+state[g.id].scores.reduce((a,b)=>a+b,0),0)}
function completed(){return GAMES.filter(g=>done(g.id)).length}

function startQuestion(id){
 const s=state[id];
 if(done(id)||s.answer!==null)return;
 if(!Number.isFinite(s.startedAt)){
   s.startedAt=Date.now();save();
 }
 if(Date.now()-s.startedAt>=QUESTION_MS)expireQuestion(id);
}
function expireQuestion(id){
 const s=state[id];
 if(done(id)||s.answer!==null)return;
 s.answer={value:null,points:0,timedOut:true};save();
}
function timeRemaining(id){
 const s=state[id];
 return Math.max(0,QUESTION_MS-(Date.now()-s.startedAt));
}
function timerWidget(){return `<div class="question-timer" id="timer" role="timer" aria-label="Preostali čas"><span>⏱</span><div class="timer-line"><div class="timer-fill" id="timerFill"></div></div><span class="timer-seconds" id="timerSeconds">0:30</span></div>`}
function tickTimer(){
 if(!view||done(view))return;
 const s=state[view];
 if(s.answer!==null)return;
 if(!Number.isFinite(s.startedAt))startQuestion(view);
 const remaining=timeRemaining(view);
 if(remaining<=0){expireQuestion(view);render();return}
 const el=document.getElementById('timer');
 if(!el)return;
 el.classList.toggle('urgent',remaining<=10000);
 const text=document.getElementById('timerSeconds');
 const fill=document.getElementById('timerFill');
 if(text)text.textContent='0:'+String(Math.ceil(remaining/1000)).padStart(2,'0');
 if(fill)fill.style.width=(remaining/QUESTION_MS*100)+'%';
}
function render(){
 if(!QUEST){document.getElementById('app').innerHTML=`<section class="heading"><h1>${formatDay(TODAY)}</h1><p>Za ta datum ni pripravljenega izziva.</p></section>`;return;}
 if(view)startQuestion(view);
 const root=document.getElementById('app');
 root.innerHTML=view?renderGame(view):renderHome();
 tickTimer();
}
function renderHome(){
 return `<section class="heading"><h1>${formatDay(TODAY)}</h1><p>${completed()} / 5 rešenih · ${allScore()} / ${MAX_SCORE} točk</p><div class="top-progress">${GAMES.map(g=>`<span class="dot ${done(g.id)?'done':''}"></span>`).join('')}</div></section><section class="cards">${GAMES.map(g=>`<button class="game-card" onclick="openGame('${g.id}')"><span class="symbol">${iconImg(g.id,g.name)}</span><span class="card-copy"><span class="card-title">${g.name}</span><span class="card-desc">${g.desc}</span></span>${done(g.id)?'<span class="check">✓</span>':'<span class="arrow">→</span>'}</button>`).join('')}</section>${completed()===5?`<button class="primary share-home" onclick="showShare()">↗ Deli rezultat</button>`:''}`;
}
function renderGame(id){
 const g=GAMES.find(g=>g.id===id),s=state[id];
 return `<button class="back" onclick="goHome()">← Vse igre</button><div class="play-head"><span class="play-mark">${iconImg(g.id,g.name)}</span><h1 class="play-title">${g.name}</h1></div><div class="steps">${[0,1,2].map(i=>`<span class="step ${i<s.i?'done':i===s.i&&!done(id)?'current':''}"></span>`).join('')}</div><section class="question">${done(id)?renderResult(id):`${s.answer===null?timerWidget():''}${renderQuestion(id)}`}</section>`;
}
function renderQuestion(id){
 const s=state[id],q=QUEST[id][s.i],reveal=s.answer!==null;
 if(id==='kje')return renderMapQuestion(q,s,reveal);
 let visual=id==='obris'?silhouette(q.shape):'';
 const opts=q.options.map((o,i)=>{let cls=reveal?(i===q.correct?'right':i===s.answer.value?'wrong':'faded'):'';return `<button class="choice ${cls}" ${reveal?'disabled':''} onclick="choose('${id}',${i})">${ESC(o)}</button>`}).join('');
 let feedbackText=reveal?feedback(id,s.answer.timedOut?'Čas je potekel':s.answer.points>0?'Pravilno':'Napačno',`Odgovor: ${q.options[q.correct]}`):'';
 return `${visual}<h2 class="question-title">${ESC(q.text)}</h2><div class="choices ${id==='prej'?'two':''}">${opts}</div>${feedbackText}`;
}
function silhouette(s){const [name,sl,region,path,b]=s;let [x,y,w,h]=b,pad=Math.max(w,h)*.13+2;let left=x-pad,top=y-pad,ww=w+2*pad,hh=h+2*pad;
 return `<div class="silhouette"><svg viewBox="${left} ${top} ${ww} ${hh}" preserveAspectRatio="xMidYMid meet" aria-label="Obris države" role="img"><path class="shape-path" d="${path}"/></svg></div>`}
function mapSvg(q,answer){
 let lines='';for(let y=75;y<450;y+=75)lines+=`<line class="map-grid" x1="0" y1="${y}" x2="900" y2="${y}"/>`;for(let x=90;x<900;x+=90)lines+=`<line class="map-grid" x1="${x}" y1="0" x2="${x}" y2="450"/>`;
 let paths=DATA.world.map(s=>`<path class="continent" d="${s[1]}"/>`).join('');
 let guess=answer&&Array.isArray(answer.value)?`<circle class="marker" cx="${(answer.value[1]+180)*2.5}" cy="${(90-answer.value[0])*2.5}" r="7"/>`:'';
 let truth=answer?`<circle class="answer-pin" cx="${(q.lon+180)*2.5}" cy="${(90-q.lat)*2.5}" r="7"/>`:'';
 return `<svg id="worldMap" viewBox="0 0 900 450" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Zemljevid sveta"><rect width="900" height="450" fill="#e5e5d2"/>${lines}${paths}${guess}${truth}</svg>`;
}
function renderMapQuestion(q,s,reveal){
 let result=reveal?feedback('kje',s.answer.timedOut?'Čas je potekel':s.answer.points?'Pravilno':'Predaleč',s.answer.timedOut?'0 točk':`${s.answer.km.toLocaleString('sl-SI')} km · +${s.answer.points} ${s.answer.points===1?'točka':'točk'}`):'';
 return `<h2 class="map-title">${ESC(q.text)}</h2><div class="mapbox">${mapSvg(q,s.answer)}</div><p class="map-help">${reveal?'Črna: tvoja točka · zelena: pravilen kraj':'Tapni mesto na zemljevidu. Do 1000 km = 1 točka.'}</p>${result}`;
}
function feedback(id,title,detail){return `<div class="question-foot"><div class="feedback"><div><strong>${ESC(title)}</strong><span>${ESC(detail)}</span></div><button class="primary" onclick="next('${id}')">${state[id].i===2?'Rezultat':'Naprej'} →</button></div></div>`}
function renderResult(id){
 let n=state[id].scores.reduce((a,b)=>a+b,0);
 return `<div class="center"><h2 class="result-title">Končano.</h2><div class="score">${n} / 3</div><p class="result-note">${ROUNDS} vprašanja</p>${completed()===5?'<button class="primary" onclick="showShare()">↗ Deli rezultat</button> ':''}<button class="primary" onclick="goHome()">Vse igre →</button></div>`;
}
function openGame(id){view=id;render();window.scrollTo({top:0,behavior:'instant'})}
function goHome(){view=null;render();window.scrollTo({top:0,behavior:'instant'})}
function choose(id,n){
 const s=state[id];if(s.answer!==null||done(id)||view!==id)return;
 if(timeRemaining(id)<=0){expireQuestion(id);render();return}
 const q=QUEST[id][s.i];s.answer={value:n,points:n===q.correct?1:0};save();render();
}
function haversine(a,b,c,d){let r=Math.PI/180,la=(c-a)*r,lo=(d-b)*r;let h=Math.sin(la/2)**2+Math.cos(a*r)*Math.cos(c*r)*Math.sin(lo/2)**2;return 12742*Math.asin(Math.min(1,Math.sqrt(h)))}
function chooseMap(px,py){
 const s=state.kje;if(view!=='kje'||s.answer!==null||done('kje'))return;
 if(timeRemaining('kje')<=0){expireQuestion('kje');render();return}
 let lat=90-py/2.5,lon=px/2.5-180,q=QUEST.kje[s.i],km=haversine(lat,lon,q.lat,q.lon);
 let points=km<=1000?1:0;
 s.answer={value:[lat,lon],km:Math.round(km),points};save();render();
}
function next(id){
 const s=state[id];if(s.answer===null||done(id))return;
 s.scores.push(s.answer.points);s.answer=null;s.i++;s.startedAt=null;save();render();
}
function shareMessage(){
 if(completed()!==5)return '';
 const emoji={prej:'⏳',leto:'📅',meja:'🌍',obris:'🗺️',kje:'📍'};
 let lines=[`🟩 BOKSTERY · ${formatDay(TODAY)}`,''];
 for(const g of GAMES){
   const n=state[g.id].scores.reduce((a,b)=>a+b,0);
   const blocks=state[g.id].scores.map(x=>x===1?'🟩':'⬛').join('');
   lines.push(`${emoji[g.id]} ${g.name}: ${blocks} ${n}/3`);
 }
 lines.push('',`🏆 Skupaj: ${allScore()}/${MAX_SCORE}`);
 lines.push('https://bokstery.si/');
 return lines.join('\n');
}
function showShare(){
 if(completed()!==5)return;
 document.getElementById('helpRoot').innerHTML=`<div class="overlay" onclick="if(event.target===this)closeHelp()"><div class="modal" role="dialog" aria-modal="true" aria-labelledby="shareHeading"><button class="close" onclick="closeHelp()" aria-label="Zapri">×</button><h2 id="shareHeading">Deli rezultat</h2><p class="share-total">${allScore()} / ${MAX_SCORE} točk</p><textarea class="share-text" id="shareText" readonly aria-label="Besedilo za deljenje">${ESC(shareMessage())}</textarea><div class="share-actions"><button class="primary" onclick="copyShare()">Kopiraj besedilo</button><button class="outline" onclick="closeHelp()">Zapri</button></div></div></div>`;
}
async function copyShare(){
 let field=document.getElementById('shareText');if(!field)return;
 let copied=false;
 try{if(navigator.clipboard&&navigator.clipboard.writeText){await navigator.clipboard.writeText(field.value);copied=true}}catch(e){}
 if(!copied){field.focus();field.select();try{copied=document.execCommand('copy')}catch(e){}}
 if(copied){let btn=document.querySelector('.share-actions .primary');if(btn)btn.textContent='Kopirano ✓'}
 else{field.focus();field.select()}
}
function showHelp(){document.getElementById('helpRoot').innerHTML=`<div class="overlay" onclick="if(event.target===this)closeHelp()"><div class="modal" role="dialog" aria-modal="true"><button class="close" onclick="closeHelp()" aria-label="Zapri">×</button><h2>Kako igrati</h2><p>Pet iger, po tri vprašanja. Za vsako imaš 30 sekund. Pravilen odgovor = 1 točka. Pri igri Kje? zadeneš, če si največ 1000 km stran.</p><p><b>Prej?</b> Izberi starejši dogodek.<br><b>Letnica</b> Izberi pravilno leto.<br><b>Sosed</b> Najdi državo s skupno mejo.<br><b>Obris</b> Prepoznaj državo po obliki.<br><b>Kje?</b> Tapni mesto na zemljevidu.</p><p>Nov izbor vsak dan ob polnoči po slovenskem času.</p><button class="primary" onclick="closeHelp()">Razumem</button></div></div>`}
function closeHelp(){document.getElementById('helpRoot').innerHTML=''}
document.addEventListener('click',e=>{
 const map=e.target.closest('#worldMap');if(!map)return;
 const s=state.kje;if(view!=='kje'||s.answer!==null||done('kje'))return;
 let pt=map.createSVGPoint();pt.x=e.clientX;pt.y=e.clientY;
 let mx=map.getScreenCTM();if(!mx)return;
 pt=pt.matrixTransform(mx.inverse());chooseMap(Math.max(0,Math.min(900,pt.x)),Math.max(0,Math.min(450,pt.y)));
});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeHelp()});
setInterval(tickTimer,150);
setInterval(()=>{if(localDate()!==TODAY)location.reload()},60000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&localDate()!==TODAY)location.reload()});
render();
