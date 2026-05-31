// script.js – w pełni działający import/eksport odpowiedzi
let config = null;
let userAnswers = [];
let currentScoringMode = 'full';   // 'full' lub 'affirmative'

const questionsContainer = document.getElementById('questions-container');
const submitBtn = document.getElementById('submitBtn');
const resultsDiv = document.getElementById('results-container');
const valuesResults = document.getElementById('values-results');
const ideologiesResults = document.getElementById('ideologies-results');
const partiesResults = document.getElementById('parties-results');
const popup = document.getElementById('popup');
const popupText = document.getElementById('popup-text');
const closePopupBtn = document.getElementById('closePopup');

const valueColors = {
  "Autonomia": "#FECB1D",
  "Heteronomia": "#613B28", 
  "Kolektywizm": "#613B28", 
  "Indywidualizm": "#FECB1D",
  "Egalitaryzm": "#FECB1D", 
  "Hierarchiczność": "#613B28", 
  "Samoorganizacja": "#2F3944", 
  "Etatyzm": "#73B0BE",
  "Decentralizacja": "#2F3944", 
  "Centralizacja": "#73B0BE", 
  "Ograniczenie władzy": "#2F3944", 
  "Absolutyzm władzy": "#73B0BE",
  "Demokracja": "#2F3944", 
  "Anty-demokracja": "#73B0BE", 
  "Autokracja": "#2F3944", 
  "Anty-autokracja": "#73B0BE",
  "Własność kolektywna": "#E44341", 
  "Własność prywatna": "#448A3A", 
  "Planowanie": "#E44341", 
  "Rynek": "#448A3A",
  "Regulacja instytucjonalna": "#E44341", 
  "Samoregulacja": "#448A3A", 
  "Ograniczanie wymiany": "#E44341", 
  "Swobodna wymiana": "#448A3A",
  "Minimalizacja granic": "#4C59CB", 
  "Kontrola granic": "#FFA219", 
  "Kosmopolityzm": "#4C59CB", 
  "Partykularyzm narodowy": "#FFA219",
  "Interwencjonizm zagraniczny": "#4C59CB", 
  "Izolacjonizm": "#FFA219", 
  "Preferencja użycia siły": "#DD59C7", 
  "Unikanie przemocy": "#86D040",
  "Rewolucja": "#DD59C7", 
  "Gradualizm": "#86D040", 
  "Progresywizm": "#DD59C7", 
  "Konserwatyzm": "#86D040",
  "Pluralizm kulturowy": "#DD59C7", 
  "Homogenizacja": "#86D040", 
  "Neutralność religijna": "#DD59C7", 
  "Instytucjonalna religia": "#86D040",
  "Włączanie": "#DD59C7", 
  "Wykluczenie": "#86D040", 
  "Egalitaryzm biologiczny": "#DD59C7", 
  "Suprematyzm biologiczny": "#86D040",
  "Wolność ekspresji": "#FECB1D", 
  "Cenzura": "#613B28", 
  "Antropocentryzm": "#E57160", 
  "Ekocentryzm": "#14832A",
  "Postęp technologiczny": "#E57160", 
  "Prymitywizm": "#14832A", 
  "Desakralizacja autorytetu": "#73B0BE", 
  "Sakralizacja autorytetu": "#2F3944",
  "Różnorodność norm": "#2F3944",
  "Uniformizacja norm": "#73B0BE",
  "Kontraktualizm": "#FECB1D",
  "Organicyzm": "#613B28",
  "Dobrowolność wspólnoty": "#FECB1D",
  "Obowiązkowość wspólnoty": "#613B28"
};

function showPopup(message) {
  popupText.innerText = message;
  popup.classList.remove('hidden');
}
closePopupBtn.addEventListener('click', () => popup.classList.add('hidden'));
popup.addEventListener('click', (e) => { if (e.target === popup) popup.classList.add('hidden'); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !popup.classList.contains('hidden')) popup.classList.add('hidden'); });

function getContrastColor(hex) {
  const r = parseInt(hex.slice(1,3), 16);
  const g = parseInt(hex.slice(3,5), 16);
  const b = parseInt(hex.slice(5,7), 16);
  const brightness = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
  return brightness > 0.5 ? '#000000' : '#ffffff';
}

async function loadConfig() {
  try {
    const response = await fetch('data.json');
    if (!response.ok) throw new Error('Nie udało się wczytać data.json');
    config = await response.json();
    initApp();
    setupSimulation();
    setupModeSelector();
    setupImport();      // <-- import odpowiedzi
  } catch (err) {
    console.error(err);
    questionsContainer.innerHTML = '<p style="color:red;">Błąd ładowania konfiguracji. Sprawdź czy plik data.json istnieje i jest poprawny.</p>';
  }
}

function initApp() {
  renderQuestions();
  attachQuestionEvents();
  submitBtn.addEventListener('click', computeAndDisplayResults);
  initThemeToggle();
}

function initThemeToggle() {
  const toggleBtn = document.getElementById('theme-toggle');
  const root = document.body;
  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
    root.classList.add('dark');
    toggleBtn.textContent = '☀️';
  } else {
    root.classList.remove('dark');
    toggleBtn.textContent = '🌙';
  }
  toggleBtn.addEventListener('click', () => {
    if (root.classList.contains('dark')) {
      root.classList.remove('dark');
      toggleBtn.textContent = '🌙';
      localStorage.setItem('theme', 'light');
    } else {
      root.classList.add('dark');
      toggleBtn.textContent = '☀️';
      localStorage.setItem('theme', 'dark');
    }
  });
}

function renderQuestions() {
  questionsContainer.innerHTML = '';
  config.questions.forEach((q, idx) => {
    const card = document.createElement('div');
    card.className = 'question-card';
    card.dataset.id = q.id;
    const questionText = document.createElement('div');
    questionText.className = 'question-text';
    questionText.innerText = `${idx+1}. ${q.text}`;
    card.appendChild(questionText);
    const btnRow = document.createElement('div');
    const expandBtn = document.createElement('button');
    expandBtn.innerText = '📖 Rozwiń tezę';
    expandBtn.className = 'expand-btn';
    const descriptionDiv = document.createElement('div');
    descriptionDiv.className = 'description';
    descriptionDiv.innerText = q.description || 'Brak dodatkowego opisu.';
    expandBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      descriptionDiv.classList.toggle('visible');
      expandBtn.innerText = descriptionDiv.classList.contains('visible') ? '📘 Zwiń tezę' : '📖 Rozwiń tezę';
    });
    btnRow.appendChild(expandBtn);
    if (q.comment) {
      const commentBtn = document.createElement('span');
      commentBtn.innerText = '⚠️ Pomiń jeśli';
      commentBtn.className = 'comment-badge';
      commentBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        showPopup(q.comment);
      });
      btnRow.appendChild(commentBtn);
    }
    card.appendChild(btnRow);
    card.appendChild(descriptionDiv);
    const answersDiv = document.createElement('div');
    answersDiv.className = 'answers';
    q.answers.forEach((ans, ansIdx) => {
      const ansEl = document.createElement('div');
      ansEl.className = 'answer-option';
      ansEl.innerText = ans.label;
      ansEl.dataset.answerIdx = ansIdx;
      ansEl.dataset.value = ans.value;
      const label = ans.label;
      if (label.includes('Zdecydowanie zgadzam się')) ansEl.classList.add('answer-strong-agree');
      else if (label.includes('Częściowo zgadzam się')) ansEl.classList.add('answer-mild-agree');
      else if (label.includes('Częściowo nie zgadzam się')) ansEl.classList.add('answer-mild-disagree');
      else if (label.includes('Zdecydowanie nie zgadzam się')) ansEl.classList.add('answer-strong-disagree');
      else if (label.includes('Pomiń')) ansEl.classList.add('answer-skip');
      ansEl.addEventListener('click', () => {
        const siblings = answersDiv.querySelectorAll('.answer-option');
        siblings.forEach(sib => sib.classList.remove('selected'));
        ansEl.classList.add('selected');
        const existing = userAnswers.findIndex(a => a.questionId === q.id);
        const answerObj = {
          questionId: q.id,
          answerIndex: ansIdx,
          answerValue: ans.value,
          answerData: ans
        };
        if (existing !== -1) userAnswers[existing] = answerObj;
        else userAnswers.push(answerObj);
      });
      answersDiv.appendChild(ansEl);
    });
    card.appendChild(answersDiv);
    questionsContainer.appendChild(card);
  });
}

function attachQuestionEvents() {}

// ========== OBLICZANIE WYNIKÓW Z UWZGLĘDNIENIEM TRYBU ==========
function computeScores(mode = currentScoringMode) {
  const ideologyScores = new Map();
  const partyScores = new Map();
  const valueScores = new Map();

  config.ideologies.forEach(ideo => ideologyScores.set(ideo.name, { sum: 0, maxPossible: 0, agreements: 0, disagreements: 0 }));
  config.parties.forEach(party => partyScores.set(party.name, { sum: 0, maxPossible: 0, agreements: 0, disagreements: 0 }));

  const allValueNames = new Set();
  config.pairsOfValues.forEach(pair => { allValueNames.add(pair.left); allValueNames.add(pair.right); });
  config.hiddenValues.forEach(v => allValueNames.add(v));
  allValueNames.forEach(v => valueScores.set(v, { sum: 0, maxPossible: 0, questionsInvolved: 0 }));

  for (const ans of userAnswers) {
    const weight = ans.answerValue;
    if (weight === 0) continue;
    const answer = ans.answerData;
    const absWeight = Math.abs(weight);

    // ---- IDEOLOGIES ----
    if (mode === 'full') {
      for (const ideo of (answer.ideologies_for || [])) {
        const rec = ideologyScores.get(ideo);
        if (rec) { rec.sum += absWeight; rec.maxPossible += 1.5; if (weight > 0) rec.agreements++; else rec.disagreements++; }
      }
      for (const ideo of (answer.ideologies_against || [])) {
        const rec = ideologyScores.get(ideo);
        if (rec) { rec.sum -= absWeight; rec.maxPossible += 1.5; if (weight < 0) rec.agreements++; else rec.disagreements++; }
      }
    } else {
      if (weight > 0) {
        for (const ideo of (answer.ideologies_for || [])) {
          const rec = ideologyScores.get(ideo);
          if (rec) { rec.sum += absWeight; rec.maxPossible += 1.5; rec.agreements++; }
        }
      }
    }

    // ---- PARTIES ----
    if (mode === 'full') {
      for (const party of (answer.parties_for || [])) {
        const rec = partyScores.get(party);
        if (rec) { rec.sum += absWeight; rec.maxPossible += 1.5; if (weight > 0) rec.agreements++; else rec.disagreements++; }
      }
      for (const party of (answer.parties_against || [])) {
        const rec = partyScores.get(party);
        if (rec) { rec.sum -= absWeight; rec.maxPossible += 1.5; if (weight < 0) rec.agreements++; else rec.disagreements++; }
      }
    } else {
      if (weight > 0) {
        for (const party of (answer.parties_for || [])) {
          const rec = partyScores.get(party);
          if (rec) { rec.sum += absWeight; rec.maxPossible += 1.5; rec.agreements++; }
        }
      }
    }

    // ---- VALUES ----
    if (mode === 'full') {
      for (const val of (answer.values_for || [])) {
        const rec = valueScores.get(val);
        if (rec) { rec.sum += absWeight; rec.maxPossible += 1.5; }
      }
      for (const val of (answer.values_against || [])) {
        const rec = valueScores.get(val);
        if (rec) { rec.sum -= absWeight; rec.maxPossible += 1.5; }
      }
    } else {
      if (weight > 0) {
        for (const val of (answer.values_for || [])) {
          const rec = valueScores.get(val);
          if (rec) { rec.sum += absWeight; rec.maxPossible += 1.5; }
        }
      }
    }
  }

  const normalizeScore = (rec) => {
    if (!rec || rec.maxPossible === 0) return 50;
    const raw = rec.sum;
    return Math.min(100, Math.max(0, (raw + rec.maxPossible) / (2 * rec.maxPossible) * 100));
  };

  const ideologyResults = [];
  for (let [name, rec] of ideologyScores.entries()) ideologyResults.push({ name, percent: normalizeScore(rec), agreements: rec.agreements, disagreements: rec.disagreements, involved: rec.maxPossible / 1.5, description: config.ideologies.find(i => i.name === name)?.description || '' });
  ideologyResults.sort((a,b) => b.percent - a.percent);

  const partyResults = [];
  for (let [name, rec] of partyScores.entries()) partyResults.push({ name, percent: normalizeScore(rec), agreements: rec.agreements, disagreements: rec.disagreements, involved: rec.maxPossible / 1.5, description: config.parties.find(p => p.name === name)?.description || '' });
  partyResults.sort((a,b) => b.percent - a.percent);

  const pairResults = [];
  for (let pair of config.pairsOfValues) {
    const recLeft = valueScores.get(pair.left);
    const recRight = valueScores.get(pair.right);
    const sumL = recLeft ? recLeft.sum : 0;
    const maxL = recLeft ? recLeft.maxPossible : 0;
    const sumR = recRight ? recRight.sum : 0;
    const maxR = recRight ? recRight.maxPossible : 0;
    const totalMax = maxL + maxR;
    let leftPercent, rightPercent;
    if (totalMax === 0) {
      leftPercent = 50;
      rightPercent = 50;
    } else {
      const net = sumL - sumR;
      leftPercent = (net + totalMax) / (2 * totalMax) * 100;
      leftPercent = Math.min(100, Math.max(0, leftPercent));
      rightPercent = 100 - leftPercent;
    }
    pairResults.push({
      left: pair.left,
      right: pair.right,
      leftPercent: leftPercent,
      rightPercent: rightPercent,
      leftDef: pair.leftDef,
      rightDef: pair.rightDef
    });
  }

  return { pairResults, ideologyResults, partyResults };
}

function createRankingSection(title, items, type) {
  const section = document.createElement('div');
  section.className = 'ranking-section';
  const header = document.createElement('h3');
  header.textContent = title;
  section.appendChild(header);
  if (title.includes('Ideologii')) {
    const info = document.createElement('div');
    info.style.marginBottom = '1rem';
    info.textContent = 'Im wyższy procent, tym bardziej Twój profil jest zgodny z daną ideologią.';
    section.appendChild(info);
  }
  const listContainer = document.createElement('div');
  listContainer.className = 'ranking-list';
  const itemsElements = [];
  items.forEach((item, idx) => {
    const itemDiv = document.createElement('div');
    itemDiv.className = `ranking-item ${type === 'ideology' ? 'ideology-entry' : 'party-entry'}`;
    itemDiv.innerHTML = `<span class="rank-name">${item.name}</span><span class="rank-percent">${Math.round(item.percent)}%</span>`;
    itemDiv.addEventListener('click', () => showPopup(`${item.name}\n${item.description || ''}`));
    itemsElements.push(itemDiv);
    listContainer.appendChild(itemDiv);
  });
  if (itemsElements.length > 3) {
    for (let i = 3; i < itemsElements.length; i++) itemsElements[i].classList.add('hidden-rank-item');
    const toggleBtn = document.createElement('button');
    toggleBtn.textContent = 'Pokaż więcej';
    toggleBtn.className = 'toggle-rank-btn';
    let expanded = false;
    toggleBtn.addEventListener('click', () => {
      if (expanded) {
        for (let i = 3; i < itemsElements.length; i++) itemsElements[i].classList.add('hidden-rank-item');
        toggleBtn.textContent = 'Pokaż więcej';
      } else {
        for (let i = 3; i < itemsElements.length; i++) itemsElements[i].classList.remove('hidden-rank-item');
        toggleBtn.textContent = 'Pokaż mniej';
      }
      expanded = !expanded;
    });
    section.appendChild(listContainer);
    section.appendChild(toggleBtn);
  } else {
    section.appendChild(listContainer);
  }
  return section;
}

function generateShareCode(pairResults) {
  const resultsString = pairResults.map(pair => `${pair.left}(${Math.round(pair.leftPercent)}) - ${pair.right}(${Math.round(pair.rightPercent)})`).join('; ');
  let base64 = '';
  try { base64 = btoa(unescape(encodeURIComponent(resultsString))); } catch(e) { console.error(e); base64 = ''; }
  const container = document.createElement('div');
  container.className = 'share-section';
  container.innerHTML = `<h3>🔗 Sprawdź położenie na kompasie</h3>
    <p>Skopiuj poniższy kod i wklej go na stronie z kompasem, by poznać swoje położenie:</p>
    <textarea readonly class="share-code" rows="3">${base64}</textarea>
    <button class="copy-btn">📋 Kopiuj kod</button>
    <p class="share-link">
      <a href="https://zbieraczartur.github.io/NeoAutystyk-Kompas/" target="_blank" rel="noopener noreferrer" class="compass-link">🧭 NeoAutystyk Kompas</a>
    </p>`;
  const copyBtn = container.querySelector('.copy-btn');
  const textarea = container.querySelector('.share-code');
  copyBtn.addEventListener('click', () => {
    textarea.select();
    navigator.clipboard.writeText(textarea.value).then(() => {
      copyBtn.textContent = '✅ Skopiowano!';
      setTimeout(() => { copyBtn.textContent = '📋 Kopiuj kod'; }, 2000);
    }).catch(() => alert('Nie udało się skopiować. Możesz zaznaczyć kod ręcznie.'));
  });
  return container;
}

// ========== EKSPORT ODPOWIEDZI ==========
function generateAnswersExportSection() {
  const now = new Date();
  const formattedDate = now.toLocaleString('pl-PL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  
  let exportText = `Data wykonania testu: ${formattedDate}\n\n`;
  
  config.questions.forEach((q, idx) => {
    const answerObj = userAnswers.find(a => a.questionId === q.id);
    let answerLabel = 'Brak odpowiedzi';
    if (answerObj && answerObj.answerData && answerObj.answerData.label) {
      answerLabel = answerObj.answerData.label;
    } else if (answerObj && answerObj.answerValue === 0) {
      answerLabel = 'Pominięte';
    }
    exportText += `${idx+1}. ${q.text}\n- ${answerLabel}\n\n`;
  });
  
  const container = document.createElement('div');
  container.className = 'export-answers-section';
  container.innerHTML = `
    <h3>📋 Eksport twoich odpowiedzi</h3>
    <p>Skopiuj poniższy kod, aby zapisać lub udostępnić swoje odpowiedzi:</p>
    <textarea readonly class="export-code" rows="10">${escapeHtml(exportText)}</textarea>
    <button class="copy-export-btn">📋 Kopiuj kod</button>
  `;
  
  const copyBtn = container.querySelector('.copy-export-btn');
  const textarea = container.querySelector('.export-code');
  copyBtn.addEventListener('click', () => {
    textarea.select();
    navigator.clipboard.writeText(textarea.value).then(() => {
      copyBtn.textContent = '✅ Skopiowano!';
      setTimeout(() => { copyBtn.textContent = '📋 Kopiuj kod'; }, 2000);
    }).catch(() => alert('Nie udało się skopiować. Możesz zaznaczyć kod ręcznie.'));
  });
  return container;
}

function escapeHtml(str) {
  return str.replace(/[&<>]/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  });
}

function computeAndDisplayResults() {
  const { pairResults, ideologyResults, partyResults } = computeScores(currentScoringMode);
  valuesResults.innerHTML = '<h3>⚖️ Pary wartości</h3>';
  pairResults.forEach(pair => {
    const leftColor = valueColors[pair.left] || '#3b82f6';
    const rightColor = valueColors[pair.right] || '#ef4444';
    const leftTextColor = getContrastColor(leftColor);
    const rightTextColor = getContrastColor(rightColor);
    const pairDiv = document.createElement('div');
    pairDiv.className = 'value-pair';
    pairDiv.innerHTML = `<div class="value-bar-container"><span class="value-left" data-def="${pair.leftDef}">${pair.left}</span><div class="value-bar"><div class="bar-left" style="width: ${pair.leftPercent}%; background-color: ${leftColor}; color: ${leftTextColor};">${Math.round(pair.leftPercent)}%</div><div class="bar-right" style="width: ${pair.rightPercent}%; background-color: ${rightColor}; color: ${rightTextColor};">${Math.round(pair.rightPercent)}%</div></div><span class="value-right" data-def="${pair.rightDef}">${pair.right}</span></div>`;
    const leftSpan = pairDiv.querySelector('.value-left');
    const rightSpan = pairDiv.querySelector('.value-right');
    leftSpan.addEventListener('click', () => showPopup(pair.leftDef));
    rightSpan.addEventListener('click', () => showPopup(pair.rightDef));
    valuesResults.appendChild(pairDiv);
  });
  ideologiesResults.innerHTML = '';
  ideologiesResults.appendChild(createRankingSection('📊 Ranking ideologii (zgodność %)', ideologyResults, 'ideology'));
  partiesResults.innerHTML = '';
  partiesResults.appendChild(createRankingSection('🗳️ Ranking partii (zgodność %)', partyResults, 'party'));
  
  const existingShare = resultsDiv.querySelector('.share-section');
  if (existingShare) existingShare.remove();
  resultsDiv.appendChild(generateShareCode(pairResults));
  
  const existingExport = resultsDiv.querySelector('.export-answers-section');
  if (existingExport) existingExport.remove();
  resultsDiv.appendChild(generateAnswersExportSection());
  
  resultsDiv.style.display = 'block';
  window.scrollTo({ top: resultsDiv.offsetTop - 20, behavior: 'smooth' });
}

// ========== SYMULACJA ==========
let simulationSelect = null;
let simulateBtn = null;
let restoreBtn = null;

function syncUserAnswersFromDOM() {
  const newAnswers = [];
  const questionCards = document.querySelectorAll('.question-card');
  
  questionCards.forEach(card => {
    const qid = parseInt(card.dataset.id);
    const questionConfig = config.questions.find(q => q.id === qid);
    if (!questionConfig) return;
    
    const selectedAnswer = card.querySelector('.answer-option.selected');
    if (selectedAnswer) {
      const ansIdx = parseInt(selectedAnswer.dataset.answerIdx);
      const answerData = questionConfig.answers[ansIdx];
      newAnswers.push({
        questionId: qid,
        answerIndex: ansIdx,
        answerValue: answerData.value,
        answerData: answerData
      });
    } else {
      const skipAnswer = questionConfig.answers.find(a => a.value === 0 && a.label.includes('Pomiń'));
      if (skipAnswer) {
        const ansIdx = questionConfig.answers.indexOf(skipAnswer);
        newAnswers.push({
          questionId: qid,
          answerIndex: ansIdx,
          answerValue: 0,
          answerData: skipAnswer
        });
      }
    }
  });
  
  userAnswers = newAnswers;
  console.log('Przywrócono odpowiedzi użytkownika z GUI. Liczba odpowiedzi:', userAnswers.length);
}

function restoreUserAnswers() {
  syncUserAnswersFromDOM();
  computeAndDisplayResults();
  console.log('✅ Przywrócono Twoje odpowiedzi i odświeżono wyniki.');
}

function simulateAnswers(selectedName) {
  console.log(`\n🎭 SYMULACJA DLA: ${selectedName}`);
  const simulatedAnswers = [];
  
  for (const question of config.questions) {
    let bestAnswer = null;
    let bestAbsValue = -1;
    
    for (const answer of question.answers) {
      const partiesFor = answer.parties_for || [];
      const ideologiesFor = answer.ideologies_for || [];
      
      if (partiesFor.includes(selectedName) || ideologiesFor.includes(selectedName)) {
        const absVal = Math.abs(answer.value);
        if (absVal > bestAbsValue) {
          bestAbsValue = absVal;
          bestAnswer = answer;
        }
      }
    }
    
    if (!bestAnswer) {
      bestAnswer = question.answers.find(a => a.value === 0 && a.label.includes('Pomiń'));
      if (!bestAnswer) {
        bestAnswer = question.answers[0];
      }
    }
    
    const answerIndex = question.answers.findIndex(a => a === bestAnswer);
    simulatedAnswers.push({
      questionId: question.id,
      answerIndex: answerIndex,
      answerValue: bestAnswer.value,
      answerData: bestAnswer
    });
  }
  
  userAnswers = simulatedAnswers;
  computeAndDisplayResults();
  
  const { pairResults, ideologyResults, partyResults } = computeScores(currentScoringMode);
  console.log(`\n📊 WYNIKI SYMULACJI (${selectedName}):`);
  console.log('--- Pary wartości ---');
  pairResults.forEach(p => {
    console.log(`${p.left}: ${p.leftPercent.toFixed(1)}%  |  ${p.right}: ${p.rightPercent.toFixed(1)}%`);
  });
  console.log('\n--- Top 5 ideologii ---');
  ideologyResults.slice(0,5).forEach(ideo => {
    console.log(`${ideo.name}: ${ideo.percent.toFixed(1)}%`);
  });
  console.log('\n--- Top 5 partii ---');
  partyResults.slice(0,5).forEach(party => {
    console.log(`${party.name}: ${party.percent.toFixed(1)}%`);
  });
  console.log(`\n✅ Symulacja zakończona. Aby wrócić do swoich odpowiedzi, kliknij "Przywróć moje odpowiedzi".\n`);
}

function setupSimulation() {
  simulationSelect = document.getElementById('simulateSelect');
  simulateBtn = document.getElementById('simulateBtn');
  restoreBtn = document.getElementById('restoreBtn');
  
  if (!simulationSelect || !simulateBtn || !restoreBtn) return;
  if (!config || !config.parties || !config.ideologies) {
    console.warn('Brak danych partii lub ideologii w config');
    simulationSelect.innerHTML = '<option>Brak danych do symulacji</option>';
    return;
  }
  
  simulationSelect.innerHTML = '';
  
  if (config.parties.length) {
    const partiesGroup = document.createElement('optgroup');
    partiesGroup.label = '🇵🇱 Partie polityczne';
    config.parties.forEach(party => {
      const option = document.createElement('option');
      option.value = party.name;
      option.textContent = party.name;
      partiesGroup.appendChild(option);
    });
    simulationSelect.appendChild(partiesGroup);
  }
  
  if (config.ideologies.length) {
    const ideologiesGroup = document.createElement('optgroup');
    ideologiesGroup.label = '💡 Ideologie';
    config.ideologies.forEach(ideo => {
      const option = document.createElement('option');
      option.value = ideo.name;
      option.textContent = ideo.name;
      ideologiesGroup.appendChild(option);
    });
    simulationSelect.appendChild(ideologiesGroup);
  }
  
  if (!config.parties.length && !config.ideologies.length) {
    simulationSelect.innerHTML = '<option>Brak partii i ideologii w data.json</option>';
    return;
  }
  
  if (config.parties.length) simulationSelect.value = config.parties[0].name;
  else if (config.ideologies.length) simulationSelect.value = config.ideologies[0].name;
  
  simulateBtn.addEventListener('click', () => {
    const selected = simulationSelect.value;
    if (selected && selected !== 'Brak danych do symulacji') {
      simulateAnswers(selected);
    } else {
      alert('Wybierz partię lub ideologię z listy.');
    }
  });
  
  restoreBtn.addEventListener('click', () => {
    restoreUserAnswers();
  });
}

// ========== TRYBY LICZENIA ==========
function setupModeSelector() {
  const radios = document.querySelectorAll('input[name="scoringMode"]');
  const helpBtn = document.getElementById('modeHelpBtn');
  
  const savedMode = localStorage.getItem('scoringMode');
  if (savedMode === 'affirmative') {
    currentScoringMode = 'affirmative';
    document.querySelector('input[value="affirmative"]').checked = true;
  } else {
    currentScoringMode = 'full';
    document.querySelector('input[value="full"]').checked = true;
  }
  
  radios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      if (e.target.checked) {
        currentScoringMode = e.target.value;
        localStorage.setItem('scoringMode', currentScoringMode);
        if (resultsDiv.style.display !== 'none') {
          computeAndDisplayResults();
        }
      }
    });
  });
  
  helpBtn.addEventListener('click', () => {
    showPopup(
      '🧠 Tryb pełnego profilowania\nUwzględnia zarówno poglądy popierane, jak i odrzucane. Niezgoda z daną tezą może przybliżać do innych ideologii, partii lub wartości.\n\n' +
      '✅ Tryb afirmacyjny\nUwzględnia wyłącznie poglądy aktywnie popierane. Niezgoda z tezą nie powoduje automatycznego przybliżenia do stanowiska przeciwnego.'
    );
  });
}

// ========== IMPORT ODPOWIEDZI (POPRAWIONY) ==========
function setupImport() {
  const importBtn = document.getElementById('importBtn');
  const importTextarea = document.getElementById('importAnswers');

  if (!importBtn || !importTextarea) return;

  importBtn.addEventListener('click', () => {
    const rawText = importTextarea.value.trim();
    if (!rawText) {
      alert('Wklej kod eksportu w pole tekstowe.');
      return;
    }

    const importedMap = parseImport(rawText);
    if (importedMap.size === 0) {
      alert('Nie udało się odczytać żadnej odpowiedzi. Upewnij się, że wklejasz prawidłowy kod (z numerami pytań i myślnikami).');
      return;
    }

    applyImportedAnswers(importedMap);
    computeAndDisplayResults();
    alert(`Zaimportowano ${importedMap.size} odpowiedzi. Możesz je teraz zmieniać ręcznie.`);
  });
}

// Poprawiona funkcja parsująca – bardziej odporna na puste linie i różne formaty
function parseImport(text) {
  const lines = text.split(/\r?\n/);
  const result = new Map();
  let currentNumber = null;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    if (line === '') continue;

    // Sprawdź, czy linia zawiera numer pytania (na początku)
    const matchNum = line.match(/^(\d+)\./);
    if (matchNum) {
      currentNumber = parseInt(matchNum[1], 10);
      // Nie resetujemy od razu – czekamy na odpowiedź w kolejnych liniach
      continue;
    }

    // Jeśli mamy zapamiętany numer i linia zaczyna się od myślnika
    if (currentNumber !== null && line.startsWith('-')) {
      let answer = line.substring(1).trim(); // odcinamy myślnik i spację
      if (answer === 'Pominięte') answer = 'Pomiń pytanie';
      result.set(currentNumber, answer);
      currentNumber = null; // reset – czekamy na następny numer
    }
  }
  return result;
}

function applyImportedAnswers(answersMap) {
  const questionCards = document.querySelectorAll('.question-card');

  questionCards.forEach((card, idx) => {
    const qid = parseInt(card.dataset.id);
    const questionConfig = config.questions.find(q => q.id === qid);
    if (!questionConfig) return;

    const questionNumber = idx + 1;  // kolejność wg wyświetlania
    const expectedLabel = answersMap.get(questionNumber);
    const answerOptions = card.querySelectorAll('.answer-option');
    let matched = false;

    // Odznacz wszystkie przyciski (będziemy zaznaczać tylko pasujące)
    answerOptions.forEach(opt => opt.classList.remove('selected'));

    if (expectedLabel) {
      // Szukamy przycisku z etykietą dokładnie taką jak w imporcie
      for (let opt of answerOptions) {
        const optLabel = opt.innerText.trim();
        if (optLabel === expectedLabel) {
          opt.classList.add('selected');
          matched = true;
          // Aktualizujemy userAnswers
          const ansIdx = parseInt(opt.dataset.answerIdx);
          const answerData = questionConfig.answers[ansIdx];
          const existing = userAnswers.findIndex(a => a.questionId === qid);
          const answerObj = {
            questionId: qid,
            answerIndex: ansIdx,
            answerValue: answerData.value,
            answerData: answerData
          };
          if (existing !== -1) userAnswers[existing] = answerObj;
          else userAnswers.push(answerObj);
          break;
        }
      }
      if (!matched) {
        console.warn(`Nie znaleziono przycisku z etykietą "${expectedLabel}" dla pytania ${questionNumber}`);
      }
    } else {
      // Brak odpowiedzi w imporcie – usuwamy istniejącą odpowiedź dla tego pytania
      const existingIdx = userAnswers.findIndex(a => a.questionId === qid);
      if (existingIdx !== -1) userAnswers.splice(existingIdx, 1);
    }
  });

  // Usuwanie ewentualnych duplikatów (zabezpieczenie)
  const unique = [];
  const seen = new Set();
  for (const ans of userAnswers) {
    if (!seen.has(ans.questionId)) {
      seen.add(ans.questionId);
      unique.push(ans);
    }
  }
  userAnswers = unique;
}

loadConfig();
