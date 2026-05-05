/* ============================================
   SCRIPT.JS — Global JavaScript
   Responsividade · Navegação · Utilitários
   ============================================ */

'use strict';

/* ─── Escala Responsiva Proporcional ─── */
function updateScale() {
  const W = window.innerWidth;
  const H = window.innerHeight;
  const base = W > H ? H : W;
  const scale = Math.min(Math.max(base / 600, 0.6), 1.6);
  document.documentElement.style.setProperty('--scale', scale.toFixed(3));
}

let _scaleRaf = null;
window.addEventListener('resize', () => {
  if (_scaleRaf) return;
  _scaleRaf = requestAnimationFrame(() => { updateScale(); _scaleRaf = null; });
}, { passive: true });
updateScale();

/* ─── Estrelas: canvas leve em vez de 120 divs DOM ─── */
function createStarsBg(container) {
  if (!container) return;
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;';
  container.appendChild(canvas);

  function draw() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < 100; i++) {
      const x  = Math.random() * canvas.width;
      const y  = Math.random() * canvas.height;
      const r  = Math.random() * 1.2 + 0.3;
      const op = Math.random() * 0.5 + 0.1;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${op})`;
      ctx.fill();
    }
  }

  draw();
  window.addEventListener('resize', draw, { passive: true });
}

/* ─── Partículas de Coração Flutuante (pool reduzido) ─── */
function createFloatingHearts(container) {
  if (!container) return;
  const symbols = ['♥', '❤', '💜', '💚', '✦', '✧'];
  let activeCount = 0;
  const MAX_HEARTS = 8;

  function spawnHeart() {
    if (activeCount >= MAX_HEARTS) return;
    activeCount++;
    const el = document.createElement('span');
    el.className = 'heart-particle';
    el.textContent = symbols[Math.floor(Math.random() * symbols.length)];
    const left  = Math.random() * 100;
    const dur   = Math.random() * 8 + 10;
    const delay = Math.random() * 3;
    const size  = Math.random() * 0.8 + 0.6;
    const hue   = Math.random() > 0.5 ? 'var(--green)' : 'var(--purple)';
    el.style.cssText = `
      left:${left}%;
      animation-duration:${dur}s;
      animation-delay:${delay}s;
      font-size:calc(${size}rem * var(--scale));
      color:${hue};
      will-change:transform,opacity;
    `;
    container.appendChild(el);
    setTimeout(() => { el.remove(); activeCount--; }, (dur + delay) * 1000);
  }

  for (let i = 0; i < 5; i++) spawnHeart();
  setInterval(spawnHeart, 2500);
}

/* ─── Transição suave de página ─── */
function navigateTo(href) {
  document.body.style.opacity = '0';
  document.body.style.transition = 'opacity 0.4s ease';
  setTimeout(() => { window.location.href = href; }, 400);
}

/* ─── Inicialização Global ─── */
document.addEventListener('DOMContentLoaded', () => {
  document.body.classList.add('page-transition');
  document.body.style.opacity = '1';
  document.body.style.transition = 'opacity 0.4s ease';

  const starsBg = document.querySelector('.stars-bg');
  if (starsBg) createStarsBg(starsBg);

  const heartsContainer = document.querySelector('.hearts-container');
  if (heartsContainer) createFloatingHearts(heartsContainer);

  document.querySelectorAll('[data-nav]').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      navigateTo(link.dataset.nav);
    });
  });

  const currentPage = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href') || link.dataset.nav || '';
    if (href.includes(currentPage.replace('.html', ''))) {
      link.classList.add('active');
    }
  });
});

/* ─── Componente: Botão "Não" Fugitivo ─── */
function initFleeButton(buttonEl, hitboxRadius = 140) {
  if (!buttonEl) return;

  let btnX = 0, btnY = 0;
  let targetX = 0, targetY = 0;
  let rafId = null;
  let isPlaced = false;

  function getBounds() {
    const bw  = buttonEl.offsetWidth  || 120;
    const bh  = buttonEl.offsetHeight || 50;
    const pad = 16;
    return {
      minX: pad,
      minY: pad,
      maxX: window.innerWidth  - bw - pad,
      maxY: window.innerHeight - bh - pad,
    };
  }

  /* Posição inicial: ao lado direito do botão Sim */
  function placeInitial() {
    const simBtn = document.querySelector('.btn-sim');
    if (simBtn) {
      const rect = simBtn.getBoundingClientRect();
      const gap  = 16;
      btnX = targetX = rect.right + gap;
      btnY = targetY = rect.top + (rect.height / 2) - ((buttonEl.offsetHeight || 50) / 2);
    } else {
      btnX = targetX = window.innerWidth  / 2 + 80;
      btnY = targetY = window.innerHeight / 2;
    }
    applyPosition();
    isPlaced = true;
  }

  function applyPosition() {
    buttonEl.style.left = btnX + 'px';
    buttonEl.style.top  = btnY + 'px';
  }

  function onMouseMove(e) {
    if (!isPlaced) return;
    const mx = e.clientX;
    const my = e.clientY;
    const bw = buttonEl.offsetWidth;
    const bh = buttonEl.offsetHeight;
    const cx = btnX + bw / 2;
    const cy = btnY + bh / 2;
    const dx = cx - mx;
    const dy = cy - my;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < hitboxRadius) {
      const angle     = Math.atan2(dy, dx);
      const noise     = (Math.random() - 0.5) * 0.6;
      const fleeAngle = angle + noise;
      const force     = (hitboxRadius - dist) / hitboxRadius;
      const step      = 160 * force + 60;
      const bounds    = getBounds();
      let newX = btnX + Math.cos(fleeAngle) * step;
      let newY = btnY + Math.sin(fleeAngle) * step;
      const margin = 40;
      if (newX <= bounds.minX + margin) newY += (Math.random() > 0.5 ? 1 : -1) * step * 0.6;
      if (newX >= bounds.maxX - margin) newY += (Math.random() > 0.5 ? 1 : -1) * step * 0.6;
      if (newY <= bounds.minY + margin) newX += (Math.random() > 0.5 ? 1 : -1) * step * 0.6;
      if (newY >= bounds.maxY - margin) newX += (Math.random() > 0.5 ? 1 : -1) * step * 0.6;
      targetX = Math.max(bounds.minX, Math.min(bounds.maxX, newX));
      targetY = Math.max(bounds.minY, Math.min(bounds.maxY, newY));
    }
  }

  function animate() {
    btnX += (targetX - btnX) * 0.15;
    btnY += (targetY - btnY) * 0.15;
    applyPosition();
    rafId = requestAnimationFrame(animate);
  }

  function onTouchMove(e) {
    const t = e.touches[0];
    onMouseMove({ clientX: t.clientX, clientY: t.clientY });
  }

  buttonEl.style.position   = 'fixed';
  buttonEl.style.zIndex     = '200';
  buttonEl.style.transition = 'none';
  buttonEl.style.willChange = 'left, top';

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      placeInitial();
      rafId = requestAnimationFrame(animate);
    });
  });

  window.addEventListener('mousemove', onMouseMove, { passive: true });
  window.addEventListener('touchmove', onTouchMove, { passive: true });
  window.addEventListener('resize', () => {
    const bounds = getBounds();
    targetX = Math.max(bounds.minX, Math.min(bounds.maxX, targetX));
    targetY = Math.max(bounds.minY, Math.min(bounds.maxY, targetY));
  });

  buttonEl._fleeCleanup = () => {
    cancelAnimationFrame(rafId);
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('touchmove', onTouchMove);
  };
}

/* ─── Utilitário: Formata número ─── */
function fmtNum(n, dec = 1) {
  return Number(n).toFixed(dec).replace('.', ',');
}

/* ─── IMC ─── */
function calcIMC(weightKg, heightM) {
  return weightKg / (heightM * heightM);
}

function imcCategory(imc) {
  if (imc < 18.5) return { label: 'Abaixo do peso', pill: 'pill-yellow', note: 'Pode indicar alimentação insuficiente ou alto metabolismo.' };
  if (imc < 25)   return { label: 'Peso adequado',  pill: 'pill-green',  note: 'Faixa associada a menor risco cardiovascular na maioria dos estudos.' };
  if (imc < 30)   return { label: 'Sobrepeso',      pill: 'pill-orange', note: 'Atenção: o IMC não diferencia gordura de massa muscular — atletas frequentemente se enquadram aqui.' };
  if (imc < 35)   return { label: 'Obesidade I',    pill: 'pill-orange', note: 'Considere avaliar composição corporal com um profissional de saúde.' };
  if (imc < 40)   return { label: 'Obesidade II',   pill: 'pill-red',    note: 'Recomenda-se acompanhamento médico e nutricional.' };
  return           { label: 'Obesidade III',  pill: 'pill-red',    note: 'Recomenda-se acompanhamento médico especializado.' };
}

/* ─── Percentual de Gordura (método Marinha EUA) ─── */
function calcBodyFat(heightCm, waistCm, neckCm, sex, hipCm) {
  const h = heightCm, w = waistCm, n = neckCm;
  if (sex === 'M') {
    const val = 495 / (1.0324 - 0.19077 * Math.log10(w - n) + 0.15456 * Math.log10(h)) - 450;
    return Math.max(3, Math.min(val, 60));
  } else {
    const hip = hipCm || (waistCm + 15);
    const val = 495 / (1.29579 - 0.35004 * Math.log10(w + hip - n) + 0.22100 * Math.log10(h)) - 450;
    return Math.max(10, Math.min(val, 65));
  }
}

function bodyFatCategory(pct, sex) {
  if (sex === 'M') {
    if (pct <  6)  return { label: 'Atlético essencial', pill: 'pill-yellow' };
    if (pct < 14)  return { label: 'Atlético',           pill: 'pill-green'  };
    if (pct < 18)  return { label: 'Boa forma',          pill: 'pill-green'  };
    if (pct < 25)  return { label: 'Aceitável',          pill: 'pill-yellow' };
    return                 { label: 'Alto',               pill: 'pill-orange' };
  } else {
    if (pct < 14)  return { label: 'Atlético essencial', pill: 'pill-yellow' };
    if (pct < 21)  return { label: 'Atlético',           pill: 'pill-green'  };
    if (pct < 25)  return { label: 'Boa forma',          pill: 'pill-green'  };
    if (pct < 32)  return { label: 'Aceitável',          pill: 'pill-yellow' };
    return                 { label: 'Alto',               pill: 'pill-orange' };
  }
}

/* ─── TMB (Mifflin–St Jeor) ─── */
function calcTMB(weightKg, heightCm, age, sex) {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === 'M' ? base + 5 : base - 161;
}

/* ─── Calorias por atividade (estimativa por 30 min) ─── */
function calcActivityCalories(weightKg, activities) {
  const METS = {
    'Caminhada (5 km/h)': 3.5,
    'Corrida leve (8 km/h)': 8.0,
    'Flexões':   3.8,
    'Agachamentos': 3.5,
    'Abdominais': 4.0,
    'Ciclismo moderado': 6.0,
    'Natação':   7.0,
  };
  return activities.map(name => ({
    name,
    kcal: Math.round(METS[name] * weightKg * 0.5),
  }));
}
