import {stocks,nextStep,peoplePanel,researchPanel,workshopPanel,storesPanel,buildingsPanel,defencePanel} from './management.mjs?v=4f';
import {cityHTML,human,primaryWeapon,figureWeapon} from './city.mjs?v=4f';
import {readCampaign,saveCampaign} from './persistence.mjs?v=4f';
import {settlementArt,buildingPreview} from './art.mjs?v=4f';
import {createGame,step,assigned,idle,assign,march,fortify,neighbours,NAMES,AGES,armyStrength,towerStrength,RECIPES,MATERIALS,JOBS,BUILDINGS,DEFENCES,TECHS,equip,kitCount,weaponCount,queueProduction,stopProduction,chooseMine,buildDefence,buildStructure,startResearch,repairCity} from './engine.mjs?v=4f';
import {centres,hexPoints,terrain,siteCellIds,connections,planRoute,routePosition} from './grid.mjs?v=4f';
const $=id=>document.getElementById(id);
let game=createGame(),selected=3,speed=1,paused=true,marching=false,force=20;
let saveMessage='Autosave starts when the campaign begins.';
let activePanel='people',orderRecipe='axe',orderQuantity=5,armament='best',cityView=false,resumePending=false;
let started=false,guideWasPaused=true,beforeMarchPaused=false,toastTimer,sliderHeld=false;
const stored=readCampaign(localStorage);if(stored){game=stored.game;selected=Number.isInteger(stored.selected)&&stored.selected>=0&&stored.selected<12?stored.selected:3;cityView=!!stored.cityView;activePanel=['people','research','workshop','build','defence','march','stores'].includes(stored.activePanel)?stored.activePanel:'people';started=true;resumePending=true;}
const time=t=>`${String(Math.floor(t/60)).padStart(2,'0')}:${String(Math.floor(t%60)).padStart(2,'0')}`;
const capacity=s=>Math.max(0,idle(s)-1);
const development=s=>['Thatch & timber outpost','Bronze masonry keep','Iron citadel'][s.age];
// Preserve node identity so simulation paints cannot swallow pointer-up or reset focus.
function patch(host,html){
 const next=host.cloneNode(false);next.innerHTML=html;
 function sync(a,b){
  if(a.nodeType!==b.nodeType||a.nodeName!==b.nodeName){a.replaceWith(b.cloneNode(true));return;}
  if(a.nodeType===3){if(a.nodeValue!==b.nodeValue)a.nodeValue=b.nodeValue;return;}
  if(a.nodeType!==1)return;
  for(const attr of [...a.attributes])if(!b.hasAttribute(attr.name))a.removeAttribute(attr.name);
  for(const attr of [...b.attributes])if(a.getAttribute(attr.name)!==attr.value)a.setAttribute(attr.name,attr.value);
  for(let i=0;i<b.childNodes.length;i++){if(a.childNodes[i])sync(a.childNodes[i],b.childNodes[i]);else a.appendChild(b.childNodes[i].cloneNode(true));}
  while(a.childNodes.length>b.childNodes.length)a.lastChild.remove();
 }
 for(let i=0;i<next.childNodes.length;i++){if(host.childNodes[i])sync(host.childNodes[i],next.childNodes[i]);else host.appendChild(next.childNodes[i].cloneNode(true));}
 while(host.childNodes.length>next.childNodes.length)host.lastChild.remove();
}
function notify(text){$('toast').textContent=text;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),5000);}
function tower(s,x,y){return settlementArt(s,x,y)+(s.owner?`${s.defences.watchtower?`<path d="M${x-65},${y+10} v-32 h16 v32 M${x-70},${y-22} l13,-15 13,15" fill="#b9ac83" stroke="#465c4d" stroke-width="2"/>`:''}${s.jobs.guard?human(x+56,y+10,s.owner==='player'?'#79e7c1':'#ef8874',0,true,1):''}`:'');}

function terrainHTML(){return `<g id="countryside">${terrain.filter(t=>t.land).map(t=>{const site=siteCellIds.indexOf(t.id),control=game.control[t.id],owner=control===null?null:game.sectors[control]?.owner;return `<g class="terrain-cell ${owner||''} ${control===selected?'influence-selected':''}" data-cell="${t.id}" role="button" tabindex="0" aria-label="${site>=0?'Settlement site '+NAMES[site]:'Countryside hex '+t.id+' — no founding site'}"><polygon points="${hexPoints(t.id).map(p=>p.join(',')).join(' ')}"/>${site<0&&t.id%9===0?`<path class="mineral-marker" d="M${t.x},${t.y-4} l3,4 -3,4 -3,-4Z"/>`:''}</g>`;}).join('')}</g>`;}
function networkHTML(){return `<g id="network">${connections(game).map(r=>`<path class="connection ${r.road?'road':'path'} ${r.owner}" d="${r.path.map((id,i)=>(i?'L':'M')+terrain[id].x+','+terrain[id].y).join(' ')}"/>`).join('')}</g>`;}
function tile(s){const[x,y]=centres[s.id],target=marching&&s.id!==selected,action=s.owner==='player'?'Reinforce':s.owner==='enemy'?'Attack':'Found city';return `<g class="sector city-site ${s.owner||''} ${selected===s.id?'selected':''} ${target?'target':''}" data-sector="${s.id}"><polygon role="button" tabindex="0" aria-label="${NAMES[s.id]}, ${s.owner==='player'?'your city':s.owner==='enemy'?'rival city':'suitable settlement site'}, ${Math.floor(s.pop)} people${target?', '+action+' destination':''}" points="${hexPoints(siteCellIds[s.id],27).map(p=>p.join(',')).join(' ')}"/><g transform="translate(${x},${y}) scale(.57)">${tower(s,0,0)}</g><text class="name" x="${x}" y="${y+30}">${NAMES[s.id]}</text><text class="count" x="${x}" y="${y+45}">${s.owner?Math.floor(s.pop)+' people · '+AGES[s.age]:'Suitable city site'}</text>${game.battles.some(b=>b.to===s.id)?`<text class="siege-marker" x="${x}" y="${y-36}">⚔ BATTLE</text>`:''}${target?`<text class="target-action" x="${x}" y="${y+59}">${action.toUpperCase()} →</text>`:''}</g>`;}
const orders=document.createElement('div');orders.id='orders';orders.setAttribute('aria-live','polite');document.querySelector('.mapframe').appendChild(orders);
const rivalNotice=document.createElement('p');rivalNotice.id='rivalNotice';document.querySelector('.maphead>div').appendChild(rivalNotice);
function renderMap(){
 patch($('tiles'),terrainHTML()+networkHTML()+game.sectors.map(tile).join(''));
 patch($('routes'),game.moves.map(m=>{const[x,y]=routePosition(m),color=m.owner==='player'?'#79e7c1':'#ef8874',path=m.path.map(id=>terrain[id]);return `<path class="route" d="${path.map((p,i)=>(i?'L':'M')+p.x+','+p.y).join(' ')}"/>${Array.from({length:Math.min(6,m.count)},(_,i)=>human(x+(i%3)*7-7,y+Math.floor(i/3)*8,color,game.time*14+i,figureWeapon(m.kit,m.count,i,Math.min(6,m.count)),.85)).join('')}<text class="armynum" x="${x}" y="${y-15}">${m.count} marching</text>`;}).join(''));
 for(const owner of ['player','enemy'])$(owner+'Count').textContent=game.sectors.filter(s=>s.owner===owner).length;
 $('neutralCount').textContent=game.sectors.filter(s=>!s.owner).length;$('time').textContent=time(game.time);
 $('status').textContent=game.ended?'Campaign ended':marching?'Choosing destination · paused':paused?'Paused · press ▶ to play':`${speed}× real time`;
 $('pause').textContent=paused?'▶':'Ⅱ';$('pause').setAttribute('aria-label',paused?'Resume game':'Pause game');
 rivalNotice.textContent=game.time<120?`Rival expands in ${time(120-game.time)} · no attacks before 04:00`:game.time<240?`Rival cannot attack you for ${time(240-game.time)}`:'Rival active · defend your towers';
 document.body.classList.toggle('is-paused',paused);
 $('mapnote').textContent=marching?`${NAMES[selected]} → choose a named site OR a destination button`:'Cities only at named sites · coloured hexes show influence · paths become roads with Engineering';
 const moves=game.moves.filter(m=>m.owner==='player'),arrival=game.events.find(e=>e.type==='good'&&/settled by your people|captured!|built,|built\./.test(e.text)&&game.time-e.time<18);
 patch(orders,moves.length?moves.map(m=>`<div class="order"><strong>${m.count} people: ${NAMES[m.from]} → ${NAMES[m.to]}</strong><span>${paused?'Paused — press ▶ to continue':`Arriving in ${m.remaining.toFixed(1)} seconds`}</span><div class="progress"><span style="width:${100*(1-m.remaining/m.duration)}%"></span></div></div>`).join(''):arrival?`<div class="order arrived"><strong>✓ ${arrival.text}</strong><span>Your changes are visible on the map.</span></div>`:'');
}
function destinationButtons(s){return neighbours(s.id).map(id=>{const t=game.sectors[id],route=planRoute(game,s.id,id),action=t.owner==='player'?'Reinforce':t.owner==='enemy'?'Attack':'Found city';return `<button class="destination ${t.owner==='enemy'?'hostile':''}" data-destination="${id}"><strong>${action} ${NAMES[id]} →</strong><small>${t.owner?Math.floor(t.pop)+' residents · '+towerStrength(t).toFixed(1)+' defence':'Suitable settlement site'} · ${route.duration.toFixed(1)}s ${route.road?'via road':''}</small></button>`;}).join('');}
function deployment(s){const cap=capacity(s);return `<section class="deployment-panel ${marching?'choosing':''}" aria-label="March orders"><div class="sectiontitle"><h3>${marching?'2. Choose destination':'1. Prepare a march'}</h3><small>From ${NAMES[s.id]}</small></div><p class="deployment-summary"><strong>${cap}</strong> available = ${Math.floor(s.pop)} residents − ${assigned(s)} workers − 1 stays home</p><div class="deployrow"><label for="force">People</label><input type="range" id="force" min="${cap?1:0}" max="${cap}" value="${force}" aria-label="Deployment size" ${cap?'':'disabled'}><output id="forceValue">${force}</output></div><label class="field-label" for="armament">Army loadout</label><select id="armament" aria-label="Army loadout"><option value="best" ${armament==='best'?'selected':''}>Best available weapons</option>${Object.entries(RECIPES).map(([k,r])=>`<option value="${k}" ${armament===k?'selected':''}>${r.name} · ${s.inventory[k]} available</option>`).join('')}</select><p class="equipment">${kitCount(equip(s,force,armament))} / ${force} equipped · attack strength ${armyStrength(force,equip(s,force,armament),s.age).toFixed(1)}<br>${Math.max(0,Math.floor(s.pop)-force)} residents remain home to defend</p>${marching?`<p class="choose-hint">Clock paused. Pick any named city site below or on the map. Your people traverse countryside; sending resumes play.</p><div class="destinations">${destinationButtons(s)}</div><button id="cancelMarch" class="cancel-march">Cancel destination selection</button>`:`<button class="primary" id="march" ${cap?'':'disabled'}>Choose destination →</button><p class="hint">Only named sites can host cities. Travel follows small hexes; friendly paths and roads speed up the march.</p>`}${cap===0?'<p class="no-troops">Everyone is working. Release workers with − or the button below to send settlers.</p><button id="releaseWorkers" class="release-workers">Release up to 10 workers for a march</button>':''}</section>`;}

function renderInspector(){
 if(sliderHeld)return;const s=game.sectors[selected],own=s.owner==='player',battle=game.battles.find(b=>b.to===selected);
 if(own)force=capacity(s)?Math.max(1,Math.min(force||20,capacity(s))):0;
 const header=`<div class="sectorhead"><span class="banner" style="color:${s.owner==='enemy'?'var(--coral)':'var(--mint)'}">⚑</span><div><h2>${NAMES[selected]}</h2><small>${own?'YOUR CITY':s.owner?'RIVAL CITY':'UNSETTLED'} · ${AGES[s.age]}</small></div></div><div class="sector-actions"><button id="openCity">${cityView?'Inspect city':'Open city view'} ↗</button><button id="returnMap">Island map</button></div>`;
 if(!own){const inbound=game.moves.filter(m=>m.to===selected&&m.owner==='player'),sources=neighbours(selected).map(i=>game.sectors[i]).filter(t=>t.owner==='player');patch($('inspector'),header+`${battle?`<div class="workshop-status">⚔ Battle in progress: ${battle.count} attackers. Open city view to see the siege, damage and outcome.</div>`:''}${inbound.length?`<div class="incoming"><strong>Your people are on the way.</strong><p>${inbound.map(m=>`${m.count} people arrive in ${m.remaining.toFixed(1)} seconds.`).join('<br>')}</p></div>`:''}<div class="stats"><div><small>Population / garrison</small><strong>${Math.floor(s.pop)}</strong></div><div><small>Passive defence</small><strong>${s.owner?towerStrength(s).toFixed(1):'None'}</strong></div></div><div class="emptyinspector"><h3 class="empty-title">${s.owner?'A rival banner flies here.':'Create a new settlement.'}</h3><p>${s.owner?'Enemy cities can be inspected while fighting. An equipped march starts a real siege on arrival.':'Send idle residents from any reachable mint city. They settle automatically and bring their chosen weapons.'}</p>${sources.map(t=>`<button class="destination" data-send-from="${t.id}" data-to="${s.id}" ${capacity(t)?'':'disabled'}><strong>${s.owner?'Send army':'Send '+Math.min(20,capacity(t))+' settlers'} from ${NAMES[t.id]} →</strong><small>${capacity(t)} available · uses best available weapons</small></button>`).join('')||'<p>Found a friendly city first.</p>'}</div>`);return;}
 const tabs=[['people','People'],['research','Research'],['workshop','Workshop'],['build','Buildings'],['defence','Defence'],['stores','Stores'],['march','March']];
 let content=activePanel==='people'?peoplePanel(s):activePanel==='research'?researchPanel(s):activePanel==='workshop'?workshopPanel(s,orderRecipe,orderQuantity):activePanel==='build'?buildingsPanel(s):activePanel==='defence'?defencePanel(s):activePanel==='stores'?storesPanel(s):deployment(s);
 patch($('inspector'),header+stocks(s)+`<div class="population-line"><b>${Math.floor(s.pop)} residents</b><span>${idle(s)} idle · ${assigned(s)} working</span></div><p class="next-step">${nextStep(s)}</p><nav class="city-tabs" aria-label="City controls">${tabs.map(([k,n])=>`<button data-panel="${k}" class="${activePanel===k?'active':''}" aria-pressed="${activePanel===k}">${n}</button>`).join('')}</nav><div id="managementPanel">${battle?'<div class="blocked">This city is under attack. Open City view to inspect the siege.</div>':''}${content}</div><p class="save-note" id="saveNote">${saveMessage}</p>`);
}
const cityFrame=document.createElement('div');cityFrame.className='cityframe';cityFrame.id='cityFrame';document.querySelector('.world').insertBefore(cityFrame,document.querySelector('.objective'));
const modeButtons=document.createElement('div');modeButtons.className='view-modes';modeButtons.innerHTML='<button id="islandMode">Island map</button><button id="cityMode">City view</button>';document.querySelector('.objective').appendChild(modeButtons);
function renderCity(){document.querySelector('.world').classList.toggle('is-city',cityView);$('cityMode').classList.toggle('active',cityView);$('islandMode').classList.toggle('active',!cityView);if(cityView)patch(cityFrame,cityHTML(game,game.sectors[selected]));}
function openCity(){cityView=true;render();cityFrame.scrollLeft=Math.max(0,(cityFrame.scrollWidth-cityFrame.clientWidth)/2);}
$('cityMode').onclick=openCity;$('islandMode').onclick=()=>{cityView=false;render();};
cityFrame.addEventListener('click',e=>{const b=e.target.closest('[data-city-panel]');if(b){if(game.sectors[selected].owner!=='player'){notify('Rival city: inspect the siege, but its controls belong to the rival.');return;}activePanel=b.dataset.cityPanel;renderInspector();$('inspector').scrollTop=0;if(innerWidth<761)$('inspector').scrollIntoView({behavior:'smooth',block:'start'});}});
cityFrame.addEventListener('keydown',e=>{const b=e.target.closest('[data-city-panel]');if(b&&['Enter',' '].includes(e.key)){e.preventDefault();b.dispatchEvent(new MouseEvent('click',{bubbles:true}));}});
function render(){
 renderMap();renderCity();renderInspector();patch($('events'),game.events.slice(0,3).map(e=>`<div class="event ${e.type}"><time>${time(e.time)} · ${e.type==='bad'?'RIVAL ACTIVITY':'ISLAND REPORT'}</time>${e.text}</div>`).join(''));
 if(game.ended&&!$('endDialog').open){paused=true;$('endTitle').textContent=game.ended==='win'?'The island is yours.':'An age has ended.';$('endText').textContent=game.ended==='win'?`The rival has fallen after ${time(game.time)}. Your civilisation holds the First Shore.`:'Your last tower has fallen. Expand early, leave residents to grow, and equip armies before attacking.';$('endDialog').showModal();}
}
function beginMarch(){if(game.sectors[selected].owner!=='player')return;if(capacity(game.sectors[selected])<1){notify('Release workers with − to make idle residents available.');return;}beforeMarchPaused=paused;paused=true;marching=true;activePanel='march';cityView=false;render();notify('Choose a named city site below or on the map. Empty countryside is traversable, not a place to found a city.');}
function cancelMarch(){marching=false;paused=beforeMarchPaused;render();}
function send(to){
 const from=selected;
 if(!neighbours(from).includes(to)){notify('Choose a designated named city site, not empty countryside.');return;}
 if(!march(game,from,to,force,armament)){notify('Not enough idle people. Release workers or reduce the force.');return;}
 const sent=force;marching=false;paused=false;selected=to;cityView=false;activePanel='people';render();$('inspector').scrollTop=0;notify(`${sent} people sent: ${NAMES[from]} → ${NAMES[to]}. Travel time ${game.moves[game.moves.length-1].duration.toFixed(1)} seconds. Play resumed.`);
}
function select(id){if(marching){send(id);return;}selected=id;render();$('inspector').scrollTop=0;}
$('map').addEventListener('click',e=>{const el=e.target.closest('[data-sector]');if(el)select(+el.dataset.sector);else{const cell=e.target.closest('[data-cell]');if(cell){const site=siteCellIds.indexOf(+cell.dataset.cell);if(site>=0)select(site);else notify('Countryside: armies can cross this hex, but a city can only be founded at a named settlement site.');}}});
$('map').addEventListener('keydown',e=>{const el=e.target.closest('[data-sector],[data-cell]');if(el&&['Enter',' '].includes(e.key)){e.preventDefault();const id=el.dataset.sector!==undefined?+el.dataset.sector:siteCellIds.indexOf(+el.dataset.cell);if(id>=0)select(id);else notify('No suitable settlement site here. Armies may traverse this countryside hex.');}});
$('inspector').addEventListener('click',e=>{
 const b=e.target.closest('button');if(!b||b.disabled)return;
 if(b.id==='openCity')openCity();if(b.id==='returnMap'){cityView=false;render();}
 if(b.dataset.panel){if(marching)cancelMarch();activePanel=b.dataset.panel;renderInspector();$('inspector').scrollTop=0;}
 const ss=game.sectors[selected];function result(r,success){if(r.ok){render();notify(success);}else notify(r.error);}
 if(b.id==='queueWeapon')result(queueProduction(game,selected,orderRecipe,orderQuantity),'Weapon batch ordered. '+(ss.jobs.smith?'Assigned smiths will manufacture it.':'Assign Smiths to begin.'));
 if(b.id==='toggleWorkshop'){ss.productionPaused=!ss.productionPaused;render();notify(ss.productionPaused?'Workshop paused.':'Workshop resumed.');}
 if(b.id==='stopWorkshop'){stopProduction(game,selected);render();notify('Orders stopped. Unfinished item materials refunded.');}
 if(b.dataset.mine)result(chooseMine(ss,b.dataset.mine),'Mine now extracts '+MATERIALS[b.dataset.mine].toLowerCase()+'. Assign Miners in People.');
 if(b.dataset.research)result(startResearch(game,selected,b.dataset.research),'Research selected: '+TECHS[b.dataset.research].name+'. Assign Inventors to progress.');
 if(b.dataset.building)result(buildStructure(game,selected,b.dataset.building),BUILDINGS[b.dataset.building].name+' built. '+BUILDINGS[b.dataset.building].effect);
 if(b.dataset.defence)result(buildDefence(game,selected,b.dataset.defence),DEFENCES[b.dataset.defence].name+' built: +'+DEFENCES[b.dataset.defence].power+' defence.');
 if(b.id==='repairCity')result(repairCity(game,selected),'Surviving structures repaired.');
 if(b.dataset.job){const ss=game.sectors[selected];if(assign(ss,b.dataset.job,+b.dataset.delta)){render();notify(`${JOBS[b.dataset.job]}: ${ss.jobs[b.dataset.job]} assigned · ${idle(ss)} residents remain idle.`);}}
 if(b.id==='march')beginMarch();if(b.id==='cancelMarch')cancelMarch();
 if(b.dataset.destination!==undefined)send(+b.dataset.destination);
 if(b.dataset.sendFrom!==undefined){selected=+b.dataset.sendFrom;force=Math.min(20,capacity(game.sectors[selected]));send(+b.dataset.to);}
 if(b.id==='resumeMarch'){paused=false;render();}
 if(b.id==='releaseWorkers'){const s=game.sectors[selected];let n=10;for(const job of ['smith','invent','gather','miner','guard'])while(n>0&&s.jobs[job]>0){assign(s,job,-1);n--;}render();notify(`${10-n} workers released. ${capacity(s)} people can now march.`);}
 if(b.id==='fortify'&&fortify(game,selected)){render();notify(`${NAMES[selected]} fortified: 50 timber and 25 ore spent. Stone walls built; +15 defence.`);}
});
$('inspector').addEventListener('pointerdown',e=>{if(e.target.id==='force')sliderHeld=true;});window.addEventListener('pointerup',()=>{sliderHeld=false;});
$('inspector').addEventListener('input',e=>{if(e.target.id==='force'){force=+e.target.value;$('forceValue').textContent=force;}if(e.target.id==='quantity'){orderQuantity=Math.max(1,Math.min(50,Math.floor(Number(e.target.value)||1)));renderInspector();}if(e.target.id==='recipe'){orderRecipe=e.target.value;renderInspector();}if(e.target.id==='armament'){armament=e.target.value;renderInspector();}});$('inspector').addEventListener('change',()=>renderInspector());
function setPause(){if(game.ended)return;if(marching){notify('Choose a destination or cancel the march first.');return;}paused=!paused;render();}
$('pause').onclick=setPause;document.querySelectorAll('[data-speed]').forEach(b=>b.onclick=()=>{speed=+b.dataset.speed;document.querySelectorAll('[data-speed]').forEach(x=>x.classList.toggle('active',x===b));renderMap();});
function showGuide(){guideWasPaused=paused;paused=true;$('start').textContent=resumePending?'Resume saved campaign ↗':started?'Return to island ↗':'Begin campaign ↗';$('guideDialog').showModal();renderMap();}
function closeGuide(){const first=!started;started=true;paused=first||resumePending?false:guideWasPaused;resumePending=false;$('guideDialog').close();render();}
$('help').onclick=showGuide;$('guide').onclick=showGuide;$('start').onclick=closeGuide;$('closeGuide').onclick=closeGuide;$('guideDialog').addEventListener('cancel',e=>{e.preventDefault();closeGuide();});
function restart(){resumePending=false;game=createGame();selected=3;force=20;cityView=false;activePanel='people';orderRecipe='axe';armament='best';marching=false;paused=false;started=true;speed=1;document.querySelectorAll('[data-speed]').forEach(b=>b.classList.toggle('active',b.dataset.speed==='1'));if($('endDialog').open)$('endDialog').close();render();$('inspector').scrollTop=0;notify('New campaign. Your rival waits 2 minutes before expanding.');}
$('restart').onclick=()=>{if(confirm('Restart this island? Current progress will be lost.'))restart();};$('playAgain').onclick=restart;
document.addEventListener('keydown',e=>{if($('guideDialog').open||$('endDialog').open)return;if(e.key==='Escape'&&marching){e.preventDefault();cancelMarch();return;}if(['INPUT','SELECT'].includes(e.target.tagName))return;if(e.code==='Space'&&e.target.tagName!=='BUTTON'){e.preventDefault();setPause();}if(['1','2','4'].includes(e.key))document.querySelector(`[data-speed="${e.key}"]`).click();});
function persist(){if(!started)return;const ok=saveCampaign(localStorage,game,selected,cityView,activePanel);saveMessage=ok?'Saved in this browser · resume after reload · no offline progress.':'Browser storage unavailable: this run cannot be saved.';const note=$('saveNote');if(note)note.textContent=saveMessage;}
window.addEventListener('pagehide',persist);document.addEventListener('visibilitychange',()=>{if(document.hidden)persist();});
let last=performance.now(),lastPaint=0,lastSave=0;function frame(now){const dt=Math.min(.25,(now-last)/1000);last=now;if(!paused&&!game.ended)step(game,dt*speed);if(now-lastSave>2000){persist();lastSave=now;}if(now-lastPaint>150){render();lastPaint=now;}requestAnimationFrame(frame);}
render();if(!game.ended)showGuide();requestAnimationFrame(frame);
