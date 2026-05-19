let config = null;
let userAnswers = []; // { questionId, answerValue }
let mode = null; // 'ideowo', 'politycznie', 'skip'

// Ładowanie configu
async function loadConfig() {
    const res = await fetch('config.json');
    config = await res.json();
}

// Obliczenia dla ideologii
function computeIdeologyScores() {
    return config.ideologies.map(ideology => {
        let agreements = 0, disagreements = 0;
        for (let ans of userAnswers) {
            const question = config.questions.find(q => q.id === ans.questionId);
            const answerObj = question.answers.find(a => a.value === ans.answerValue);
            if (ans.answerValue === 'skip') continue;
            if (answerObj.ideologies_for?.includes(ideology.id)) agreements++;
            else if (answerObj.ideologies_against?.includes(ideology.id)) disagreements++;
        }
        const total = agreements + disagreements;
        const score = total === 0 ? null : (agreements / total) * 100;
        return { id: ideology.id, name: ideology.name, score, agreements, disagreements };
    }).sort((a,b) => (b.score ?? -1) - (a.score ?? -1));
}

// Podobnie dla partii i dla par wartości (value pairs)
// ... (analogiczna logika)

// Po zebraniu odpowiedzi – wyświetlenie wyników
function showResults() {
    const ideologyRanking = computeIdeologyScores();
    const partyRanking = computePartyScores();
    const valueResults = computeValuePairs();
    // renderowanie w #results-content
}
