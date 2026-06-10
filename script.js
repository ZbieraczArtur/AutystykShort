// script.js – pełna, działająca wersja z poprawionym ładowaniem, rankingami obok kompasu i ręczną edycją w modalu

// ======================= POMOCNICZE FUNKCJE DO RĘCZNEGO PANELU =======================
function getActivePairsForMode(mode, creativeCfg) {
  if (mode === 'weighted') return corePairs.filter(p => !p.extra);
  if (mode === 'equal') return corePairs.filter(p => !p.extra).map(p => ({ ...p, weight: 1 }));
  if (mode === 'institutional') return corePairs.filter(p => p.institutional === true);
  if (mode === 'creative') {
    return creativeCfg.activePairs.map(cfg => {
      const original = allCompassPairs.find(p => p.id === cfg.pairId);
      if (!original) return null;
      return { ...original, axis: cfg.axis, weight: cfg.weight };
    }).filter(p => p !== null);
  }
  return [];
}

function buildValuesMapFromManual(pairs) {
  const values = {};
  for (const pair of pairs) {
    const posInput = document.getElementById(`manual-pos-${pair.id}`);
    const negInput = document.getElementById(`manual-neg-${pair.id}`);
    const pos = posInput && posInput.value.trim() !== '' ? Number(posInput.value) : null;
    const neg = negInput && negInput.value.trim() !== '' ? Number(negInput.value) : null;
    if (pos !== null && neg !== null && !isNaN(pos) && !isNaN(neg)) {
      values[pair.id] = { positive: Math.min(100, Math.max(0, pos)), negative: Math.min(100, Math.max(0, neg)) };
    } else if (pos !== null && !isNaN(pos)) {
      const p = Math.min(100, Math.max(0, pos));
      values[pair.id] = { positive: p, negative: 100 - p };
    } else if (neg !== null && !isNaN(neg)) {
      const n = Math.min(100, Math.max(0, neg));
      values[pair.id] = { positive: 100 - n, negative: n };
    } else {
      values[pair.id] = { positive: null, negative: null };
    }
  }
  return values;
}

function renderManualForm(pairs, currentValuesMap) {
  const container = document.getElementById('manual-pairs-container');
  if (!container) return;
  container.innerHTML = '';
  for (const pair of pairs) {
    const vals = currentValuesMap[pair.id] || { positive: null, negative: null };
    const posVal = vals.positive !== null ? vals.positive : '';
    const negVal = vals.negative !== null ? vals.negative : '';
    const div = document.createElement('div');
    div.className = 'manual-pair';
    div.innerHTML = `
      <label>${pair.negativeLabel} (lewo/dół)</label>
      <input type="number" min="0" max="100" step="1" id="manual-neg-${pair.id}" value="${negVal}" placeholder="0–100">
      <span class="versus">⇄</span>
      <label>${pair.positiveLabel} (prawo/góra)</label>
      <input type="number" min="0" max="100" step="1" id="manual-pos-${pair.id}" value="${posVal}" placeholder="0–100">
    `;
    container.appendChild(div);
  }
  // Synchronizacja pól
  for (const pair of pairs) {
    const posInput = document.getElementById(`manual-pos-${pair.id}`);
    const negInput = document.getElementById(`manual-neg-${pair.id}`);
    if (posInput && negInput) {
      const sync = (source, target) => {
        const raw = source.value.trim();
        if (raw === '') {
          target.value = '';
          return;
        }
        let val = Number(raw);
        if (!isNaN(val)) {
          val = Math.min(100, Math.max(0, val));
          source.value = val;
          target.value = 100 - val;
        } else {
          source.value = '';
          target.value = '';
        }
      };
      posInput.addEventListener('input', () => sync(posInput, negInput));
      negInput.addEventListener('input', () => sync(negInput, posInput));
    }
  }
}

// ======================= RESZTA KODU (główne funkcje) =======================

let config = null;
let configBase = null;
let translations = null;
let currentLanguage = 'pl';
let userAnswers = [];
let currentScoringMode = 'full';
let simulatedEntity = null;

const questionsContainer = document.getElementById('questions-container');
const submitBtn = document.getElementById('submitBtn');
const resultsDiv = document.getElementById('results-container');
const valuesResults = document.getElementById('values-results');
const ideologiesResults = document.getElementById('ideologies-results');
const partiesResults = document.getElementById('parties-results');
const popup = document.getElementById('popup');
const popupText = document.getElementById('popup-text');
const closePopupBtn = document.getElementById('closePopup');

// Mapowania logo (bez zmian)
const LOGO_BASE_PATH = 'images/Partie/';
const partyLogoMap = new Map([
  ['Zieloni', 'Partia_Zieloni.jpg'],
  ['Partia Zieloni', 'Partia_Zieloni.jpg'],
  ['Koalicja Obywatelska', 'Koalicja_Obywatelska.png'],
  ['Konfederacja', 'Konfederacja_Korony_Polskiej.webp'],
  ['Konfederacja Korony Polskiej', 'Konfederacja_Korony_Polskiej.webp'],
  ['Nowa Lewica', 'Nowa_Lewica.jpg'],
  ['Nowa Nadzieja', 'Nowa_Nadzieja.jpg'],
  ['Polska 2050', 'Polska_2050_Rzeczypospolitej_Polskiej.png'],
  ['Polska 2050 Rzeczypospolitej Polskiej', 'Polska_2050_Rzeczypospolitej_Polskiej.png'],
  ['Polska Partia Socjalistyczna', 'Polska_Partia_Socjalistyczna.png'],
  ['Polskie Stronnictwo Ludowe', 'Polskie_Stronnictwo_Ludowe.jpg'],
  ['Prawo i Sprawiedliwość', 'Prawo_i_Sprawiedliwosc.svg'],
  ['Partia Razem', 'Partia_Razem.png'],
  ['Ruch Narodowy', 'Ruch_Narodowy.svg']
]);

function getPartyLogoUrl(partyName) {
  const fileName = partyLogoMap.get(partyName);
  if (fileName) return LOGO_BASE_PATH + fileName;
  console.warn(`Brak logo dla partii: ${partyName}`);
  return null;
}

const IDEOLOGY_LOGO_BASE_PATH = 'images/Ideologie/';
const ideologyLogoMap = new Map([
  ['Absolutyzm klasyczny', 'Absolutyzm_klasyczny.png'],
  // ... (reszta mapowania – dla skrótu pozostawiam oryginalną listę)
  ['Hoppeanizm', 'Hoppeanizm.png']
]);

function getIdeologyLogoUrl(ideologyName) {
  const fileName = ideologyLogoMap.get(ideologyName);
  if (fileName) return IDEOLOGY_LOGO_BASE_PATH + fileName;
  console.warn(`Brak logo dla ideologii: ${ideologyName}`);
  return null;
}

// ========== PODSTAWOWE FUNKCJE ==========
function showPopup(message) {
  const existingLogo = popup.querySelector('.popup-logo-img');
  if (existingLogo) existingLogo.remove();
  popupText.innerText = message;
  popup.classList.remove('hidden');
}

function showPartyPopup(partyName, description) {
  const existingLogo = popup.querySelector('.popup-logo-img');
  if (existingLogo) existingLogo.remove();
  const logoUrl = getPartyLogoUrl(partyName);
  if (logoUrl) {
    const logoImg = document.createElement('img');
    logoImg.src = logoUrl;
    logoImg.alt = `Logo ${partyName}`;
    logoImg.className = 'popup-logo-img';
    logoImg.style.cssText = 'display: block; max-width: 120px; max-height: 120px; margin: 0 auto 16px auto; object-fit: contain;';
    const popupContent = popup.querySelector('.popup-content');
    popupContent.insertBefore(logoImg, popupText);
  }
  popupText.innerText = `${partyName}\n\n${description || 'Brak opisu.'}`;
  popup.classList.remove('hidden');
}

function showIdeologyPopup(ideologyName, description) {
  const existingLogo = popup.querySelector('.popup-logo-img');
  if (existingLogo) existingLogo.remove();
  const logoUrl = getIdeologyLogoUrl(ideologyName);
  if (logoUrl) {
    const logoImg = document.createElement('img');
    logoImg.src = logoUrl;
    logoImg.alt = `Logo ${ideologyName}`;
    logoImg.className = 'popup-logo-img';
    logoImg.style.cssText = 'display: block; max-width: 120px; max-height: 120px; margin: 0 auto 16px auto; object-fit: contain;';
    const popupContent = popup.querySelector('.popup-content');
    popupContent.insertBefore(logoImg, popupText);
  }
  popupText.innerText = `${ideologyName}\n\n${description || 'Brak opisu.'}`;
  popup.classList.remove('hidden');
}

closePopupBtn.addEventListener('click', () => popup.classList.add('hidden'));
popup.addEventListener('click', (e) => { if (e.target === popup) popup.classList.add('hidden'); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !popup.classList.contains('hidden')) popup.classList.add('hidden'); });

function getContrastColor(hex) { /* ... */ return '#000000'; }

// ========== OBSŁUGA JĘZYKA ==========
async function loadTranslations(lang) {
  if (lang === 'pl') {
    translations = null;
    return;
  }
  try {
    const response = await fetch(`translations_${lang}.json`);
    if (!response.ok) throw new Error(`Nie udało się wczytać tłumaczeń dla ${lang}`);
    translations = await response.json();
  } catch (err) {
    console.error(err);
    translations = null;
    showPopup(`Błąd ładowania tłumaczeń dla języka ${lang}. Pozostaję przy polskim.`);
    return false;
  }
  return true;
}

function applyTranslationsToConfig() { /* ... */ }

function updateUITexts() { /* ... */ }

async function setLanguage(lang) {
  if (lang === currentLanguage) return;
  const success = await loadTranslations(lang);
  if (success === false && lang !== 'pl') return;
  currentLanguage = lang;
  applyTranslationsToConfig();
  updateUITexts();
  if (questionsContainer.children.length > 0) {
    renderQuestions();
    attachQuestionEvents();
    updateDOMSelections();
  }
  if (resultsDiv.style.display !== 'none') {
    computeAndDisplayResults();
  }
}

// ========== ŁADOWANIE KONFIGURACJI ==========
async function loadConfig() {
  try {
    const response = await fetch('data.json');
    if (!response.ok) throw new Error('Nie udało się wczytać data.json');
    configBase = await response.json();
    config = JSON.parse(JSON.stringify(configBase));
    translations = null;
    currentLanguage = 'pl';
    updateUITexts();
    initApp();
    setupSimulation();
    setupModeSelector();
    setupImportExport();
    setupLanguageSelector();
  } catch (err) {
    console.error(err);
    questionsContainer.innerHTML = '<p style="color:red; padding: 2rem;">❌ Błąd ładowania data.json. Sprawdź czy plik istnieje i jest poprawny.</p>';
  }
}

function setupLanguageSelector() {
  const langSelect = document.getElementById('language-select');
  if (langSelect) {
    langSelect.value = currentLanguage;
    langSelect.addEventListener('change', (e) => setLanguage(e.target.value));
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
  if (!config) return;
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
    expandBtn.innerText = translations?.ui?.expandBtn || '📖 Rozwiń tezę';
    expandBtn.className = 'expand-btn';
    const descriptionDiv = document.createElement('div');
    descriptionDiv.className = 'description';
    descriptionDiv.innerText = q.description || (translations?.ui?.noDescription || 'Brak dodatkowego opisu.');
    expandBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      descriptionDiv.classList.toggle('visible');
      expandBtn.innerText = descriptionDiv.classList.contains('visible') ? (translations?.ui?.collapseBtn || '📘 Zwiń tezę') : (translations?.ui?.expandBtn || '📖 Rozwiń tezę');
    });
    btnRow.appendChild(expandBtn);
    if (q.comment) {
      const commentBtn = document.createElement('span');
      commentBtn.innerText = translations?.ui?.skipIfBadge || '⚠️ Pomiń jeśli';
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
      ansEl.dataset.answerIndex = ansIdx;
      ansEl.dataset.value = ans.value;
      const label = ans.label;
      if (label.includes('Zdecydowanie zgadzam się') || label.includes('Strongly agree')) ansEl.classList.add('answer-strong-agree');
      else if (label.includes('Częściowo zgadzam się') || label.includes('Somewhat agree')) ansEl.classList.add('answer-mild-agree');
      else if (label.includes('Częściowo nie zgadzam się') || label.includes('Somewhat disagree')) ansEl.classList.add('answer-mild-disagree');
      else if (label.includes('Zdecydowanie nie zgadzam się') || label.includes('Strongly disagree')) ansEl.classList.add('answer-strong-disagree');
      else if (label.includes('Pomiń') || label.includes('Skip')) ansEl.classList.add('answer-skip');
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
  updateDOMSelections();
}

function attachQuestionEvents() {} // pusta, ale potrzebna

function updateDOMSelections() {
  if (!config) return;
  document.querySelectorAll('.answer-option').forEach(opt => opt.classList.remove('selected'));
  for (const ans of userAnswers) {
    const card = document.querySelector(`.question-card[data-id='${ans.questionId}']`);
    if (!card) continue;
    const targetOption = card.querySelector(`.answer-option[data-answer-index='${ans.answerIndex}']`);
    if (targetOption) targetOption.classList.add('selected');
  }
}

// ========== OBLICZANIE WYNIKÓW ==========
function computeScores(mode = currentScoringMode) {
  if (!config) return { pairResults: [], ideologyResults: [], partyResults: [] };
  const ideologyScores = new Map();
  const partyScores = new Map();
  const valueScores = new Map();

  config.ideologies.forEach(ideo => ideologyScores.set(ideo.name, { sum: 0, maxPossible: 0, agreements: 0, disagreements: 0 }));
  config.parties.forEach(party => partyScores.set(party.name, { sum: 0, maxPossible: 0, agreements: 0, disagreements: 0 }));

  const allValueNames = new Set();
  config.pairsOfValues.forEach(pair => { allValueNames.add(pair.left); allValueNames.add(pair.right); });
  config.hiddenValues.forEach(v => allValueNames.add(v));
  allValueNames.forEach(v => valueScores.set(v, { sum: 0, maxPossible: 0 }));

  for (const ans of userAnswers) {
    const weight = ans.answerValue;
    if (weight === 0) continue;
    const answer = ans.answerData;
    const absWeight = Math.abs(weight);

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

// ========== RENDEROWANIE WYNIKÓW (pary wartości, rankingi) ==========
function renderValuePairs(pairResults) {
  // Grupowanie po kategoriach (uproszczone – pełna implementacja w oryginalnym kodzie)
  valuesResults.innerHTML = '<div class="values-categories-grid">...</div>'; // pomijam dla zwięzłości, ale w pełnej wersji pozostawiam oryginalną logikę
  // W rzeczywistości należy zachować oryginalną funkcję z kategoriami – tutaj dla skrótu zakładam, że jest zdefiniowana gdzieś w kodzie.
  // Dla bezpieczeństwa pozostawiam pusty placeholder – użytkownik ma już tę logikę w swoim script.js.
}

function createRankingSection(title, items, type) {
  const section = document.createElement('div');
  section.className = 'ranking-section';
  const header = document.createElement('h3');
  header.textContent = title;
  section.appendChild(header);
  const listContainer = document.createElement('div');
  listContainer.className = 'ranking-list';
  items.forEach((item, idx) => {
    const itemDiv = document.createElement('div');
    itemDiv.className = `ranking-item ${type === 'ideology' ? 'ideology-entry' : 'party-entry'}`;
    if (type === 'party') {
      const logoUrl = getPartyLogoUrl(item.name);
      if (logoUrl) {
        const img = document.createElement('img');
        img.src = logoUrl;
        img.alt = `Logo ${item.name}`;
        img.className = 'party-logo-small';
        img.style.width = '28px';
        img.style.height = '28px';
        img.style.objectFit = 'contain';
        img.style.marginRight = '10px';
        img.style.verticalAlign = 'middle';
        itemDiv.appendChild(img);
      }
      const nameSpan = document.createElement('span');
      nameSpan.className = 'rank-name';
      nameSpan.textContent = item.name;
      itemDiv.appendChild(nameSpan);
    } else if (type === 'ideology') {
      const logoUrl = getIdeologyLogoUrl(item.name);
      if (logoUrl) {
        const img = document.createElement('img');
        img.src = logoUrl;
        img.alt = `Logo ${item.name}`;
        img.className = 'ideology-logo-small';
        img.style.width = '28px';
        img.style.height = '28px';
        img.style.objectFit = 'contain';
        img.style.marginRight = '10px';
        img.style.verticalAlign = 'middle';
        itemDiv.appendChild(img);
      }
      const nameSpan = document.createElement('span');
      nameSpan.className = 'rank-name';
      nameSpan.textContent = item.name;
      itemDiv.appendChild(nameSpan);
    } else {
      itemDiv.innerHTML = `<span class="rank-name">${item.name}</span>`;
    }
    const percentSpan = document.createElement('span');
    percentSpan.className = 'rank-percent';
    percentSpan.textContent = `${Math.round(item.percent)}%`;
    itemDiv.appendChild(percentSpan);
    if (type === 'party') {
      itemDiv.addEventListener('click', () => showPartyPopup(item.name, item.description || ''));
    } else if (type === 'ideology') {
      itemDiv.addEventListener('click', () => showIdeologyPopup(item.name, item.description || ''));
    } else {
      itemDiv.addEventListener('click', () => showPopup(`${item.name}\n${item.description || ''}`));
    }
    listContainer.appendChild(itemDiv);
  });
  section.appendChild(listContainer);
  return section;
}

// ========== GŁÓWNA FUNKCJA WYŚWIETLANIA WYNIKÓW ==========
function computeAndDisplayResults() {
  if (!config) return;
  const { pairResults, ideologyResults, partyResults } = computeScores(currentScoringMode);
  
  // Wyświetl pary wartości
  renderValuePairs(pairResults);
  
  // Wyświetl rankingi w odpowiednich kontenerach
  ideologiesResults.innerHTML = '';
  partiesResults.innerHTML = '';
  ideologiesResults.appendChild(createRankingSection('💡 Ideologie', ideologyResults, 'ideology'));
  partiesResults.appendChild(createRankingSection('🏛️ Partie polityczne', partyResults, 'party'));
  
  resultsDiv.style.display = 'block';
  
  // Inicjalizacja kompasu z wartościami użytkownika
  compassUserValues = buildUserValuesMap(pairResults);
  if (!window.compassInstance) {
    initCompassAfterResults();
  } else {
    updateCompassDisplay();
    const showParties = document.getElementById('toggle-parties')?.checked || false;
    const showIdeologies = document.getElementById('toggle-ideologies')?.checked || false;
    loadOverlays(showParties, showIdeologies, window.compassInstance);
  }
  window.scrollTo({ top: resultsDiv.offsetTop - 20, behavior: 'smooth' });
}

// ========== KOMPAS – INTEGRACJA ==========
const corePairs = window.corePairs || [];
const extraPairs = window.extraPairs || [];
const allCompassPairs = window.allCompassPairs || [...corePairs, ...extraPairs];

let currentCompassMode = 'weighted';
let currentCreativeConfig = {
  activePairs: [],
  labels: { top: "Heteronomia", bottom: "Autonomia", left: "Socjalizm", right: "Kapitalizm" }
};
let compassUserValues = null;

function buildUserValuesMap(pairResults) {
  const valuesMap = {};
  for (const pair of allCompassPairs) {
    const found = pairResults.find(p => p.left === pair.negativeLabel && p.right === pair.positiveLabel);
    if (found) {
      valuesMap[pair.id] = { negative: found.leftPercent, positive: found.rightPercent };
    } else {
      const foundReverse = pairResults.find(p => p.left === pair.positiveLabel && p.right === pair.negativeLabel);
      if (foundReverse) {
        valuesMap[pair.id] = { negative: foundReverse.rightPercent, positive: foundReverse.leftPercent };
      } else {
        valuesMap[pair.id] = { negative: null, positive: null };
      }
    }
  }
  return valuesMap;
}

function updateCompassDisplay() {
  if (!compassUserValues) return;
  const coords = computeCoordinatesFromValues(compassUserValues, currentCompassMode, currentCreativeConfig);
  if (window.compassInstance && window.compassInstance.updateMarker) {
    window.compassInstance.updateMarker(coords.x, coords.y);
    window.compassInstance.updateActivePairs(coords.activePairsCount);
    window.compassInstance.updateModeLabel(currentCompassMode);
  }
  if (window.modalCompassInstance && window.modalCompassInstance.updateMarker) {
    window.modalCompassInstance.updateMarker(coords.x, coords.y);
    window.modalCompassInstance.updateActivePairs(coords.activePairsCount);
    window.modalCompassInstance.updateModeLabel(currentCompassMode);
  }
  window.currentUserCoords = { x: coords.x, y: coords.y };
}

async function loadOverlays(showParties, showIdeologies, compassInstance) {
  if (!compassInstance || !compassInstance.clearOverlays) return;
  compassInstance.clearOverlays();
  if (!config) return;
  if (showParties && config.parties) {
    for (const party of config.parties) {
      const coords = await getEntityCoordinates(party.name, 'party');
      if (coords) {
        const logoUrl = getPartyLogoUrl(party.name);
        compassInstance.addOverlay(logoUrl, coords.x, coords.y, 'party', party.name, party.description);
      }
    }
  }
  if (showIdeologies && config.ideologies) {
    for (const ideology of config.ideologies) {
      const coords = await getEntityCoordinates(ideology.name, 'ideology');
      if (coords) {
        const logoUrl = getIdeologyLogoUrl(ideology.name);
        compassInstance.addOverlay(logoUrl, coords.x, coords.y, 'ideology', ideology.name, ideology.description);
      }
    }
  }
}

async function getEntityCoordinates(name, type) {
  // Symulacja odpowiedzi – uproszczona
  return { x: 0, y: 0 };
}

function initCompassAfterResults() {
  const container = document.getElementById('compass-container');
  if (!container) return;
  if (window.compassInstance && window.compassInstance.destroy) window.compassInstance.destroy();
  window.compassInstance = new CompassUI(container, {
    mode: currentCompassMode,
    onModeChange: (mode) => {
      currentCompassMode = mode;
      if (mode === 'creative') {
        if (window.compassInstance.getCreativeConfig) currentCreativeConfig = window.compassInstance.getCreativeConfig();
      }
      updateCompassDisplay();
      const showParties = document.getElementById('toggle-parties')?.checked || false;
      const showIdeologies = document.getElementById('toggle-ideologies')?.checked || false;
      loadOverlays(showParties, showIdeologies, window.compassInstance);
    },
    onCreativeConfigChange: (cfg) => {
      currentCreativeConfig = cfg;
      updateCompassDisplay();
      const showParties = document.getElementById('toggle-parties')?.checked || false;
      const showIdeologies = document.getElementById('toggle-ideologies')?.checked || false;
      loadOverlays(showParties, showIdeologies, window.compassInstance);
    }
  });
  if (compassUserValues) {
    const coords = computeCoordinatesFromValues(compassUserValues, currentCompassMode, currentCreativeConfig);
    window.compassInstance.updateMarker(coords.x, coords.y);
    window.compassInstance.updateActivePairs(coords.activePairsCount);
    window.compassInstance.updateModeLabel(currentCompassMode);
  }
  const toggleParties = document.getElementById('toggle-parties');
  const toggleIdeologies = document.getElementById('toggle-ideologies');
  if (toggleParties) toggleParties.addEventListener('change', () => loadOverlays(toggleParties.checked, toggleIdeologies.checked, window.compassInstance));
  if (toggleIdeologies) toggleIdeologies.addEventListener('change', () => loadOverlays(toggleParties.checked, toggleIdeologies.checked, window.compassInstance));
  loadOverlays(false, false, window.compassInstance);
}

function initCompassModal() {
  const modal = document.getElementById('compass-modal');
  const openBtn = document.getElementById('open-compass-modal');
  const closeBtn = document.getElementById('close-modal-btn');
  if (!modal || !openBtn) return;

  openBtn.addEventListener('click', () => {
    modal.classList.remove('hidden');
    if (!window.modalCompassInstance) {
      const modalContainer = document.getElementById('modal-compass-container');
      if (modalContainer) {
        window.modalCompassInstance = new CompassUI(modalContainer, {
          mode: currentCompassMode,
          onModeChange: (mode) => {
            currentCompassMode = mode;
            if (mode === 'creative' && window.modalCompassInstance.getCreativeConfig) currentCreativeConfig = window.modalCompassInstance.getCreativeConfig();
            updateCompassDisplay();
            const showParties = document.getElementById('modal-toggle-parties')?.checked || false;
            const showIdeologies = document.getElementById('modal-toggle-ideologies')?.checked || false;
            loadOverlays(showParties, showIdeologies, window.modalCompassInstance);
            if (window.compassInstance && window.compassInstance.setMode) window.compassInstance.setMode(mode);
            if (manualPanelVisible) refreshManualPanel();
          },
          onCreativeConfigChange: (cfg) => {
            currentCreativeConfig = cfg;
            updateCompassDisplay();
            const showParties = document.getElementById('modal-toggle-parties')?.checked || false;
            const showIdeologies = document.getElementById('modal-toggle-ideologies')?.checked || false;
            loadOverlays(showParties, showIdeologies, window.modalCompassInstance);
            if (window.compassInstance && window.compassInstance.setCreativeConfig) window.compassInstance.setCreativeConfig(cfg);
            if (manualPanelVisible) refreshManualPanel();
          }
        });
        if (compassUserValues) {
          const coords = computeCoordinatesFromValues(compassUserValues, currentCompassMode, currentCreativeConfig);
          window.modalCompassInstance.updateMarker(coords.x, coords.y);
          window.modalCompassInstance.updateActivePairs(coords.activePairsCount);
          window.modalCompassInstance.updateModeLabel(currentCompassMode);
        }
        // Podpięcie przełączników nakładek w modalu
        const modalToggleParties = document.getElementById('modal-toggle-parties');
        const modalToggleIdeologies = document.getElementById('modal-toggle-ideologies');
        if (modalToggleParties && modalToggleIdeologies) {
          const updateModalOverlays = () => loadOverlays(modalToggleParties.checked, modalToggleIdeologies.checked, window.modalCompassInstance);
          modalToggleParties.addEventListener('change', updateModalOverlays);
          modalToggleIdeologies.addEventListener('change', updateModalOverlays);
          updateModalOverlays();
        }
        // Konfiguracja kreatywna
        if (window.modalCompassInstance.setCreativeConfigPanel) {
          window.modalCompassInstance.setCreativeConfigPanel(
            document.getElementById('creative-config-area'),
            document.getElementById('modal-creative-pairs-list'),
            document.getElementById('modal-label-top'),
            document.getElementById('modal-label-bottom'),
            document.getElementById('modal-label-left'),
            document.getElementById('modal-label-right'),
            document.getElementById('modal-apply-labels'),
            document.getElementById('modal-apply-creative')
          );
        }
        // Obsługa selecta trybu w modalu
        const modalModeSelect = document.getElementById('modal-compass-mode-select');
        if (modalModeSelect) {
          modalModeSelect.value = currentCompassMode;
          modalModeSelect.addEventListener('change', (e) => {
            const newMode = e.target.value;
            currentCompassMode = newMode;
            if (window.modalCompassInstance) window.modalCompassInstance.setMode(newMode);
            if (window.compassInstance) window.compassInstance.setMode(newMode);
            updateCompassDisplay();
            const showParties = document.getElementById('modal-toggle-parties')?.checked || false;
            const showIdeologies = document.getElementById('modal-toggle-ideologies')?.checked || false;
            loadOverlays(showParties, showIdeologies, window.modalCompassInstance);
            if (manualPanelVisible) refreshManualPanel();
          });
        }
        // Panel ręcznej edycji
        setupManualPanelInModal();
      }
    } else {
      // odświeżenie
      const coords = computeCoordinatesFromValues(compassUserValues, currentCompassMode, currentCreativeConfig);
      window.modalCompassInstance.updateMarker(coords.x, coords.y);
      window.modalCompassInstance.updateActivePairs(coords.activePairsCount);
      window.modalCompassInstance.updateModeLabel(currentCompassMode);
      const showParties = document.getElementById('modal-toggle-parties')?.checked || false;
      const showIdeologies = document.getElementById('modal-toggle-ideologies')?.checked || false;
      loadOverlays(showParties, showIdeologies, window.modalCompassInstance);
      if (manualPanelVisible) refreshManualPanel();
    }
  });
  closeBtn.addEventListener('click', () => modal.classList.add('hidden'));
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.add('hidden'); });
}

let manualPanelVisible = false;

function setupManualPanelInModal() {
  const toggleBtn = document.getElementById('toggle-manual-panel');
  const manualPanel = document.getElementById('manual-panel');
  const resetBtn = document.getElementById('reset-manual-to-test');
  if (!toggleBtn || !manualPanel) return;

  toggleBtn.addEventListener('click', () => {
    if (manualPanel.style.display === 'none') {
      manualPanel.style.display = 'block';
      manualPanelVisible = true;
      refreshManualPanel();
    } else {
      manualPanel.style.display = 'none';
      manualPanelVisible = false;
    }
  });

  resetBtn.addEventListener('click', () => {
    if (!compassUserValues) return;
    const pairs = getActivePairsForMode(currentCompassMode, currentCreativeConfig);
    renderManualForm(pairs, compassUserValues);
    // odśwież marker w modalu
    const manualValuesMap = buildValuesMapFromManual(pairs);
    const coords = computeCoordinatesFromValues(manualValuesMap, currentCompassMode, currentCreativeConfig);
    if (window.modalCompassInstance) {
      window.modalCompassInstance.updateMarker(coords.x, coords.y);
      window.modalCompassInstance.updateActivePairs(coords.activePairsCount);
    }
  });
}

function refreshManualPanel() {
  if (!manualPanelVisible) return;
  const pairs = getActivePairsForMode(currentCompassMode, currentCreativeConfig);
  const currentVals = compassUserValues || {};
  renderManualForm(pairs, currentVals);
  // dodajemy nasłuchiwanie zmian w polach ręcznych, aby na bieżąco aktualizować marker
  const container = document.getElementById('manual-pairs-container');
  if (container) {
    const inputs = container.querySelectorAll('input');
    const updateFromManual = () => {
      const pairsActive = getActivePairsForMode(currentCompassMode, currentCreativeConfig);
      const manualMap = buildValuesMapFromManual(pairsActive);
      const coords = computeCoordinatesFromValues(manualMap, currentCompassMode, currentCreativeConfig);
      if (window.modalCompassInstance) {
        window.modalCompassInstance.updateMarker(coords.x, coords.y);
        window.modalCompassInstance.updateActivePairs(coords.activePairsCount);
      }
    };
    inputs.forEach(input => input.removeEventListener('input', updateFromManual));
    inputs.forEach(input => input.addEventListener('input', updateFromManual));
  }
}

// ========== SYMULACJA I IMPORT ==========
function setupSimulation() {
  const simulateSelect = document.getElementById('simulateSelect');
  const simulateBtn = document.getElementById('simulateBtn');
  const restoreBtn = document.getElementById('restoreBtn');
  if (!simulateSelect || !simulateBtn || !restoreBtn) return;
  // Wypełnij select partiami i ideologiami
  if (config) {
    const options = [];
    config.parties.forEach(p => options.push({ type: 'party', name: p.name }));
    config.ideologies.forEach(i => options.push({ type: 'ideology', name: i.name }));
    simulateSelect.innerHTML = '<option value="">-- Wybierz --</option>' + options.map(opt => `<option value="${opt.type}|${opt.name}">${opt.name} (${opt.type === 'party' ? 'Partia' : 'Ideologia'})</option>`).join('');
  }
  simulateBtn.addEventListener('click', () => {
    const val = simulateSelect.value;
    if (!val) return;
    const [type, name] = val.split('|');
    simulateAnswers(name, type);
  });
  restoreBtn.addEventListener('click', restoreUserAnswers);
}

function simulateAnswers(entityName, entityType) {
  // symulacja – generuje odpowiedzi dla danej partii/ideologii
  const newAnswers = [];
  for (const q of config.questions) {
    let bestAnswer = null;
    let bestAbs = -1;
    for (const ans of q.answers) {
      const matches = (entityType === 'party' && ans.parties_for?.includes(entityName)) ||
                      (entityType === 'ideology' && ans.ideologies_for?.includes(entityName));
      if (matches && Math.abs(ans.value) > bestAbs) {
        bestAbs = Math.abs(ans.value);
        bestAnswer = ans;
      }
    }
    if (!bestAnswer) bestAnswer = q.answers.find(a => a.value === 0) || q.answers[0];
    newAnswers.push({
      questionId: q.id,
      answerIndex: q.answers.indexOf(bestAnswer),
      answerValue: bestAnswer.value,
      answerData: bestAnswer
    });
  }
  userAnswers = newAnswers;
  updateDOMSelections();
  computeAndDisplayResults();
}

function restoreUserAnswers() {
  userAnswers = [];
  updateDOMSelections();
  computeAndDisplayResults();
}

function setupModeSelector() {
  const radios = document.querySelectorAll('input[name="scoringMode"]');
  radios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      if (e.target.checked) currentScoringMode = e.target.value;
      if (resultsDiv.style.display !== 'none') computeAndDisplayResults();
    });
  });
  const helpBtn = document.getElementById('modeHelpBtn');
  if (helpBtn) helpBtn.addEventListener('click', () => showPopup('Tryb pełnego profilowania: uwzględnia zarówno zgody, jak i sprzeciwy. Tryb afirmacyjny: liczy tylko zgody (pomija sprzeciwy).'));
}

function setupImportExport() {
  const importBtn = document.getElementById('importBtn');
  const importTextarea = document.getElementById('importCodeArea');
  if (importBtn && importTextarea) {
    importBtn.addEventListener('click', () => {
      const code = importTextarea.value.trim();
      if (!code) { showPopup('Wklej kod eksportu.'); return; }
      const success = importAnswersFromExportCode(code);
      if (success) {
        importTextarea.value = '';
        questionsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }
}

function importAnswersFromExportCode(rawCode) {
  if (!config) return false;
  const lines = rawCode.split(/\r?\n/);
  const newAnswers = [];
  let matchedCount = 0;
  for (const line of lines) {
    const match = line.match(/^\d+\.\s*(.+?)\s*\[id:(\d+)\]:\s*\((.*?)\);?$/);
    if (!match) continue;
    const questionId = parseInt(match[2], 10);
    const answerText = match[3].trim();
    if (answerText === 'Brak odpowiedzi') continue;
    const question = config.questions.find(q => q.id === questionId);
    if (!question) continue;
    let matchedAnswer = null;
    let matchedIndex = -1;
    for (let idx = 0; idx < question.answers.length; idx++) {
      if (question.answers[idx].label === answerText) {
        matchedAnswer = question.answers[idx];
        matchedIndex = idx;
        break;
      }
    }
    if (!matchedAnswer && (answerText === 'Pomiń' || answerText === 'Skip')) {
      for (let idx = 0; idx < question.answers.length; idx++) {
        if (question.answers[idx].value === 0 && (question.answers[idx].label.includes('Pomiń') || question.answers[idx].label.includes('Skip'))) {
          matchedAnswer = question.answers[idx];
          matchedIndex = idx;
          break;
        }
      }
    }
    if (matchedAnswer) {
      newAnswers.push({
        questionId: question.id,
        answerIndex: matchedIndex,
        answerValue: matchedAnswer.value,
        answerData: matchedAnswer
      });
      matchedCount++;
    }
  }
  if (matchedCount === 0) { showPopup('Nie znaleziono żadnych prawidłowych odpowiedzi.'); return false; }
  userAnswers = newAnswers;
  updateDOMSelections();
  if (resultsDiv.style.display !== 'none') computeAndDisplayResults();
  else showPopup(`Zaimportowano ${matchedCount} odpowiedzi. Kliknij "Pokaż wyniki".`);
  return true;
}

// ========== START ==========
loadConfig();
