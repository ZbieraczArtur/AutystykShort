(function () {
  const NOTE_LIMIT = 3000;
  const ANSWER_SCALE = [1.5, 0.5, -0.5, -1.5];

  function normalizeProfileText(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[\u0142\u0141]/g, 'l')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ');
  }

  function profileKey(type) {
    if (type === 'party') return 'parties';
    if (type === 'ideology') return 'ideologies';
    return 'users';
  }

  function getCollection(type) {
    const key = profileKey(type);
    return Array.isArray(politicalProfiles?.[key]) ? politicalProfiles[key] : [];
  }

  function getProfile(name, type) {
    const needle = normalizeProfileText(name);
    return getCollection(type).find(profile =>
      normalizeProfileText(profile.name) === needle ||
      normalizeProfileText(profile.key) === needle ||
      normalizeProfileText(profile.id) === needle
    ) || null;
  }

  function getSkipAnswer(question) {
    return question?.answers?.find(answer => Number(answer.value) === 0 && /pomi|skip/i.test(normalizeProfileText(answer.label))) ||
      question?.answers?.find(answer => Number(answer.value) === 0) ||
      question?.answers?.[0] || null;
  }

  function answerByLabel(question, label) {
    const normalized = normalizeProfileText(label);
    if (!question || !normalized) return null;
    if (['pomin', 'pomin pytanie', 'skip'].includes(normalized)) return getSkipAnswer(question);
    return question.answers.find(answer => normalizeProfileText(answer.label) === normalized) || null;
  }

  function parseExportLineModern(line) {
    const value = String(line || '').trim();
    if (!value || /^data wykonania testu/i.test(normalizeProfileText(value))) return null;
    let match = value.match(/^\[id:(\d+)\]\s*:\s*\((.*?)\)\s*(?:;)?$/i);
    if (match) return { questionId: Number(match[1]), answerText: match[2].trim() };
    match = value.match(/^(\d+)\s*:\s*\((.*?)\)\s*(?:;)?$/);
    if (match) return { questionId: Number(match[1]), answerText: match[2].trim() };
    match = value.match(/^(\d+)\s*=\s*(.*?)\s*(?:;)?$/);
    if (match) return { questionId: Number(match[1]), answerText: match[2].trim().replace(/^\((.*)\)$/, '$1') };
    match = value.match(/^\d+\.\s*.*?\[id:(\d+)\]:\s*\((.*?)\)\s*(?:;)?$/);
    if (match) return { questionId: Number(match[1]), answerText: match[2].trim() };
    return null;
  }

  function decodeNote(value) {
    const text = String(value || '');
    try { return decodeURIComponent(text).slice(0, NOTE_LIMIT); }
    catch { return text.slice(0, NOTE_LIMIT); }
  }

  function parseNoteLine(line) {
    const value = String(line || '').trim();
    let match = value.match(/^(\d+)#(?:opis|note)\s*:\s*(.*)$/i);
    if (match) return { questionId: Number(match[1]), note: decodeNote(match[2]) };
    match = value.match(/^\s*(?:Uzasadnienie|Opis|Note)\s*\[id:(\d+)\]:\s*(.*)$/i);
    if (match) return { questionId: Number(match[1]), note: decodeNote(match[2]) };
    return null;
  }

  function splitAllowedAnswers(answerText) {
    const raw = String(answerText || '').trim();
    if (!raw || /^brak odpowiedzi$/i.test(raw)) return [];
    if (/^neither$/i.test(raw)) return ['Neither'];
    const grouped = raw.match(/^\((.*)\)$/);
    const source = grouped ? grouped[1] : raw;
    return source.split(',').map(item => item.trim()).filter(Boolean);
  }

  function parseExportCodeModern(rawCode) {
    if (!config) return [];
    const notes = new Map();
    for (const line of String(rawCode || '').split(/\r?\n/)) {
      const note = parseNoteLine(line);
      if (note) notes.set(note.questionId, note.note);
    }
    const rows = [];
    for (const line of String(rawCode || '').split(/\r?\n/)) {
      const parsed = parseExportLineModern(line);
      if (!parsed) continue;
      const question = config.questions.find(q => Number(q.id) === Number(parsed.questionId));
      if (!question) continue;
      const answerText = splitAllowedAnswers(parsed.answerText)[0] || parsed.answerText;
      if (/^brak odpowiedzi$/i.test(answerText)) {
        if (notes.has(question.id)) rows.push({ questionId: question.id, answerIndex: -1, answerValue: 0, answerData: null, note: notes.get(question.id), noteOnly: true });
        continue;
      }
      const answer = answerByLabel(question, answerText);
      if (!answer) {
        if (notes.has(question.id)) rows.push({ questionId: question.id, answerIndex: -1, answerValue: 0, answerData: null, note: notes.get(question.id), noteOnly: true });
        continue;
      }
      rows.push({ questionId: question.id, answerIndex: question.answers.indexOf(answer), answerValue: Number(answer.value), answerData: answer, note: notes.get(question.id) || '' });
    }
    return rows;
  }

  function parseReferenceExportCodeModern(rawCode) {
    const reference = new Map();
    if (!config) return reference;
    for (const line of String(rawCode || '').split(/\r?\n/)) {
      const parsed = parseExportLineModern(line);
      if (!parsed) continue;
      const question = config.questions.find(q => Number(q.id) === Number(parsed.questionId));
      if (!question) continue;
      const allowed = splitAllowedAnswers(parsed.answerText).map(label => {
        if (normalizeProfileText(label) === 'neither') return { label: 'Neither', neither: true, value: null, answerData: null };
        const answer = answerByLabel(question, label);
        return answer ? { label: answer.label, value: Number(answer.value), answerData: answer } : null;
      }).filter(Boolean);
      reference.set(Number(question.id), allowed.length ? allowed : [{ value: 0, answerData: getSkipAnswer(question) }]);
    }
    return reference;
  }

  function scaleIndex(value) {
    const numeric = Number(value);
    for (let index = 0; index < ANSWER_SCALE.length; index++) {
      if (Math.abs(ANSWER_SCALE[index] - numeric) < 0.01) return index;
    }
    return null;
  }

  function profilePairScoreModern(userValue, referenceAnswer) {
    const current = Number(userValue);
    if (!referenceAnswer || Number.isNaN(current)) return 0;
    if (current === 0 || Number(referenceAnswer.value) === 0) return 0;
    if (referenceAnswer.neither) return -1.0;
    const userIndex = scaleIndex(current);
    const refIndex = scaleIndex(referenceAnswer.value);
    if (userIndex === null || refIndex === null) return 0;
    return [1.5, 0.5, -1.0, -1.5][Math.abs(userIndex - refIndex)] || 0;
  }

  function compareAnswersToReferenceProfileModern(answers, referenceProfile) {
    const reference = parseReferenceExportCodeModern(referenceProfile?.exportCode || '');
    if (!reference.size || !Array.isArray(config?.questions)) return { percent: 0, score: 0, maxPossible: 0, compared: 0 };
    const answersByQuestion = new Map((answers || []).filter(row => !row.noteOnly).map(row => [Number(row.questionId), row]));
    let score = 0;
    let maxPossible = 0;
    let compared = 0;
    for (const question of config.questions) {
      const userAnswer = answersByQuestion.get(Number(question.id));
      const allowed = reference.get(Number(question.id)) || [{ value: 0, answerData: getSkipAnswer(question) }];
      const userValue = userAnswer ? Number(userAnswer.answerValue) : 0;
      score += Math.max(...allowed.map(answer => profilePairScoreModern(userValue, answer)));
      maxPossible += 1.5;
      compared++;
    }
    const percent = maxPossible ? Math.round(((score + maxPossible) / (2 * maxPossible)) * 100) : 0;
    return { percent: Math.min(100, Math.max(0, percent)), score, maxPossible, compared };
  }

  function getModernRankingItems(type) {
    return getCollection(type).map(profile => {
      const match = compareAnswersToReferenceProfileModern(userAnswers, profile);
      return { key: profile.key || profile.id || profile.name, name: profile.name, percent: match.percent, agreements: 0, disagreements: 0, involved: match.compared, description: profile.description || '', logo: profile.logo || '', profile };
    }).sort((a, b) => b.percent - a.percent);
  }

  function firstAnswersFromReference(profile) {
    const reference = parseReferenceExportCodeModern(profile?.exportCode || '');
    return config.questions.map(question => {
      const allowed = reference.get(Number(question.id)) || [];
      const selected = allowed.filter(answer => !answer.neither && answer.answerData && Number(answer.value) !== 0).sort((a, b) => Math.abs(Number(b.value)) - Math.abs(Number(a.value)))[0]?.answerData || getSkipAnswer(question);
      return { questionId: question.id, answerIndex: question.answers.indexOf(selected), answerValue: Number(selected?.value || 0), answerData: selected };
    });
  }

  function syncConfigDescriptionsFromProfiles() {
    if (!config || !politicalProfiles) return;
    for (const type of ['party', 'ideology', 'user']) {
      const key = profileKey(type);
      const target = config[key] || [];
      for (const item of target) {
        const profile = getProfile(item.key || item.name, type);
        if (!profile) continue;
        item.key = item.key || item.name;
        item.description = profile.description || item.description || '';
        item.logo = profile.logo || item.logo || '';
        if (type === 'user') item.exportCode = profile.exportCode || item.exportCode || '';
      }
    }
  }

  const originalComputeScores = window.computeScores || computeScores;
  computeScores = function (mode = currentScoringMode) {
    if (currentMatchingMode !== 'modern') return originalComputeScores(mode);
    const base = originalComputeScores(mode);
    return { ...base, ideologyResults: getModernRankingItems('ideology'), partyResults: getModernRankingItems('party') };
  };
  window.computeScores = computeScores;

  parseExportCode = parseExportCodeModern;
  window.parseExportCode = parseExportCodeModern;
  parseReferenceExportCode = parseReferenceExportCodeModern;
  window.parseReferenceExportCode = parseReferenceExportCodeModern;
  compareAnswersToReferenceProfile = compareAnswersToReferenceProfileModern;
  window.compareAnswersToReferenceProfile = compareAnswersToReferenceProfileModern;
  getModernRanking = getModernRankingItems;
  window.getModernRanking = getModernRankingItems;
  getProfileByName = getProfile;
  window.getProfileByName = getProfile;
  getProfileCollection = getCollection;
  window.getProfileCollection = getCollection;

  generateExportCode = function () {
    if (!config) return '';
    return config.questions.map(question => {
      const answer = userAnswers.find(row => Number(row.questionId) === Number(question.id) && !row.noteOnly);
      const note = answer?.note || '';
      const label = answer?.answerData?.label || (answer ? 'Pomiń pytanie' : 'Brak odpowiedzi');
      const noteLine = note.trim() ? '\n' + question.id + '#opis:' + encodeURIComponent(note.trim()) : '';
      return question.id + ':(' + label + ');' + noteLine;
    }).join('\n');
  };
  window.generateExportCode = generateExportCode;

  importAnswersFromExportCode = function (rawCode) {
    if (!config) return false;
    const parsed = parseExportCodeModern(rawCode);
    const answerRows = parsed.filter(row => !row.noteOnly && row.answerData);
    const noteRows = parsed.filter(row => row.note);
    if (!answerRows.length && !noteRows.length) {
      showPopup(translations?.ui?.importNoAnswers || 'Nie znaleziono prawidłowych odpowiedzi w kodzie.');
      return false;
    }
    userAnswers = answerRows;
    updateDOMSelections();
    if (resultsDiv.style.display !== 'none') computeAndDisplayResults();
    else showPopup((translations?.ui?.importSuccess || ('Zaimportowano ' + answerRows.length + ' odpowiedzi.')) + ' ' + (translations?.ui?.clickShowResults || 'Kliknij "Pokaż wyniki", aby zobaczyć zaktualizowany profil.'));
    return true;
  };
  window.importAnswersFromExportCode = importAnswersFromExportCode;

  const originalSimulateAnswers = window.simulateAnswers || simulateAnswers;
  simulateAnswers = function (selectedName) {
    const type = getProfile(selectedName, 'party') ? 'party' : getProfile(selectedName, 'ideology') ? 'ideology' : getProfile(selectedName, 'user') ? 'user' : null;
    if (currentMatchingMode === 'modern' && type) {
      const profile = getProfile(selectedName, type);
      userAnswers = type === 'user' ? parseExportCodeModern(profile.exportCode).filter(row => !row.noteOnly && row.answerData) : firstAnswersFromReference(profile);
      simulatedEntity = { type, name: profile.name };
      updateDOMSelections();
      computeAndDisplayResults();
      return;
    }
    originalSimulateAnswers(selectedName);
  };
  window.simulateAnswers = simulateAnswers;

  const originalGetEntityCoordinates = window.getEntityCoordinates || getEntityCoordinates;
  getEntityCoordinates = async function (name, type) {
    const profile = getProfile(name, type);
    if (currentMatchingMode === 'modern' && profile?.exportCode) {
      const parsed = type === 'user' ? parseExportCodeModern(profile.exportCode).filter(row => !row.noteOnly && row.answerData) : firstAnswersFromReference(profile);
      if (!parsed.length) return { x: 0, y: 0 };
      const scores = computeScoresForAnswers(parsed, currentScoringMode);
      const valuesMap = buildUserValuesMap(scores.pairResults);
      const coords = computeCoordinatesFromValues(valuesMap, currentCompassMode, currentCreativeConfig);
      return { x: coords.x, y: coords.y };
    }
    return originalGetEntityCoordinates(name, type);
  };
  window.getEntityCoordinates = getEntityCoordinates;

  loadOverlays = async function (showParties, showIdeologies, compassInstance) {
    const showUsers = document.getElementById('toggle-users')?.checked || document.getElementById('modal-toggle-users')?.checked || false;
    if (!compassInstance?.clearOverlays || !config) return;
    compassInstance.clearOverlays();
    const addProfiles = async (type, enabled) => {
      if (!enabled) return;
      for (const profile of getCollection(type)) {
        const coords = await getEntityCoordinates(profile.key || profile.name, type);
        if (!coords) continue;
        compassInstance.addOverlay(profile.logo || getProfileLogoUrl(profile.name, type) || 'images/ALogo.svg', coords.x, coords.y, type, profile.name, profile.description || '');
      }
    };
    await addProfiles('party', showParties);
    await addProfiles('ideology', showIdeologies);
    await addProfiles('user', showUsers);
  };
  window.loadOverlays = loadOverlays;

  const originalSetupSimulation = window.setupSimulation || setupSimulation;
  setupSimulation = function () {
    originalSetupSimulation();
    const select = document.getElementById('simulateSelect');
    if (!select || !politicalProfiles) return;
    select.innerHTML = '';
    const groups = [['parties', translations?.ui?.partiesGroup || 'Partie polityczne'], ['ideologies', translations?.ui?.ideologiesGroup || 'Ideologie'], ['users', translations?.ui?.usersGroup || 'Użytkownicy']];
    for (const [key, label] of groups) {
      const list = politicalProfiles[key] || [];
      if (!list.length) continue;
      const group = document.createElement('optgroup');
      group.label = label;
      for (const profile of list) {
        const option = document.createElement('option');
        option.value = profile.name;
        option.textContent = profile.name;
        group.appendChild(option);
      }
      select.appendChild(group);
    }
  };
  window.setupSimulation = setupSimulation;

  const originalBoot = window.__neoAutystykBoot || loadConfig;
  loadConfig = async function () {
    localStorage.setItem('matchingMode', 'modern');
    await originalBoot();
    syncConfigDescriptionsFromProfiles();
    currentMatchingMode = 'modern';
    window.currentMatchingMode = 'modern';
    document.querySelectorAll('input[name="matchingMode"]').forEach(radio => { radio.checked = radio.value === 'modern'; });
    setupSimulation();
  };
  window.loadConfig = loadConfig;

  loadConfig();
})();
