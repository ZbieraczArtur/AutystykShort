// script.js – z dodanymi logotypami partii i ideologii (ranking, popup, symulacja) + obsługa języka + panel ręczny dla kompasu

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
  // Dodajemy nasłuchiwanie synchronizacji
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

// ======================= RESZTA KODU (zachowana oryginalna treść) =======================

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

// ======================= FUNKCJA OBLICZAJĄCA ODZNAKI (DO ROZBUDOWY) =======================
// Na razie zwraca pustą tablicę – możesz dodać własne warunki w oparciu o wyniki par wartości.
function computeBadges() {
  // Przykładowa implementacja (później możesz zastąpić):
  // const badges = [];
  // if (warunek) badges.push('Monarchizm');
  // return badges;
  return [];
}

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
  ['Chrześcijańska demokracja', 'Chrzescijańska_demokracja.png'],
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
  ['Liberalizm utylitarny', 'Liberalizm_utylitarny.png'],
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

// ======================= INTEGRACJA Z KOMPASEM =======================
// Upewnij się, że pary z compass-core.js są dostępne globalnie
const corePairs = window.corePairs || [];
const extraPairs = window.extraPairs || [];
const allCompassPairs = window.allCompassPairs || [...corePairs, ...extraPairs];

let currentCompassMode = 'weighted';
let currentCreativeConfig = {
  activePairs: [],
  labels: { top: "Heteronomia", bottom: "Autonomia", left: "Socjalizm", right: "Kapitalizm" }
};
let compassUserValues = null; // mapa wartości dla użytkownika

// Funkcja do budowania mapy wartości dla użytkownika na podstawie pairResults
function buildUserValuesMap(pairResults) {
  const valuesMap = {};
  // Używamy tych samych identyfikatorów par co w compass-core
  const allCompassPairs = [...corePairs, ...extraPairs];
  for (const pair of allCompassPairs) {
    // Znajdź w pairResults parę pasującą (left/right)
    const found = pairResults.find(p => p.left === pair.negativeLabel && p.right === pair.positiveLabel);
    if (found) {
      valuesMap[pair.id] = {
        negative: found.leftPercent,
        positive: found.rightPercent
      };
    } else {
      // Szukaj odwrotnej kolejności
      const foundReverse = pairResults.find(p => p.left === pair.positiveLabel && p.right === pair.negativeLabel);
      if (foundReverse) {
        valuesMap[pair.id] = {
          negative: foundReverse.rightPercent,
          positive: foundReverse.leftPercent
        };
      } else {
        valuesMap[pair.id] = { negative: null, positive: null };
      }
    }
  }
  return valuesMap;
}

// Funkcja aktualizująca kompas w kontenerze głównym i w modalu
function updateCompassDisplay() {
  const valuesMap = compassUserValues;
  if (!valuesMap) return;
  const coords = computeCoordinatesFromValues(valuesMap, currentCompassMode, currentCreativeConfig);
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
  // Zapamiętaj współrzędne do ewentualnego użycia przy nakładkach
  window.currentUserCoords = { x: coords.x, y: coords.y };
}

// Ładowanie nakładek (partie, ideologie)
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

// Obliczanie współrzędnych dla partii/ideologii (symulacja odpowiedzi)
async function getEntityCoordinates(name, type) {
  // Symulacja odpowiedzi dla danej entitiy (używamy trybu full)
  const simulatedAnswers = [];
  for (const question of config.questions) {
    let bestAnswer = null;
    let bestAbsValue = -1;
    for (const answer of question.answers) {
      const partiesFor = answer.parties_for || [];
      const ideologiesFor = answer.ideologies_for || [];
      if ((type === 'party' && partiesFor.includes(name)) || (type === 'ideology' && ideologiesFor.includes(name))) {
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
    simulatedAnswers.push({
      questionId: question.id,
      answerIndex: question.answers.indexOf(bestAnswer),
      answerValue: bestAnswer.value,
      answerData: bestAnswer
    });
  }
  // Oblicz pairResults dla tych odpowiedzi (tryb full)
  const tmpScores = computeScoresForAnswers(simulatedAnswers, 'full');
  const valuesMap = buildUserValuesMap(tmpScores.pairResults);
  const coords = computeCoordinatesFromValues(valuesMap, currentCompassMode, currentCreativeConfig);
  return { x: coords.x, y: coords.y };
}

// Pomocnicza funkcja do obliczania wyników dla podanych odpowiedzi i trybu
function computeScoresForAnswers(answers, mode) {
  const ideologyScores = new Map();
  const partyScores = new Map();
  const valueScores = new Map();

  config.ideologies.forEach(ideo => ideologyScores.set(ideo.name, { sum: 0, maxPossible: 0 }));
  config.parties.forEach(party => partyScores.set(party.name, { sum: 0, maxPossible: 0 }));

  const allValueNames = new Set();
  config.pairsOfValues.forEach(pair => { allValueNames.add(pair.left); allValueNames.add(pair.right); });
  config.hiddenValues.forEach(v => allValueNames.add(v));
  allValueNames.forEach(v => valueScores.set(v, { sum: 0, maxPossible: 0 }));

  for (const ans of answers) {
    const weight = ans.answerValue;
    if (weight === 0) continue;
    const answer = ans.answerData;
    const absWeight = Math.abs(weight);

    if (mode === 'full') {
      for (const ideo of (answer.ideologies_for || [])) {
        const rec = ideologyScores.get(ideo);
        if (rec) { rec.sum += absWeight; rec.maxPossible += 1.5; }
      }
      for (const ideo of (answer.ideologies_against || [])) {
        const rec = ideologyScores.get(ideo);
        if (rec) { rec.sum -= absWeight; rec.maxPossible += 1.5; }
      }
    } else {
      if (weight > 0) {
        for (const ideo of (answer.ideologies_for || [])) {
          const rec = ideologyScores.get(ideo);
          if (rec) { rec.sum += absWeight; rec.maxPossible += 1.5; }
        }
      }
    }
    // analogicznie dla partii i wartości – uproszczone, bo potrzebujemy tylko pairResults
    // Do pairResults potrzebujemy tylko wartości valueScores
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

  // Oblicz pairResults podobnie jak w computeScores
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
    });
  }
  return { pairResults };
}

// Inicjalizacja kompasu po pokazaniu wyników
function initCompassAfterResults() {
  const container = document.getElementById('compass-container');
  if (!container) return;
  if (window.compassInstance && window.compassInstance.destroy) window.compassInstance.destroy();
  window.compassInstance = new CompassUI(container, {
    mode: currentCompassMode,
    onModeChange: (mode) => {
      currentCompassMode = mode;
      if (mode === 'creative') {
        // Wczytaj zapisaną konfigurację kreatywną
        if (window.compassInstance.getCreativeConfig) {
          currentCreativeConfig = window.compassInstance.getCreativeConfig();
        }
      }
      updateCompassDisplay();
      // Odśwież nakładki
      const showParties = document.getElementById('toggle-parties')?.checked || false;
      const showIdeologies = document.getElementById('toggle-ideologies')?.checked || false;
      loadOverlays(showParties, showIdeologies, window.compassInstance);
    },
    onCreativeConfigChange: (config) => {
      currentCreativeConfig = config;
      updateCompassDisplay();
      const showParties = document.getElementById('toggle-parties')?.checked || false;
      const showIdeologies = document.getElementById('toggle-ideologies')?.checked || false;
      loadOverlays(showParties, showIdeologies, window.compassInstance);
    }
  });
  // Ustaw wartości użytkownika
  if (compassUserValues) {
    const coords = computeCoordinatesFromValues(compassUserValues, currentCompassMode, currentCreativeConfig);
    window.compassInstance.updateMarker(coords.x, coords.y);
    window.compassInstance.updateActivePairs(coords.activePairsCount);
    window.compassInstance.updateModeLabel(currentCompassMode);
  }
  // Obsługa przełączników nakładek
  const toggleParties = document.getElementById('toggle-parties');
  const toggleIdeologies = document.getElementById('toggle-ideologies');
  if (toggleParties) {
    toggleParties.addEventListener('change', () => {
      loadOverlays(toggleParties.checked, toggleIdeologies.checked, window.compassInstance);
    });
  }
  if (toggleIdeologies) {
    toggleIdeologies.addEventListener('change', () => {
      loadOverlays(toggleParties.checked, toggleIdeologies.checked, window.compassInstance);
    });
  }
  // Inicjalne załadowanie nakładek
  loadOverlays(false, false, window.compassInstance);
}

let manualPanelVisible = false;

function setupManualPanelInModal() {
  const toggleBtn = document.getElementById('toggle-manual-panel');
  const manualPanel = document.getElementById('manual-panel');
  const resetBtn = document.getElementById('reset-manual-to-test');
  const applyBtn = document.getElementById('apply-manual-to-marker');
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
  });

  applyBtn.addEventListener('click', () => {
    const pairs = getActivePairsForMode(currentCompassMode, currentCreativeConfig);
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
}

// Obsługa pełnoekranowego modala kompasu
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
            if (mode === 'creative') {
              if (window.modalCompassInstance.getCreativeConfig) {
                currentCreativeConfig = window.modalCompassInstance.getCreativeConfig();
              }
            }
            updateCompassDisplay();
            const showParties = document.getElementById('modal-toggle-parties')?.checked || false;
            const showIdeologies = document.getElementById('modal-toggle-ideologies')?.checked || false;
            loadOverlays(showParties, showIdeologies, window.modalCompassInstance);
            if (window.compassInstance && window.compassInstance.setMode) window.compassInstance.setMode(mode);
            // Odśwież panel ręczny po zmianie trybu
            if (manualPanelVisible) refreshManualPanel();
          },
          onCreativeConfigChange: (config) => {
            currentCreativeConfig = config;
            updateCompassDisplay();
            const showParties = document.getElementById('modal-toggle-parties')?.checked || false;
            const showIdeologies = document.getElementById('modal-toggle-ideologies')?.checked || false;
            loadOverlays(showParties, showIdeologies, window.modalCompassInstance);
            if (window.compassInstance && window.compassInstance.setCreativeConfig) window.compassInstance.setCreativeConfig(config);
            if (manualPanelVisible) refreshManualPanel();
          }
        });
        if (compassUserValues) {
          const coords = computeCoordinatesFromValues(compassUserValues, currentCompassMode, currentCreativeConfig);
          window.modalCompassInstance.updateMarker(coords.x, coords.y);
          window.modalCompassInstance.updateActivePairs(coords.activePairsCount);
          window.modalCompassInstance.updateModeLabel(currentCompassMode);
        }
        // Obsługa przełączników nakładek w modalu
        const modalToggleParties = document.getElementById('modal-toggle-parties');
        const modalToggleIdeologies = document.getElementById('modal-toggle-ideologies');
        if (modalToggleParties && modalToggleIdeologies) {
          const updateModalOverlays = () => {
            loadOverlays(modalToggleParties.checked, modalToggleIdeologies.checked, window.modalCompassInstance);
          };
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
        // ========== DODANIE OBSŁUGI SELECTA TRYBU W MODALU ==========
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
        // ========== PANEL RĘCZNEGO WPROWADZANIA ==========
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
  closeBtn.addEventListener('click', () => {
    modal.classList.add('hidden');
  });
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.add('hidden');
  });
}

// Modyfikacja funkcji computeAndDisplayResults – dodanie budowania wartości kompasu i inicjalizacji
const originalComputeAndDisplay = computeAndDisplayResults;
computeAndDisplayResults = function() {
  originalComputeAndDisplay();
  const { pairResults } = computeScores(currentScoringMode);
  compassUserValues = buildUserValuesMap(pairResults);
  if (!window.compassInstance) {
    initCompassAfterResults();
  } else {
    updateCompassDisplay();
    const showParties = document.getElementById('toggle-parties')?.checked || false;
    const showIdeologies = document.getElementById('toggle-ideologies')?.checked || false;
    loadOverlays(showParties, showIdeologies, window.compassInstance);
  }
};

// Po załadowaniu configu, dodajemy dodatkowe inicjalizacje
const originalLoadConfig = loadConfig;
loadConfig = async function() {
  await originalLoadConfig();
  // Po załadowaniu configu, ustawiamy nasłuchiwanie na zmianę trybu kompasu
  const compassModeSelect = document.getElementById('compass-mode-select');
  if (compassModeSelect) {
    compassModeSelect.addEventListener('change', (e) => {
      currentCompassMode = e.target.value;
      if (window.compassInstance && window.compassInstance.setMode) window.compassInstance.setMode(currentCompassMode);
      if (window.modalCompassInstance && window.modalCompassInstance.setMode) window.modalCompassInstance.setMode(currentCompassMode);
      updateCompassDisplay();
      const showParties = document.getElementById('toggle-parties')?.checked || false;
      const showIdeologies = document.getElementById('toggle-ideologies')?.checked || false;
      loadOverlays(showParties, showIdeologies, window.compassInstance);
      if (window.modalCompassInstance) {
        const modalShowParties = document.getElementById('modal-toggle-parties')?.checked || false;
        const modalShowIdeologies = document.getElementById('modal-toggle-ideologies')?.checked || false;
        loadOverlays(modalShowParties, modalShowIdeologies, window.modalCompassInstance);
      }
    });
    // ustawienie opisu trybu
    const modeDesc = document.getElementById('compass-mode-desc');
    if (modeDesc) {
      const descriptions = {
        weighted: 'Wagowy – uwzględnia domyślne wagi poszczególnych par.',
        equal: 'Jednakowe wagi – każda para ma wagę 1.',
        institutional: 'Instytucjonalny – tylko pary związane z instytucjami państwowymi.',
        creative: 'Kreatywny – ręczny wybór par i wag.'
      };
      compassModeSelect.addEventListener('change', () => {
        modeDesc.textContent = descriptions[compassModeSelect.value] || '';
      });
      modeDesc.textContent = descriptions[compassModeSelect.value];
    }
  }
  initCompassModal();
};

// Przeładowanie funkcji symulacji, aby po symulacji odświeżyć kompas
const originalSimulateAnswers = simulateAnswers;
simulateAnswers = function(selectedName) {
  originalSimulateAnswers(selectedName);
  // Po symulacji odpowiedzi, przelicz wartości dla kompasu
  const { pairResults } = computeScores(currentScoringMode);
  compassUserValues = buildUserValuesMap(pairResults);
  updateCompassDisplay();
  const showParties = document.getElementById('toggle-parties')?.checked || false;
  const showIdeologies = document.getElementById('toggle-ideologies')?.checked || false;
  loadOverlays(showParties, showIdeologies, window.compassInstance);
  if (window.modalCompassInstance) {
    const modalShowParties = document.getElementById('modal-toggle-parties')?.checked || false;
    const modalShowIdeologies = document.getElementById('modal-toggle-ideologies')?.checked || false;
    loadOverlays(modalShowParties, modalShowIdeologies, window.modalCompassInstance);
  }
};

const originalRestoreUserAnswers = restoreUserAnswers;
restoreUserAnswers = function() {
  originalRestoreUserAnswers();
  const { pairResults } = computeScores(currentScoringMode);
  compassUserValues = buildUserValuesMap(pairResults);
  updateCompassDisplay();
  const showParties = document.getElementById('toggle-parties')?.checked || false;
  const showIdeologies = document.getElementById('toggle-ideologies')?.checked || false;
  loadOverlays(showParties, showIdeologies, window.compassInstance);
  if (window.modalCompassInstance) {
    const modalShowParties = document.getElementById('modal-toggle-parties')?.checked || false;
    const modalShowIdeologies = document.getElementById('modal-toggle-ideologies')?.checked || false;
    loadOverlays(modalShowParties, modalShowIdeologies, window.modalCompassInstance);
  }
};

// Dodatkowo, po imporcie odpowiedzi, też odświeżamy kompas
const originalImportAnswers = importAnswersFromExportCode;
importAnswersFromExportCode = function(rawCode) {
  const success = originalImportAnswers(rawCode);
  if (success) {
    const { pairResults } = computeScores(currentScoringMode);
    compassUserValues = buildUserValuesMap(pairResults);
    updateCompassDisplay();
    const showParties = document.getElementById('toggle-parties')?.checked || false;
    const showIdeologies = document.getElementById('toggle-ideologies')?.checked || false;
    loadOverlays(showParties, showIdeologies, window.compassInstance);
    if (window.modalCompassInstance) {
      const modalShowParties = document.getElementById('modal-toggle-parties')?.checked || false;
      const modalShowIdeologies = document.getElementById('modal-toggle-ideologies')?.checked || false;
      loadOverlays(modalShowParties, modalShowIdeologies, window.modalCompassInstance);
    }
  }
  return success;
};

loadConfig();
