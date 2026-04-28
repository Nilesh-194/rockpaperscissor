const CHOICES = {
  rock: {
    label: "Rock",
    icon: "&#9994;&#65038;",
    beats: "scissors",
    modifier: "rock"
  },
  paper: {
    label: "Paper",
    icon: "&#9995;&#65038;",
    beats: "rock",
    modifier: "paper"
  },
  scissors: {
    label: "Scissors",
    icon: "&#9996;&#65038;",
    beats: "paper",
    modifier: "scissors"
  }
};

const STORAGE_KEY = "cuvette-rps-score";
const choiceKeys = Object.keys(CHOICES);
const app = document.querySelector("#app");
const toast = document.querySelector("#toast");

const state = {
  phase: "choices",
  rulesOpen: false,
  scores: loadScores(),
  round: null
};

app.addEventListener("click", handleAppClick);
render();

function handleAppClick(event) {
  const target = event.target.closest("[data-choice], [data-action]");

  if (!target) {
    return;
  }

  if (target.dataset.choice) {
    playRound(target.dataset.choice);
    return;
  }

  const action = target.dataset.action;

  if (action === "toggle-rules") {
    state.rulesOpen = !state.rulesOpen;
    render();
    return;
  }

  if (action === "close-rules") {
    state.rulesOpen = false;
    render();
    return;
  }

  if (action === "play-again") {
    state.phase = "choices";
    state.round = null;
    render();
    return;
  }

  if (action === "next") {
    state.phase = "celebration";
    state.rulesOpen = false;
    render();
  }
}

function playRound(playerChoice) {
  if (!isValidChoice(playerChoice)) {
    showToast("Please choose rock, paper, or scissors.");
    return;
  }

  const computerChoice = getRandomChoice();
  const outcome = getOutcome(playerChoice, computerChoice);

  if (outcome === "win") {
    state.scores.player += 1;
  }

  if (outcome === "lose") {
    state.scores.computer += 1;
  }

  state.round = {
    playerChoice,
    computerChoice,
    outcome
  };
  state.phase = "result";
  state.rulesOpen = false;
  saveScores(state.scores);
  render();
}

function getRandomChoice() {
  const index = Math.floor(Math.random() * choiceKeys.length);
  return choiceKeys[index];
}

function getOutcome(playerChoice, computerChoice) {
  if (playerChoice === computerChoice) {
    return "tie";
  }

  return CHOICES[playerChoice].beats === computerChoice ? "win" : "lose";
}

function isValidChoice(choice) {
  return Object.prototype.hasOwnProperty.call(CHOICES, choice);
}

function loadScores() {
  try {
    const storedScore = localStorage.getItem(STORAGE_KEY);

    if (!storedScore) {
      return { player: 0, computer: 0 };
    }

    const parsedScore = JSON.parse(storedScore);
    const player = Number(parsedScore.player);
    const computer = Number(parsedScore.computer);

    return {
      player: Number.isFinite(player) && player >= 0 ? player : 0,
      computer: Number.isFinite(computer) && computer >= 0 ? computer : 0
    };
  } catch (error) {
    showToast("Score storage is unavailable. Scores will reset on reload.");
    return { player: 0, computer: 0 };
  }
}

function saveScores(scores) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scores));
  } catch (error) {
    showToast("Unable to save the latest score.");
  }
}

function render() {
  app.className = `app app--${state.phase}`;
  document.body.dataset.phase = state.phase;

  if (state.phase === "celebration") {
    app.innerHTML = renderCelebrationScreen();
    return;
  }

  app.innerHTML = `
    <section class="game-shell" aria-label="Rock Paper Scissors game">
      ${renderScoreboard()}
      ${state.phase === "result" && state.round ? renderResultBoard() : renderChoiceBoard()}
      ${renderControls()}
      ${state.rulesOpen ? renderRulesPanel() : ""}
    </section>
  `;
}

function renderScoreboard() {
  return `
    <header class="scoreboard">
      <h1 class="scoreboard__title">
        <span>Rock</span>
        <span>Paper</span>
        <span>Scissors</span>
      </h1>
      <div class="scoreboard__cards" aria-label="Score">
        ${renderScoreCard("Computer Score", state.scores.computer)}
        ${renderScoreCard("Your Score", state.scores.player)}
      </div>
    </header>
  `;
}

function renderScoreCard(label, value) {
  return `
    <article class="score-card">
      <span class="score-card__label">${label}</span>
      <strong class="score-card__value">${value}</strong>
    </article>
  `;
}

function renderChoiceBoard() {
  return `
    <section class="choice-board" aria-label="Choose your hand">
      <span class="connector connector--rock-scissors" aria-hidden="true"></span>
      <span class="connector connector--rock-paper" aria-hidden="true"></span>
      <span class="connector connector--scissors-paper" aria-hidden="true"></span>
      ${renderChoiceButton("rock", "choice-board__token choice-board__token--rock")}
      ${renderChoiceButton("scissors", "choice-board__token choice-board__token--scissors")}
      ${renderChoiceButton("paper", "choice-board__token choice-board__token--paper")}
    </section>
  `;
}

function renderChoiceButton(choice, extraClass = "") {
  const choiceData = CHOICES[choice];

  return `
    <button
      class="choice-token choice-token--${choiceData.modifier} ${extraClass}"
      type="button"
      data-choice="${choice}"
      aria-label="Pick ${choiceData.label}"
    >
      <span class="choice-token__inner">
        <span class="choice-token__icon" aria-hidden="true">${choiceData.icon}</span>
      </span>
    </button>
  `;
}

function renderResultBoard() {
  const { playerChoice, computerChoice, outcome } = state.round;
  const playerWon = outcome === "win";
  const computerWon = outcome === "lose";

  return `
    <section class="result-board result-board--${outcome}" aria-label="Round result">
      ${renderContestant("You Picked", playerChoice, playerWon)}
      ${renderResultMessage(outcome)}
      ${renderContestant("PC Picked", computerChoice, computerWon)}
    </section>
  `;
}

function renderContestant(label, choice, isWinner) {
  const choiceData = CHOICES[choice];

  return `
    <article class="contestant ${isWinner ? "contestant--winner" : ""}">
      <h2 class="contestant__label">${label}</h2>
      <div class="contestant__token-wrap">
        <div class="choice-token choice-token--${choiceData.modifier}" aria-label="${choiceData.label}">
          <span class="choice-token__inner">
            <span class="choice-token__icon" aria-hidden="true">${choiceData.icon}</span>
          </span>
        </div>
      </div>
    </article>
  `;
}

function renderResultMessage(outcome) {
  const text = {
    win: {
      title: "You Win",
      subtitle: "Against PC",
      button: "Play Again"
    },
    lose: {
      title: "You Lost",
      subtitle: "Against PC",
      button: "Play Again"
    },
    tie: {
      title: "Tie Up",
      subtitle: "",
      button: "Replay"
    }
  }[outcome];

  return `
    <div class="result-message">
      <h2>${text.title}</h2>
      ${text.subtitle ? `<p>${text.subtitle}</p>` : ""}
      <button class="primary-button" type="button" data-action="play-again">${text.button}</button>
    </div>
  `;
}

function renderControls() {
  const canMoveNext = state.phase === "result" && state.round?.outcome === "win";

  return `
    <div class="corner-actions">
      <button class="outline-button" type="button" data-action="toggle-rules">Rules</button>
      ${
        canMoveNext
          ? '<button class="outline-button" type="button" data-action="next">Next</button>'
          : ""
      }
    </div>
  `;
}

function renderRulesPanel() {
  return `
    <aside class="rules-panel" aria-label="Game rules">
      <button class="rules-panel__close" type="button" data-action="close-rules" aria-label="Close rules">X</button>
      <h2>Game Rules</h2>
      <ul>
        <li>Rock beats scissors, scissors beat paper, and paper beats rock.</li>
        <li>Agree ahead of time whether you will count off "rock, paper, scissors, shoot" or just "rock, paper, scissors."</li>
        <li>Use rock, paper, scissors to settle minor decisions or simply play to pass the time.</li>
        <li>If both players lay down the same hand, each player lays down another hand.</li>
      </ul>
    </aside>
  `;
}

function renderCelebrationScreen() {
  return `
    <section class="celebration-screen" aria-label="Game won">
      <div class="celebration-screen__art" aria-hidden="true">
        <img class="celebration-screen__stars" src="./src/assets/stars.png" alt="" />
        <img class="celebration-screen__trophy" src="./src/assets/trophy.png" alt="" />
      </div>
      <h1>Hurray!!</h1>
      <p>You Won The Game</p>
      <button class="primary-button primary-button--wide" type="button" data-action="play-again">Play Again</button>
      <div class="corner-actions">
        <button class="outline-button" type="button" data-action="toggle-rules">Rules</button>
      </div>
      ${state.rulesOpen ? renderRulesPanel() : ""}
    </section>
  `;
}

function showToast(message) {
  if (!toast) {
    return;
  }

  toast.textContent = message;
  toast.classList.add("toast--visible");
  window.clearTimeout(showToast.timeoutId);
  showToast.timeoutId = window.setTimeout(() => {
    toast.classList.remove("toast--visible");
  }, 2600);
}
