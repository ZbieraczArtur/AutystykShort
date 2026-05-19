// --------------------- GLOBALNE ZMIENNE ---------------------
let configData = null;          // wczytany config.json
let userAnswers = {};           // mapowanie id pytania -> indeks odpowiedzi (0-4)
let currentQuestionIds = [];    // lista id pytań w kolejności

// --------------------- WCZYTYWANIE KONFIGURACJI ---------------------
async function loadConfig() {
    try {
        const response = await fetch('data/config.json');
        if (!response.ok) throw new Error('Nie udało się wczytać konfiguracji');
        configData = await response.json();
        // Walidacja podstawowa
        if (!configData.questions || !configData.valuePairs || !configData.ideologies || !configData.parties) {
            throw new Error('Brak wymaganych sekcji w config.json');
        }
        currentQuestionIds = configData.questions.map(q => q.id);
        return true;
    } catch (err) {
        console.error(err);
        alert('Błąd ładowania danych testu. Spróbuj odświeżyć stronę.');
        return false;
    }
}

// --------------------- RENDEROWANIE PYTAŃ ---------------------
function renderQuestions() {
    const container = document.getElementById('questionsContainer');
    container.innerHTML = '';
    configData.questions.forEach(question => {
        const qDiv = document.createElement('div');
        qDiv.className = 'question-card';
        qDiv.dataset.qid = question.id;

        // Nagłówek z komentarzem (ikona)
        const headerDiv = document.createElement('div');
        headerDiv.className = 'question-header';
        const textSpan = document.createElement('span');
        textSpan.className = 'question-text';
        textSpan.innerText = question.text;
        headerDiv.appendChild(textSpan);

        if (question.comment) {
            const commentIcon = document.createElement('span');
            commentIcon.className = 'comment-icon';
            commentIcon.innerText = 'i';
            commentIcon.title = 'Komentarz twórcy';
            commentIcon.addEventListener('click', (e) => {
                e.stopPropagation();
                // pokaż dymek komentarza pod pytaniem
                const existingTooltip = qDiv.querySelector('.tooltip-comment');
                if (existingTooltip) {
                    existingTooltip.remove();
                } else {
                    const tooltip = document.createElement('div');
                    tooltip.className = 'tooltip-comment';
                    tooltip.innerText = question.comment;
                    qDiv.insertBefore(tooltip, qDiv.children[1]);
                }
            });
            headerDiv.appendChild(commentIcon);
        }
        qDiv.appendChild(headerDiv);

        // Opcjonalne rozwinięcie (description)
        if (question.description) {
            const descDiv = document.createElement('div');
            descDiv.className = 'question-description';
            descDiv.innerText = question.description;
            qDiv.appendChild(descDiv);
        }

        // Odpowiedzi
        const answersDiv = document.createElement('div');
        answersDiv.className = 'answers';
        question.answers.forEach((answer, idx) => {
            const btn = document.createElement('button');
            btn.className = 'answer-btn';
            btn.innerText = answer.label;
            btn.dataset.answerIdx = idx;
            // zaznacz jeśli wcześniej wybrano
            if (userAnswers[question.id] === idx) btn.classList.add('selected');
            btn.addEventListener('click', () => {
                // usuń zaznaczenie innych odpowiedzi dla tego pytania
                const parent = btn.parentNode;
                Array.from(parent.children).forEach(btnChild => btnChild.classList.remove('selected'));
                btn.classList.add('selected');
                userAnswers[question.id] = idx;
            });
            answersDiv.appendChild(btn);
        });
        qDiv.appendChild(answersDiv);
        container.appendChild(qDiv);
    });
}

// --------------------- OBLICZANIE WYNIKÓW ---------------------
function computeResults() {
    // Inicjalizacja struktur dla ideologii, partii, par wartości
    const ideologiesStats = {};
    configData.ideologies.forEach(ideo => {
        ideologiesStats[ideo.name] = { supportSum: 0, opposeSum: 0 };
    });
    const partiesStats = {};
    configData.parties.forEach(party => {
        partiesStats[party.name] = { supportSum: 0, opposeSum: 0 };
    });

    // Dla par wartości: każda para ma left i right, będziemy zbierać punkty dla lewej i prawej
    const valuePairsStats = {};
    configData.valuePairs.forEach(pair => {
        const key = `${pair.left}|${pair.right}`;
        valuePairsStats[key] = { leftSum: 0, rightSum: 0, leftName: pair.left, rightName: pair.right };
    });

    // Przejście przez wszystkie pytania i odpowiedzi użytkownika
    for (let q of configData.questions) {
        const answerIdx = userAnswers[q.id];
        if (answerIdx === undefined) continue; // brak odpowiedzi (nie wybrano) – pomijamy
        const answer = q.answers[answerIdx];
        if (answer.weight === 0) continue; // pominięcie - brak wpływu

        const w = answer.weight;

        // Ideologie: wspierające
        if (answer.supportIdeologies) {
            for (let ideo of answer.supportIdeologies) {
                if (ideologiesStats[ideo]) ideologiesStats[ideo].supportSum += w;
            }
        }
        // Ideologie: przeciwne
        if (answer.opposeIdeologies) {
            for (let ideo of answer.opposeIdeologies) {
                if (ideologiesStats[ideo]) ideologiesStats[ideo].opposeSum += w;
            }
        }

        // Partie
        if (answer.supportParties) {
            for (let party of answer.supportParties) {
                if (partiesStats[party]) partiesStats[party].supportSum += w;
            }
        }
        if (answer.opposeParties) {
            for (let party of answer.opposeParties) {
                if (partiesStats[party]) partiesStats[party].opposeSum += w;
            }
        }

        // Wartości: dla każdej pary, sprawdzamy czy wartości z odpowiedzi pasują do left/right
        // Mapowanie: supportValues -> zwiększa left lub right, opposeValues -> zwiększa przeciwną stronę
        // Najpierw obsługa supportValues
        if (answer.supportValues) {
            for (let val of answer.supportValues) {
                // znajdź parę, w której val jest left lub right
                for (let pair of configData.valuePairs) {
                    if (pair.left === val) {
                        const key = `${pair.left}|${pair.right}`;
                        valuePairsStats[key].leftSum += w;
                        break;
                    } else if (pair.right === val) {
                        const key = `${pair.left}|${pair.right}`;
                        valuePairsStats[key].rightSum += w;
                        break;
                    }
                }
            }
        }
        // opposeValues: sprzeciw wobec wartości X oznacza poparcie dla jej przeciwieństwa w parze
        if (answer.opposeValues) {
            for (let val of answer.opposeValues) {
                for (let pair of configData.valuePairs) {
                    if (pair.left === val) {
                        const key = `${pair.left}|${pair.right}`;
                        valuePairsStats[key].rightSum += w; // sprzeciw wobec left = poparcie dla right
                        break;
                    } else if (pair.right === val) {
                        const key = `${pair.left}|${pair.right}`;
                        valuePairsStats[key].leftSum += w; // sprzeciw wobec right = poparcie dla left
                        break;
                    }
                }
            }
        }
    }

    // Obliczenie procentów dla ideologii
    let ideologyResults = [];
    for (let [name, stats] of Object.entries(ideologiesStats)) {
        const total = stats.supportSum + stats.opposeSum;
        let percent = 50; // domyślnie brak danych
        if (total > 0) {
            percent = (stats.supportSum / total) * 100;
        }
        ideologyResults.push({ name, percent, description: configData.ideologies.find(i => i.name === name)?.description });
    }
    ideologyResults.sort((a,b) => b.percent - a.percent);

    // Partie
    let partyResults = [];
    for (let [name, stats] of Object.entries(partiesStats)) {
        const total = stats.supportSum + stats.opposeSum;
        let percent = 50;
        if (total > 0) {
            percent = (stats.supportSum / total) * 100;
        }
        partyResults.push({ name, percent, description: configData.parties.find(p => p.name === name)?.description });
    }
    partyResults.sort((a,b) => b.percent - a.percent);

    // Pary wartości
    let valueResults = [];
    for (let [key, stats] of Object.entries(valuePairsStats)) {
        const total = stats.leftSum + stats.rightSum;
        let leftPercent = 50, rightPercent = 50;
        if (total > 0) {
            leftPercent = (stats.leftSum / total) * 100;
            rightPercent = 100 - leftPercent;
        }
        valueResults.push({
            left: stats.leftName,
            right: stats.rightName,
            leftPercent: Math.round(leftPercent),
            rightPercent: Math.round(rightPercent),
            leftDef: configData.valuePairs.find(p => p.left === stats.leftName)?.leftDefinition,
            rightDef: configData.valuePairs.find(p => p.left === stats.leftName)?.rightDefinition
        });
    }

    return { valueResults, ideologyResults, partyResults };
}

// --------------------- WYŚWIETLANIE WYNIKÓW ---------------------
function displayResults(results) {
    const valuesDiv = document.getElementById('valuesResults');
    valuesDiv.innerHTML = '<h3>Pary wartości (przeciąganie liny)</h3>';
    results.valueResults.forEach(pair => {
        const pairDiv = document.createElement('div');
        pairDiv.className = 'value-pair';
        pairDiv.innerHTML = `
            <div class="value-row">
                <span class="clickable-value" data-def="${pair.leftDef}">${pair.left}</span>
                <span>↔</span>
                <span class="clickable-value" data-def="${pair.rightDef}">${pair.right}</span>
            </div>
            <div class="value-bar-container">
                <div class="value-bar-left" style="width: ${pair.leftPercent}%;">${pair.leftPercent}%</div>
                <div class="value-bar-right" style="width: ${pair.rightPercent}%;">${pair.rightPercent}%</div>
            </div>
        `;
        valuesDiv.appendChild(pairDiv);
    });

    // Dodanie eventów kliknięcia na wartości (pokazanie definicji)
    document.querySelectorAll('.clickable-value').forEach(el => {
        el.addEventListener('click', (e) => {
            const def = el.dataset.def;
            if (def) {
                const modal = document.getElementById('definitionModal');
                const defText = document.getElementById('definitionText');
                defText.innerText = def;
                modal.style.display = 'flex';
                const closeSpan = modal.querySelector('.close-def-btn');
                closeSpan.onclick = () => { modal.style.display = 'none'; };
                modal.onclick = (e2) => { if (e2.target === modal) modal.style.display = 'none'; };
            }
        });
    });

    // Ideologie
    const ideologiesDiv = document.getElementById('ideologiesResults');
    ideologiesDiv.innerHTML = '<h3>Ranking ideologii (zgodność)</h3><div class="ideologies-list"></div>';
    const ideologiesList = ideologiesDiv.querySelector('.ideologies-list');
    results.ideologyResults.forEach(ideo => {
        const item = document.createElement('div');
        item.className = 'ideology-item';
        item.innerHTML = `
            <div class="ideology-name">${ideo.name}</div>
            <div class="percentage">${Math.round(ideo.percent)}%</div>
        `;
        const nameSpan = item.querySelector('.ideology-name');
        nameSpan.addEventListener('click', () => {
            const existingDesc = item.querySelector('.description-expanded');
            if (existingDesc) {
                existingDesc.remove();
            } else if (ideo.description) {
                const descDiv = document.createElement('div');
                descDiv.className = 'description-expanded';
                descDiv.innerText = ideo.description;
                item.appendChild(descDiv);
            }
        });
        ideologiesList.appendChild(item);
    });

    // Partie
    const partiesDiv = document.getElementById('partiesResults');
    partiesDiv.innerHTML = '<h3>Ranking partii (zgodność)</h3><div class="parties-list"></div>';
    const partiesList = partiesDiv.querySelector('.parties-list');
    results.partyResults.forEach(party => {
        const item = document.createElement('div');
        item.className = 'party-item';
        item.innerHTML = `
            <div class="party-name">${party.name}</div>
            <div class="percentage">${Math.round(party.percent)}%</div>
        `;
        const nameSpan = item.querySelector('.party-name');
        nameSpan.addEventListener('click', () => {
            const existingDesc = item.querySelector('.description-expanded');
            if (existingDesc) {
                existingDesc.remove();
            } else if (party.description) {
                const descDiv = document.createElement('div');
                descDiv.className = 'description-expanded';
                descDiv.innerText = party.description;
                item.appendChild(descDiv);
            }
        });
        partiesList.appendChild(item);
    });
}

// --------------------- INICJALIZACJA APLIKACJI ---------------------
async function init() {
    const loaded = await loadConfig();
    if (!loaded) return;

    // Obsługa modalu startowego
    const introModal = document.getElementById('introModal');
    const startBtn = document.getElementById('startTestBtn');
    const testSection = document.getElementById('testSection');
    const submitBtn = document.getElementById('submitBtn');
    const resultsSection = document.getElementById('resultsSection');
    const restartBtn = document.getElementById('restartBtn');

    startBtn.onclick = () => {
        introModal.style.display = 'none';
        testSection.style.display = 'block';
        renderQuestions();
    };

    submitBtn.onclick = () => {
        // Sprawdź czy wszystkie pytania mają odpowiedź? Nie trzeba, pominięte są OK.
        const results = computeResults();
        testSection.style.display = 'none';
        resultsSection.style.display = 'block';
        displayResults(results);
    };

    restartBtn.onclick = () => {
        userAnswers = {};
        resultsSection.style.display = 'none';
        testSection.style.display = 'block';
        renderQuestions();
    };

    // Zamykanie modali definicji
    const defModal = document.getElementById('definitionModal');
    const closeDef = defModal.querySelector('.close-def-btn');
    closeDef.onclick = () => { defModal.style.display = 'none'; };
    window.onclick = (e) => { if (e.target === defModal) defModal.style.display = 'none'; };

    // Pokazanie modalu na starcie
    introModal.style.display = 'flex';
}

// Start
init();
