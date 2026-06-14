// compass-core.js – logika obliczeń współrzędnych (wersja rozszerzona)

// ========== PARY PODSTAWOWE (core) ==========
const corePairs = [
  { id: "p1", axis: "x", negativeLabel: "Własność kolektywna", positiveLabel: "Własność prywatna", weight: 1.5, institutional: true },
  { id: "p2", axis: "x", negativeLabel: "Planowanie", positiveLabel: "Rynek", weight: 1, institutional: true },
  { id: "p3", axis: "y", negativeLabel: "Samoregulacja", positiveLabel: "Regulacja instytucjonalna", weight: 1, institutional: true },
  { id: "p4", axis: "y", negativeLabel: "Samoorganizacja", positiveLabel: "Etatyzm", weight: 1.75, institutional: true },
  { id: "p5", axis: "y", negativeLabel: "Decentralizacja", positiveLabel: "Centralizacja", weight: 1, institutional: true },
  { id: "p6", axis: "y", negativeLabel: "Ograniczenie władzy", positiveLabel: "Absolutyzm władzy", weight: 1.75, institutional: true },
  { id: "p7", axis: "y", negativeLabel: "Różnorodność norm", positiveLabel: "Uniformizacja norm", weight: 1, institutional: true },
  { id: "p8", axis: "y", negativeLabel: "Minimalizacja granic", positiveLabel: "Kontrola granic", weight: 0.5, institutional: true },
  { id: "p9", axis: "y", negativeLabel: "Wolność ekspresji", positiveLabel: "Cenzura", weight: 1, institutional: true },
  { id: "p10", axis: "y", negativeLabel: "Autonomia", positiveLabel: "Heteronomia", weight: 2, institutional: false },
  { id: "p11", axis: "y", negativeLabel: "Kontraktualizm", positiveLabel: "Organicyzm", weight: 1.5, institutional: false },
  { id: "p12", axis: "y", negativeLabel: "Dobrowolność wspólnoty", positiveLabel: "Obowiązkowość wspólnoty", weight: 1.5, institutional: false },
  { id: "p13", axis: "y", negativeLabel: "Desakralizacja autorytetu", positiveLabel: "Sakralizacja autorytetu", weight: 1.75, institutional: false }
];

// ========== PARY DODATKOWE (extra) ==========
const extraPairs = [
  { id: "ex1", axis: null, negativeLabel: "Kolektywizm", positiveLabel: "Indywidualizm", weight: 1, institutional: false, extra: true },
  { id: "ex2", axis: null, negativeLabel: "Hierarchiczność", positiveLabel: "Egalitaryzm", weight: 1, institutional: false, extra: true },
  { id: "ex3", axis: null, negativeLabel: "Anty-demokracja", positiveLabel: "Demokracja", weight: 1, institutional: false, extra: true },
  { id: "ex4", axis: null, negativeLabel: "Anty-autokracja", positiveLabel: "Autokracja", weight: 1, institutional: false, extra: true },
  { id: "ex5", axis: null, negativeLabel: "Swobodna wymiana", positiveLabel: "Ograniczanie wymiany", weight: 1, institutional: false, extra: true },
  { id: "ex6", axis: null, negativeLabel: "Partykularyzm narodowy", positiveLabel: "Kosmopolityzm", weight: 1, institutional: false, extra: true },
  { id: "ex7", axis: null, negativeLabel: "Izolacjonizm", positiveLabel: "Interwencjonizm zagraniczny", weight: 1, institutional: false, extra: true },
  { id: "ex8", axis: null, negativeLabel: "Unikanie przemocy", positiveLabel: "Preferencja użycia siły", weight: 1, institutional: false, extra: true },
  { id: "ex9", axis: null, negativeLabel: "Gradualizm", positiveLabel: "Rewolucja", weight: 1, institutional: false, extra: true },
  { id: "ex10", axis: null, negativeLabel: "Konserwatyzm", positiveLabel: "Progresywizm", weight: 1, institutional: false, extra: true },
  { id: "ex11", axis: null, negativeLabel: "Homogenizacja", positiveLabel: "Pluralizm kulturowy", weight: 1, institutional: false, extra: true },
  { id: "ex12", axis: null, negativeLabel: "Instytucjonalna religia", positiveLabel: "Neutralność religijna", weight: 1, institutional: false, extra: true },
  { id: "ex13", axis: null, negativeLabel: "Wykluczenie", positiveLabel: "Włączanie", weight: 1, institutional: false, extra: true },
  { id: "ex14", axis: null, negativeLabel: "Suprematyzm biologiczny", positiveLabel: "Egalitaryzm biologiczny", weight: 1, institutional: false, extra: true },
  { id: "ex15", axis: null, negativeLabel: "Ekocentryzm", positiveLabel: "Antropocentryzm", weight: 1, institutional: false, extra: true },
  { id: "ex16", axis: null, negativeLabel: "Prymitywizm", positiveLabel: "Postęp technologiczny", weight: 1, institutional: false, extra: true }
];

const allCompassPairs = [...corePairs, ...extraPairs];

// ========== KONFIGURACJE TRYBÓW INTERPRETACYJNYCH ==========
const HIERARCHICAL_PAIRS_CONFIG = [
  // Oś X
  { id: "p1", axis: "x", direction: 1 },   // Własność kolektywna ⇄ Własność prywatna
  { id: "ex2", axis: "x", direction: -1 },  // Hierarchiczność → Egalitaryzm (odwrócenie)
  { id: "ex1", axis: "x", direction: 1 },   // Kolektywizm ⇄ Indywidualizm
  { id: "ex3", axis: "x", direction: 1 },   // Anty-demokracja ⇄ Demokracja
  { id: "ex4", axis: "x", direction: 1 },   // Anty-autokracja ⇄ Autokracja
  { id: "ex13", axis: "x", direction: 1 },  // Wykluczenie ⇄ Włączanie
  { id: "ex14", axis: "x", direction: 1 },  // Suprematyzm biologiczny ⇄ Egalitaryzm biologiczny
  // Oś Y – wszystkie corePairs z axis: "y"
  { id: "p3", axis: "y", direction: 1 },
  { id: "p4", axis: "y", direction: 1 },
  { id: "p5", axis: "y", direction: 1 },
  { id: "p6", axis: "y", direction: 1 },
  { id: "p7", axis: "y", direction: 1 },
  { id: "p8", axis: "y", direction: 1 },
  { id: "p9", axis: "y", direction: 1 },
  { id: "p10", axis: "y", direction: 1 },
  { id: "p11", axis: "y", direction: 1 },
  { id: "p12", axis: "y", direction: 1 },
  { id: "p13", axis: "y", direction: 1 }
];

const EGALITARIAN_PAIRS_CONFIG = [
  { id: "ex2", axis: "x", direction: -1 },  // Hierarchiczność → Egalitaryzm
  { id: "ex3", axis: "x", direction: -1 },  // Demokracja → Anty-demokracja
  { id: "p4", axis: "y", direction: 1 },    // Samoorganizacja ⇄ Etatyzm
  { id: "p3", axis: "y", direction: 1 }     // Samoregulacja ⇄ Regulacja instytucjonalna
];

const NATIONAL_PAIRS_CONFIG = [
  { id: "ex6", axis: "x", direction: 1 },   // Partykularyzm narodowy ⇄ Kosmopolityzm
  { id: "p8", axis: "x", direction: 1 },    // Minimalizacja granic ⇄ Kontrola granic
  { id: "ex11", axis: "x", direction: 1 },  // Homogenizacja ⇄ Pluralizm kulturowy
  { id: "ex13", axis: "x", direction: 1 },  // Wykluczenie ⇄ Włączanie
  // Oś Y – wszystkie corePairs z axis: "y"
  { id: "p3", axis: "y", direction: 1 },
  { id: "p4", axis: "y", direction: 1 },
  { id: "p5", axis: "y", direction: 1 },
  { id: "p6", axis: "y", direction: 1 },
  { id: "p7", axis: "y", direction: 1 },
  { id: "p8", axis: "y", direction: 1 },
  { id: "p9", axis: "y", direction: 1 },
  { id: "p10", axis: "y", direction: 1 },
  { id: "p11", axis: "y", direction: 1 },
  { id: "p12", axis: "y", direction: 1 },
  { id: "p13", axis: "y", direction: 1 }
];

const FRENCH_REVOLUTION_PAIRS_CONFIG = [
  { id: "ex10", axis: "x", direction: 1 },  // Konserwatyzm ⇄ Progresywizm
  { id: "ex12", axis: "x", direction: 1 },  // Instytucjonalna religia ⇄ Neutralność religijna
  { id: "p13", axis: "x", direction: 1 },   // Desakralizacja autorytetu ⇄ Sakralizacja autorytetu
  { id: "ex9", axis: "x", direction: 1 },   // Gradualizm ⇄ Rewolucja
  { id: "p11", axis: "x", direction: -1 },  // Kontraktualizm → Organicyzm (odwrócenie)
  { id: "ex4", axis: "y", direction: 1 },   // Anty-autokracja ⇄ Autokracja
  { id: "ex3", axis: "y", direction: -1 },  // Demokracja → Anty-demokracja
  { id: "p5", axis: "y", direction: 1 }     // Decentralizacja ⇄ Centralizacja
];

// ========== GŁÓWNA FUNKCJA OBLICZENIOWA ==========
/**
 * Oblicza współrzędne na podstawie udzielonych odpowiedzi.
 * @param {Object} valuesMap - Mapa wartości dla każdej pary (negative, positive)
 * @param {string} scoringMethod - 'weighted' (domyślnie) lub 'equal' (wagi = 1)
 * @param {string} interpretationMode - 'default', 'institutional', 'hierarchical', 'egalitarian', 'national', 'french_revolution', 'creative'
 * @param {Object} creativeConfig - Konfiguracja dla trybu 'creative' { activePairs: [], labels: {} }
 */
function computeCoordinatesFromValues(valuesMap, scoringMethod = 'weighted', interpretationMode = 'default', creativeConfig = { activePairs: [], labels: {} }) {
  // Kompatybilność ze starą sygnaturą (mode, creativeConfig)
  if (typeof scoringMethod === 'string' && ['weighted', 'equal', 'institutional', 'creative'].includes(scoringMethod) && interpretationMode === 'default') {
    const oldMode = scoringMethod;
    if (oldMode === 'institutional') interpretationMode = 'institutional';
    else if (oldMode === 'creative') interpretationMode = 'creative';
    else if (oldMode === 'weighted') { scoringMethod = 'weighted'; interpretationMode = 'default'; }
    else if (oldMode === 'equal') { scoringMethod = 'equal'; interpretationMode = 'default'; }
  }

  let pairsConfig = [];
  // Wybór konfiguracji par na podstawie trybu interpretacyjnego
  switch (interpretationMode) {
    case 'default':
      pairsConfig = corePairs.filter(p => !p.extra).map(p => ({ id: p.id, axis: p.axis, direction: 1 }));
      break;
    case 'institutional':
      pairsConfig = corePairs.filter(p => p.institutional === true).map(p => ({ id: p.id, axis: p.axis, direction: 1 }));
      break;
    case 'hierarchical':
      pairsConfig = [...HIERARCHICAL_PAIRS_CONFIG];
      break;
    case 'egalitarian':
      pairsConfig = [...EGALITARIAN_PAIRS_CONFIG];
      break;
    case 'national':
      pairsConfig = [...NATIONAL_PAIRS_CONFIG];
      break;
    case 'french_revolution':
      pairsConfig = [...FRENCH_REVOLUTION_PAIRS_CONFIG];
      break;
    case 'creative':
      pairsConfig = creativeConfig.activePairs.map(cfg => {
        const original = allCompassPairs.find(p => p.id === cfg.pairId);
        if (!original) return null;
        return { id: cfg.pairId, axis: cfg.axis, direction: cfg.direction || 1, weight: cfg.weight };
      }).filter(p => p !== null);
      break;
    default:
      pairsConfig = corePairs.filter(p => !p.extra).map(p => ({ id: p.id, axis: p.axis, direction: 1 }));
  }

  // Przygotowanie listy par z odpowiednimi wagami i kierunkami
  const pairsToUse = [];
  for (const cfg of pairsConfig) {
    const original = allCompassPairs.find(p => p.id === cfg.id);
    if (!original) continue;
    let weight = original.weight;
    if (scoringMethod === 'equal') weight = 1;
    pairsToUse.push({
      ...original,
      axis: cfg.axis,
      weight: weight,
      direction: cfg.direction || 1
    });
  }

  // Obliczenia sum ważonych
  let sumX = 0, maxSumX = 0, activeX = 0;
  let sumY = 0, maxSumY = 0, activeY = 0;
  for (const pair of pairsToUse) {
    const vals = valuesMap[pair.id];
    if (!vals || vals.negative === null || vals.positive === null) continue;
    const diff = (vals.positive - vals.negative) * pair.direction;
    const weightVal = pair.weight;
    if (pair.axis === 'x') {
      sumX += diff * weightVal;
      maxSumX += 100 * weightVal;
      activeX++;
    } else if (pair.axis === 'y') {
      sumY += diff * weightVal;
      maxSumY += 100 * weightVal;
      activeY++;
    }
  }
  const scoreX = maxSumX > 0 ? (sumX / maxSumX) * 10 : 0;
  const scoreY = maxSumY > 0 ? (sumY / maxSumY) * 10 : 0;
  return {
    x: Math.min(10, Math.max(-10, scoreX)),
    y: Math.min(10, Math.max(-10, scoreY)),
    activePairsCount: activeX + activeY
  };
}

// ========== EKSPORT GLOBALNY (dla innych skryptów) ==========
window.corePairs = corePairs;
window.extraPairs = extraPairs;
window.allCompassPairs = allCompassPairs;
window.computeCoordinatesFromValues = computeCoordinatesFromValues;
