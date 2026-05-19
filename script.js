// -------------------------------
// GLOBALNE ZMIENNE I DANE
// -------------------------------
let config = null;
let userAnswers = [];
let lastValueScoresMap = null;      // przechowuje Mapę wartości z {sum, maxPossible}
let compassPanel = null;

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

// Kompas DOM
const compassPanelDiv = document.getElementById('compass-panel');
const canvas = document.getElementById('compassCanvas');
const coordXSpan = document.getElementById('coordX');
const coordYSpan = document.getElementById('coordY');
const weightToggle = document.getElementById('weightModeToggle');

// -------------------------------
// DEFINICJE OSI KOMPASU (bez tekstu na samym rysunku)
// -------------------------------
const COMPASS_AXES = {
  x: [
    { left: "Własność kolektywna", right: "Własność prywatna", weight: 1 },
    { left: "Planowanie", right: "Rynek", weight: 1 }
  ],
  y: [
    { down: "Autonomia", up: "Heteronomia", weight: 5 },
    { down: "Anarchia", up: "Etatyzm", weight: 5 },
    { down: "Decentralizacja", up: "Centralizacja", weight: 1.25 },
    { down: "Samoregulacja", up: "Regulacja instytucjonalna", weight: 1.25 },
    { down: "Desakralizacja autorytetu", up: "Sakralizacja autorytetu", weight: 5 },
    { down: "Prymat jednostki", up: "Prymat kolektywu", weight: 3 },
    { down: "Permisywizm wobec odstępstwa", up: "Uniformizacja norm", weight: 3 }
  ]
};

// -------------------------------
// POPUP
// -------------------------------
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

function initApp() {
  renderQuestions();
  attachQuestionEvents();
  submitBtn.addEventListener('click', computeAndDisplayResults);
  if (weightToggle) {
    weightToggle.addEventListener('change', () => {
      if (lastValueScoresMap) {
        updateCompassFromScores(lastValueScoresMap);
      }
    });
  }
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

    const questionText = document.createElement('div');
    questionText.className = 'question-text';
    questionText.innerText = `${idx+1}. ${q.text}`;
    card.appendChild(questionText);

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

    const answersDiv = document.createElement('div');
    answersDiv.className = 'answers';
    q.answers.forEach((ans, ansIdx) => {
      const ansEl = document.createElement('div');
      ansEl.className = 'answer-option';
      ansEl.innerText = ans.label;
      ansEl.dataset.answerIdx = ansIdx;
      ansEl.dataset.value = ans.value;
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

// -------------------------------
// OBLICZENIA WARTOŚCI (SUMY I MAX POSSIBLE)
// -------------------------------
function computeValueScores() {
  const valueScores = new Map(); // klucz: nazwa wartości, wartość: { sum: 0, maxPossible: 0 }

  // Zbierz wszystkie nazwy wartości z pairsOfValues oraz hiddenValues
  const allValueNames = new Set();
  if (config.pairsOfValues) {
    config.pairsOfValues.forEach(pair => {
      allValueNames.add(pair.left);
      allValueNames.add(pair.right);
    });
  }
  if (config.hiddenValues) {
    config.hiddenValues.forEach(v => allValueNames.add(v));
  }
  // Dodatkowo wartości z odpowiedzi (dla bezpieczeństwa)
  config.questions.forEach(q => {
    q.answers.forEach(ans => {
      (ans.values_for || []).forEach(v => allValueNames.add(v));
      (ans.values_against || []).forEach(v => allValueNames.add(v));
    });
  });

  allValueNames.forEach(v => {
    valueScores.set(v, { sum: 0, maxPossible: 0 });
  });

  // Oblicz maxPossible dla każdej wartości: ile maksymalnie +1.5 można zdobyć z pytań, gdzie dana wartość występuje (w for lub against z odpowiedzią dającą +1.5)
  // Dla każdego pytania i każdej wartości: maksymalny wkład dodatni to 1.5 (gdy użytkownik wybierze odpowiedź najbardziej wspierającą).
  for (let [valName, data] of valueScores.entries()) {
    let maxTotal = 0;
    for (let q of config.questions) {
      let maxForThisQuestion = 0;
      for (let ans of q.answers) {
        let contribution = 0;
        if (ans.values_for && ans.values_for.includes(valName)) {
          contribution = Math.max(contribution, ans.value);
        }
        if (ans.values_against && ans.values_against.includes(valName)) {
          contribution = Math.max(contribution, -ans.value); // przeciwne daje odwrotność
        }
        if (Math.abs(contribution) > Math.abs(maxForThisQuestion)) {
          maxForThisQuestion = contribution;
        }
      }
      if (maxForThisQuestion > 0) maxTotal += maxForThisQuestion;
      else if (maxForThisQuestion < 0) maxTotal += 0; // nie liczymy ujemnego maksimum
      else {
        // sprawdź czy w ogóle występuje: jeśli występuje w jakiejkolwiek odpowiedzi (nawet zero?) to i tak max 1.5 można by uzyskać poprzez inną odpowiedź?
        let appears = false;
        for (let ans of q.answers) {
          if ((ans.values_for && ans.values_for.includes(valName)) || (ans.values_against && ans.values_against.includes(valName))) {
            appears = true;
            break;
          }
        }
        if (appears) maxTotal += 1.5;
      }
    }
    data.maxPossible = maxTotal;
  }

  // Oblicz sumy na podstawie odpowiedzi użytkownika
  userAnswers.forEach(ans => {
    const answer = ans.answerData;
    const weight = ans.answerValue;
    if (weight === 0) return;
    (answer.values_for || []).forEach(val => {
      const rec = valueScores.get(val);
      if (rec) rec.sum += weight;
    });
    (answer.values_against || []).forEach(val => {
      const rec = valueScores.get(val);
      if (rec) rec.sum -= weight;
    });
  });

  return valueScores;
}

// -------------------------------
// OBLICZENIA DLA IDEOLOGII, PARTII ORAZ PAR WARTOŚCI (oryginalne)
// -------------------------------
function computeIdeologyPartyAndPairs(valueScoresMap) {
  // Ideologie i partie – pozostawiamy oryginalną logikę
  const ideologyScores = new Map();
  const partyScores = new Map();
  config.ideologies.forEach(ideo => {
    ideologyScores.set(ideo.name, { sum: 0, maxPossible: 0, questionsInvolved: 0, agreements: 0, disagreements: 0 });
  });
  config.parties.forEach(party => {
    partyScores.set(party.name, { sum: 0, maxPossible: 0, questionsInvolved: 0, agreements: 0, disagreements: 0 });
  });

  const questionIdeologies = new Map();
  const questionParties = new Map();
  config.questions.forEach(q => {
    const ideoSet = new Set();
    const partySet = new Set();
    q.answers.forEach(ans => {
      ans.ideologies_for?.forEach(i => ideoSet.add(i));
      ans.ideologies_against?.forEach(i => ideoSet.add(i));
      ans.parties_for?.forEach(p => partySet.add(p));
      ans.parties_against?.forEach(p => partySet.add(p));
    });
    questionIdeologies.set(q.id, ideoSet);
    questionParties.set(q.id, partySet);
  });

  for (let [ideoName, data] of ideologyScores.entries()) {
    let max = 0, involved = 0;
    for (let [qId, ideoSet] of questionIdeologies.entries()) {
      if (ideoSet.has(ideoName)) {
        max += 1.5;
        involved++;
      }
    }
    data.maxPossible = max;
    data.questionsInvolved = involved;
  }
  for (let [partyName, data] of partyScores.entries()) {
    let max = 0, involved = 0;
    for (let [qId, partySet] of questionParties.entries()) {
      if (partySet.has(partyName)) {
        max += 1.5;
        involved++;
      }
    }
    data.maxPossible = max;
    data.questionsInvolved = involved;
  }

  userAnswers.forEach(ans => {
    const answer = ans.answerData;
    const weight = ans.answerValue;
    if (weight === 0) return;
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
        rec.sum -= weight;
        if (weight < 0) rec.agreements++;
        else if (weight > 0) rec.disagreements++;
      }
    });
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
  });

  function normalizeScore(rec) {
    if (!rec || rec.maxPossible === 0) return 50;
    let raw = rec.sum;
    let normalized = (raw + rec.maxPossible) / (2 * rec.maxPossible) * 100;
    return Math.min(100, Math.max(0, normalized));
  }

  const ideologyResults = [];
  for (let [name, rec] of ideologyScores.entries()) {
    ideologyResults.push({
      name, percent: normalizeScore(rec), agreements: rec.agreements || 0,
      disagreements: rec.disagreements || 0, involved: rec.questionsInvolved,
      description: config.ideologies.find(i => i.name === name)?.description || ''
    });
  }
  ideologyResults.sort((a,b) => b.percent - a.percent);

  const partyResults = [];
  for (let [name, rec] of partyScores.entries()) {
    partyResults.push({
      name, percent: normalizeScore(rec), agreements: rec.agreements || 0,
      disagreements: rec.disagreements || 0, involved: rec.questionsInvolved,
      description: config.parties.find(p => p.name === name)?.description || ''
    });
  }
  partyResults.sort((a,b) => b.percent - a.percent);

  // Pary wartości (oryginalne wyświetlanie)
  const valuePercentMap = new Map();
  for (let [name, rec] of valueScoresMap.entries()) {
    let percent = 50;
    if (rec.maxPossible > 0) {
      let raw = rec.sum;
      percent = (raw + rec.maxPossible) / (2 * rec.maxPossible) * 100;
      percent = Math.min(100, Math.max(0, percent));
    }
    valuePercentMap.set(name, percent);
  }

  const pairResults = [];
  for (let pair of config.pairsOfValues) {
    let leftScore = valuePercentMap.get(pair.left) ?? 50;
    let rightScore = valuePercentMap.get(pair.right) ?? 50;
    let total = leftScore + rightScore;
    if (total === 0) { leftScore = 50; rightScore = 50; }
    else { leftScore = (leftScore / total) * 100; rightScore = 100 - leftScore; }
    pairResults.push({
      left: pair.left, right: pair.right, leftPercent: leftScore, rightPercent: rightScore,
      leftDef: pair.leftDef, rightDef: pair.rightDef
    });
  }
  return { ideologyResults, partyResults, pairResults };
}

// -------------------------------
// OBLICZANIE POZYCJI NA KOMPASIE
// -------------------------------
function computeCompassPosition(valueScoresMap, useWeights = true) {
  let totalWeightedDiffX = 0, totalWeightedDiffY = 0;
  let totalMaxX = 0, totalMaxY = 0;

  // Oś X
  for (let pair of COMPASS_AXES.x) {
    const leftScore = valueScoresMap.get(pair.left);
    const rightScore = valueScoresMap.get(pair.right);
    if (!leftScore || !rightScore) continue;
    const diff = (rightScore.sum - leftScore.sum);
    const maxPossibleDiff = (rightScore.maxPossible + leftScore.maxPossible);
    const w = useWeights ? pair.weight : 1;
    totalWeightedDiffX += diff * w;
    totalMaxX += maxPossibleDiff * w;
  }

  // Oś Y
  for (let pair of COMPASS_AXES.y) {
    const downScore = valueScoresMap.get(pair.down);
    const upScore = valueScoresMap.get(pair.up);
    if (!downScore || !upScore) continue;
    const diff = (upScore.sum - downScore.sum);
    const maxPossibleDiff = (upScore.maxPossible + downScore.maxPossible);
    const w = useWeights ? pair.weight : 1;
    totalWeightedDiffY += diff * w;
    totalMaxY += maxPossibleDiff * w;
  }

  let coordX = 0, coordY = 0;
  if (totalMaxX !== 0) coordX = (totalWeightedDiffX / totalMaxX) * 10;
  if (totalMaxY !== 0) coordY = (totalWeightedDiffY / totalMaxY) * 10;
  coordX = Math.min(10, Math.max(-10, coordX));
  coordY = Math.min(10, Math.max(-10, coordY));
  return { x: coordX, y: coordY };
}

// -------------------------------
// RYSOWANIE KOMPASU (Canvas)
// -------------------------------
function drawCompass(x, y) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  const centerX = w / 2, centerY = h / 2;
  const range = 10;
  const step = 2;
  const pxPerUnit = Math.min(w, h) / (range * 2); // bo -10..10 to 20 jednostek

  ctx.clearRect(0, 0, w, h);

  // Rysowanie 4 ćwiartek (prostokąty)
  // Prawa góra
  ctx.fillStyle = '#0183BE';
  ctx.fillRect(centerX, 0, w - centerX, centerY);
  // Prawy dół
  ctx.fillStyle = '#EDD500';
  ctx.fillRect(centerX, centerY, w - centerX, h - centerY);
  // Lewa góra
  ctx.fillStyle = '#DD0000';
  ctx.fillRect(0, 0, centerX, centerY);
  // Lewy dół
  ctx.fillStyle = '#202020';
  ctx.fillRect(0, centerY, centerX, h - centerY);

  // Siatka i osie (czarne, wyraźne)
  ctx.save();
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1.5;
  ctx.fillStyle = '#000000';
  ctx.font = '10px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // linie poziome i pionowe (co step)
  for (let i = -range; i <= range; i += step) {
    const xPos = centerX + i * pxPerUnit;
    const yPos = centerY - i * pxPerUnit;
    // pionowe
    ctx.beginPath();
    ctx.moveTo(xPos, 0);
    ctx.lineTo(xPos, h);
    ctx.stroke();
    // poziome
    ctx.beginPath();
    ctx.moveTo(0, yPos);
    ctx.lineTo(w, yPos);
    ctx.stroke();
  }

  // osie główne (grubsze)
  ctx.beginPath();
  ctx.moveTo(centerX, 0);
  ctx.lineTo(centerX, h);
  ctx.moveTo(0, centerY);
  ctx.lineTo(w, centerY);
  ctx.lineWidth = 2;
  ctx.stroke();

  // strzałki (opcjonalnie)
  ctx.fillStyle = '#000';
  // małe oznaczenia kreskowe na końcach (minimum)
  
  // Punkt użytkownika (bardzo mały, biały z czarną obwódką)
  const pointX = centerX + x * pxPerUnit;
  const pointY = centerY - y * pxPerUnit;
  ctx.beginPath();
  ctx.arc(pointX, pointY, 5, 0, 2 * Math.PI);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  
  ctx.restore();
}

// -------------------------------
// AKTUALIZACJA KOMPASU Z ZAPISANYCH SCORES
// -------------------------------
function updateCompassFromScores(valueScoresMap) {
  if (!valueScoresMap) return;
  const useWeights = weightToggle ? weightToggle.checked : false;
  const { x, y } = computeCompassPosition(valueScoresMap, useWeights);
  coordXSpan.innerText = x.toFixed(2);
  coordYSpan.innerText = y.toFixed(2);
  drawCompass(x, y);
}

// -------------------------------
// GŁÓWNA FUNKCJA WYŚWIETLANIA WYNIKÓW
// -------------------------------
function computeAndDisplayResults() {
  if (!config) return;
  const valueScoresMap = computeValueScores();
  lastValueScoresMap = valueScoresMap;

  const { ideologyResults, partyResults, pairResults } = computeIdeologyPartyAndPairs(valueScoresMap);

  // Wyświetlanie par wartości (oryginalne)
  valuesResults.innerHTML = '<h3>⚖️ Pary wartości (przeciąganie liny)</h3>';
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

  ideologiesResults.innerHTML = '<h3>📊 Ranking ideologii (zgodność %)</h3><div style="margin-bottom:1rem;">Im wyższy procent, tym bardziej Twoje poglądy są zgodne z daną ideologią.</div>';
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
  compassPanelDiv.style.display = 'block';
  
  // Inicjalne rysowanie kompasu (tryb domyślny: unchecked = jednakowe wagi)
  if (weightToggle) weightToggle.checked = false;
  updateCompassFromScores(valueScoresMap);
  
  window.scrollTo({ top: compassPanelDiv.offsetTop - 20, behavior: 'smooth' });
}

// Obsługa zmiany rozmiaru okna – przerysowanie kompasu
window.addEventListener('resize', () => {
  if (lastValueScoresMap && compassPanelDiv.style.display !== 'none') {
    updateCompassFromScores(lastValueScoresMap);
  }
});

// Uruchom
loadConfig();
