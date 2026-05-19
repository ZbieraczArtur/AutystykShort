// Stan aplikacji
let userAnswers = {};  // { questionId: 'agree' | 'disagree' | 'skip' }

// Inicjalizacja po załadowaniu strony
document.addEventListener('DOMContentLoaded', () => {
  renderQuestions();
  document.getElementById('submitBtn').addEventListener('click', showResults);
});

// Generuje HTML wszystkich pytań
function renderQuestions() {
  const container = document.getElementById('questionsContainer');
  container.innerHTML = '';
  quizData.questions.forEach(q => {
    const qDiv = document.createElement('div');
    qDiv.className = 'question';
    qDiv.dataset.id = q.id;

    const title = document.createElement('h3');
    title.textContent = q.text;
    qDiv.appendChild(title);

    if (q.description) {
      const desc = document.createElement('p');
      desc.className = 'description';
      desc.textContent = q.description;
      qDiv.appendChild(desc);
    }

    // Opcje odpowiedzi
    const optionsDiv = document.createElement('div');
    optionsDiv.className = 'options';
    const answers = ['agree', 'disagree', 'skip'];
    const labels = { agree: 'Zgadzam się', disagree: 'Nie zgadzam się', skip: 'Pomiń pytanie' };

    answers.forEach(ans => {
      const label = document.createElement('label');
      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.name = `q${q.id}`;
      radio.value = ans;
      radio.addEventListener('change', (e) => {
        userAnswers[q.id] = e.target.value;
      });
      // jeśli już była zapisana odpowiedź, zaznacz
      if (userAnswers[q.id] === ans) radio.checked = true;
      label.appendChild(radio);
      label.appendChild(document.createTextNode(labels[ans]));
      optionsDiv.appendChild(label);
    });
    qDiv.appendChild(optionsDiv);

    if (q.comment) {
      const comment = document.createElement('div');
      comment.className = 'comment';
      comment.textContent = `💡 ${q.comment}`;
      qDiv.appendChild(comment);
    }

    container.appendChild(qDiv);
  });
}

// Główna funkcja obliczająca wyniki
function calculateResults() {
  // Inicjalizacja liczników wartości
  const valueCounts = {};
  quizData.valuePairs.forEach(pair => {
    valueCounts[pair.left] = 0;
    valueCounts[pair.right] = 0;
  });

  // Inicjalizacja liczników ideologii
  const ideologyStats = {};
  quizData.ideologies.forEach(ide => {
    ideologyStats[ide.id] = { matches: 0, mismatches: 0 };
  });

  // Inicjalizacja liczników partii
  const partyStats = {};
  quizData.parties.forEach(party => {
    partyStats[party.id] = { matches: 0, mismatches: 0 };
  });

  // Przetwarzanie odpowiedzi
  for (const q of quizData.questions) {
    const answer = userAnswers[q.id];
    if (!answer || answer === 'skip') continue;

    const answerData = q.answers[answer];
    if (!answerData) continue; // zabezpieczenie

    // 1. Wartości
    if (answerData.values) {
      for (const val of answerData.values) {
        if (valueCounts.hasOwnProperty(val)) {
          valueCounts[val]++;
        }
      }
    }

    // 2. Ideologie
    for (const ide of quizData.ideologies) {
      const support = answerData.ideologies_support || [];
      const oppose = answerData.ideologies_oppose || [];
      if (support.includes(ide.id)) {
        if (answer === 'agree') ideologyStats[ide.id].matches++;
        else ideologyStats[ide.id].mismatches++;
      } else if (oppose.includes(ide.id)) {
        if (answer === 'agree') ideologyStats[ide.id].mismatches++;
        else ideologyStats[ide.id].matches++;
      }
      // jeśli nie ma ani support ani oppose – neutralne, nic nie rób
    }

    // 3. Partie
    for (const party of quizData.parties) {
      const support = answerData.parties_support || [];
      const oppose = answerData.parties_oppose || [];
      if (support.includes(party.id)) {
        if (answer === 'agree') partyStats[party.id].matches++;
        else partyStats[party.id].mismatches++;
      } else if (oppose.includes(party.id)) {
        if (answer === 'agree') partyStats[party.id].mismatches++;
        else partyStats[party.id].matches++;
      }
    }
  }

  // Obliczenie procentów dla wartości (pary)
  const valueResults = {};
  quizData.valuePairs.forEach(pair => {
    const leftCount = valueCounts[pair.left];
    const rightCount = valueCounts[pair.right];
    const total = leftCount + rightCount;
    let leftPercent = 0, rightPercent = 0;
    if (total > 0) {
      leftPercent = (leftCount / total) * 100;
      rightPercent = 100 - leftPercent;
    }
    valueResults[pair.left] = { label: pair.leftLabel, percent: leftPercent, count: leftCount };
    valueResults[pair.right] = { label: pair.rightLabel, percent: rightPercent, count: rightCount };
  });

  // Obliczenie procentów dla ideologii
  const ideologyRanking = [];
  for (const ide of quizData.ideologies) {
    const stats = ideologyStats[ide.id];
    const total = stats.matches + stats.mismatches;
    let percent = 0;
    if (total > 0) percent = (stats.matches / total) * 100;
    ideologyRanking.push({
      id: ide.id,
      name: ide.name,
      percent: percent,
      matches: stats.matches,
      mismatches: stats.mismatches,
      neutral: quizData.questions.length - total // liczba pytań, gdzie ideologia nie wystąpiła
    });
  }
  ideologyRanking.sort((a,b) => b.percent - a.percent);

  // Obliczenie procentów dla partii
  const partyRanking = [];
  for (const party of quizData.parties) {
    const stats = partyStats[party.id];
    const total = stats.matches + stats.mismatches;
    let percent = 0;
    if (total > 0) percent = (stats.matches / total) * 100;
    partyRanking.push({
      id: party.id,
      name: party.name,
      percent: percent,
      matches: stats.matches,
      mismatches: stats.mismatches,
      neutral: quizData.questions.length - total
    });
  }
  partyRanking.sort((a,b) => b.percent - a.percent);

  return { valueResults, ideologyRanking, partyRanking };
}

// Wyświetlenie wyników
function showResults() {
  const results = calculateResults();
  const resultsDiv = document.getElementById('results');
  resultsDiv.innerHTML = '';

  // Sekcja wartości (pary)
  const valuesSection = document.createElement('div');
  valuesSection.innerHTML = '<h2>Wyniki wartości (pary przeciwstawne)</h2>';
  for (const [valId, data] of Object.entries(results.valueResults)) {
    // Wyświetlamy tylko dla lewej strony każdej pary – prawa jest uzupełnieniem
    const pair = quizData.valuePairs.find(p => p.left === valId);
    if (pair) {
      const left = results.valueResults[pair.left];
      const right = results.valueResults[pair.right];
      const barContainer = document.createElement('div');
      barContainer.className = 'value-bar';
      barContainer.innerHTML = `
        <div class="value-labels">
          <span>${left.label}</span>
          <span>${right.label}</span>
        </div>
        <div class="bar-bg">
          <div class="bar-left" style="width: ${left.percent}%;">${left.percent.toFixed(1)}%</div>
          <div class="bar-right" style="width: ${right.percent}%;">${right.percent.toFixed(1)}%</div>
        </div>
        <div class="value-counts">(głosów: ${left.count} / ${right.count})</div>
      `;
      valuesSection.appendChild(barContainer);
    }
  }
  resultsDiv.appendChild(valuesSection);

  // Ranking ideologii
  const ideologiesSection = document.createElement('div');
  ideologiesSection.innerHTML = '<h2>Ranking ideologii (zgodność)</h2>';
  const ideTable = document.createElement('table');
  ideTable.innerHTML = `<tr><th>Ideologia</th><th>Zgodność</th><th>Zgodne</th><th>Sprzeczne</th><th>Neutralne</th></tr>`;
  for (const ide of results.ideologyRanking) {
    const row = ideTable.insertRow();
    row.insertCell(0).textContent = ide.name;
    row.insertCell(1).textContent = `${ide.percent.toFixed(1)}%`;
    row.insertCell(2).textContent = ide.matches;
    row.insertCell(3).textContent = ide.mismatches;
    row.insertCell(4).textContent = ide.neutral;
  }
  ideologiesSection.appendChild(ideTable);
  resultsDiv.appendChild(ideologiesSection);

  // Ranking partii
  const partiesSection = document.createElement('div');
  partiesSection.innerHTML = '<h2>Ranking partii (zgodność)</h2>';
  const partyTable = document.createElement('table');
  partyTable.innerHTML = `<tr><th>Partia</th><th>Zgodność</th><th>Zgodne</th><th>Sprzeczne</th><th>Neutralne</th></tr>`;
  for (const party of results.partyRanking) {
    const row = partyTable.insertRow();
    row.insertCell(0).textContent = party.name;
    row.insertCell(1).textContent = `${party.percent.toFixed(1)}%`;
    row.insertCell(2).textContent = party.matches;
    row.insertCell(3).textContent = party.mismatches;
    row.insertCell(4).textContent = party.neutral;
  }
  partiesSection.appendChild(partyTable);
  resultsDiv.appendChild(partiesSection);

  // Przewiń do wyników
  resultsDiv.scrollIntoView({ behavior: 'smooth' });
}
