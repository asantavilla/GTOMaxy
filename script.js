(() => {
  const TURN_ORDER = ['UTG', 'MP', 'CO', 'BTN', 'SB', 'BB'];
  const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
  const SUITS = ['♠', '♥', '♦', '♣'];
  const RED_SUITS = new Set(['♥', '♦']);
  const CLOSE_CALL_THRESHOLD = 15;
  const STORAGE_KEY = 'gtomaxy-stats';

  const BLIND_SB = 0.5;
  const BLIND_BB = 1;
  const RAISE_SIZE = 2.5;

  const config = {
    stackDepth: '100bb',
    gameType: '6max',
  };

  const tableCache = {};
  let currentPosition = null;
  let currentHandData = null;
  let currentHeroCards = null;
  let hasActed = false;
  let potState = null;

  const el = {
    position: document.getElementById('current-position'),
    heroCards: document.getElementById('hero-cards'),
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
    potLine: document.getElementById('pot-line'),
    configCurrentText: document.getElementById('config-current-text'),
  };

  function stackStart() {
    return config.stackDepth === '50bb' ? 50 : 100;
  }

  function fmt(n) {
    return (Math.round(n * 10) / 10).toString();
  }

  function buildDeck() {
    const deck = [];
    for (const rank of RANKS) {
      for (const suit of SUITS) {
        deck.push({ rank, suit });
      }
    }
    return deck;
  }

  function dealTwoCards() {
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
    return TURN_ORDER[Math.floor(Math.random() * TURN_ORDER.length)];
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
  }

  function weightedChoice(handData) {
    const r = Math.random() * 100;
    if (r < handData.fold) return 'fold';
    if (r < handData.fold + handData.call) return 'call';
    return 'raise';
  }

  function applyAction(pos, action) {
    if (action === 'fold') {
      potState.folded[pos] = true;
      return;
    }
    if (action === 'call') {
      potState.contributions[pos] = potState.currentBet;
      return;
    }
    // raise
    if (potState.currentBet <= BLIND_BB) {
      potState.currentBet = RAISE_SIZE;
      potState.contributions[pos] = RAISE_SIZE;
    } else {
      // Someone already raised; this simplified model caps betting at one
      // raise, so a second "raise" from the range just calls the existing bet.
      potState.contributions[pos] = potState.currentBet;
    }
  }

  async function simulateSeatAction(pos) {
    const table = await loadPositionTable(pos);
    const cards = dealTwoCards();
    const canonical = toCanonicalHand(cards[0], cards[1]);
    const handData = table.hands[canonical];
    let action = weightedChoice(handData);
    if (pos === 'BB' && potState.currentBet <= BLIND_BB && action === 'fold') {
      // Nothing has been raised, so the BB isn't giving anything up by
      // declining to fold here -- treat it as checking instead.
      action = 'call';
    }
    applyAction(pos, action);
  }

  function renderTable() {
    const heroIdx = TURN_ORDER.indexOf(currentPosition);
    for (let offset = 0; offset < TURN_ORDER.length; offset++) {
      const pos = TURN_ORDER[(heroIdx + offset) % TURN_ORDER.length];
      const isHero = pos === currentPosition;
      const isFolded = potState.folded[pos];
      const contribution = potState.contributions[pos];

      const seatEl = document.getElementById(`seat-slot${offset}`);
      document.getElementById(`name-slot${offset}`).textContent = pos;
      document.getElementById(`stack-slot${offset}`).textContent = `${fmt(stackStart() - contribution)} BB`;

      seatEl.classList.toggle('active', isHero);
      seatEl.classList.toggle('folded', !isHero && isFolded);

      const cardsContainer = document.getElementById(`cards-slot${offset}`);
      cardsContainer.innerHTML = '';
      if (isHero) {
        cardsContainer.appendChild(renderCardFace(currentHeroCards[0]));
        cardsContainer.appendChild(renderCardFace(currentHeroCards[1]));
      } else if (!isFolded) {
        cardsContainer.appendChild(renderCardBack());
        cardsContainer.appendChild(renderCardBack());
      } else {
        const label = document.createElement('div');
        label.className = 'folded-label';
        label.textContent = 'FOLDED';
        cardsContainer.appendChild(label);
      }

      const betEl = document.getElementById(`bet-slot${offset}`);
      betEl.innerHTML = '';
      if (contribution > 0) {
        const chip = document.createElement('span');
        chip.className = 'chip-icon';
        betEl.appendChild(chip);
        const amount = document.createElement('span');
        amount.textContent = `${fmt(contribution)} BB`;
        betEl.appendChild(amount);
      }
    }

    const pot = Object.values(potState.contributions).reduce((a, b) => a + b, 0);
    el.potLine.textContent = `POT: ${fmt(pot)} BB`;
  }

  function renderHeroCards(heroCards) {
    el.heroCards.innerHTML = '';
    el.heroCards.appendChild(renderCardFace(heroCards[0]));
    el.heroCards.appendChild(renderCardFace(heroCards[1]));
  }

  function setButtonsNeutral() {
    [el.btnFold, el.btnCall, el.btnRaise].forEach((btn) => {
      btn.disabled = false;
      btn.classList.remove('reveal-green', 'reveal-yellow', 'reveal-red', 'reveal-grey');
    });
    [el.pctFold, el.pctCall, el.pctRaise].forEach((span) => {
      span.classList.add('hidden');
      span.textContent = '';
    });
    el.pctHint.classList.remove('hidden');
  }

  function revealButtons(handData) {
    const map = { fold: [el.btnFold, el.pctFold], call: [el.btnCall, el.pctCall], raise: [el.btnRaise, el.pctRaise] };
    Object.entries(map).forEach(([action, [btn, pctSpan]]) => {
      const value = handData[action];
      btn.classList.add(`reveal-${getPercentageColor(value)}`);
      btn.disabled = true;
      pctSpan.textContent = `${value}%`;
      pctSpan.classList.remove('hidden');
    });
    el.pctHint.classList.add('hidden');
  }

  async function newHand() {
    currentPosition = getRandomPosition();
    const table = await loadPositionTable(currentPosition);

    currentHeroCards = dealTwoCards();
    const canonical = toCanonicalHand(currentHeroCards[0], currentHeroCards[1]);
    currentHandData = table.hands[canonical];

    potState = {
      currentBet: BLIND_BB,
      contributions: { UTG: 0, MP: 0, CO: 0, BTN: 0, SB: BLIND_SB, BB: BLIND_BB },
      folded: { UTG: false, MP: false, CO: false, BTN: false, SB: false, BB: false },
    };

    const heroIdx = TURN_ORDER.indexOf(currentPosition);
    for (let i = 0; i < heroIdx; i++) {
      await simulateSeatAction(TURN_ORDER[i]);
    }

    hasActed = false;

    el.position.textContent = `${currentPosition} (${table.fullName})`;
    renderHeroCards(currentHeroCards);
    renderTable();

    el.feedbackBox.className = 'feedback-box';
    el.feedbackText.textContent = 'Choose an action to see GTO feedback.';

    setButtonsNeutral();
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

  async function handleAction(userAction) {
    if (hasActed) return;
    hasActed = true;

    applyAction(currentPosition, userAction);

    const heroIdx = TURN_ORDER.indexOf(currentPosition);
    for (let i = heroIdx + 1; i < TURN_ORDER.length; i++) {
      await simulateSeatAction(TURN_ORDER[i]);
    }

    renderTable();
    revealButtons(currentHandData);
    el.btnNext.disabled = false;

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
