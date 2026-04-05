/* =====================================================
   dashboard.js — Full Dashboard Charts + Live API
   MrittikaWatch · CHE110 · LPU
   ===================================================== */

'use strict';

let soilData = null;

const CHART_OPTS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: { color: '#8a9a72', font: { size: 11 }, boxWidth: 12, usePointStyle: true, pointStyle: 'circle' }
    },
    tooltip: {
      backgroundColor: 'rgba(15,20,18,0.96)',
      borderColor: 'rgba(134,163,64,0.2)', borderWidth: 1,
      padding: 12, titleColor: '#e8eed6', bodyColor: '#8a9a72',
    }
  },
  scales: {
    x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#8a9a72', font: { size: 11 } }, border: { color: 'rgba(255,255,255,0.06)' } },
    y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#8a9a72', font: { size: 11 } }, border: { color: 'rgba(255,255,255,0.06)' } }
  }
};

// ── Init ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  // Navbar scroll
  const nav = document.getElementById('navbar');
  window.addEventListener('scroll', () => nav?.classList.toggle('scrolled', window.scrollY > 20));

  // Animated counters
  initCounters();

  // Use inlined data — no fetch needed (works on file://)
  soilData = INDIA_SOIL_DATA;
  buildDashboardCharts();

  // Live API
  refreshWorldBank();
});

function initCounters() {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { animateCounter(e.target); observer.unobserve(e.target); } });
  }, { threshold: 0.5 });
  document.querySelectorAll('[data-count]').forEach(el => observer.observe(el));
}

function animateCounter(el) {
  const target = parseFloat(el.dataset.count);
  const suffix = el.dataset.suffix || '';
  const decimals = el.dataset.decimals ? parseInt(el.dataset.decimals) : 0;
  const duration = 1800;
  const start = performance.now();
  const update = now => {
    const p = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - p, 3);
    el.textContent = (target * ease).toFixed(decimals) + suffix;
    if (p < 1) requestAnimationFrame(update);
  };
  requestAnimationFrame(update);
}

// ── Build All Charts ──────────────────────────────────
function buildDashboardCharts() {
  if (!soilData) return;
  buildHeavyMetals();
  buildPesticides();
  buildYield();
  buildFertilizer();
  buildStateRisk();
  buildStateRadar();
  buildFood();
  buildRemediationRadar();
  buildRemediationScatter();
}

// ── Heavy Metals ──────────────────────────────────────
function buildHeavyMetals() {
  const ctx = document.getElementById('d-heavy-metals');
  if (!ctx) return;
  const d = soilData.heavyMetalsTrend;
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: d.years,
      datasets: [
        { label: 'Arsenic (µg/kg)', data: d.arsenic_ppb, borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.08)', tension: 0.4, fill: true, pointRadius: 3, pointHoverRadius: 6 },
        { label: 'Lead (mg/kg)',     data: d.lead_ppm,    borderColor: '#f97316', tension: 0.4, fill: false, pointRadius: 3 },
        { label: 'Chromium (mg/kg)',data: d.chromium_ppm, borderColor: '#a855f7', tension: 0.4, fill: false, pointRadius: 3 },
        { label: 'Cadmium (mg/kg)', data: d.cadmium_ppm,  borderColor: '#eab308', tension: 0.4, fill: false, yAxisID: 'y1', pointRadius: 3 },
      ]
    },
    options: {
      ...CHART_OPTS,
      scales: {
        ...CHART_OPTS.scales,
        y:  { ...CHART_OPTS.scales.y, title: { display: true, text: 'Concentration', color: '#8a9a72', font: { size: 10 } } },
        y1: { position: 'right', grid: { display: false }, ticks: { color: '#8a9a72' }, title: { display: true, text: 'Cadmium', color: '#8a9a72', font: { size: 10 } }, border: { color: 'transparent' } }
      }
    }
  });
}

// ── Pesticides ────────────────────────────────────────
function buildPesticides() {
  const ctx = document.getElementById('d-pesticides');
  if (!ctx) return;
  const d = soilData.pesticideUseTrend;
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: d.years,
      datasets: [
        { label: 'Total (MT)',        data: d.technicalGradeMT, borderColor: '#86a340', backgroundColor: 'rgba(134,163,64,0.08)', tension: 0.4, fill: true, pointRadius: 3 },
        { label: 'Organochlorines',  data: d.organochlorines,  borderColor: '#ef4444', tension: 0.4, fill: false, pointRadius: 3 },
        { label: 'Herbicides',       data: d.herbicides,       borderColor: '#c9a84c', tension: 0.4, fill: false, pointRadius: 3 },
        { label: 'Pyrethroids',      data: d.pyrethroids,      borderColor: '#06b6d4', tension: 0.4, fill: false, pointRadius: 3 },
      ]
    },
    options: { ...CHART_OPTS }
  });
}

// ── Yield ─────────────────────────────────────────────
function buildYield() {
  const ctx = document.getElementById('d-yield');
  if (!ctx) return;
  const d = soilData.cropYieldVsPollution;
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: d.years,
      datasets: [
        { label: 'Wheat Yield (kg/ha)', data: d.wheatYield_kg_ha, borderColor: '#c9a84c', tension: 0.4, fill: false, yAxisID: 'y', pointRadius: 3 },
        { label: 'Rice Yield (kg/ha)',  data: d.riceYield_kg_ha,  borderColor: '#86a340', tension: 0.4, fill: false, yAxisID: 'y', pointRadius: 3 },
        { label: 'Soil Health Index',   data: d.soilHealthIndex,  borderColor: '#4ade80', tension: 0.4, fill: false, yAxisID: 'y1', borderDash: [6, 3], pointRadius: 3 },
        { label: 'Pollution Index',     data: d.pollutionIndexEstimate, borderColor: '#ef4444', tension: 0.4, fill: false, yAxisID: 'y1', borderDash: [6, 3], pointRadius: 3 },
      ]
    },
    options: {
      ...CHART_OPTS,
      scales: {
        ...CHART_OPTS.scales,
        y:  { ...CHART_OPTS.scales.y, title: { display: true, text: 'Yield (kg/ha)', color: '#8a9a72', font: { size: 10 } } },
        y1: { position: 'right', grid: { display: false }, ticks: { color: '#8a9a72' }, max: 100, min: 0, title: { display: true, text: 'Index', color: '#8a9a72', font: { size: 10 } }, border: { color: 'transparent' } }
      }
    }
  });
}

// ── Fertilizer ────────────────────────────────────────
function buildFertilizer() {
  const ctx = document.getElementById('d-fertilizer');
  if (!ctx) return;
  const d = soilData.fertilizerConsumption;
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: d.years,
      datasets: [
        { label: 'Nitrogen (kg/ha)',   data: d.nitrogen_kg_ha,   backgroundColor: 'rgba(239,68,68,0.75)',  borderRadius: 3 },
        { label: 'Phosphorus (kg/ha)', data: d.phosphorus_kg_ha, backgroundColor: 'rgba(249,115,22,0.75)', borderRadius: 3 },
        { label: 'Potassium (kg/ha)',  data: d.potassium_kg_ha,  backgroundColor: 'rgba(134,163,64,0.75)', borderRadius: 3 },
      ]
    },
    options: { ...CHART_OPTS }
  });
}

// ── State Risk Bar ────────────────────────────────────
function buildStateRisk() {
  const ctx = document.getElementById('d-state-risk');
  if (!ctx) return;
  const states = soilData.stateContaminationLevels;
  const sorted = [...states].sort((a, b) => b.overallRisk - a.overallRisk);
  const colors = sorted.map(s =>
    s.overallRisk >= 80 ? 'rgba(220,38,38,0.8)' :
    s.overallRisk >= 70 ? 'rgba(249,115,22,0.8)' :
    s.overallRisk >= 60 ? 'rgba(234,179,8,0.8)'  : 'rgba(134,163,64,0.8)'
  );
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: sorted.map(s => s.state),
      datasets: [{
        label: 'Overall Risk Index',
        data: sorted.map(s => s.overallRisk),
        backgroundColor: colors,
        borderRadius: 5,
      }]
    },
    options: {
      ...CHART_OPTS,
      indexAxis: 'y',
      plugins: {
        ...CHART_OPTS.plugins,
        tooltip: {
          ...CHART_OPTS.plugins.tooltip,
          callbacks: {
            label: ctx => {
              const s = sorted[ctx.dataIndex];
              return [` Risk: ${s.overallRisk}/100`, ` Main pollutant: ${s.mainPollutant}`];
            }
          }
        }
      }
    }
  });
}

// ── State Radar ───────────────────────────────────────
function buildStateRadar() {
  const ctx = document.getElementById('d-state-radar');
  if (!ctx) return;
  // Pick top 6 states by overall risk
  const top6 = [...soilData.stateContaminationLevels]
    .sort((a, b) => b.overallRisk - a.overallRisk)
    .slice(0, 6);

  const colors = [
    { border: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
    { border: '#f97316', bg: 'rgba(249,115,22,0.1)' },
    { border: '#eab308', bg: 'rgba(234,179,8,0.1)' },
    { border: '#a855f7', bg: 'rgba(168,85,247,0.1)' },
    { border: '#06b6d4', bg: 'rgba(6,182,212,0.1)' },
    { border: '#86a340', bg: 'rgba(134,163,64,0.1)' },
  ];

  new Chart(ctx, {
    type: 'radar',
    data: {
      labels: ['Heavy Metal', 'Pesticide', 'Nitrate', 'Overall Risk'],
      datasets: top6.map((s, i) => ({
        label: s.state,
        data: [s.heavyMetal, s.pesticide, s.nitrate, s.overallRisk],
        borderColor: colors[i].border,
        backgroundColor: colors[i].bg,
        pointBackgroundColor: colors[i].border,
        pointRadius: 4,
      }))
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: '#8a9a72', font: { size: 10 }, usePointStyle: true } },
        tooltip: CHART_OPTS.plugins.tooltip
      },
      scales: {
        r: {
          grid: { color: 'rgba(255,255,255,0.06)' },
          angleLines: { color: 'rgba(255,255,255,0.06)' },
          ticks: { color: '#8a9a72', backdropColor: 'transparent', font: { size: 10 } },
          pointLabels: { color: '#8a9a72', font: { size: 11 } },
          min: 0, max: 100,
        }
      }
    }
  });
}

// ── Food Safety ───────────────────────────────────────
function buildFood() {
  const ctx = document.getElementById('d-food');
  if (!ctx) return;
  const d = soilData.contaminantFoodSafety;
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: d.foodItems,
      datasets: [
        { label: 'Arsenic Exceedance %',   data: d.arsenicExceedance_percent,  backgroundColor: 'rgba(239,68,68,0.75)',  borderRadius: 4 },
        { label: 'Lead Exceedance %',      data: d.leadExceedance_percent,     backgroundColor: 'rgba(249,115,22,0.75)', borderRadius: 4 },
        { label: 'Cadmium Exceedance %',  data: d.cadmiumExceedance_percent,  backgroundColor: 'rgba(168,85,247,0.75)', borderRadius: 4 },
        { label: 'Pesticide Residues %',   data: d.pesticideResidues_percent,  backgroundColor: 'rgba(201,168,76,0.75)', borderRadius: 4 },
      ]
    },
    options: {
      ...CHART_OPTS,
      scales: {
        ...CHART_OPTS.scales,
        y: { ...CHART_OPTS.scales.y, max: 60, title: { display: true, text: '% samples above FSSAI limit', color: '#8a9a72', font: { size: 10 } } }
      }
    }
  });
}

// ── Remediation Radar ─────────────────────────────────
function buildRemediationRadar() {
  const ctx = document.getElementById('d-remediation-radar');
  if (!ctx) return;
  const d = soilData.remediationTechniques;
  new Chart(ctx, {
    type: 'radar',
    data: {
      labels: d.map(t => t.technique.split(' ')[0]), // Short labels
      datasets: [
        { label: 'Effectiveness (%)', data: d.map(t => t.effectiveness), borderColor: '#86a340', backgroundColor: 'rgba(134,163,64,0.12)', pointBackgroundColor: '#86a340', pointRadius: 5 },
        { label: 'Affordability (100−cost)', data: d.map(t => 100 - t.costIndex), borderColor: '#c9a84c', backgroundColor: 'rgba(201,168,76,0.08)', pointBackgroundColor: '#c9a84c', pointRadius: 5 },
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: '#8a9a72', font: { size: 11 }, usePointStyle: true } },
        tooltip: CHART_OPTS.plugins.tooltip
      },
      scales: {
        r: {
          grid: { color: 'rgba(255,255,255,0.06)' },
          angleLines: { color: 'rgba(255,255,255,0.06)' },
          ticks: { color: '#8a9a72', backdropColor: 'transparent', font: { size: 9 } },
          pointLabels: { color: '#8a9a72', font: { size: 10 } },
          min: 0, max: 100,
        }
      }
    }
  });
}

// ── Remediation Scatter ───────────────────────────────
function buildRemediationScatter() {
  const ctx = document.getElementById('d-remediation-scatter');
  if (!ctx) return;
  const d = soilData.remediationTechniques;

  const colors = ['#86a340', '#c9a84c', '#06b6d4', '#a855f7', '#ef4444', '#f97316', '#4ade80'];

  new Chart(ctx, {
    type: 'bubble',
    data: {
      datasets: d.map((t, i) => ({
        label: t.technique,
        data: [{ x: t.costIndex, y: t.effectiveness, r: 12 }],
        backgroundColor: colors[i % colors.length] + 'BB',
        borderColor: colors[i % colors.length],
        borderWidth: 2,
      }))
    },
    options: {
      ...CHART_OPTS,
      scales: {
        x: {
          ...CHART_OPTS.scales.x,
          title: { display: true, text: 'Cost Index (higher = more expensive)', color: '#8a9a72', font: { size: 10 } },
          min: 0, max: 110,
        },
        y: {
          ...CHART_OPTS.scales.y,
          title: { display: true, text: 'Effectiveness (%)', color: '#8a9a72', font: { size: 10 } },
          min: 30, max: 100,
        }
      },
      plugins: {
        ...CHART_OPTS.plugins,
        tooltip: {
          ...CHART_OPTS.plugins.tooltip,
          callbacks: {
            label: ctx => {
              const t = d[ctx.datasetIndex];
              return [`${t.technique}`, `Effectiveness: ${t.effectiveness}%`, `Cost Index: ${t.costIndex}`, `Time: ${t.timeYears} yrs`];
            }
          }
        }
      }
    }
  });
}

// ── World Bank Live API ───────────────────────────────
const WB_INDICATORS = [
  { id: 'AG.CON.FERT.ZS', label: 'Fertilizer Consumption', unit: '% of production', elementId: 'dash-wb-fertilizer', chartId: 'api-chart-fertilizer', badgeId: 'badge-fertilizer', color: '#ef4444' },
  { id: 'AG.YLD.CREL.KG', label: 'Cereal Yield',           unit: 'kg per hectare',  elementId: 'dash-wb-yield',       chartId: 'api-chart-yield',       badgeId: 'badge-yield',       color: '#86a340' },
  { id: 'AG.LND.ARBL.ZS', label: 'Arable Land',            unit: '% of land area',  elementId: 'dash-wb-arable',      chartId: 'api-chart-arable',      badgeId: 'badge-arable',      color: '#c9a84c' },
  { id: 'SH.STA.MALN.ZS', label: 'Malnutrition',           unit: '% under 5',       elementId: 'dash-wb-malnutrition',chartId: 'api-chart-malnutrition', badgeId: 'badge-malnutrition', color: '#f97316' },
];

async function refreshWorldBank() {
  const btn = document.getElementById('refresh-api');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Fetching…'; }

  for (const ind of WB_INDICATORS) {
    const badge = document.getElementById(ind.badgeId);
    if (badge) { badge.className = 'api-status-badge cached'; badge.textContent = '● Loading…'; }

    const infoEl = document.getElementById(ind.elementId);
    if (infoEl) infoEl.innerHTML = '<div class="api-loading"><div class="spinner"></div> Connecting to World Bank API…</div>';

    try {
      const url = `https://api.worldbank.org/v2/country/IN/indicator/${ind.id}?format=json&per_page=40&mrv=25`;
      const res  = await fetch(url);
      const json = await res.json();
      const data = (json[1] || []).filter(d => d.value !== null).sort((a, b) => a.date - b.date);

      if (data.length > 0) {
        renderWBMetric(ind, data);
        const badge = document.getElementById(ind.badgeId);
        if (badge) { badge.className = 'api-status-badge live'; badge.textContent = '● Live'; }
      } else {
        if (infoEl) infoEl.innerHTML = '<div style="color:#8a9a72;font-size:0.82rem">No data available</div>';
      }
    } catch(e) {
      const badge = document.getElementById(ind.badgeId);
      if (badge) { badge.className = 'api-status-badge'; badge.textContent = '● Error'; badge.style.color = '#f87171'; }
      const el = document.getElementById(ind.elementId);
      if (el) el.innerHTML = '<div style="color:#f87171;font-size:0.82rem">⚠ API unreachable. Check network.</div>';
    }
  }

  if (btn) { btn.disabled = false; btn.textContent = '🔄 Refresh Data'; }
}

function renderWBMetric(ind, data) {
  const infoEl = document.getElementById(ind.elementId);
  if (!infoEl) return;

  const latest = data[data.length - 1];
  const prev   = data[data.length - 2];
  const delta  = prev ? ((latest.value - prev.value) / prev.value * 100).toFixed(1) : null;
  const dUp    = delta > 0;

  infoEl.innerHTML = `
    <div style="display:flex;align-items:flex-end;gap:16px;flex-wrap:wrap">
      <div>
        <div style="font-size:2rem;font-weight:700;font-family:'JetBrains Mono',monospace;color:${ind.color};line-height:1">${latest.value?.toFixed(1) ?? '—'}</div>
        <div style="font-size:0.75rem;color:#8a9a72;margin-top:4px">${ind.unit} &nbsp;·&nbsp; Year ${latest.date}</div>
      </div>
      ${delta !== null ? `
        <div style="padding:6px 12px;border-radius:20px;font-size:0.78rem;font-weight:600;background:${dUp ? 'rgba(239,68,68,0.12)' : 'rgba(74,222,128,0.1)'};color:${dUp ? '#f87171' : '#4ade80'}">
          ${dUp ? '▲' : '▼'} ${Math.abs(delta)}% vs ${prev.date}
        </div>` : ''}
      <div style="font-size:0.72rem;color:#4a5740">Source: World Bank Open Data API<br/>Country: India (IN) · ${ind.id}</div>
    </div>
  `;

  // Sparkline chart
  const chartCtx = document.getElementById(ind.chartId);
  if (!chartCtx) return;

  new Chart(chartCtx, {
    type: 'line',
    data: {
      labels: data.map(d => d.date),
      datasets: [{
        data: data.map(d => d.value),
        borderColor: ind.color,
        backgroundColor: ind.color + '18',
        fill: true, tension: 0.4,
        pointRadius: 0, borderWidth: 2,
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: {
        backgroundColor: 'rgba(15,20,18,0.95)', borderColor: 'rgba(134,163,64,0.2)', borderWidth: 1,
        padding: 10, titleColor: '#e8eed6', bodyColor: '#8a9a72',
        callbacks: { label: ctx => `${ctx.parsed.y?.toFixed(2)} ${ind.unit}` }
      }},
      scales: {
        x: { display: false },
        y: {
          display: true,
          grid: { color: 'rgba(255,255,255,0.03)' },
          ticks: { color: '#4a5740', font: { size: 9 }, maxTicksLimit: 4 },
          border: { color: 'transparent' }
        }
      },
      animation: { duration: 1200, easing: 'easeInOutQuart' }
    }
  });
}
