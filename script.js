let config = null;

async function loadConfig() {
  const res = await fetch('config.json');
  if (!res.ok) throw new Error('Nie udało się załadować config.json');
  return await res.json();
}

function renderQuestions(questions) {
  const container = document.getElementById('questions-container');
  container.innerHTML = '';
  questions.forEach((q, idx) => {
    const card = document.createElement('div');
    card.className = 'question-card';
    card.dataset.qid = q.id;
    card.innerHTML = `
      <div class="question-text">${idx+1}. ${q.text}</div>
      ${q.description ? `<div class="question-desc">${q.description}</div>` : ''}
      ${q.comment ? `<div class="question-comment">💬 ${q.comment}</div>` : ''}
      <div class="options">
        ${q.answers.map(a => `
          <label class="option">
            <input type="radio" name="q_${q.id}" value="${a.id}"> ${a.label}
          </label>
        `).join('')}
        <label class="option">
          <input type="radio" name="q_${q.id}" value="skip" checked> Pomiń
        </label>
      </div>
    `;
    container.appendChild(card);
  });
}

function collectAnswers(questions) {
  const answers = [];
  for (const q of questions) {
    const radios = document.querySelectorAll(`input[name="q_${q.id}"]`);
    let selected = null;
    for (const radio of radios) {
      if (radio.checked) {
        selected = radio.value;
        break;
      }
    }
    if (selected && selected !== 'skip') {
      const chosenAnswer = q.answers.find(a => a.id === selected);
      if (chosenAnswer) {
        answers.push({
          questionId: q.id,
          answer: chosenAnswer
        });
      }
    }
  }
  return answers;
}

function calculateValuePairs(valuePairs, answers) {
  const results = {};
  for (const pair of valuePairs) {
    let leftCount = 0, rightCount = 0;
    for (const ans of answers) {
      if (ans.answer.values.includes(pair.leftId)) leftCount++;
      if (ans.answer.values.includes(pair.rightId)) rightCount++;
    }
    const total = leftCount + rightCount;
    const leftPct = total === 0 ? 0 : (leftCount / total) * 100;
    const rightPct = total === 0 ? 0 : (rightCount / total) * 100;
    results[pair.leftId + '_' + pair.rightId] = {
      leftLabel: pair.leftLabel,
      rightLabel: pair.rightLabel,
      leftPercent: leftPct,
      rightPercent: rightPct
    };
  }
  return results;
}

function calculateCompatibility(items, answers, type) { // type: 'ideologies' lub 'parties'
  const stats = {};
  // Inicjalizacja
  for (const item of items) {
    stats[item.id] = { for: 0, against: 0 };
  }
  for (const ans of answers) {
    const answer = ans.answer;
    // Dla każdej ideologii/partii określamy czy jest za czy przeciw tej odpowiedzi
    const forList = type === 'ideologies' ? answer.ideologies_for : answer.parties_for;
    const againstList = type === 'ideologies' ? answer.ideologies_against : answer.parties_against;
    for (const id of forList) {
      if (stats[id]) stats[id].for++;
    }
    for (const id of againstList) {
      if (stats[id]) stats[id].against++;
    }
  }
  const results = [];
  for (const item of items) {
    const total = stats[item.id].for + stats[item.id].against;
    let percent = 0;
    if (total > 0) {
      percent = (stats[item.id].for / total) * 100;
    } else {
      percent = null; // brak danych
    }
    results.push({
      id: item.id,
      name: item.name,
      percent: percent,
      compatible: stats[item.id].for,
      incompatible: stats[item.id].against
    });
  }
  results.sort((a,b) => (b.percent ?? -1) - (a.percent ?? -1));
  return results;
}

function displayResults(valueResults, ideologyResults, partyResults) {
  const valueDiv = document.getElementById('value-results');
  valueDiv.innerHTML = '<h3>📐 Pary wartości</h3>';
  for (const key in valueResults) {
    const v = valueResults[key];
    valueDiv.innerHTML += `
      <div class="value-pair">
        <strong>${v.leftLabel} ↔ ${v.rightLabel}</strong>
        <div class="result-item">
          <span>${v.leftLabel}: ${v.leftPercent.toFixed(1)}%</span>
          <div class="bar-container"><div class="bar" style="width: ${v.leftPercent}%;"></div></div>
        </div>
        <div class="result-item">
          <span>${v.rightLabel}: ${v.rightPercent.toFixed(1)}%</span>
          <div class="bar-container"><div class="bar" style="width: ${v.rightPercent}%;"></div></div>
        </div>
      </div>
    `;
  }

  const ideologyDiv = document.getElementById('ideology-results');
  ideologyDiv.innerHTML = '<h3>🏛️ Zgodność z ideologiami</h3>';
  for (const res of ideologyResults) {
    const pct = res.percent !== null ? `${res.percent.toFixed(1)}%` : 'brak danych';
    ideologyDiv.innerHTML += `<div class="result-item"><span>${res.name}</span><span><strong>${pct}</strong> (zgodnych: ${res.compatible}, sprzecznych: ${res.incompatible})</span></div>`;
  }

  const partyDiv = document.getElementById('party-results');
  partyDiv.innerHTML = '<h3>🗳️ Zgodność z partiami</h3>';
  for (const res of partyResults) {
    const pct = res.percent !== null ? `${res.percent.toFixed(1)}%` : 'brak danych';
    partyDiv.innerHTML += `<div class="result-item"><span>${res.name}</span><span><strong>${pct}</strong> (zgodnych: ${res.compatible}, sprzecznych: ${res.incompatible})</span></div>`;
  }

  document.getElementById('results').style.display = 'block';
}

async function init() {
  try {
    config = await loadConfig();
    renderQuestions(config.questions);
    document.getElementById('submit-btn').addEventListener('click', () => {
      const answers = collectAnswers(config.questions);
      const valueResults = calculateValuePairs(config.valuePairs, answers);
      const ideologyResults = calculateCompatibility(config.ideologies, answers, 'ideologies');
      const partyResults = calculateCompatibility(config.parties, answers, 'parties');
      displayResults(valueResults, ideologyResults, partyResults);
    });
  } catch (err) {
    console.error(err);
    document.getElementById('questions-container').innerHTML = '<p style="color:red;">❌ Błąd ładowania konfiguracji. Sprawdź plik config.json</p>';
  }
}

init();
