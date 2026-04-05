// ── NAV TOGGLE ──
document.getElementById('navToggle').addEventListener('click', () => {
  document.getElementById('navLinks').classList.toggle('open');
});

// ── SMOOTH NAV HIGHLIGHT ──
const sections = document.querySelectorAll('section[id], header[id]');
const navLinks = document.querySelectorAll('.nav-links a');
window.addEventListener('scroll', () => {
  let current = '';
  sections.forEach(s => { if (window.scrollY >= s.offsetTop - 120) current = s.id; });
  navLinks.forEach(a => {
    a.style.color = a.getAttribute('href') === `#${current}` ? 'var(--text)' : '';
  });
});

// ── HERO COUNTER ANIMATION ──
function animateCounter(el) {
  const target = parseFloat(el.dataset.target);
  const isFloat = target % 1 !== 0;
  const duration = 1800;
  const start = performance.now();
  const update = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    el.textContent = isFloat ? (target * ease).toFixed(1) : Math.round(target * ease).toLocaleString();
    if (progress < 1) requestAnimationFrame(update);
  };
  requestAnimationFrame(update);
}
const counterObserver = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { animateCounter(e.target); counterObserver.unobserve(e.target); } });
}, { threshold: 0.5 });
document.querySelectorAll('.stat-num').forEach(el => counterObserver.observe(el));

// ── SCROLL REVEAL ──
document.querySelectorAll('.section > .container > *, .chart-card, .source-card, .eco-card, .mit-item, .comm-card, .policy-card, .timeline-item').forEach(el => {
  el.classList.add('reveal');
});
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); revealObserver.unobserve(e.target); } });
}, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

// ── CHARTS ──
Chart.defaults.color = '#94a3b8';
Chart.defaults.borderColor = '#1e2d4a';

// Population Exposure Chart
new Chart(document.getElementById('exposureChart'), {
  type: 'bar',
  data: {
    labels: ['< 50 dB', '50–55 dB', '55–60 dB', '60–65 dB', '65–70 dB', '> 70 dB'],
    datasets: [{
      label: 'Population (millions)',
      data: [12.4, 8.7, 6.2, 4.1, 2.8, 1.3],
      backgroundColor: ['#4ade80','#a3e635','#facc15','#fb923c','#f87171','#dc2626'],
      borderRadius: 6,
    }]
  },
  options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
});

// Sources Pie Chart
new Chart(document.getElementById('sourcesChart'), {
  type: 'doughnut',
  data: {
    labels: ['Road Traffic', 'Aviation', 'Rail', 'Industry', 'Construction', 'Recreational'],
    datasets: [{
      data: [54, 12, 11, 10, 7, 6],
      backgroundColor: ['#3b82f6','#06b6d4','#8b5cf6','#f59e0b','#ef4444','#10b981'],
      borderWidth: 2, borderColor: '#141c2e',
    }]
  },
  options: { responsive: true, plugins: { legend: { position: 'bottom', labels: { padding: 12, font: { size: 11 } } } } }
});

// Trend Line Chart
new Chart(document.getElementById('trendChart'), {
  type: 'line',
  data: {
    labels: ['2010','2012','2014','2016','2018','2020','2022','2024'],
    datasets: [
      {
        label: 'Day Average (dB)',
        data: [68.2, 68.8, 69.1, 69.4, 69.0, 66.2, 67.5, 67.8],
        borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.1)',
        tension: 0.4, fill: true, pointRadius: 4,
      },
      {
        label: 'Night Average (dB)',
        data: [58.1, 58.6, 59.0, 59.3, 58.8, 55.4, 56.8, 57.1],
        borderColor: '#06b6d4', backgroundColor: 'rgba(6,182,212,0.05)',
        tension: 0.4, fill: true, pointRadius: 4,
      }
    ]
  },
  options: {
    responsive: true,
    plugins: { legend: { position: 'top' } },
    scales: { y: { min: 50, max: 75, title: { display: true, text: 'dB Level' } } }
  }
});

// ── NOISE RISK CALCULATOR ──
function updateCalc() {
  const noise = parseInt(document.getElementById('homeNoise').value);
  const hours = parseInt(document.getElementById('hoursExp').value);
  document.getElementById('homeVal').textContent = noise + ' dB';
  document.getElementById('hoursVal').textContent = hours + ' hrs';

  // Simple risk score: weighted by noise level and hours
  const score = Math.min(100, ((noise - 30) / 60) * 70 + (hours / 16) * 30);
  const fill = document.getElementById('riskFill');
  const text = document.getElementById('riskText');
  fill.style.width = score + '%';

  if (score < 25) {
    fill.style.background = '#4ade80'; text.textContent = '✅ Risk Level: Low — within safe limits';
    text.style.color = '#4ade80';
  } else if (score < 55) {
    fill.style.background = '#facc15'; text.textContent = '⚠️ Risk Level: Moderate — consider mitigation';
    text.style.color = '#facc15';
  } else if (score < 80) {
    fill.style.background = '#fb923c'; text.textContent = '🔶 Risk Level: High — health effects likely';
    text.style.color = '#fb923c';
  } else {
    fill.style.background = '#ef4444'; text.textContent = '🚨 Risk Level: Critical — seek noise reduction urgently';
    text.style.color = '#ef4444';
  }
}
updateCalc();

// ── QUIZ ──
const questions = [
  {
    q: 'What is the WHO recommended maximum outdoor noise level for residential areas?',
    options: ['45 dB', '55 dB', '65 dB', '75 dB'],
    answer: 1,
    explanation: 'WHO recommends below 55 dB L_den for road traffic noise outdoors.'
  },
  {
    q: 'Which is the largest source of urban noise pollution?',
    options: ['Aviation', 'Construction', 'Road Traffic', 'Industry'],
    answer: 2,
    explanation: 'Road traffic accounts for approximately 54% of urban noise exposure.'
  },
  {
    q: 'How much can reducing speed limits from 50 to 30 km/h reduce traffic noise?',
    options: ['~1 dB', '~3 dB', '~10 dB', '~15 dB'],
    answer: 1,
    explanation: 'A 20 km/h speed reduction typically cuts noise by ~3 dB — equivalent to halving traffic volume.'
  },
  {
    q: 'What effect does urban noise have on birds?',
    options: ['No measurable effect', 'They sing louder and lower', 'They shift to higher-frequency songs', 'They become silent'],
    answer: 2,
    explanation: 'Many urban bird species have adapted by shifting their songs to higher frequencies to be heard above low-frequency traffic noise.'
  },
  {
    q: 'At what dB level does prolonged exposure cause permanent hearing damage?',
    options: ['Above 65 dB', 'Above 75 dB', 'Above 85 dB', 'Above 95 dB'],
    answer: 2,
    explanation: 'Prolonged exposure above 85 dB causes permanent hearing damage (noise-induced hearing loss).'
  }
];

let currentQ = 0, score = 0, answered = false;

function loadQuestion() {
  const q = questions[currentQ];
  document.getElementById('quizQuestion').textContent = `Q${currentQ + 1}/${questions.length}: ${q.q}`;
  const opts = document.getElementById('quizOptions');
  opts.innerHTML = '';
  q.options.forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.textContent = opt;
    btn.onclick = () => selectAnswer(i);
    opts.appendChild(btn);
  });
  document.getElementById('quizFeedback').textContent = '';
  document.getElementById('nextBtn').style.display = 'none';
  answered = false;
}

function selectAnswer(idx) {
  if (answered) return;
  answered = true;
  const q = questions[currentQ];
  const btns = document.querySelectorAll('.quiz-options button');
  btns[q.answer].classList.add('correct');
  if (idx !== q.answer) btns[idx].classList.add('wrong');
  else score++;
  document.getElementById('quizFeedback').textContent = `💡 ${q.explanation}`;
  document.getElementById('nextBtn').style.display = currentQ < questions.length - 1 ? 'inline-block' : 'none';
  if (currentQ === questions.length - 1) setTimeout(showResult, 1200);
}

function nextQuestion() {
  currentQ++;
  loadQuestion();
}

function showResult() {
  document.getElementById('quiz').style.display = 'none';
  document.getElementById('quizResult').style.display = 'block';
  const pct = Math.round((score / questions.length) * 100);
  const msg = pct === 100 ? '🏆 Perfect score!' : pct >= 60 ? '👍 Good job!' : '📚 Keep learning!';
  document.getElementById('quizScore').textContent = `${msg} You scored ${score}/${questions.length} (${pct}%)`;
}

function restartQuiz() {
  currentQ = 0; score = 0;
  document.getElementById('quiz').style.display = 'block';
  document.getElementById('quizResult').style.display = 'none';
  loadQuestion();
}

loadQuestion();

// ── CONTACT FORM ──
function submitForm(e) {
  e.preventDefault();
  document.getElementById('formSuccess').style.display = 'block';
  e.target.reset();
  setTimeout(() => { document.getElementById('formSuccess').style.display = 'none'; }, 4000);
}
