(() => {
  const POSITIONS = ['UTG', 'MP', 'CO', 'BTN', 'SB', 'BB'];
  const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
  const SUITS = ['♠', '♥', '♦', '♣'];
  const RED_SUITS = new Set(['♥', '♦']);
  const CLOSE_CALL_THRESHOLD = 15;
  const STORAGE_KEY = 'gtomaxy-stats';

  const config = {
    stackDepth: '100bb',
    gameType: '6max',
  };

  const tableCache = {};
  let currentPosition = null;
  let currentHandData = null;
  let currentHeroCards = null;
  let hasActed = false;

  const el = {
    position: document.getElementById('current-position'),
    heroCards: document.getElementById('hero-cards'),
    pctBox: document.getElementById('gto-percentages'),
    pctHint: document.getElementById('pct-hint'),
    pctFold: document.getElementById('pct-fold'),
    pctCall: document.getElementById('pct-call'),
    pctRaise: document.getElementById('pct-raise'),
    feedbackBox: document.getElementById('feedback-box'),
    feedbackText: document.getElementById('feedback-text'),
    btnFold: document.getElementById('btn-fold'),
    btnCall: document.getElementById('btn-call'),
    btnRaise: document.getElementById('btn-raise'),
    btnNext: document.getElementById('btn-next'),
    btnResetStats: document.getElementById('btn-reset-stats'),
    statHands: document.getElementById('stat-hands'),
    statAccuracy: document.getElementById('stat-accuracy'),
    statStreak: document.getElementById('stat-streak'),
    feltLabel: document.getElementById('felt-label'),
    configCurrentText: document.getElementById('config-current-text'),
  };

  function buildDeck() {
    const deck = [];
    for (const rank of RANKS) {
      for (const suit of SUITS) {
        deck.push({ rank, suit });
      }
    }
    return deck;
  }

  function dealHeroCards() {
    const deck = buildDeck();
    const i1 = Math.floor(Math.random() * deck.length);
    let i2 = Math.floor(Math.random() * (deck.length - 1));
    if (i2 >= i1) i2 += 1;
    return [deck[i1], deck[i2]];
  }

  function toCanonicalHand(card1, card2) {
    const idx1 = RANKS.indexOf(card1.rank);
    const idx2 = RANKS.indexOf(card2.rank);
    const [hi, lo] = idx1 >= idx2 ? [card1, card2] : [card2, card1];
    if (hi.rank === lo.rank) return `${hi.rank}${lo.rank}`;
    const suited = hi.suit === lo.suit;
    return `${hi.rank}${lo.rank}${suited ? 's' : 'o'}`;
  }

  function getRandomPosition() {
    return POSITIONS[Math.floor(Math.random() * POSITIONS.length)];
  }

  function getPercentageColor(percentage) {
    if (percentage >= 50) return 'green';
    if (percentage >= 25) return 'yellow';
    if (percentage > 0) return 'red';
    return 'grey';
  }

  function loadStats() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {
        // fall through to defaults on corrupted data
      }
    }
    return { handsPlayed: 0, correct: 0, streak: 0 };
  }

  function saveStats(stats) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  }

  function renderStats() {
    const stats = loadStats();
    el.statHands.textContent = stats.handsPlayed;
    const accuracy = stats.handsPlayed > 0 ? Math.round((stats.correct / stats.handsPlayed) * 100) : 0;
    el.statAccuracy.textContent = `${accuracy}%`;
    el.statStreak.textContent = stats.streak;
  }

  function setSeatHighlight(position) {
    POSITIONS.forEach((p) => {
      document.getElementById(`seat-${p}`).classList.toggle('active', p === position);
    });
  }

  function renderCardFace(card) {
    const div = document.createElement('div');
    div.className = 'card card-face';
    if (RED_SUITS.has(card.suit)) div.classList.add('suit-red');
    div.textContent = `${card.rank}${card.suit}`;
    return div;
  }

  function renderCardBack() {
    const div = document.createElement('div');
    div.className = 'card card-back';
    return div;
  }

  function renderTableCards(heroPosition, heroCards) {
    POSITIONS.forEach((p) => {
      const container = document.getElementById(`cards-${p}`);
      container.innerHTML = '';
      if (p === heroPosition) {
        container.appendChild(renderCardFace(heroCards[0]));
        container.appendChild(renderCardFace(heroCards[1]));
      } else {
        container.appendChild(renderCardBack());
        container.appendChild(renderCardBack());
      }
    });
  }

  function renderHeroCards(heroCards) {
    el.heroCards.innerHTML = '';
    el.heroCards.appendChild(renderCardFace(heroCards[0]));
    el.heroCards.appendChild(renderCardFace(heroCards[1]));
  }

  function setPercentageDisplay(elem, value) {
    elem.textContent = `${value}%`;
    elem.classList.remove('color-green', 'color-yellow', 'color-red', 'color-grey');
    elem.classList.add(`color-${getPercentageColor(value)}`);
  }

  async function loadPositionTable(position) {
    const key = `${config.gameType}_${config.stackDepth}_${position}`;
    if (tableCache[key]) return tableCache[key];
    const path = `gto_tables/${config.gameType}_${config.stackDepth}/${position.toLowerCase()}.json`;
    const response = await fetch(path);
    const table = await response.json();
    tableCache[key] = table;
    return table;
  }

  function updateConfigDisplay() {
    const stackLabel = config.stackDepth === '50bb' ? '50BB' : '100BB';
    const gameLabel = config.gameType === '6max' ? '6-Max' : '9-Max';
    el.configCurrentText.textContent = `${stackLabel} · ${gameLabel}`;
    el.feltLabel.textContent = `${gameLabel.toUpperCase()} · ${stackLabel}`;
  }

  function setActionButtons(validActions) {
    const buttons = {
      fold: el.btnFold,
      call: el.btnCall,
      raise: el.btnRaise,
    };
    Object.entries(buttons).forEach(([action, btn]) => {
      const isValid = validActions.includes(action);
      btn.disabled = !isValid;
      btn.classList.toggle('invalid', !isValid);
    });
  }

  async function newHand() {
    currentPosition = getRandomPosition();
    const table = await loadPositionTable(currentPosition);

    currentHeroCards = dealHeroCards();
    const canonical = toCanonicalHand(currentHeroCards[0], currentHeroCards[1]);
    currentHandData = table.hands[canonical];

    hasActed = false;

    setSeatHighlight(currentPosition);
    el.position.textContent = `${currentPosition} (${table.fullName})`;
    renderHeroCards(currentHeroCards);
    renderTableCards(currentPosition, currentHeroCards);

    el.pctBox.classList.add('hidden');
    el.pctHint.classList.remove('hidden');

    el.feedbackBox.className = 'feedback-box';
    el.feedbackText.textContent = 'Choose an action to see GTO feedback.';

    setActionButtons(currentHandData.valid_actions);
    el.btnNext.disabled = true;
  }

  function bestAction(handData) {
    const entries = [
      ['fold', handData.fold],
      ['call', handData.call],
      ['raise', handData.raise],
    ];
    entries.sort((a, b) => b[1] - a[1]);
    return entries[0];
  }

  function handleAction(userAction) {
    if (hasActed) return;
    if (!currentHandData.valid_actions.includes(userAction)) return;
    hasActed = true;

    el.btnFold.disabled = true;
    el.btnCall.disabled = true;
    el.btnRaise.disabled = true;
    el.btnNext.disabled = false;

    el.pctBox.classList.remove('hidden');
    el.pctHint.classList.add('hidden');
    setPercentageDisplay(el.pctFold, currentHandData.fold);
    setPercentageDisplay(el.pctCall, currentHandData.call);
    setPercentageDisplay(el.pctRaise, currentHandData.raise);

    const [bestName, bestPct] = bestAction(currentHandData);
    const userPct = currentHandData[userAction];
    const isCorrect = userAction === bestName;
    const gap = bestPct - userPct;

    const stats = loadStats();
    stats.handsPlayed += 1;

    let feedbackClass;
    let message;

    if (isCorrect) {
      feedbackClass = 'feedback-correct';
      message = `✅ Correct! You chose ${userAction.toUpperCase()} (${userPct}%) — the GTO play.`;
      stats.correct += 1;
      stats.streak += 1;
    } else if (gap <= CLOSE_CALL_THRESHOLD) {
      feedbackClass = 'feedback-close';
      message = `⚠️ Close call! You chose ${userAction.toUpperCase()} (${userPct}%), but ${bestName.toUpperCase()} is optimal (${bestPct}%).`;
      stats.streak = 0;
    } else {
      feedbackClass = 'feedback-incorrect';
      message = `❌ Incorrect! You chose ${userAction.toUpperCase()} (${userPct}%), but GTO recommends ${bestName.toUpperCase()} (${bestPct}%).`;
      stats.streak = 0;
    }

    el.feedbackBox.className = `feedback-box ${feedbackClass}`;
    el.feedbackText.textContent = message;

    saveStats(stats);
    renderStats();
  }

  function resetStats() {
    saveStats({ handsPlayed: 0, correct: 0, streak: 0 });
    renderStats();
  }

  function initConfigControls() {
    document.querySelectorAll('input[name="stack-depth"]').forEach((input) => {
      input.addEventListener('change', (e) => {
        if (e.target.checked) {
          config.stackDepth = e.target.value;
          updateConfigDisplay();
        }
      });
    });
    document.querySelectorAll('input[name="game-type"]').forEach((input) => {
      input.addEventListener('change', (e) => {
        if (e.target.checked && !e.target.disabled) {
          config.gameType = e.target.value;
          updateConfigDisplay();
        }
      });
    });
  }

  async function init() {
    initConfigControls();
    updateConfigDisplay();

    el.btnFold.addEventListener('click', () => handleAction('fold'));
    el.btnCall.addEventListener('click', () => handleAction('call'));
    el.btnRaise.addEventListener('click', () => handleAction('raise'));
    el.btnNext.addEventListener('click', newHand);
    el.btnResetStats.addEventListener('click', resetStats);

    renderStats();
    await newHand();
  }

  init();
})();
