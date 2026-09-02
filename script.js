(() => {
  const POSITIONS = ['UTG', 'MP', 'CO', 'BTN', 'SB', 'BB'];
  const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
  const SUITS = ['♠', '♥', '♦', '♣'];
  const CLOSE_CALL_THRESHOLD = 15;
  const STORAGE_KEY = 'gtomaxy-stats';

  let gtoData = null;
  let currentPosition = null;
  let currentGto = null;
  let hasActed = false;

  const el = {
    position: document.getElementById('current-position'),
    hand: document.getElementById('current-hand'),
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
  };

  function getRandomPosition() {
    return POSITIONS[Math.floor(Math.random() * POSITIONS.length)];
  }

  function generateRandomHand() {
    const card1 = RANKS[Math.floor(Math.random() * RANKS.length)] + SUITS[Math.floor(Math.random() * SUITS.length)];
    const card2 = RANKS[Math.floor(Math.random() * RANKS.length)] + SUITS[Math.floor(Math.random() * SUITS.length)];
    return `${card1} ${card2}`;
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

  function setPercentageDisplay(elem, value) {
    elem.textContent = `${value}%`;
    elem.classList.remove('color-green', 'color-yellow', 'color-red', 'color-grey');
    elem.classList.add(`color-${getPercentageColor(value)}`);
  }

  function newHand() {
    currentPosition = getRandomPosition();
    currentGto = gtoData.positions[currentPosition];
    hasActed = false;

    setSeatHighlight(currentPosition);
    el.position.textContent = `${currentPosition} (${currentGto.fullName})`;
    el.hand.textContent = generateRandomHand();

    setPercentageDisplay(el.pctFold, currentGto.fold);
    setPercentageDisplay(el.pctCall, currentGto.call);
    setPercentageDisplay(el.pctRaise, currentGto.raise);

    el.feedbackBox.className = 'feedback-box';
    el.feedbackText.textContent = 'Choose an action to see GTO feedback.';

    el.btnFold.disabled = false;
    el.btnCall.disabled = false;
    el.btnRaise.disabled = false;
    el.btnNext.disabled = true;
  }

  function bestAction(gto) {
    const entries = [
      ['fold', gto.fold],
      ['call', gto.call],
      ['raise', gto.raise],
    ];
    entries.sort((a, b) => b[1] - a[1]);
    return entries[0];
  }

  function handleAction(userAction) {
    if (hasActed) return;
    hasActed = true;

    el.btnFold.disabled = true;
    el.btnCall.disabled = true;
    el.btnRaise.disabled = true;
    el.btnNext.disabled = false;

    const [bestName, bestPct] = bestAction(currentGto);
    const userPct = currentGto[userAction];
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

  async function init() {
    const response = await fetch('data.json');
    gtoData = await response.json();

    el.btnFold.addEventListener('click', () => handleAction('fold'));
    el.btnCall.addEventListener('click', () => handleAction('call'));
    el.btnRaise.addEventListener('click', () => handleAction('raise'));
    el.btnNext.addEventListener('click', newHand);
    el.btnResetStats.addEventListener('click', resetStats);

    renderStats();
    newHand();
  }

  init();
})();
