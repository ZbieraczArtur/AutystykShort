// script.js – z dodanymi logotypami partii i ideologii (ranking, popup, symulacja) + obsługa języka
let config = null;
let configBase = null;      // oryginalne dane z data.json (wartości, mapowania)
let translations = null;    // aktualne tłumaczenia (teksty)
let currentLanguage = 'pl';
let userAnswers = [];
let currentScoringMode = 'full';   // 'full' lub 'affirmative'
let simulatedEntity = null;         // { type: 'party'|'ideology', name: string }

const questionsContainer = document.getElementById('questions-container');
const submitBtn = document.getElementById('submitBtn');
const resultsDiv = document.getElementById('results-container');
const valuesResults = document.getElementById('values-results');
const ideologiesResults = document.getElementById('ideologies-results');
const partiesResults = document.getElementById('parties-results');
const popup = document.getElementById('popup');
const popupText = document.getElementById('popup-text');
const closePopupBtn = document.getElementById('closePopup');

// ======================= MAPOWANIE PARTII -> LOGO =======================
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

// ======================= MAPOWANIE IDEOLOGII -> LOGO =======================
const IDEOLOGY_LOGO_BASE_PATH = 'images/Ideologie/';
const ideologyLogoMap = new Map([
  ['Absolutyzm klasyczny', 'Absolutyzm_klasyczny.png'],
  ['Absolutyzm oświecony', 'Absolutyzm_oswiecony.png'],
  ['Agoryzm', 'Agoryzm.png'],
  ['Agraryzm', 'Agraryzm.png'],
  ['Anarchofeminizm', 'Anarchofeminizm.png'],
  ['Anarchoindywidualizm', 'Anarchoindywidualizm.png'],
  ['Anarchokapitalizm', 'Anarchokapitalizm.svg'],
  ['Anarchokolektywizm', 'Anarchokolektywizm.webp'],
  ['Anarchokomunizm', 'Anarchokomunizm.svg'],
  ['Anarchoprymitywizm', 'Anarchoprymitywizm.png'],
  ['Anarchosyndykalizm', 'Anarchosyndykalizm.png'],
  ['Chrześcijańska demokracja', 'Chrzescijanska_demokracja.png'],
  ['De Leonizm', 'De_Leonizm.png'],
  ['Demokratyczny konfederalizm', 'Demokratyczny_konfederalizm.png'],
  ['Dystrybucjonizm', 'Dystrybucjonizm.png'],
  ['Egoizm', 'Egoizm.png'],
  ['Egokomunizm', 'Egokomunizm.png'],
  ['Ekoanarchizm', 'Ekoanarchizm.png'],
  ['Ekologizm prawicowy', 'Ekologizm_prawicowy.jpg'],
  ['Ekosocjalizm', 'Ekosocjalizm.png'],
  ['Eurokomunizm', 'Eurokomunizm.png'],
  ['Faszyzm', 'Faszyzm.png'],
  ['Feminizm liberalny', 'Feminizm_liberalny.png'],
  ['Feminizm radykalny', 'Feminizm_radykalny.svg'],
  ['Feminizm socjalistyczny', 'Feminizm_socjalistyczny.png'],
  ['Fundamentalizm religijny', 'Fundamentalizm_religijny.png'],
  ['Georgizm', 'Georgizm.svg'],
  ['Głęboka ekologia', 'Gleboka_ekologia.svg'],
  ['Zielony liberalizm', 'Zielony_liberalizm.png'],
  ['Hoppeanism', 'Hoppeanism.png'],
  ['Komunizm rad', 'Komunizm_rad.png'],
  ['Konserwatywny liberalizm', 'Konserwatywny_liberalizm.png'],
  ['Konserwatyzm autorytarny', 'Konserwatyzm_autorytarny.png'],
  ['Konserwatyzm ewolucyjny', 'Konserwatyzm_ewolucyjny.png'],
  ['Konserwatyzm jednego narodu', 'Konserwatyzm_jednego_narodu.jpg'],
  ['Konserwatyzm paternalistyczny', 'Konserwatyzm_paternalistyczny.png'],
  ['Korwinizm', 'Korwinizm.png'],
  ['Leninizm', 'Leninizm.png'],
  ['Lewicowy anarchizm rynkowy', 'Lewicowy_anarchizm_rynkowy.png'],
  ['Liberalizm klasyczny', 'Liberalizm_klasyczny.png'],
  ['Liberalizm perfekcjonistyczny', 'Liberalizm_perfekcjonistyczny.png'],
  ['Liberalny konserwatyzm', 'Liberalny_konserwatyzm.png'],
  ['Libertarianizm konsekwencjalistyczny', 'Libertarianizm_konsekwencjalistyczny.png'],
  ['Libertariański municypalizm', 'Libertarianski_municypalizm.png'],
  ['Liechtensteinizm', 'Liechtensteinizm.png'],
  ['Luksemburgizm', 'Luksemburgizm.png'],
  ['Marksizm klasyczny', 'Marksizm_klasyczny.png'],
  ['Minarchizm', 'Minarchizm.png'],
  ['Mutualizm', 'Mutualizm.png'],
  ['Nacjonalizm ekspansjonistyczny', 'Nacjonalizm_ekspansjonistyczny.svg'],
  ['Nacjonalizm konserwatywny', 'Nacjonalizm_konserwatywny.svg'],
  ['Nacjonalizm lewicowy', 'Nacjonalizm_lewicowy.svg'],
  ['Nacjonalizm liberalny', 'Nacjonalizm_liberalny.png'],
  ['Narodowa demokracja', 'Narodowa_demokracja.png'],
  ['Narodowy anarchizm', 'Narodowy_anarchizm.png'],
  ['Narodowy bolszewizm', 'Narodowy_bolszewizm.png'],
  ['Narodowy komunizm', 'Narodowy_komunizm.png'],
  ['Narodowy liberalizm', 'Narodowy_liberalizm.svg'],
  ['Nazizm', 'Nazizm.png'],
  ['Neokonserwatyzm', 'Neokonserwatyzm.png'],
  ['Neolibertarianizm', 'Neolibertarianizm.svg'],
  ['Neoluddyzm', 'Neoluddyzm.png'],
  ['Neorepublikanizm', 'Neorepublikanizm.svg'],
  ['Ordoliberalizm', 'Ordoliberalizm.png'],
  ['Paleokonserwatyzm', 'Paleokonserwatyzm.png'],
  ['Paleolibertarianizm', 'Paleolibertarianizm.png'],
  ['Randyzm', 'Randyzm.png'],
  ['Socjaldemokracja', 'Socjaldemokracja.png'],
  ['Socjalizm chrześcijański', 'Socjalizm_chrzescijanski.png'],
  ['Socjalizm demokratyczny', 'Socjalizm_demokratyczny.png'],
  ['Socjalizm fabiański', 'Socjalizm_fabianski.png'],
  ['Socjalizm liberalny', 'Socjalizm_liberalny.png'],
  ['Socjalizm rynkowy', 'Socjalizm_rynkowy.png'],
  ['Socjalliberalizm', 'Socjalliberalizm.png'],
  ['Sośnierzyzm', 'Sosnierzyzm.png'],
  ['Stalinizm', 'Stalinizm.svg'],
  ['Strasseryzm', 'Strasseryzm.png'],
  ['Tradycjonalizm integralny', 'Tradycjonalizm_integralny.png'],
  ['Trockizm', 'Trockizm.svg'],
  ['Trzecia droga', 'Trzecia_droga.svg'],
  ['Nacjonalizm obywatelski', 'Nacjonalizm_obywatelski.svg'],
  ['Hoppeanizm', 'Hoppeanizm.png']
]);

function getIdeologyLogoUrl(ideologyName) {
  const fileName = ideologyLogoMap.get(ideologyName);
  if (fileName) return IDEOLOGY_LOGO_BASE_PATH + fileName;
  console.warn(`Brak logo dla ideologii: ${ideologyName}`);
  return null;
}
// ========================================================================

// Mapowanie par wartości na kategorie (na podstawie lewej wartości)
const categoryMapping = {
  "Autonomia": 1, "Indywidualizm": 1, "Kontraktualizm": 1, "Dobrowolność wspólnoty": 1,
  "Egalitaryzm": 1, "Wolność ekspresji": 1,
  "Samoorganizacja": 2, "Decentralizacja": 2, "Ograniczenie władzy": 2, "Sakralizacja autorytetu": 2,
  "Różnorodność norm": 2, "Demokracja": 2, "Autokracja": 2,
  "Własność kolektywna": 3, "Planowanie": 3, "Regulacja instytucjonalna": 3, "Ograniczanie wymiany": 3,
  "Minimalizacja granic": 4, "Kosmopolityzm": 4, "Interwencjonizm zagraniczny": 4,
  "Preferencja użycia siły": 5, "Rewolucja": 5, "Progresywizm": 5, "Pluralizm kulturowy": 5,
  "Neutralność religijna": 5, "Włączanie": 5, "Egalitaryzm biologiczny": 5,
  "Antropocentryzm": 6, "Postęp technologiczny": 6
};

const categoryNames = {
  1: "⚖️ Społeczeństwo i jednostka",
  2: "🏛️ Władza i ustrój",
  3: "💰 Ekonomia",
  4: "🌍 Globalizacja i granice",
  5: "🌱 Kultura i zmiana społeczna",
  6: "🌿 Środowisko i technologia"
};

const valueColors = {
  "Autonomia": "#FECB1D", "Heteronomia": "#613B28", "Kolektywizm": "#613B28", "Indywidualizm": "#FECB1D",
  "Egalitaryzm": "#FECB1D", "Hierarchiczność": "#613B28", "Samoorganizacja": "#2F3944", "Etatyzm": "#73B0BE",
  "Decentralizacja": "#2F3944", "Centralizacja": "#73B0BE", "Ograniczenie władzy": "#2F3944", "Absolutyzm władzy": "#73B0BE",
  "Demokracja": "#2F3944", "Anty-demokracja": "#73B0BE", "Autokracja": "#2F3944", "Anty-autokracja": "#73B0BE",
  "Własność kolektywna": "#E44341", "Własność prywatna": "#448A3A", "Planowanie": "#E44341", "Rynek": "#448A3A",
  "Regulacja instytucjonalna": "#E44341", "Samoregulacja": "#448A3A", "Ograniczanie wymiany": "#E44341", "Swobodna wymiana": "#448A3A",
  "Minimalizacja granic": "#4C59CB", "Kontrola granic": "#FFA219", "Kosmopolityzm": "#4C59CB", "Partykularyzm narodowy": "#FFA219",
  "Interwencjonizm zagraniczny": "#4C59CB", "Izolacjonizm": "#FFA219", "Preferencja użycia siły": "#DD59C7", "Unikanie przemocy": "#86D040",
  "Rewolucja": "#DD59C7", "Gradualizm": "#86D040", "Progresywizm": "#DD59C7", "Konserwatyzm": "#86D040",
  "Pluralizm kulturowy": "#DD59C7", "Homogenizacja": "#86D040", "Neutralność religijna": "#DD59C7", "Instytucjonalna religia": "#86D040",
  "Włączanie": "#DD59C7", "Wykluczenie": "#86D040", "Egalitaryzm biologiczny": "#DD59C7", "Suprematyzm biologiczny": "#86D040",
  "Wolność ekspresji": "#FECB1D", "Cenzura": "#613B28", "Antropocentryzm": "#E57160", "Ekocentryzm": "#14832A",
  "Postęp technologiczny": "#E57160", "Prymitywizm": "#14832A", "Desakralizacja autorytetu": "#73B0BE", "Sakralizacja autorytetu": "#2F3944",
  "Różnorodność norm": "#2F3944", "Uniformizacja norm": "#73B0BE", "Kontraktualizm": "#FECB1D", "Organicyzm": "#613B28",
  "Dobrowolność wspólnoty": "#FECB1D", "Obowiązkowość wspólnoty": "#613B28"
};

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

function getContrastColor(hex) {
  const r = parseInt(hex.slice(1,3), 16);
  const g = parseInt(hex.slice(3,5), 16);
  const b = parseInt(hex.slice(5,7), 16);
  const brightness = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
  return brightness > 0.5 ? '#000000' : '#ffffff';
}

// ======================= OBSŁUGA JĘZYKA =======================
async function loadTranslations(lang) {
  if (lang === 'pl') {
    // Dla polskiego nie ładujemy zewnętrznego pliku – używamy danych z configBase
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

function applyTranslationsToConfig() {
  if (!configBase) return;
  // głęboka kopia configBase
  config = JSON.parse(JSON.stringify(configBase));
  if (!translations) return; // brak tłumaczeń – zostawiamy polskie

  // Tłumaczenie par wartości
  if (translations.pairsOfValues) {
    for (let i = 0; i < config.pairsOfValues.length; i++) {
      const pair = config.pairsOfValues[i];
      const transPair = translations.pairsOfValues.find(p => p.left === pair.left && p.right === pair.right);
      if (transPair) {
        pair.left = transPair.left;
        pair.right = transPair.right;
        pair.leftDef = transPair.leftDef;
        pair.rightDef = transPair.rightDef;
      }
    }
  }

  // Tłumaczenie ideologii
  if (translations.ideologies) {
    for (let i = 0; i < config.ideologies.length; i++) {
      const ideo = config.ideologies[i];
      const transIdeo = translations.ideologies.find(t => t.name === ideo.name);
      if (transIdeo) {
        ideo.name = transIdeo.name;
        ideo.description = transIdeo.description;
      }
    }
  }

  // Tłumaczenie partii
  if (translations.parties) {
    for (let i = 0; i < config.parties.length; i++) {
      const party = config.parties[i];
      const transParty = translations.parties.find(t => t.name === party.name);
      if (transParty) {
        party.name = transParty.name;
        party.description = transParty.description;
      }
    }
  }

  // Tłumaczenie pytań i odpowiedzi
  if (translations.questions) {
    for (let i = 0; i < config.questions.length; i++) {
      const q = config.questions[i];
      const transQ = translations.questions.find(t => t.id === q.id);
      if (transQ) {
        q.text = transQ.text;
        q.description = transQ.description;
        if (transQ.answers) {
          for (let j = 0; j < q.answers.length; j++) {
            if (transQ.answers[j] && transQ.answers[j].label) {
              q.answers[j].label = transQ.answers[j].label;
            }
          }
        }
      }
    }
  }
}

function updateUITexts() {
  if (!translations || !translations.ui) return;
  const ui = translations.ui;
  // Aktualizacja tekstów w elementach (jeśli istnieją)
  if (ui.disclaimerTitle) {
    const disclaimer = document.getElementById('disclaimer');
    if (disclaimer) {
      const strong = disclaimer.querySelector('strong');
      if (strong) strong.textContent = ui.disclaimerTitle;
    }
  }
  if (ui.disclaimerText) {
    const disclaimer = document.getElementById('disclaimer');
    if (disclaimer) {
      const paragraphs = disclaimer.querySelectorAll('p');
      if (paragraphs.length > 1) paragraphs[1].innerHTML = ui.disclaimerText;
      if (paragraphs.length > 2) paragraphs[2].innerHTML = ui.disclaimerText2;
      if (paragraphs.length > 3) paragraphs[3].innerHTML = ui.disclaimerText3;
    }
  }
  const importLabel = document.getElementById('importLabel');
  if (importLabel && ui.importLabel) importLabel.textContent = ui.importLabel;
  const importCodeArea = document.getElementById('importCodeArea');
  if (importCodeArea && ui.importPlaceholder) importCodeArea.placeholder = ui.importPlaceholder;
  const importBtn = document.getElementById('importBtn');
  if (importBtn && ui.importBtn) importBtn.textContent = ui.importBtn;
  const importInfo = document.getElementById('importInfo');
  if (importInfo && ui.importInfo) importInfo.textContent = ui.importInfo;
  const simulateLabel = document.getElementById('simulateLabel');
  if (simulateLabel && ui.simulateLabel) simulateLabel.textContent = ui.simulateLabel;
  const simulateBtn = document.getElementById('simulateBtn');
  if (simulateBtn && ui.simulateBtn) simulateBtn.textContent = ui.simulateBtn;
  const restoreBtn = document.getElementById('restoreBtn');
  if (restoreBtn && ui.restoreBtn) restoreBtn.textContent = ui.restoreBtn;
  const simulateInfo = document.getElementById('simulateInfo');
  if (simulateInfo && ui.simulateInfo) simulateInfo.textContent = ui.simulateInfo;
  const submitBtnElem = document.getElementById('submitBtn');
  if (submitBtnElem && ui.submitBtn) submitBtnElem.textContent = ui.submitBtn;
  const modeLabel = document.getElementById('modeLabel');
  if (modeLabel && ui.modeLabel) modeLabel.textContent = ui.modeLabel;
  const modeFullLabel = document.getElementById('modeFullLabel');
  if (modeFullLabel && ui.modeFullLabel) modeFullLabel.textContent = ui.modeFullLabel;
  const modeAffirmativeLabel = document.getElementById('modeAffirmativeLabel');
  if (modeAffirmativeLabel && ui.modeAffirmativeLabel) modeAffirmativeLabel.textContent = ui.modeAffirmativeLabel;
  const resultsTitle = document.getElementById('resultsTitle');
  if (resultsTitle && ui.resultsTitle) resultsTitle.textContent = ui.resultsTitle;
  const closePopupBtnElem = document.getElementById('closePopup');
  if (closePopupBtnElem && ui.closePopup) closePopupBtnElem.textContent = ui.closePopup;
}

async function setLanguage(lang) {
  if (lang === currentLanguage) return;
  const success = await loadTranslations(lang);
  if (success === false && lang !== 'pl') return;
  currentLanguage = lang;
  applyTranslationsToConfig();
  updateUITexts();
  // Ponowne renderowanie pytań (jeśli istnieją)
  if (questionsContainer.children.length > 0) {
    renderQuestions();
    attachQuestionEvents();
    // Przywróć zaznaczenia odpowiedzi
    updateDOMSelections();
  }
  // Jeśli wyniki są widoczne – przelicz i wyświetl od nowa
  if (resultsDiv.style.display !== 'none') {
    computeAndDisplayResults();
  }
}

// ======================= KONFIGURACJA =======================
async function loadConfig() {
  try {
    const response = await fetch('data.json');
    if (!response.ok) throw new Error('Nie udało się wczytać data.json');
    configBase = await response.json();
    // Domyślnie ładujemy język polski (nie ładujemy pliku tłumaczeń, bo dane są po polsku)
    config = JSON.parse(JSON.stringify(configBase));
    translations = null; // dla polskiego brak zewnętrznych tłumaczeń
    currentLanguage = 'pl';
    updateUITexts(); // ustawi polskie teksty z domyślnych (ale możemy też załadować plik translations_pl.json – opcjonalnie)
    initApp();
    setupSimulation();
    setupModeSelector();
    setupImportExport();
    setupLanguageSelector();
  } catch (err) {
    console.error(err);
    questionsContainer.innerHTML = '<p style="color:red;">Błąd ładowania konfiguracji. Sprawdź czy plik data.json istnieje i jest poprawny.</p>';
  }
}

function setupLanguageSelector() {
  const langSelect = document.getElementById('language-select');
  if (langSelect) {
    langSelect.value = currentLanguage;
    langSelect.addEventListener('change', (e) => {
      setLanguage(e.target.value);
    });
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

function attachQuestionEvents() {}

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

function getCurrentDateTime() {
  const now = new Date();
  const YYYY = now.getFullYear();
  const MM = String(now.getMonth() + 1).padStart(2, '0');
  const DD = String(now.getDate()).padStart(2, '0');
  const HH = String(now.getHours()).padStart(2, '0');
  const MMmin = String(now.getMinutes()).padStart(2, '0');
  return `${YYYY}-${MM}-${DD} ${HH}:${MMmin}`;
}

function generateExportCode() {
  if (!config) return '';
  const dateStr = getCurrentDateTime();
  let output = `Data wykonania testu: ${dateStr}\n\n`;
  for (let i = 0; i < config.questions.length; i++) {
    const q = config.questions[i];
    const userAns = userAnswers.find(a => a.questionId === q.id);
    let answerText = 'Brak odpowiedzi';
    if (userAns && userAns.answerData) {
      answerText = userAns.answerData.label;
    } else if (userAns && userAns.answerValue === 0) {
      answerText = 'Pomiń';
    }
    output += `${i+1}. ${q.text} [id:${q.id}]: (${answerText});\n`;
  }
  return output;
}

function createExportSection() {
  const exportDiv = document.createElement('div');
  exportDiv.id = 'export-answers-section';
  exportDiv.className = 'export-answers-section';
  const exportTitle = translations?.ui?.exportTitle || '📋 Eksport Twoich odpowiedzi';
  const exportDesc = translations?.ui?.exportDesc || 'Skopiuj poniższy kod, aby zapisać lub przenieść swoje odpowiedzi do innego urządzenia.';
  const copyBtnText = translations?.ui?.copyExportBtn || '📋 Kopiuj kod eksportu';
  exportDiv.innerHTML = `
    <h3>${exportTitle}</h3>
    <p>${exportDesc}</p>
    <textarea id="exportCodeArea" class="export-code" rows="5" readonly></textarea>
    <button id="copyExportBtn" class="copy-export-btn">${copyBtnText}</button>
  `;
  const textarea = exportDiv.querySelector('#exportCodeArea');
  textarea.value = generateExportCode();
  const copyBtn = exportDiv.querySelector('#copyExportBtn');
  copyBtn.addEventListener('click', () => {
    textarea.select();
    navigator.clipboard.writeText(textarea.value).then(() => {
      copyBtn.textContent = '✅ ' + (translations?.ui?.copied || 'Skopiowano!');
      setTimeout(() => { copyBtn.textContent = copyBtnText; }, 2000);
    }).catch(() => showPopup(translations?.ui?.copyError || 'Nie udało się skopiować. Zaznacz kod ręcznie.'));
  });
  return exportDiv;
}

function refreshExportSection() {
  const existingExport = document.getElementById('export-answers-section');
  if (existingExport) existingExport.remove();
  const newExport = createExportSection();
  const shareSection = resultsDiv.querySelector('.share-section');
  if (shareSection) shareSection.insertAdjacentElement('afterend', newExport);
  else resultsDiv.appendChild(newExport);
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
      const ans = question.answers[idx];
      if (ans.label === answerText) {
        matchedAnswer = ans;
        matchedIndex = idx;
        break;
      }
    }
    if (!matchedAnswer && (answerText === 'Pomiń' || answerText === 'Skip')) {
      for (let idx = 0; idx < question.answers.length; idx++) {
        const ans = question.answers[idx];
        if (ans.value === 0 && (ans.label.includes('Pomiń') || ans.label.includes('Skip'))) {
          matchedAnswer = ans;
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
  if (matchedCount === 0) {
    showPopup(translations?.ui?.importNoAnswers || 'Nie znaleziono żadnych prawidłowych odpowiedzi w kodzie. Upewnij się, że wklejasz poprawny kod eksportu.');
    return false;
  }
  userAnswers = newAnswers;
  updateDOMSelections();
  if (resultsDiv.style.display !== 'none') {
    computeAndDisplayResults();
  } else {
    showPopup(`${translations?.ui?.importSuccess || `Zaimportowano ${matchedCount} odpowiedzi.`} ${translations?.ui?.clickShowResults || 'Kliknij "Pokaż wyniki", aby zobaczyć zaktualizowany profil.'}`);
  }
  return true;
}

function setupImportExport() {
  const importBtn = document.getElementById('importBtn');
  const importTextarea = document.getElementById('importCodeArea');
  if (importBtn && importTextarea) {
    importBtn.addEventListener('click', () => {
      const code = importTextarea.value.trim();
      if (!code) {
        showPopup(translations?.ui?.pasteCode || 'Wklej kod eksportu w pole powyżej.');
        return;
      }
      const success = importAnswersFromExportCode(code);
      if (success) {
        importTextarea.value = '';
        questionsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }
}

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

// ========== ODZNAKI: DEFINICJE I ICH OPISY ==========
const badgesDescriptions = {
  "Monarchizm": "Poparcie dla dziedzicznej władzy, często legitymizowanej boskim prawem lub tradycją. Kładzie nacisk na stabilność, ciągłość i hierarchię.",
  "Anarchizm": "Odrzucenie państwa i wszelkiej przymusowej władzy na rzecz dobrowolnych, zdecentralizowanych wspólnot i bezpośredniej demokracji.",
  "Technokracja": "Przekonanie, że rządzić powinni eksperci i specjaliści, a decyzje polityczne powinny być oparte na danych naukowych i efektywności.",
  "Oligarchia": "Akceptacja koncentracji władzy i bogactwa w rękach nielicznych, często usprawiedliwiana naturalnymi nierównościami lub efektywnością.",
  "Państwo minimalne": "Postulat ograniczenia roli państwa wyłącznie do funkcji ochronnych (sądy, policja, wojsko), bez ingerencji w gospodarkę i życie prywatne.",
  "Państwo opiekuńcze": "Model, w którym państwo zapewnia obywatelom bezpieczeństwo socjalne, dostęp do edukacji, ochrony zdrowia i redystrybucję dochodów.",
  "Secesjonizm": "Prawo regionów lub grup etnicznych do pokojowego odłączenia się od istniejącego państwa i utworzenia własnej administracji.",
  "Agraryzm": "Uznanie rolnictwa i wsi za fundament społeczeństwa, promowanie rodzinnych gospodarstw oraz tradycyjnego stylu życia."
};

// Ścieżka do obrazków odznak (użytkownik może umieścić pliki w tym katalogu)
const BADGES_IMG_BASE_PATH = 'AutystykShort/images/Odznaki/';

function createBadgesSection(badges) {
  const section = document.createElement('div');
  section.className = 'badges-section';
  const header = document.createElement('h3');
  header.textContent = '🏅 Odznaki';
  section.appendChild(header);
  if (badges.length === 0) {
    const none = document.createElement('p');
    none.textContent = 'Nie zdobyto jeszcze żadnej odznaki. Odpowiadaj zdecydowanie na pytania pasujące do określonych światopoglądów.';
    none.className = 'no-badges';
    section.appendChild(none);
  } else {
    const badgesContainer = document.createElement('div');
    badgesContainer.className = 'badges-list';
    for (const badge of badges) {
      const badgeEl = document.createElement('div');
      badgeEl.className = 'badge-item';
      
      // Dodanie miniaturki ikony (jeśli istnieje)
      const img = document.createElement('img');
      img.alt = badge;
      img.className = 'badge-icon';
      // próba załadowania obrazka – najpierw .png, potem .jpg
      const tryImage = (ext) => {
        img.src = `${BADGES_IMG_BASE_PATH}${badge}${ext}`;
        img.onerror = () => {
          // jeśli nie udało się załadować, ukryj obrazek
          img.style.display = 'none';
        };
        img.onload = () => {
          img.style.display = 'inline-block';
        };
      };
      tryImage('.png');
      // małe opóźnienie, by sprawdzić, czy obrazek się załadował – uproszczone: dla uproszczenia najpierw próbujemy PNG, jeśli błąd to ukrywamy.
      // Można by dodać obsługę .jpg, ale to tylko szczegół.
      badgeEl.appendChild(img);
      
      const textSpan = document.createElement('span');
      textSpan.textContent = badge;
      badgeEl.appendChild(textSpan);
      
      // Kliknięcie pokazuje opis
      badgeEl.addEventListener('click', (e) => {
        e.stopPropagation();
        const description = badgesDescriptions[badge] || 'Brak szczegółowego opisu tej odznaki.';
        showPopup(`🏅 ${badge}\n\n${description}`);
      });
      
      badgesContainer.appendChild(badgeEl);
    }
    section.appendChild(badgesContainer);
  }
  return section;
}

// ========== ZMODYFIKOWANA FUNKCJA createRankingSection ==========
function createRankingSection(title, items, type) {
  const section = document.createElement('div');
  section.className = 'ranking-section';
  const header = document.createElement('h3');
  header.textContent = title;
  section.appendChild(header);
  if (title.includes('Ideologii') || title.includes('Ideologies')) {
    const info = document.createElement('div');
    info.style.marginBottom = '1rem';
    info.textContent = translations?.ui?.rankingInfo || 'Im wyższy procent, tym bardziej Twój profil jest zgodny z daną ideologią.';
    section.appendChild(info);
  }
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

function generateShareCode(pairResults) {
  const resultsString = pairResults.map(pair => `${pair.left}(${Math.round(pair.leftPercent)}) - ${pair.right}(${Math.round(pair.rightPercent)})`).join('; ');
  let base64 = '';
  try { base64 = btoa(unescape(encodeURIComponent(resultsString))); } catch(e) { console.error(e); base64 = ''; }
  const container = document.createElement('div');
  container.className = 'share-section';
  const shareTitle = translations?.ui?.shareTitle || '🔗 Sprawdź położenie na kompasie';
  const shareDesc = translations?.ui?.shareDesc || 'Skopiuj poniższy kod i wklej go na stronie z kompasem, by poznać swoje położenie:';
  const copyBtnText = translations?.ui?.copyShareBtn || '📋 Kopiuj kod';
  const compassLinkText = translations?.ui?.compassLink || '🧭 NeoAutystyk Kompas';
  container.innerHTML = `<h3>${shareTitle}</h3>
    <p>${shareDesc}</p>
    <textarea readonly class="share-code" rows="3">${base64}</textarea>
    <button class="copy-btn">${copyBtnText}</button>
    <p class="share-link">
      <a href="https://zbieraczartur.github.io/NeoAutystyk-Kompas/" target="_blank" rel="noopener noreferrer" class="compass-link">${compassLinkText}</a>
    </p>`;
  const copyBtn = container.querySelector('.copy-btn');
  const textarea = container.querySelector('.share-code');
  copyBtn.addEventListener('click', () => {
    textarea.select();
    navigator.clipboard.writeText(textarea.value).then(() => {
      copyBtn.textContent = '✅ ' + (translations?.ui?.copied || 'Skopiowano!');
      setTimeout(() => { copyBtn.textContent = copyBtnText; }, 2000);
    }).catch(() => alert('Nie udało się skopiować. Możesz zaznaczyć kod ręcznie.'));
  });
  return container;
}

function computeAndDisplayResults() {
  const { pairResults, ideologyResults, partyResults } = computeScores(currentScoringMode);

  // Grupowanie par wartości
  const groups = new Map();
  for (const pair of pairResults) {
    const catId = categoryMapping[pair.left];
    if (!catId) continue;
    if (!groups.has(catId)) groups.set(catId, { name: categoryNames[catId], pairs: [] });
    groups.get(catId).pairs.push(pair);
  }
  const sortedGroups = Array.from(groups.entries()).sort((a, b) => a[0] - b[0]);

  const valuesHeader = translations?.ui?.valuesHeader || '⚖️ Pary wartości';
  valuesResults.innerHTML = `<h3>${valuesHeader}</h3>`;
  const gridContainer = document.createElement('div');
  gridContainer.className = 'values-categories-grid';
  for (const [catId, group] of sortedGroups) {
    const categoryDiv = document.createElement('div');
    categoryDiv.className = 'value-category-block';
    const catHeader = document.createElement('h4');
    catHeader.className = 'category-header';
    catHeader.textContent = group.name;
    categoryDiv.appendChild(catHeader);
    for (const pair of group.pairs) {
      const leftColor = valueColors[pair.left] || '#3b82f6';
      const rightColor = valueColors[pair.right] || '#ef4444';
      const leftTextColor = getContrastColor(leftColor);
      const rightTextColor = getContrastColor(rightColor);
      const pairDiv = document.createElement('div');
      pairDiv.className = 'value-pair';
      pairDiv.innerHTML = `
        <div class="value-bar-container-new">
          <span class="value-left-new" data-def="${pair.leftDef}">${pair.left}</span>
          <div class="value-bar-new">
            <div class="bar-left-new" style="width: ${pair.leftPercent}%; background-color: ${leftColor}; color: ${leftTextColor};">${Math.round(pair.leftPercent)}%</div>
            <div class="bar-right-new" style="width: ${pair.rightPercent}%; background-color: ${rightColor}; color: ${rightTextColor};">${Math.round(pair.rightPercent)}%</div>
          </div>
          <span class="value-right-new" data-def="${pair.rightDef}">${pair.right}</span>
        </div>
      `;
      const leftSpan = pairDiv.querySelector('.value-left-new');
      const rightSpan = pairDiv.querySelector('.value-right-new');
      
      leftSpan.style.setProperty('--hover-color', leftColor);
      rightSpan.style.setProperty('--hover-color', rightColor);
      
      leftSpan.addEventListener('click', () => showPopup(pair.leftDef));
      rightSpan.addEventListener('click', () => showPopup(pair.rightDef));
      categoryDiv.appendChild(pairDiv);
    }
    gridContainer.appendChild(categoryDiv);
  }
  valuesResults.appendChild(gridContainer);

  ideologiesResults.innerHTML = '';
  partiesResults.innerHTML = '';

  // ---- DODANIE SEKCJI ODZNAK (pod osiami, nad rankingami) ----
  const badges = computeBadges();
  const existingBadgesSection = resultsDiv.querySelector('.badges-section');
  if (existingBadgesSection) existingBadgesSection.remove();
  const badgesSection = createBadgesSection(badges);
  // Wstawiamy przed kontenerem rankingów
  const ideologiesPartiesContainer = document.querySelector('.ideologies-parties-container');
  if (ideologiesPartiesContainer) {
    ideologiesPartiesContainer.parentNode.insertBefore(badgesSection, ideologiesPartiesContainer);
  } else {
    // jeżeli kontener nie istnieje (np. przy pierwszym uruchomieniu), wstawiamy po wartości
    valuesResults.parentNode.insertBefore(badgesSection, valuesResults.nextSibling);
  }
  // ------------------------------------------------

  // BANNER SYMULACJI (dla partii lub ideologii)
  const existingBanner = resultsDiv.querySelector('.simulation-banner');
  if (existingBanner) existingBanner.remove();
  if (simulatedEntity) {
    const banner = document.createElement('div');
    banner.className = 'simulation-banner';
    let logoUrl = null;
    let entityTypeLabel = '';
    if (simulatedEntity.type === 'party') {
      logoUrl = getPartyLogoUrl(simulatedEntity.name);
      entityTypeLabel = translations?.ui?.simulatingParty || 'partię';
    } else if (simulatedEntity.type === 'ideology') {
      logoUrl = getIdeologyLogoUrl(simulatedEntity.name);
      entityTypeLabel = translations?.ui?.simulatingIdeology || 'ideologię';
    }
    let logoHtml = '';
    if (logoUrl) {
      logoHtml = `<img src="${logoUrl}" alt="Logo ${simulatedEntity.name}" class="simulation-banner-logo">`;
    }
    banner.innerHTML = `
      ${logoHtml}
      <div class="simulation-banner-text">
        🎭 ${translations?.ui?.simulating || 'Symulujesz'} ${entityTypeLabel}: <strong>${simulatedEntity.name}</strong><br>
        <small>${translations?.ui?.simulationNote || 'Wyniki poniżej są tymczasowe. Kliknij „Przywróć moje odpowiedzi”, aby wrócić do własnych.'}</small>
      </div>
    `;
    if (ideologiesPartiesContainer) {
      ideologiesPartiesContainer.parentNode.insertBefore(banner, ideologiesPartiesContainer);
    } else {
      partiesResults.parentNode.insertBefore(banner, partiesResults);
    }
  }

  const ideologiesTitle = translations?.ui?.rankingIdeologies || '📊 Ranking ideologii';
  const partiesTitle = translations?.ui?.rankingParties || '🗳️ Ranking partii';
  ideologiesResults.appendChild(createRankingSection(ideologiesTitle, ideologyResults, 'ideology'));
  partiesResults.appendChild(createRankingSection(partiesTitle, partyResults, 'party'));

  const existingShare = resultsDiv.querySelector('.share-section');
  if (existingShare) existingShare.remove();
  resultsDiv.appendChild(generateShareCode(pairResults));
  resultsDiv.style.display = 'block';
  refreshExportSection();
  window.scrollTo({ top: resultsDiv.offsetTop - 20, behavior: 'smooth' });
}

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
      const ansIdx = parseInt(selectedAnswer.dataset.answerIndex);
      const answerData = questionConfig.answers[ansIdx];
      newAnswers.push({
        questionId: qid,
        answerIndex: ansIdx,
        answerValue: answerData.value,
        answerData: answerData
      });
    } else {
      const skipAnswer = questionConfig.answers.find(a => a.value === 0 && (a.label.includes('Pomiń') || a.label.includes('Skip')));
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
}

function restoreUserAnswers() {
  syncUserAnswersFromDOM();
  simulatedEntity = null;
  computeAndDisplayResults();
  showPopup(translations?.ui?.restored || 'Przywrócono Twoje odpowiedzi i odświeżono wyniki.');
}

function simulateAnswers(selectedName) {
  const isParty = config.parties.some(p => p.name === selectedName);
  const isIdeology = config.ideologies.some(i => i.name === selectedName);
  if (isParty) {
    simulatedEntity = { type: 'party', name: selectedName };
  } else if (isIdeology) {
    simulatedEntity = { type: 'ideology', name: selectedName };
  } else {
    simulatedEntity = null;
  }

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
      bestAnswer = question.answers.find(a => a.value === 0 && (a.label.includes('Pomiń') || a.label.includes('Skip')));
      if (!bestAnswer) bestAnswer = question.answers[0];
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
  updateDOMSelections();
  computeAndDisplayResults();
}

function setupSimulation() {
  simulationSelect = document.getElementById('simulateSelect');
  simulateBtn = document.getElementById('simulateBtn');
  restoreBtn = document.getElementById('restoreBtn');
  if (!simulationSelect || !simulateBtn || !restoreBtn) return;
  if (!config || !config.parties || !config.ideologies) return;
  simulationSelect.innerHTML = '';
  if (config.parties.length) {
    const partiesGroup = document.createElement('optgroup');
    partiesGroup.label = translations?.ui?.partiesGroup || '🇵🇱 Partie polityczne';
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
    ideologiesGroup.label = translations?.ui?.ideologiesGroup || '💡 Ideologie';
    config.ideologies.forEach(ideo => {
      const option = document.createElement('option');
      option.value = ideo.name;
      option.textContent = ideo.name;
      ideologiesGroup.appendChild(option);
    });
    simulationSelect.appendChild(ideologiesGroup);
  }
  if (config.parties.length) simulationSelect.value = config.parties[0].name;
  else if (config.ideologies.length) simulationSelect.value = config.ideologies[0].name;
  simulateBtn.addEventListener('click', () => {
    const selected = simulationSelect.value;
    if (selected) simulateAnswers(selected);
    else alert(translations?.ui?.selectEntity || 'Wybierz partię lub ideologię.');
  });
  restoreBtn.addEventListener('click', restoreUserAnswers);
}

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
    const helpText = translations?.ui?.modeHelpText || '🧠 Tryb pełnego profilowania\nUwzględnia zarówno poglądy popierane, jak i odrzucane.\n\n✅ Tryb afirmacyjny\nUwzględnia wyłącznie poglądy aktywnie popierane.';
    showPopup(helpText);
  });
}

loadConfig();
