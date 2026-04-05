/* =====================================================
   main.js – Core website logic
   Soil Pollution India — CHE110 College Project
   ===================================================== */

'use strict';

// ── Global State ──────────────────────────────────────
let soilData = null;
let charts   = {};

// ── Init on DOM Ready ─────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  initNavbar();
  initMobileMenu();
  initScrollReveal();
  initCounters();
  new ParticleSystem('particles-canvas');
  initStatsBanner();

  // Use inlined data (no fetch needed — works on file://)
  soilData = INDIA_SOIL_DATA;
  initContaminantBars();
  initIndiaMap();
  initChartTabs();
  buildAllCharts();
  initCaseStudies();
  buildFoodSafetyChart();
  buildRemediationChart();
  buildPolicyTimeline();
  buildResourcesGrid();

  // Live API data
  fetchWorldBankData();
});

// ── Navbar ────────────────────────────────────────────
function initNavbar() {
  const nav  = document.getElementById('navbar');
  const links = document.querySelectorAll('.nav-links a');

  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 30);
    updateActiveLink();
  });

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        closeMobileMenu();
      }
    });
  });
}

function updateActiveLink() {
  const sections = document.querySelectorAll('section[id]');
  const scrollY  = window.scrollY + 100;
  sections.forEach(sec => {
    const top    = sec.offsetTop;
    const height = sec.offsetHeight;
    const id     = sec.getAttribute('id');
    const link   = document.querySelector(`.nav-links a[href="#${id}"]`);
    if (link) link.classList.toggle('active', scrollY >= top && scrollY < top + height);
  });
}

// ── Mobile Menu ───────────────────────────────────────
function initMobileMenu() {
  const burger = document.getElementById('hamburger');
  const menu   = document.getElementById('mobile-menu');
  const close  = document.getElementById('close-menu');
  if (burger) burger.addEventListener('click', () => menu.classList.add('open'));
  if (close)  close.addEventListener('click', closeMobileMenu);
}
function closeMobileMenu() {
  const menu = document.getElementById('mobile-menu');
  if (menu) menu.classList.remove('open');
}

// ── Scroll Reveal ─────────────────────────────────────
function initScrollReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -60px 0px' });

  document.querySelectorAll('.reveal, .reveal-left, .reveal-right')
    .forEach(el => observer.observe(el));
}

// ── Animated Counters ─────────────────────────────────
function initCounters() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('[data-count]').forEach(el => observer.observe(el));
}

function animateCounter(el) {
  const target   = parseFloat(el.dataset.count);
  const suffix   = el.dataset.suffix || '';
  const prefix   = el.dataset.prefix || '';
  const decimals = el.dataset.decimals ? parseInt(el.dataset.decimals) : 0;
  const duration = 2000;
  const start    = performance.now();

  function update(now) {
    const elapsed  = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const ease     = 1 - Math.pow(1 - progress, 3);
    const val      = target * ease;
    el.textContent = prefix + val.toFixed(decimals) + suffix;
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

// ── Stats Banner (Marquee) ────────────────────────────
function initStatsBanner() {
  const stats = [
    { icon: '☣️', num: '1.46', suffix: ' Mha', label: 'Contaminated Farmland' },
    { icon: '⚗️', num: '62,000', suffix: ' MT', label: 'Pesticides Used (2023)' },
    { icon: '🌾', num: '15', suffix: '%', label: 'Avg Crop Yield Loss' },
    { icon: '🔬', num: '3,947', suffix: '', label: 'Heavy-Metal Sites' },
    { icon: '💧', num: '153', suffix: '', label: 'Arsenic-Hit Districts' },
    { icon: '👨‍🌾', num: '120', suffix: 'M+', label: 'Affected Farmers' },
    { icon: '🧪', num: '45', suffix: ' µg/L', label: 'Avg Arsenic (W. Bengal)' },
    { icon: '📉', num: '55', suffix: '/100', label: 'Soil Health Index 2023' },
    { icon: '🏭', num: '61', suffix: 'M MT', label: 'Fertilizer Use/Year' },
    { icon: '🌿', num: '72', suffix: '%', label: 'Phytoremediation Efficacy' },
  ];

  const track = document.getElementById('stats-track');
  if (!track) return;

  // Duplicate for seamless marquee
  const html = [...stats, ...stats].map(s => `
    <div class="stat-item">
      <span class="stat-icon">${s.icon}</span>
      <div>
        <div class="stat-num">${s.num}${s.suffix}</div>
        <div class="stat-label">${s.label}</div>
      </div>
    </div>`).join('');
  track.innerHTML = html;
}

// ── Contaminant Progress Bars ─────────────────────────
function initContaminantBars() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.querySelectorAll('.progress-fill').forEach(bar => {
          bar.style.width = bar.dataset.width + '%';
        });
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });

  document.querySelectorAll('.contaminant-card').forEach(el => observer.observe(el));
}

// ── India SVG Map ─────────────────────────────────────
function initIndiaMap() {
  if (!soilData) return;
  const mapContainer = document.getElementById('india-map-chart');
  if (!mapContainer) return;

  // We'll render a bar-based state comparison using Chart.js
  const states = soilData.stateContaminationLevels;
  const labels = states.map(s => s.state);
  const vals   = states.map(s => s.overallRisk);

  // Color by risk level
  const colors = vals.map(v =>
    v >= 80 ? 'rgba(220,38,38,0.8)'   :
    v >= 70 ? 'rgba(249,115,22,0.8)'  :
    v >= 60 ? 'rgba(234,179,8,0.8)'   :
              'rgba(134,163,64,0.8)'
  );

  charts.map = new Chart(mapContainer, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Overall Pollution Risk Index',
        data: vals,
        backgroundColor: colors,
        borderColor: colors.map(c => c.replace('0.8', '1')),
        borderWidth: 1,
        borderRadius: 6,
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => {
              const s = states[ctx.dataIndex];
              return [
                ` Risk Index: ${s.overallRisk}/100`,
                ` Main: ${s.mainPollutant}`,
                ` Heavy Metal: ${s.heavyMetal} | Pesticide: ${s.pesticide} | Nitrate: ${s.nitrate}`
              ];
            }
          },
          backgroundColor: 'rgba(15,20,18,0.95)',
          borderColor: 'rgba(134,163,64,0.2)',
          borderWidth: 1, padding: 12,
          titleColor: '#e8eed6', bodyColor: '#8a9a72',
        }
      },
      scales: {
        x: {
          max: 100,
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: { color: '#8a9a72', font: { size: 11 } },
          border: { color: 'rgba(255,255,255,0.06)' }
        },
        y: {
          grid: { display: false },
          ticks: { color: '#e8eed6', font: { size: 11 } },
          border: { color: 'rgba(255,255,255,0.06)' }
        }
      }
    }
  });

  // Setup state click info
  setupStateInfo(states);
}

function setupStateInfo(states) {
  const infoBox = document.getElementById('state-detail');
  if (!infoBox) return;

  // Default state
  showStateDetail(states[0], infoBox);

  // Listen for chart click
  const mapCanvas = document.getElementById('india-map-chart');
  if (mapCanvas) {
    mapCanvas.addEventListener('click', (evt) => {
      const points = charts.map.getElementsAtEventForMode(evt, 'nearest', { intersect: true }, true);
      if (points.length) {
        const idx = points[0].index;
        showStateDetail(states[idx], infoBox);
      }
    });
  }
}

function showStateDetail(s, box) {
  const riskColor = s.overallRisk >= 80 ? '#f87171' : s.overallRisk >= 70 ? '#fbbf24' : s.overallRisk >= 60 ? '#eab308' : '#86a340';
  box.innerHTML = `
    <div class="state-name" style="font-size:1.2rem;font-weight:700;margin-bottom:4px">${s.state}</div>
    <div style="margin-bottom:14px">
      <span class="state-risk-badge" style="background:${riskColor}22;color:${riskColor};border:1px solid ${riskColor}44;padding:3px 10px;border-radius:20px;font-size:0.7rem;font-weight:600">
        RISK ${s.overallRisk}/100
      </span>
    </div>
    <div style="font-size:0.8rem;color:#8a9a72;margin-bottom:4px">Main Pollutants</div>
    <div style="font-size:0.88rem;color:#e8eed6;margin-bottom:16px">${s.mainPollutant}</div>
    <div class="state-metrics">
      <div class="state-metric"><div class="sm-val" style="color:#ef4444">${s.heavyMetal}</div><div class="sm-label">Heavy Metal</div></div>
      <div class="state-metric"><div class="sm-val" style="color:#f97316">${s.pesticide}</div><div class="sm-label">Pesticide</div></div>
      <div class="state-metric"><div class="sm-val" style="color:#eab308">${s.nitrate}</div><div class="sm-label">Nitrate</div></div>
      <div class="state-metric"><div class="sm-val" style="color:${riskColor}">${s.overallRisk}</div><div class="sm-label">Overall</div></div>
    </div>
  `;
}

// ── Chart Tabs ────────────────────────────────────────
function initChartTabs() {
  document.querySelectorAll('.chart-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const pane = tab.dataset.tab;
      document.querySelectorAll('.chart-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.chart-pane').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById('pane-' + pane)?.classList.add('active');
    });
  });
}

// ── Build All Charts ──────────────────────────────────
function buildAllCharts() {
  if (!soilData) return;
  buildHeavyMetalTrendChart();
  buildPesticideChart();
  buildCropYieldChart();
  buildFertilizerChart();
}

const CHART_DEFAULTS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: {
        color: '#8a9a72', font: { size: 11 },
        boxWidth: 12, boxHeight: 12, borderRadius: 4,
        usePointStyle: true, pointStyle: 'circle'
      }
    },
    tooltip: {
      backgroundColor: 'rgba(15,20,18,0.95)',
      borderColor: 'rgba(134,163,64,0.2)', borderWidth: 1,
      padding: 12, titleColor: '#e8eed6', bodyColor: '#8a9a72',
    }
  },
  scales: {
    x: {
      grid: { color: 'rgba(255,255,255,0.04)' },
      ticks: { color: '#8a9a72', font: { size: 11 } },
      border: { color: 'rgba(255,255,255,0.06)' }
    },
    y: {
      grid: { color: 'rgba(255,255,255,0.04)' },
      ticks: { color: '#8a9a72', font: { size: 11 } },
      border: { color: 'rgba(255,255,255,0.06)' }
    }
  }
};

function buildHeavyMetalTrendChart() {
  const ctx = document.getElementById('chart-heavy-metals');
  if (!ctx) return;
  const d = soilData.heavyMetalsTrend;

  charts.heavyMetals = new Chart(ctx, {
    type: 'line',
    data: {
      labels: d.years,
      datasets: [
        { label: 'Arsenic (µg/kg)', data: d.arsenic_ppb, borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.08)', tension: 0.4, fill: true, pointRadius: 4, pointHoverRadius: 7 },
        { label: 'Lead (mg/kg)',    data: d.lead_ppm,    borderColor: '#f97316', backgroundColor: 'rgba(249,115,22,0.06)', tension: 0.4, fill: false, pointRadius: 4, pointHoverRadius: 7 },
        { label: 'Chromium (mg/kg)',data: d.chromium_ppm,borderColor: '#a855f7', backgroundColor: 'rgba(168,85,247,0.06)', tension: 0.4, fill: false, pointRadius: 4, pointHoverRadius: 7 },
        { label: 'Cadmium (mg/kg)', data: d.cadmium_ppm, borderColor: '#eab308', backgroundColor: 'rgba(234,179,8,0.06)',  tension: 0.4, fill: false, yAxisID: 'y1', pointRadius: 4, pointHoverRadius: 7 },
      ]
    },
    options: {
      ...CHART_DEFAULTS,
      scales: {
        ...CHART_DEFAULTS.scales,
        y:  { ...CHART_DEFAULTS.scales.y, title: { display: true, text: 'Concentration (µg/kg or mg/kg)', color: '#8a9a72', font: { size: 10 } } },
        y1: { position: 'right', grid: { display: false }, ticks: { color: '#8a9a72', font: { size: 10 } }, title: { display: true, text: 'Cadmium (mg/kg)', color: '#8a9a72', font: { size: 10 } }, border: { color: 'rgba(255,255,255,0.04)' } }
      }
    }
  });
}

function buildPesticideChart() {
  const ctx = document.getElementById('chart-pesticides');
  if (!ctx) return;
  const d = soilData.pesticideUseTrend;

  charts.pesticides = new Chart(ctx, {
    type: 'line',
    data: {
      labels: d.years,
      datasets: [
        { label: 'Total Technical Grade (MT)', data: d.technicalGradeMT, borderColor: '#86a340', backgroundColor: 'rgba(134,163,64,0.1)', tension: 0.4, fill: true, pointRadius: 4, pointHoverRadius: 7 },
        { label: 'Organochlorines',  data: d.organochlorines,  borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.06)', tension: 0.4, fill: false, pointRadius: 4 },
        { label: 'Organophosphates', data: d.organophosphates, borderColor: '#f97316', backgroundColor: 'rgba(249,115,22,0.06)', tension: 0.4, fill: false, pointRadius: 4 },
        { label: 'Pyrethroids',      data: d.pyrethroids,      borderColor: '#06b6d4', backgroundColor: 'rgba(6,182,212,0.06)',  tension: 0.4, fill: false, pointRadius: 4 },
        { label: 'Herbicides',       data: d.herbicides,       borderColor: '#c9a84c', backgroundColor: 'rgba(201,168,76,0.06)', tension: 0.4, fill: false, pointRadius: 4 },
      ]
    },
    options: {
      ...CHART_DEFAULTS,
      scales: { ...CHART_DEFAULTS.scales, y: { ...CHART_DEFAULTS.scales.y, title: { display: true, text: 'Metric Tonnes (MT)', color: '#8a9a72', font: { size: 10 } } } }
    }
  });
}

function buildCropYieldChart() {
  const ctx = document.getElementById('chart-yield');
  if (!ctx) return;
  const d = soilData.cropYieldVsPollution;

  charts.yield = new Chart(ctx, {
    type: 'line',
    data: {
      labels: d.years,
      datasets: [
        { label: 'Wheat Yield (kg/ha)', data: d.wheatYield_kg_ha, borderColor: '#c9a84c', fill: false, tension: 0.4, yAxisID: 'y', pointRadius: 4, pointHoverRadius: 7 },
        { label: 'Rice Yield (kg/ha)',  data: d.riceYield_kg_ha,  borderColor: '#86a340', fill: false, tension: 0.4, yAxisID: 'y', pointRadius: 4, pointHoverRadius: 7 },
        { label: 'Soil Health Index',   data: d.soilHealthIndex,  borderColor: '#4ade80', fill: false, tension: 0.4, yAxisID: 'y1', pointRadius: 4, borderDash: [5,4] },
        { label: 'Pollution Index',     data: d.pollutionIndexEstimate, borderColor: '#ef4444', fill: false, tension: 0.4, yAxisID: 'y1', pointRadius: 4, borderDash: [5,4] },
      ]
    },
    options: {
      ...CHART_DEFAULTS,
      scales: {
        ...CHART_DEFAULTS.scales,
        y:  { ...CHART_DEFAULTS.scales.y, title: { display: true, text: 'Yield (kg/ha)', color: '#8a9a72', font: { size: 10 } } },
        y1: { position: 'right', grid: { display: false }, ticks: { color: '#8a9a72', font: { size: 10 } }, title: { display: true, text: 'Index (0–100)', color: '#8a9a72', font: { size: 10 } }, border: { color: 'rgba(255,255,255,0.04)' } }
      }
    }
  });
}

function buildFertilizerChart() {
  const ctx = document.getElementById('chart-fertilizer');
  if (!ctx) return;
  const d = soilData.fertilizerConsumption;

  charts.fertilizer = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: d.years,
      datasets: [
        { label: 'Nitrogen (kg/ha)',   data: d.nitrogen_kg_ha,   backgroundColor: 'rgba(239,68,68,0.75)',   borderRadius: 4 },
        { label: 'Phosphorus (kg/ha)', data: d.phosphorus_kg_ha, backgroundColor: 'rgba(249,115,22,0.75)',  borderRadius: 4 },
        { label: 'Potassium (kg/ha)',  data: d.potassium_kg_ha,  backgroundColor: 'rgba(134,163,64,0.75)', borderRadius: 4 },
      ]
    },
    options: {
      ...CHART_DEFAULTS,
      plugins: { ...CHART_DEFAULTS.plugins },
    }
  });
}

// ── Case Studies ──────────────────────────────────────
function initCaseStudies() {
  if (!soilData) return;
  const grid = document.getElementById('cases-grid');
  if (!grid) return;

  grid.innerHTML = soilData.casestudies.map((c, i) => `
    <div class="card case-card ${c.severity} reveal reveal-delay-${(i % 3) + 1}">
      <div class="case-number">${String(i + 1).padStart(2,'0')}</div>
      <div class="case-header">
        <div>
          <div class="case-title">${c.title}</div>
          <div class="case-region">📍 ${c.region} &nbsp;·&nbsp; ${c.year}</div>
        </div>
        <span class="severity-badge ${c.severity}">${c.severity}</span>
      </div>
      <div class="pollutant-pills">
        ${c.pollutants.map(p => `<span class="pollutant-pill">${p}</span>`).join('')}
      </div>
      <p class="case-desc">${c.impact}</p>
      <div class="case-keyfact">
        <span class="kf-icon">⚠️</span>
        <span>${c.keyFact}</span>
      </div>
    </div>
  `).join('');
  initScrollReveal();
}

// ── Food Safety Chart ─────────────────────────────────
function buildFoodSafetyChart() {
  if (!soilData) return;
  const ctx = document.getElementById('chart-food-safety');
  if (!ctx) return;
  const d = soilData.contaminantFoodSafety;

  charts.foodSafety = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: d.foodItems,
      datasets: [
        { label: 'Arsenic Exceedance (%)',   data: d.arsenicExceedance_percent,   backgroundColor: 'rgba(239,68,68,0.75)',   borderRadius: 4 },
        { label: 'Lead Exceedance (%)',      data: d.leadExceedance_percent,      backgroundColor: 'rgba(249,115,22,0.75)',  borderRadius: 4 },
        { label: 'Cadmium Exceedance (%)',   data: d.cadmiumExceedance_percent,   backgroundColor: 'rgba(168,85,247,0.75)', borderRadius: 4 },
        { label: 'Pesticide Residues (%)',   data: d.pesticideResidues_percent,   backgroundColor: 'rgba(201,168,76,0.75)', borderRadius: 4 },
      ]
    },
    options: {
      ...CHART_DEFAULTS,
      scales: { ...CHART_DEFAULTS.scales, y: { ...CHART_DEFAULTS.scales.y, max: 60, title: { display: true, text: '% samples exceeding FSSAI limit', color: '#8a9a72', font: { size: 10 } } } }
    }
  });
}

// ── Remediation Chart ─────────────────────────────────
function buildRemediationChart() {
  if (!soilData) return;
  const ctx = document.getElementById('chart-remediation');
  if (!ctx) return;
  const d = soilData.remediationTechniques;

  charts.remediation = new Chart(ctx, {
    type: 'radar',
    data: {
      labels: d.map(t => t.technique),
      datasets: [
        {
          label: 'Effectiveness (%)', data: d.map(t => t.effectiveness),
          backgroundColor: 'rgba(134,163,64,0.15)', borderColor: '#86a340',
          pointBackgroundColor: '#86a340', pointRadius: 5,
        },
        {
          label: 'Cost Index (inverted)', data: d.map(t => 100 - t.costIndex),
          backgroundColor: 'rgba(201,168,76,0.1)', borderColor: '#c9a84c',
          pointBackgroundColor: '#c9a84c', pointRadius: 5,
        }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { labels: { color: '#8a9a72', font: { size: 11 }, usePointStyle: true } },
        tooltip: { backgroundColor: 'rgba(15,20,18,0.95)', borderColor: 'rgba(134,163,64,0.2)', borderWidth: 1, padding: 12, titleColor: '#e8eed6', bodyColor: '#8a9a72' }
      },
      scales: {
        r: {
          backgroundColor: 'rgba(255,255,255,0.01)',
          grid: { color: 'rgba(255,255,255,0.06)' },
          angleLines: { color: 'rgba(255,255,255,0.06)' },
          ticks: { color: '#8a9a72', backdropColor: 'transparent', font: { size: 9 } },
          pointLabels: { color: '#8a9a72', font: { size: 10 } }
        }
      }
    }
  });
}

// ── Policy Timeline ───────────────────────────────────
function buildPolicyTimeline() {
  if (!soilData) return;
  const wrap = document.getElementById('timeline-wrap');
  if (!wrap) return;

  wrap.innerHTML = soilData.policyTimeline.map((item, i) => `
    <div class="timeline-item reveal delay-${i % 3}">
      ${i % 2 === 0 ? `
        <div class="tl-content">
          <div class="tl-year">${item.year}</div>
          <div class="tl-event">${item.event}</div>
          <div class="tl-type">${item.type}</div>
        </div>
        <div class="tl-dot ${item.type}"></div>
        <div class="tl-empty"></div>
      ` : `
        <div class="tl-empty"></div>
        <div class="tl-dot ${item.type}"></div>
        <div class="tl-content">
          <div class="tl-year">${item.year}</div>
          <div class="tl-event">${item.event}</div>
          <div class="tl-type">${item.type}</div>
        </div>
      `}
    </div>
  `).join('');
  initScrollReveal();
}

// ── Resources Grid ────────────────────────────────────
function buildResourcesGrid() {
  const resources = [
    { icon: '🏛️', title: 'CPCB India', desc: 'Central Pollution Control Board – official pollution data, standards & regulations.', url: 'https://cpcb.nic.in', tag: 'Government' },
    { icon: '🌾', title: 'ICAR Soil Science', desc: 'Indian Council of Agricultural Research – soil health, fertilizer recommendations.', url: 'https://icar.org.in', tag: 'Research' },
    { icon: '🌍', title: 'FAO FAOSTAT', desc: 'UN Food & Agriculture Organization – agriculture production data for India.', url: 'https://www.fao.org/faostat', tag: 'UN Data' },
    { icon: '📊', title: 'World Bank Open Data', desc: 'Free access to global development data including Indian agriculture indicators.', url: 'https://data.worldbank.org/country/india', tag: 'API' },
    { icon: '🔬', title: 'NEERI Nagpur', desc: 'National Environmental Engineering Research Institute – soil & water pollution studies.', url: 'https://www.neeri.res.in', tag: 'Research' },
    { icon: '📋', title: 'Ministry of Agriculture', desc: 'Soil Health Card scheme data, fertilizer subsidies & crop statistics.', url: 'https://soilhealth.dac.gov.in', tag: 'Government' },
    { icon: '⚗️', title: 'GEMS/Food WHO', desc: 'WHO global food contamination monitoring data & standards database.', url: 'https://www.who.int/health-topics/food-safety', tag: 'WHO' },
    { icon: '🗺️', title: 'SoilGrids ISRIC', desc: 'Global gridded soil information including pH, organic carbon, & properties.', url: 'https://soilgrids.org', tag: 'Science' },
  ];

  const grid = document.getElementById('resources-grid');
  if (!grid) return;

  grid.innerHTML = resources.map((r, i) => `
    <div class="card resource-card reveal reveal-delay-${(i % 4) + 1}" onclick="window.open('${r.url}','_blank')">
      <div class="resource-icon">${r.icon}</div>
      <div class="tag teal" style="margin-bottom:10px">${r.tag}</div>
      <h3>${r.title}</h3>
      <p>${r.desc}</p>
      <div class="resource-link">Visit Resource →</div>
    </div>
  `).join('');
  initScrollReveal();
}

// ── World Bank Live API ───────────────────────────────
async function fetchWorldBankData() {
  const indicators = [
    { id: 'AG.CON.FERT.ZS',   label: 'Fertilizer Consumption',  unit: '% of production', elementId: 'wb-fertilizer',  color: '#ef4444' },
    { id: 'AG.YLD.CREL.KG',   label: 'Cereal Yield',            unit: 'kg / ha',          elementId: 'wb-yield',      color: '#86a340' },
    { id: 'AG.LND.ARBL.ZS',   label: 'Arable Land',             unit: '% of land area',   elementId: 'wb-arable',     color: '#c9a84c' },
    { id: 'SH.STA.MALN.ZS',   label: 'Malnutrition Prevalence', unit: '% under 5',        elementId: 'wb-malnutrition',color: '#f97316' },
  ];

  for (const ind of indicators) {
    updateApiWidget(ind.elementId, 'loading');
    try {
      const url = `https://api.worldbank.org/v2/country/IN/indicator/${ind.id}?format=json&per_page=30&mrv=20`;
      const res  = await fetch(url);
      const json = await res.json();
      const data = json[1]?.filter(d => d.value !== null) || [];
      if (data.length > 0) {
        renderApiWidget(ind.elementId, ind.label, ind.unit, data, ind.color);
      } else {
        updateApiWidget(ind.elementId, 'no-data');
      }
    } catch(e) {
      updateApiWidget(ind.elementId, 'error');
    }
  }
}

function updateApiWidget(id, status) {
  const el = document.getElementById(id);
  if (!el) return;
  if (status === 'loading') {
    el.innerHTML = `<div class="api-loading"><div class="spinner"></div> Fetching from World Bank API…</div>`;
  } else if (status === 'error') {
    el.innerHTML = `<div style="color:#f87171;font-size:0.82rem">⚠ API unavailable — check network connection</div>`;
  } else if (status === 'no-data') {
    el.innerHTML = `<div style="color:#8a9a72;font-size:0.82rem">No data available for this indicator.</div>`;
  }
}

function renderApiWidget(elementId, label, unit, data, color) {
  const el = document.getElementById(elementId);
  if (!el) return;

  const sorted    = [...data].sort((a, b) => a.date - b.date);
  const latest    = sorted[sorted.length - 1];
  const prev      = sorted[sorted.length - 2];
  const delta     = prev ? ((latest.value - prev.value) / prev.value * 100).toFixed(1) : null;
  const deltaDir  = delta > 0 ? '▲' : '▼';
  const deltaColor= delta > 0 ? '#f87171' : '#4ade80';

  el.innerHTML = `
    <div class="flex-between" style="margin-bottom:12px">
      <div>
        <div style="font-size:1.8rem;font-weight:700;font-family:'JetBrains Mono',monospace;color:${color}">${latest.value?.toFixed(1) ?? 'N/A'}</div>
        <div style="font-size:0.75rem;color:#8a9a72">${unit} &nbsp;·&nbsp; ${latest.date}</div>
      </div>
      ${delta !== null ? `<div style="font-size:0.85rem;font-weight:600;color:${deltaColor}">${deltaDir} ${Math.abs(delta)}%<br><span style="font-size:0.7rem;color:#4a5740">vs prev year</span></div>` : ''}
    </div>
    <div id="${elementId}-chart-wrap" style="position:relative;height:80px"></div>
    <div class="api-status-badge live" style="margin-top:10px">● Live World Bank API</div>
  `;

  // Mini sparkline
  const wrap = document.getElementById(`${elementId}-chart-wrap`);
  const miniCanvas = document.createElement('canvas');
  miniCanvas.id = `${elementId}-chart`;
  wrap.appendChild(miniCanvas);

  new Chart(miniCanvas, {
    type: 'line',
    data: {
      labels: sorted.map(d => d.date),
      datasets: [{ data: sorted.map(d => d.value), borderColor: color, backgroundColor: color + '15', fill: true, tension: 0.4, pointRadius: 0, borderWidth: 2 }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { enabled: false } },
      scales: { x: { display: false }, y: { display: false } },
      animation: { duration: 1000, easing: 'easeInOutQuart' }
    }
  });
}
