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
}

// -------------------------------
// RENDEROWANIE PYTAŃ
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
    expandBtn.innerText = '📖 Rozwiń pytanie';
    expandBtn.className = 'expand-btn';
    const descriptionDiv = document.createElement('div');
    descriptionDiv.className = 'description';
    descriptionDiv.innerText = q.description || 'Brak dodatkowego opisu.';
    expandBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      descriptionDiv.classList.toggle('visible');
      expandBtn.innerText = descriptionDiv.classList.contains('visible') ? '📘 Zwiń' : '📖 Rozwiń pytanie';
    });
    btnRow.appendChild(expandBtn);

    if (q.comment) {
      const commentBtn = document.createElement('span');
      commentBtn.innerText = '💬 komentarz twórcy';
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

// dummy – bo attach już jest w renderze, ale zostawiam funkcję
function attachQuestionEvents() {}

// -------------------------------
// ALGORYTM LICZENIA ZGODNOŚCI
// -------------------------------
function computeScores() {
  // Inicjalizacja map dla ideologii, partii i wartości (wszystkie wartości zdefiniowane w pytaniach)
  const ideologyScores = new Map(); // { name: { sum:0, maxPossible:0, questionsCount:0, agreements:0, disagreements:0 } }
  const partyScores = new Map();
  const valueScores = new Map(); // dla każdej wartości (w tym ukrytych)

  // Najpierw zbierz wszystkie możliwe nazwy z konfiguracji (ideologie, partie)
  config.ideologies.forEach(ideo => {
    ideologyScores.set(ideo.name, { sum: 0, maxPossible: 0, questionsInvolved: 0, agreements: 0, disagreements: 0 });
  });
  config.parties.forEach(party => {
    partyScores.set(party.name, { sum: 0, maxPossible: 0, questionsInvolved: 0, agreements: 0, disagreements: 0 });
  });

  // Dla wartości: wszystkie występujące w odpowiedziach (values_for, values_against) – zostaną dodane dynamicznie
  // ale także pary wartości i hiddenValues – muszą istnieć, aby je pokazać.
  // Zainicjuj wszystkie wartości z par oraz hidden
  const allValueNames = new Set();
  config.pairsOfValues.forEach(pair => {
    allValueNames.add(pair.left);
    allValueNames.add(pair.right);
  });
  config.hiddenValues.forEach(v => allValueNames.add(v));
  // oraz dodaj wartości, które pojawiają się tylko w odpowiedziach (choć pewnie są w parach)
  allValueNames.forEach(v => {
    if (!valueScores.has(v)) valueScores.set(v, { sum: 0, maxPossible: 0, questionsInvolved: 0 });
  });

  // Dla każdej udzielonej odpowiedzi (pomijamy pominięte – wartość 0, ale i tak liczymy maxPossible tylko dla pytań, gdzie ideologia wystąpiła)
  // Najpierw przejdź przez wszystkie pytania, aby dla każdej ideologii/partii/wartości obliczyć maxPossible (teoretyczny max)
  // Uwaga: dla każdego pytania, jeśli ideologia występuje w którejkolwiek odpowiedzi (for lub against), to maksymalny wkład to 1.5 (wartość bezwzględna)
  // Ale uprościmy: przy każdej odpowiedzi użytkownika dla danego pytania sprawdzamy, czy ideologia występuje w odpowiedzi (for/against),
  // ale pytanie mogło mieć wiele odpowiedzi z różnymi powiązaniami. Dla maxPossible bierzemy pod uwagę, że w danym pytaniu maksymalny score to 1.5,
  // niezależnie od tego, którą odpowiedź by wybrał.
  // Aby to policzyć, dla każdego pytania i każdej ideologii/partii/wartości sprawdzamy, czy w OGÓLE występuje w którejś odpowiedzi (for lub against).
  // Jeśli tak, to dodajemy do maxPossible 1.5.
  // Jednocześnie dla faktycznej odpowiedzi liczymy sumę.

  // Przygotuj mapy pytanie -> zbiory ideologii/partii/wartości występujących
  const questionIdeologies = new Map();
  const questionParties = new Map();
  const questionValues = new Map();

  config.questions.forEach(q => {
    const ideoSet = new Set();
    const partySet = new Set();
    const valueSet = new Set();
    q.answers.forEach(ans => {
      ans.ideologies_for?.forEach(i => ideoSet.add(i));
      ans.ideologies_against?.forEach(i => ideoSet.add(i));
      ans.parties_for?.forEach(p => partySet.add(p));
      ans.parties_against?.forEach(p => partySet.add(p));
      ans.values_for?.forEach(v => valueSet.add(v));
      ans.values_against?.forEach(v => valueSet.add(v));
    });
    questionIdeologies.set(q.id, ideoSet);
    questionParties.set(q.id, partySet);
    questionValues.set(q.id, valueSet);
  });

  // Dodaj maxPossible dla każdej ideologii
  for (let [ideoName, data] of ideologyScores.entries()) {
    let max = 0;
    for (let [qId, ideoSet] of questionIdeologies.entries()) {
      if (ideoSet.has(ideoName)) {
        max += 1.5;
        data.questionsInvolved++;
      }
    }
    data.maxPossible = max;
  }
  for (let [partyName, data] of partyScores.entries()) {
    let max = 0;
    for (let [qId, partySet] of questionParties.entries()) {
      if (partySet.has(partyName)) {
        max += 1.5;
        data.questionsInvolved++;
      }
    }
    data.maxPossible = max;
  }
  for (let [valueName, data] of valueScores.entries()) {
    let max = 0;
    for (let [qId, valueSet] of questionValues.entries()) {
      if (valueSet.has(valueName)) {
        max += 1.5;
        data.questionsInvolved++;
      }
    }
    data.maxPossible = max;
  }

  // Teraz przelicz sumy na podstawie faktycznych odpowiedzi użytkownika
  userAnswers.forEach(ans => {
    const answer = ans.answerData;
    const weight = ans.answerValue; // od -1.5 do 1.5
    if (weight === 0) return; // pominięte – bez wpływu

    // Ideologie
    (answer.ideologies_for || []).forEach(ideo => {
      const rec = ideologyScores.get(ideo);
      if (rec) {
        rec.sum += weight;
        if (weight > 0) rec.agreements++;
        else if (weight < 0) rec.disagreements++;
      }
    });
    (answer.ideologies_against || []).forEach(ideo => {
      const rec = ideologyScores.get(ideo);
      if (rec) {
        rec.sum -= weight;  // przeciwna odpowiedź: odwracamy znak
        if (weight < 0) rec.agreements++;  // bo np. -1.5 -> -(-1.5)=+1.5 -> zgodność
        else if (weight > 0) rec.disagreements++;
      }
    });

    // Partie
    (answer.parties_for || []).forEach(party => {
      const rec = partyScores.get(party);
      if (rec) {
        rec.sum += weight;
        if (weight > 0) rec.agreements++;
        else if (weight < 0) rec.disagreements++;
      }
    });
    (answer.parties_against || []).forEach(party => {
      const rec = partyScores.get(party);
      if (rec) {
        rec.sum -= weight;
        if (weight < 0) rec.agreements++;
        else if (weight > 0) rec.disagreements++;
      }
    });

    // Wartości
    (answer.values_for || []).forEach(val => {
      const rec = valueScores.get(val);
      if (rec) {
        rec.sum += weight;
      }
    });
    (answer.values_against || []).forEach(val => {
      const rec = valueScores.get(val);
      if (rec) {
        rec.sum -= weight;
      }
    });
  });

  // Przelicz na procent (0-100) dla każdego elementu
  function normalizeScore(rec) {
    if (!rec || rec.maxPossible === 0) return 50; // neutralne
    let raw = rec.sum;
    // zakres -maxPossible .. +maxPossible
    let normalized = (raw + rec.maxPossible) / (2 * rec.maxPossible) * 100;
    return Math.min(100, Math.max(0, normalized));
  }

  const ideologyResults = [];
  for (let [name, rec] of ideologyScores.entries()) {
    ideologyResults.push({
      name,
      percent: normalizeScore(rec),
      agreements: rec.agreements || 0,
      disagreements: rec.disagreements || 0,
      involved: rec.questionsInvolved,
      description: config.ideologies.find(i => i.name === name)?.description || ''
    });
  }
  ideologyResults.sort((a,b) => b.percent - a.percent);

  const partyResults = [];
  for (let [name, rec] of partyScores.entries()) {
    partyResults.push({
      name,
      percent: normalizeScore(rec),
      agreements: rec.agreements || 0,
      disagreements: rec.disagreements || 0,
      involved: rec.questionsInvolved,
      description: config.parties.find(p => p.name === name)?.description || ''
    });
  }
  partyResults.sort((a,b) => b.percent - a.percent);

  // Wartości dla par – przygotuj mapę wyników wartości
  const valuePercentMap = new Map();
  for (let [name, rec] of valueScores.entries()) {
    valuePercentMap.set(name, normalizeScore(rec));
  }

  // Pary wartości
  const pairResults = [];
  for (let pair of config.pairsOfValues) {
    let leftScore = valuePercentMap.get(pair.left) ?? 50;
    let rightScore = valuePercentMap.get(pair.right) ?? 50;
    // przeskaluj, żeby suma była 100
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
// WYŚWIETLANIE WYNIKÓW
// -------------------------------
function computeAndDisplayResults() {
  const { pairResults, ideologyResults, partyResults } = computeScores();

  // Wyświetl pary wartości
  valuesResults.innerHTML = '<h3>⚖️ Wartości;
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
    // Dodanie kliknięcia do definicji
    const leftSpan = pairDiv.querySelector('.value-left');
    const rightSpan = pairDiv.querySelector('.value-right');
    leftSpan.addEventListener('click', () => showPopup(pair.leftDef));
    rightSpan.addEventListener('click', () => showPopup(pair.rightDef));
    valuesResults.appendChild(pairDiv);
  });

  // Ranking ideologii
  ideologiesResults.innerHTML = '<h3>📊 Ranking ideologii (zgodność %)</h3><div style="margin-bottom:1rem;">Im wyższy procent, tym bardziej Twój profil jest zgodny z daną ideologią.</div>';
  const ideoList = document.createElement('div');
  ideologyResults.forEach(ideo => {
    const item = document.createElement('div');
    item.className = 'ranking-item ideology-entry';
    item.innerHTML = `<span class="rank-name">${ideo.name}</span><span class="rank-percent">${Math.round(ideo.percent)}%</span>`;
    item.addEventListener('click', () => {
      showPopup(`${ideo.name}\n${ideo.description}\n\nZgodnych odpowiedzi: ${ideo.agreements}\nSprzecznych: ${ideo.disagreements}\nPytania z stanowiskiem: ${ideo.involved}`);
    });
    ideoList.appendChild(item);
  });
  ideologiesResults.appendChild(ideoList);

  // Ranking partii
  partiesResults.innerHTML = '<h3>🗳️ Ranking partii (zgodność %)</h3>';
  const partyList = document.createElement('div');
  partyResults.forEach(party => {
    const item = document.createElement('div');
    item.className = 'ranking-item party-entry';
    item.innerHTML = `<span class="rank-name">${party.name}</span><span class="rank-percent">${Math.round(party.percent)}%</span>`;
    item.addEventListener('click', () => {
      showPopup(`${party.name}\n${party.description}\n\nZgodnych odpowiedzi: ${party.agreements}\nSprzecznych: ${party.disagreements}\nPytania z stanowiskiem: ${party.involved}`);
    });
    partyList.appendChild(item);
  });
  partiesResults.appendChild(partyList);

  resultsDiv.style.display = 'block';
  window.scrollTo({ top: resultsDiv.offsetTop - 20, behavior: 'smooth' });
}

// Uruchom
loadConfig();
