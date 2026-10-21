/* Isolated approval study, not the storefront collision/discount integration. */
const stage = document.querySelector('#stage');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const ns = 'http://www.w3.org/2000/svg';
const create = (tag, attrs, parent) => { const el = document.createElementNS(ns, tag); Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, String(v))); parent.append(el); return el; };
const creatures = [];
const count = innerWidth < 600 ? 4 : 6;
let paused = false;
let elapsed = 0;
let previousTime;
function makeSpider(index) {
  const node = document.createElement('div'); node.className = 'walker'; node.setAttribute('aria-hidden', 'true'); stage.append(node);
  const svg = create('svg', {viewBox: '0 0 120 120'}, node);
  const defs = create('defs', {}, svg);
  const abdomen = create('radialGradient', {id: `abdomen-${index}`, cx: '.34', cy: '.23', r: '.75'}, defs);
  [['0', '#393a3c'], ['.35', '#1e2022'], ['1', '#08090a']].forEach(([offset, color]) => create('stop', {offset, 'stop-color': color}, abdomen));
  const anatomy = create('g', {class: 'anatomy'}, svg);
  const legs = [];
  for (const side of [-1, 1]) for (let leg = 0; leg < 4; leg++) {
    const group = create('g', {'data-leg': `${side}:${leg}`}, anatomy);
    const thick = create('path', {fill: 'none', stroke: '#111214', 'stroke-width': 3.3}, group);
    const thin = create('path', {fill: 'none', stroke: '#141517', 'stroke-width': 1.65}, group);
    const shine = create('path', {fill: 'none', stroke: '#505152', 'stroke-width': .45, opacity: .65}, group);
    legs.push({side, leg, thick, thin, shine});
  }
  create('ellipse', {cx: 60, cy: 75, rx: 14, ry: 20, fill: `url(#abdomen-${index})`, transform: 'rotate(-3 60 75)'}, anatomy);
  create('ellipse', {cx: 60, cy: 52, rx: 10, ry: 13, fill: `url(#abdomen-${index})`}, anatomy);
  create('path', {d: 'M54 41Q50 33 53 30M66 41Q70 33 67 30', fill: 'none', stroke: '#161719', 'stroke-width': 3}, anatomy);
  create('path', {d: 'M57 41L57 36M63 41L63 36', stroke: '#0a0b0c', 'stroke-width': 2.5}, anatomy);
  create('path', {d: 'M53 65Q50 74 53 83', stroke: '#6b6d70', 'stroke-width': .65, opacity: .4, fill: 'none'}, anatomy);
  for (let j = 0; j < 7; j++) create('path', {d: `M${48+j%2} ${67+j*3}l-2 -1M${72-j%2} ${67+j*3}l2 -1`, stroke: '#191a1b', 'stroke-width': .6}, anatomy);
  const bounds = stage.getBoundingClientRect();
  const positions = [[.18,.2],[.51,.15],[.8,.28],[.24,.68],[.57,.73],[.84,.67]];
  const spider = {node, anatomy, legs, x: bounds.width*positions[index][0], y: bounds.height*positions[index][1], angle: index*.9+.3, phase: index*.7, walking: true, nextChange: .9+index*.28, turn: index%2 ? .36 : -.38, distance:0};
  creatures.push(spider); draw(spider, 0); return spider;
}
function draw(s, stride) {
  for (const {side, leg, thick, thin, shine} of s.legs) {
    const phase = s.phase + (leg % 2 ? Math.PI : 0) + (side === 1 ? Math.PI : 0);
    const shift = Math.sin(phase) * 7 * stride;
    const lift = Math.max(0, Math.cos(phase)) * 3.2 * stride;
    const hipX = 60 + side * (leg === 0 ? 7 : 9);
    const hipY = [45, 49, 56, 62][leg];
    const kneeX = 60 + side * ([22, 28, 28, 24][leg] + lift);
    const kneeY = [30, 43, 66, 80][leg] + shift * .5;
    const ankleX = 60 + side * ([38, 45, 44, 36][leg] + lift);
    const ankleY = [18, 35, 80, 99][leg] + shift;
    const toeX = ankleX + side * (leg < 2 ? 5 : 6);
    const toeY = ankleY + (leg < 2 ? -8 : 9) + shift * .12;
    thick.setAttribute('d', `M${hipX} ${hipY} Q${hipX+side*9} ${hipY-3} ${kneeX} ${kneeY}`);
    thin.setAttribute('d', `M${kneeX} ${kneeY} Q${ankleX-side*2} ${ankleY} ${ankleX} ${ankleY} L${toeX} ${toeY}`);
    shine.setAttribute('d', `M${hipX} ${hipY-1} L${kneeX} ${kneeY-1} L${ankleX} ${ankleY-1}`);
  }
  const bob = Math.sin(s.phase*2)*.65*stride;
  s.anatomy.setAttribute('transform', `translate(0 ${bob})`);
  s.node.style.transform = `translate3d(${s.x-s.node.offsetWidth/2}px,${s.y-s.node.offsetHeight/2}px,0) rotate(${s.angle*180/Math.PI+90}deg)`;
  s.node.dataset.walking = String(Boolean(stride));
}
for (let i = 0; i < count; i++) makeSpider(i);
function frame(time) {
  const dt = previousTime === undefined ? 0 : Math.min((time-previousTime)/1000,.045); previousTime=time;
  if (!paused && !reduced.matches) {
    elapsed += dt;
    const width = stage.clientWidth, height = stage.clientHeight;
    creatures.forEach((s, i) => {
      if (elapsed >= s.nextChange) {
        s.walking = !s.walking;
        s.nextChange = elapsed + (s.walking ? 1.1+(i%3)*.3 : 1.1+(i%3)*.45);
        s.turn = (Math.sin(elapsed*1.2+i)*.7);
      }
      if (s.walking) {
        let target = s.angle+s.turn*dt;
        if (s.x<65) target = Math.atan2(Math.sin(s.angle)*.5,1);
        if (s.x>width-65) target = Math.atan2(Math.sin(s.angle)*.5,-1);
        if (s.y<65) target = Math.atan2(1,Math.cos(s.angle)*.5);
        if (s.y>height-65) target = Math.atan2(-1,Math.cos(s.angle)*.5);
        const difference=Math.atan2(Math.sin(target-s.angle),Math.cos(target-s.angle));
        s.angle += Math.max(-dt*2.8,Math.min(dt*2.8,difference));
        const speed = innerWidth<600 ? 27 : 39;
        s.x=Math.max(40,Math.min(width-40,s.x+Math.cos(s.angle)*speed*dt));
        s.y=Math.max(40,Math.min(height-40,s.y+Math.sin(s.angle)*speed*dt));
        s.phase += dt*Math.PI*2/.4;
        s.distance += speed*dt;
      }
      const twitch = !s.walking && Math.sin(elapsed*2.2+i)>.985 ? .12 : 0;
      draw(s,s.walking ? 1 : twitch);
    });
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
document.querySelector('#toggle').addEventListener('click', () => { paused=!paused; document.querySelector('#toggle').textContent=paused?'Resume spiders':'Pause spiders'; });
window.motionStudy={creatures,get paused(){return paused},get elapsed(){return elapsed}};
