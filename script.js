// -------------------------------
// GLOBALNE ZMIENNE I DANE
// -------------------------------
let config = null;        // wczytany JSON
let userAnswers = [];     // tablica odpowiedzi { questionId, answerIndex, answerValue, answerData }

// Elementy DOM
const questionsContainer = document.getElementById('questions-container');
const submitBtn = document.getElementById('submitBtn');
const resultsDiv = document.getElementById('results-container');
const valuesResults = document.getElementById('values-results');
const ideologiesResults = document.getElementById('ideologies-results');
const partiesResults = document.getElementById('parties-results');
const popup = document.getElementById('popup');
const popupText = document.getElementById('popup-text');
const closePopupBtn = document.getElementById('closePopup');

// POMOCNICZE: popup
function showPopup(message) {
  popupText.innerText = message;
  popup.classList.remove('hidden');
}
closePopupBtn.addEventListener('click', () => {
  popup.classList.add('hidden');
});
popup.addEventListener('click', (e) => {
  if (e.target === popup) popup.classList.add('hidden');
});

// Dodanie zamykania popupu klawiszem ESC
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !popup.classList.contains('hidden')) {
    popup.classList.add('hidden');
  }
});

// -------------------------------
// WCZYTYWANIE KONFIGURACJI
// -------------------------------
async function loadConfig() {
  try {
    const response = await fetch('data.json');
    if (!response.ok) throw new Error('Nie udało się wczytać data.json');
    config = await response.json();
    initApp();
  } catch (err) {
    console.error(err);
    questionsContainer.innerHTML = '<p style="color:red;">Błąd ładowania konfiguracji. Sprawdź czy plik data.json istnieje i jest poprawny.</p>';
  }
}

// Inicjalizacja po danych
function initApp() {
  renderQuestions();
  attachQuestionEvents();
  submitBtn.addEventListener('click', computeAndDisplayResults);
  initThemeToggle(); // inicjalizacja przełącznika trybu
}

// -------------------------------
// PRZEŁĄCZNIK TRYBU JASNY/CIEMNY
// -------------------------------
function initThemeToggle() {
  const toggleBtn = document.getElementById('theme-toggle');
  const root = document.body;
  // Sprawdź zapisany motyw lub preferencję systemową
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    root.classList.add('dark');
    toggleBtn.textContent = '☀️';
  } else if (savedTheme === 'light') {
    root.classList.remove('dark');
    toggleBtn.textContent = '🌙';
  } else {
    // Preferencja systemowa
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark) {
      root.classList.add('dark');
      toggleBtn.textContent = '☀️';
    } else {
      root.classList.remove('dark');
      toggleBtn.textContent = '🌙';
    }
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

// -------------------------------
// RENDEROWANIE PYTAŃ (z kolorami odpowiedzi)
// -------------------------------
function renderQuestions() {
  questionsContainer.innerHTML = '';
  config.questions.forEach((q, idx) => {
    const card = document.createElement('div');
    card.className = 'question-card';
    card.dataset.id = q.id;

    // treść pytania
    const questionText = document.createElement('div');
    questionText.className = 'question-text';
    questionText.innerText = `${idx+1}. ${q.text}`;
    card.appendChild(questionText);

    // przyciski rozwijania i komentarz
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

    // odpowiedzi
    const answersDiv = document.createElement('div');
    answersDiv.className = 'answers';
    q.answers.forEach((ans, ansIdx) => {
      const ansEl = document.createElement('div');
      ansEl.className = 'answer-option';
      ansEl.innerText = ans.label;
      ansEl.dataset.answerIdx = ansIdx;
      ansEl.dataset.value = ans.value;

      // Dodanie klasy koloru w zależności od etykiety
      const label = ans.label;
      if (label.includes('Zdecydowanie zgadzam się')) {
        ansEl.classList.add('answer-strong-agree');
      } else if (label.includes('Częściowo zgadzam się')) {
        ansEl.classList.add('answer-mild-agree');
      } else if (label.includes('Częściowo nie zgadzam się')) {
        ansEl.classList.add('answer-mild-disagree');
      } else if (label.includes('Zdecydowanie nie zgadzam się')) {
        ansEl.classList.add('answer-strong-disagree');
      } else if (label.includes('Pomiń')) {
        ansEl.classList.add('answer-skip');
      }

      ansEl.addEventListener('click', () => {
        // odznacz inne w tym pytaniu
        const siblings = answersDiv.querySelectorAll('.answer-option');
        siblings.forEach(sib => sib.classList.remove('selected'));
        ansEl.classList.add('selected');
        // zapisz odpowiedź
        const existing = userAnswers.findIndex(a => a.questionId === q.id);
        const answerObj = {
          questionId: q.id,
          answerIndex: ansIdx,
          answerValue: ans.value,
          answerData: ans
        };
        if (existing !== -1) {
          userAnswers[existing] = answerObj;
        } else {
          userAnswers.push(answerObj);
        }
      });
      answersDiv.appendChild(ansEl);
    });
    card.appendChild(answersDiv);
    questionsContainer.appendChild(card);
  });
}

function attachQuestionEvents() {}

// -------------------------------
// NOWA WERSJA ALGORYTMU LICZENIA ZGODNOŚCI
// -------------------------------
function computeScores() {
  const ideologyScores = new Map();
  const partyScores = new Map();
  const valueScores = new Map();

  // Inicjalizacja
  config.ideologies.forEach(ideo => {
    ideologyScores.set(ideo.name, { sum: 0, maxPossible: 0, agreements: 0, disagreements: 0 });
  });
  config.parties.forEach(party => {
    partyScores.set(party.name, { sum: 0, maxPossible: 0, agreements: 0, disagreements: 0 });
  });

  const allValueNames = new Set();
  config.pairsOfValues.forEach(pair => {
    allValueNames.add(pair.left);
    allValueNames.add(pair.right);
  });
  config.hiddenValues.forEach(v => allValueNames.add(v));
  allValueNames.forEach(v => {
    valueScores.set(v, { sum: 0, maxPossible: 0, questionsInvolved: 0 });
  });

  // Dla każdej odpowiedzi użytkownika
  for (const ans of userAnswers) {
    const weight = ans.answerValue;
    if (weight === 0) continue; // pominięte

    const answer = ans.answerData;
    const absWeight = Math.abs(weight);

    // ------ Ideologie ------
    for (const ideo of (answer.ideologies_for || [])) {
      const rec = ideologyScores.get(ideo);
      if (rec) {
        rec.sum += absWeight;
        rec.maxPossible += 1.5;
        if (weight > 0) rec.agreements++;
        else if (weight < 0) rec.disagreements++;
      }
    }
    for (const ideo of (answer.ideologies_against || [])) {
      const rec = ideologyScores.get(ideo);
      if (rec) {
        rec.sum -= absWeight;
        rec.maxPossible += 1.5;
        if (weight < 0) rec.agreements++;
        else if (weight > 0) rec.disagreements++;
      }
    }

    // ------ Partie ------
    for (const party of (answer.parties_for || [])) {
      const rec = partyScores.get(party);
      if (rec) {
        rec.sum += absWeight;
        rec.maxPossible += 1.5;
        if (weight > 0) rec.agreements++;
        else if (weight < 0) rec.disagreements++;
      }
    }
    for (const party of (answer.parties_against || [])) {
      const rec = partyScores.get(party);
      if (rec) {
        rec.sum -= absWeight;
        rec.maxPossible += 1.5;
        if (weight < 0) rec.agreements++;
        else if (weight > 0) rec.disagreements++;
      }
    }

    // ------ Wartości ------
    for (const val of (answer.values_for || [])) {
      const rec = valueScores.get(val);
      if (rec) {
        rec.sum += absWeight;
        rec.maxPossible += 1.5;
      }
    }
    for (const val of (answer.values_against || [])) {
      const rec = valueScores.get(val);
      if (rec) {
        rec.sum -= absWeight;
        rec.maxPossible += 1.5;
      }
    }
  }

  function normalizeScore(rec) {
    if (!rec || rec.maxPossible === 0) return 50;
    let raw = rec.sum;
    let normalized = (raw + rec.maxPossible) / (2 * rec.maxPossible) * 100;
    return Math.min(100, Math.max(0, normalized));
  }

  // Wyniki ideologii
  const ideologyResults = [];
  for (let [name, rec] of ideologyScores.entries()) {
    ideologyResults.push({
      name,
      percent: normalizeScore(rec),
      agreements: rec.agreements || 0,
      disagreements: rec.disagreements || 0,
      involved: rec.maxPossible / 1.5,
      description: config.ideologies.find(i => i.name === name)?.description || ''
    });
  }
  ideologyResults.sort((a,b) => b.percent - a.percent);

  // Wyniki partii
  const partyResults = [];
  for (let [name, rec] of partyScores.entries()) {
    partyResults.push({
      name,
      percent: normalizeScore(rec),
      agreements: rec.agreements || 0,
      disagreements: rec.disagreements || 0,
      involved: rec.maxPossible / 1.5,
      description: config.parties.find(p => p.name === name)?.description || ''
    });
  }
  partyResults.sort((a,b) => b.percent - a.percent);

  // Wartości – analogicznie
  const valuePercentMap = new Map();
  for (let [name, rec] of valueScores.entries()) {
    valuePercentMap.set(name, normalizeScore(rec));
  }

  const pairResults = [];
  for (let pair of config.pairsOfValues) {
    let leftScore = valuePercentMap.get(pair.left) ?? 50;
    let rightScore = valuePercentMap.get(pair.right) ?? 50;
    let total = leftScore + rightScore;
    if (total === 0) {
      leftScore = 50; rightScore = 50;
    } else {
      leftScore = (leftScore / total) * 100;
      rightScore = 100 - leftScore;
    }
    pairResults.push({
      left: pair.left,
      right: pair.right,
      leftPercent: leftScore,
      rightPercent: rightScore,
      leftDef: pair.leftDef,
      rightDef: pair.rightDef
    });
  }

  return { pairResults, ideologyResults, partyResults };
}

// -------------------------------
// FUNKCJE POMOCNICZE DO RANKINGÓW Z PRZYCISKIEM ZWIJANIA
// -------------------------------
function createRankingSection(title, items, type) {
  const section = document.createElement('div');
  section.className = 'ranking-section';
  const header = document.createElement('h3');
  header.textContent = title;
  section.appendChild(header);
  
  // Podpowiedź (jak w oryginale)
  if (title.includes('Ideologii')) {
    const info = document.createElement('div');
    info.style.marginBottom = '1rem';
    info.textContent = 'Im wyższy procent, tym bardziej Twój profil jest zgodny z daną ideologią.';
    section.appendChild(info);
  }
  
  const listContainer = document.createElement('div');
  listContainer.className = 'ranking-list';
  
  // Tworzenie wszystkich elementów
  const itemsElements = [];
  items.forEach((item, idx) => {
    const itemDiv = document.createElement('div');
    itemDiv.className = `ranking-item ${type === 'ideology' ? 'ideology-entry' : 'party-entry'}`;
    itemDiv.innerHTML = `<span class="rank-name">${item.name}</span><span class="rank-percent">${Math.round(item.percent)}%</span>`;
    // Dodanie eventu popup (zachowanie oryginalne)
    itemDiv.addEventListener('click', () => {
      const desc = item.description || '';
      showPopup(`${item.name}\n${desc}\n\nZgodnych odpowiedzi: ${item.agreements}\nSprzecznych: ${item.disagreements}\nPytania z stanowiskiem: ${item.involved}`);
    });
    itemsElements.push(itemDiv);
    listContainer.appendChild(itemDiv);
  });
  
  // Jeśli więcej niż 3, dodajemy przycisk i ukrywamy nadmiarowe
  if (itemsElements.length > 3) {
    // Ukryj elementy od indexu 3
    for (let i = 3; i < itemsElements.length; i++) {
      itemsElements[i].classList.add('hidden-rank-item');
    }
    const toggleBtn = document.createElement('button');
    toggleBtn.textContent = 'Pokaż więcej';
    toggleBtn.className = 'toggle-rank-btn';
    let expanded = false;
    toggleBtn.addEventListener('click', () => {
      const hiddenItems = listContainer.querySelectorAll('.hidden-rank-item');
      if (expanded) {
        hiddenItems.forEach(el => el.classList.add('hidden-rank-item'));
        toggleBtn.textContent = 'Pokaż więcej';
      } else {
        hiddenItems.forEach(el => el.classList.remove('hidden-rank-item'));
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

// -------------------------------
// WYŚWIETLANIE WYNIKÓW
// -------------------------------
function computeAndDisplayResults() {
  const { pairResults, ideologyResults, partyResults } = computeScores();

  // Wyświetl pary wartości (bez zmian)
  valuesResults.innerHTML = '<h3>⚖️ Pary wartości</h3>';
  pairResults.forEach(pair => {
    const pairDiv = document.createElement('div');
    pairDiv.className = 'value-pair';
    pairDiv.innerHTML = `
      <div class="value-bar-container">
        <span class="value-left" data-def="${pair.leftDef}">${pair.left}</span>
        <div class="value-bar">
          <div class="bar-left" style="width: ${pair.leftPercent}%;">${Math.round(pair.leftPercent)}%</div>
          <div class="bar-right" style="width: ${pair.rightPercent}%;">${Math.round(pair.rightPercent)}%</div>
        </div>
        <span class="value-right" data-def="${pair.rightDef}">${pair.right}</span>
      </div>
    `;
    const leftSpan = pairDiv.querySelector('.value-left');
    const rightSpan = pairDiv.querySelector('.value-right');
    leftSpan.addEventListener('click', () => showPopup(pair.leftDef));
    rightSpan.addEventListener('click', () => showPopup(pair.rightDef));
    valuesResults.appendChild(pairDiv);
  });

  // Ranking ideologii z przyciskiem rozwijania
  ideologiesResults.innerHTML = '';
  const ideoSection = createRankingSection('📊 Ranking ideologii (zgodność %)', ideologyResults, 'ideology');
  ideologiesResults.appendChild(ideoSection);
  
  // Ranking partii z przyciskiem rozwijania
  partiesResults.innerHTML = '';
  const partySection = createRankingSection('🗳️ Ranking partii (zgodność %)', partyResults, 'party');
  partiesResults.appendChild(partySection);

  resultsDiv.style.display = 'block';
  window.scrollTo({ top: resultsDiv.offsetTop - 20, behavior: 'smooth' });
}

// Uruchom
loadConfig();
