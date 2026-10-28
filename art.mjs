const frames=['0 0 660 724','660 0 710 724','1370 0 802 724'];
function clippedImage(s,prefix){const[x,y,w,h]=frames[s.age].split(' '),id=`${prefix}-${s.id}`;return `<defs><clipPath id="${id}" clipPathUnits="userSpaceOnUse"><rect x="${x}" y="${y}" width="${w}" height="${h}"/></clipPath></defs><image href="assets/buildings.png" width="2172" height="724" clip-path="url(#${id})"/>`;}
export function buildingPreview(s){return `<svg class="building-preview-art" viewBox="${frames[s.age]}" role="img" aria-label="${['Stone Age thatch and timber outpost','Bronze Age terraced masonry keep','Iron Age stone citadel'][s.age]}">${clippedImage(s,'preview-art')}</svg>`;}
export function settlementArt(s,x,y,prefix="map"){
 if(!s.owner)return `<g class="vacant-site" transform="translate(${x},${y-15})"><ellipse rx="23" ry="9"/><path d="M-10,1 L0,-13 10,1 M0,-13 V8"/></g>`;
 const color=s.owner==='player'?'#79e7c1':'#ef8874',size=97+s.age*9,houseCount=Math.min(4,Math.floor(s.pop/20));
 return `<g class="settlement-art age-${s.age} ${s.fort?'fortified':''}" data-age="${s.age}" data-development="${['Thatch & timber outpost','Bronze masonry keep','Iron citadel'][s.age]}${s.fort?' · fortified':''}" transform="translate(${x},${y-9})" aria-hidden="true">
 <ellipse class="tower-shadow" cy="10" rx="${43+s.age*4+s.fort*8}" ry="13"/>
 ${s.fort?'<path class="walls" d="M-59,-5 L-47,-20 -41,-10 -29,-24 -18,-12 0,-28 18,-12 29,-24 41,-10 47,-20 59,-5 V19 L41,33 -41,33 -59,19Z"/>':''}
 ${Array.from({length:houseCount},(_,i)=>{const hx=[-50,44,-40,39][i],hy=[5,5,21,21][i];return `<g class="house" transform="translate(${hx},${hy})"><path fill="${s.age?'#cbb994':'#a88d63'}" d="M-8,0 H8 V11 H-8Z"/><path fill="${s.age===2?'#547989':'#895a43'}" d="M-11,0 L0,-8 11,0Z"/><path fill="#332e28" d="M-2,5 h4 v6 h-4z"/></g>`;}).join('')}
 <foreignObject class="settlement-sprite" x="${-size/2}" y="${-size+18}" width="${size}" height="${size}"><div xmlns="http://www.w3.org/1999/xhtml" style="position:relative;overflow:hidden;width:${size}px;height:${size}px"><img alt="" src="assets/buildings.png" style="position:absolute;max-width:none;height:${size}px;width:${size*3}px;left:${(size-Number(frames[s.age].split(' ')[2])/724*size)/2-Number(frames[s.age].split(' ')[0])/724*size}px;top:0;pointer-events:none"></div></foreignObject>
 ${s.fort?'<path class="wallfront" d="M-59,5 L-41,17 -30,11 -17,22 0,15 17,22 30,11 41,17 59,5 V19 L41,33 -41,33 -59,19Z"/><path class="fort-shield" d="M45,6 h14 v10 q-7,11 -14,0z"/>':''}
 <path class="flagpole" d="M37,-20 v-43"/><path class="flag" fill="${color}" d="M38,-63 h19 v20 l-9,-4 -10,4z"/>
 </g>`;
}
