/* =========================================================
   EDIT YOUR BIRTHDAY SURPRISE HERE
   ---------------------------------------------------------
   Share a personal link: index.html?name=Ammulu
   If there is no ?name= in the link, recipientName is used.

   You can write {name} and {sender} inside any message.
   They are replaced when the page opens.

   letter.body is the note inside the envelope.
   ========================================================= */
const CONFIG = {
  recipientName: "Ammulu",
  senderName: "Yours",
  birthdayGreeting: "Happy Birthday",

  balloonMessages: [
    "You are my happiness ❤️",
    "You are my favourite person",
    "You make life beautiful",
    "You are my forever",
  ],
  balloonFinalMessage:
    "If I could give you one thing in life, it would be the ability to see yourself through my eyes. You'd finally understand how beautiful, precious, and extraordinary you are to me. You make even my ordinary days feel special, and I'm so lucky to have you in my life. ❤️",

  roseMessages: [
    "Forever yours ♡",
    "You make my world beautiful",
    "You are my sunshine ☀️",
    "Happy Birthday {name} 💗",
    "I am so lucky to know you",
    "Sending you all my love 💌",
  ],

  letter: {
    signOff: "With all my love,",
    body:
      "Happy Birthday, beautiful! ❤️\n\nI hope your day is as special as you are. I just want you to know how happy I am to have you in my life. I'm grateful for all the little moments, laughs, conversations, and memories we share.\n\nI wish you lots of happiness, success, good health, and everything you've been wishing for. Keep smiling, keep being yourself, and never stop chasing your dreams.\n\nI hope this year brings you everything you deserve and more.\n\nHave the best birthday, baby. ❤️ Love you!",
  },

  finalGiftMessage:
    "Happy Birthday, {name}! ❤️\n\nYou make my world a little brighter just by being in it. Your smile is my favourite sight, your happiness means everything to me, and every moment with you becomes a beautiful memory. I hope life gives you countless reasons to smile, endless adventures to enjoy, and all the love your heart can hold. Never stop being the wonderful person you are. I'm so grateful to have you in my life. You deserve all the happiness in the world, today and always. 💗",

  memories: [
    { src: "images/memory-1.jpg", caption: "Dancing with you" },
    { src: "images/memory-2.jpg", caption: "Us, side by side" },
    { src: "images/memory-3.jpg", caption: "That night together" },
  ],

  // Audio never plays on its own. A chime starts only after a tap.
  sound: false,
};

/* =========================================================
   Experience code. Edit the CONFIG block above.
   ========================================================= */

const FLOW = ["welcome", "balloons", "cake", "roses", "memories", "letter", "gift"];
const BALLOON_COLORS = ["blue", "pink", "green", "lavender"];
const SCREEN_TITLES = {
  preparing: "Preparing something special",
  welcome: "Birthday welcome",
  balloons: "Pop the balloons",
  cake: "Blow the candle",
  roses: "Rose bouquet",
  memories: "Sweet memories",
  letter: "A message from the heart",
  gift: "One last thing",
};

const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

let epoch = 0;
let timers = [];
let typeTimer = null;
let toastTimer = null;
let navGen = 0;
let noBusy = false;
let memoryBusy = false;
let drag = null;
let audioCtx = null;

const state = {
  screen: "preparing",
  history: [],
  name: "Friend",
  balloons: [false, false, false, false],
  candleBlown: false,
  rosesOpened: false,
  roseEntered: false,
  memoryIndex: 0,
  letterPhase: "closed",
  giftTaps: 0,
  soundOn: false,
};

const $ = (id) => document.getElementById(id);

function prefersReducedMotion() {
  return motionQuery.matches;
}

function cleanName(value) {
  return String(value || "")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .trim()
    .slice(0, 40);
}

function readName() {
  const param = new URLSearchParams(window.location.search).get("name");
  return cleanName(param) || cleanName(CONFIG.recipientName) || "Friend";
}

function personalize(text) {
  return String(text ?? "")
    .replaceAll("{name}", state.name)
    .replaceAll("{sender}", CONFIG.senderName || "");
}

function later(fn, ms) {
  const token = epoch;
  const id = setTimeout(() => {
    timers = timers.filter((item) => item !== id);
    if (token !== epoch) return;
    fn();
  }, ms);
  timers.push(id);
}

function clearLater() {
  epoch += 1;
  timers.forEach((id) => clearTimeout(id));
  timers = [];
  clearTimeout(typeTimer);
  typeTimer = null;
}

function ensureAudio() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  if (!audioCtx) audioCtx = new AudioContextClass();
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

function playChime(kind) {
  if (!state.soundOn) return;
  const ctx = ensureAudio();
  if (!ctx) return;
  const now = ctx.currentTime;
  const notes = kind === "magic" ? [523, 659, 784] : kind === "pop" ? [494, 698] : [659, 880];
  notes.forEach((freq, index) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    const start = now + index * 0.07;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.045, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.28);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + 0.3);
  });
}

function burst(el, count) {
  if (!el || prefersReducedMotion()) return;
  const host = $("fx");
  const phone = document.querySelector(".phone").getBoundingClientRect();
  const rect = el.getBoundingClientRect();
  const x = rect.left + rect.width / 2 - phone.left;
  const y = rect.top + rect.height / 2 - phone.top;
  const colors = ["#e36b86", "#ffd166", "#8ecae6", "#c9b6f2", "#fff", "#f4a3b8", "#95d5b2"];
  const pieces = count || 16;
  for (let i = 0; i < pieces; i += 1) {
    const bit = document.createElement("span");
    const angle = (Math.PI * 2 * i) / pieces + Math.random() * 0.5;
    const dist = 36 + Math.random() * 72;
    bit.className = "confetti";
    bit.style.left = `${x}px`;
    bit.style.top = `${y}px`;
    bit.style.background = colors[i % colors.length];
    bit.style.setProperty("--dx", `${Math.cos(angle) * dist}px`);
    bit.style.setProperty("--dy", `${Math.sin(angle) * dist - 18}px`);
    bit.style.width = `${5 + Math.random() * 5}px`;
    bit.style.height = `${7 + Math.random() * 6}px`;
    bit.style.borderRadius = Math.random() > 0.5 ? "2px" : "50%";
    host.appendChild(bit);
    bit.addEventListener("animationend", () => bit.remove());
  }
}

function showToast(message) {
  const toast = $("toast");
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.hidden = true;
  }, 3200);
}

function applyCopy() {
  document.title = `${CONFIG.birthdayGreeting}, ${state.name}`;
  $("welcome-heading").textContent = `${CONFIG.birthdayGreeting}, ${state.name}`;
  $("cake-heading").textContent = `Blow the candle, ${state.name}`;
  $("letter-dear").textContent = `Dear ${state.name} 💜`;
  $("letter-signoff").textContent = CONFIG.letter.signOff || "With all my love,";
  $("letter-sender").textContent = `${CONFIG.senderName} ♡`;
  $("balloon-final-text").textContent = personalize(CONFIG.balloonFinalMessage);
  $("gift-message").textContent = personalize(CONFIG.finalGiftMessage);
}

function buildBalloons() {
  const grid = $("balloon-grid");
  const messages = CONFIG.balloonMessages.slice(0, 4);
  while (messages.length < 4) messages.push("You are loved");
  messages.forEach((message, index) => {
    const slot = document.createElement("div");
    slot.className = "balloon-slot";
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `balloon balloon-${BALLOON_COLORS[index]}`;
    btn.setAttribute("aria-label", `Balloon ${index + 1}. Pop to reveal a message.`);
    btn.innerHTML = `
      <span class="balloon-visual">
        <span class="balloon-body"><span class="balloon-shine"></span></span>
        <span class="balloon-knot"></span>
        <span class="balloon-string"></span>
      </span>`;
    const msg = document.createElement("p");
    msg.className = "balloon-message";
    msg.setAttribute("aria-hidden", "true");
    msg.textContent = personalize(message);
    btn.addEventListener("click", () => popBalloon(index, slot));
    slot.append(btn, msg);
    grid.append(slot);
  });
}

function syncBalloons() {
  const popped = state.balloons.filter(Boolean).length;
  $("balloon-count").textContent = `${popped} / 4 POPPED`;
  document.querySelectorAll(".balloon-slot").forEach((slot, index) => {
    const isPopped = Boolean(state.balloons[index]);
    slot.classList.toggle("is-popped", isPopped);
    const btn = slot.querySelector("button");
    const messageEl = slot.querySelector(".balloon-message");
    const message = messageEl.textContent;
    messageEl.setAttribute("aria-hidden", isPopped ? "false" : "true");
    btn.setAttribute("aria-disabled", isPopped ? "true" : "false");
    btn.tabIndex = isPopped ? -1 : 0;
    if (isPopped) btn.setAttribute("aria-label", `Revealed message: ${message}`);
  });
  const done = state.balloons.length >= 4 && state.balloons.every(Boolean);
  const panel = $("balloon-final");
  panel.hidden = !done;
    if (done) {
    $("live").textContent = $("balloon-final-text").textContent;
    if (state.screen === "balloons") {
      $("balloon-continue").scrollIntoView({
        behavior: prefersReducedMotion() ? "auto" : "smooth",
        block: "nearest",
      });
    }
  }
}

function popBalloon(index, slot) {
  if (state.balloons[index]) return;
  state.balloons[index] = true;
  burst(slot.querySelector(".balloon"), 18);
  playChime("pop");
  syncBalloons();
}

function syncCake() {
  document.querySelector('[data-screen="cake"]').classList.toggle("is-night", state.candleBlown);
  $("cake").classList.toggle("is-out", state.candleBlown);
  $("blow-btn").hidden = state.candleBlown;
  $("wish").hidden = !state.candleBlown;
}

function blowCandle() {
  if (state.candleBlown) return;
  state.candleBlown = true;
  playChime("soft");
  syncCake();
  $("live").textContent = "The candle is out. Close your eyes and make a wish.";
  later(() => {
    if (state.screen === "cake" && state.candleBlown) {
      $("wish-done").focus({ preventScroll: true });
    }
  }, prefersReducedMotion() ? 0 : 450);
}

const NOTE_SPOTS = ["tl", "tr", "mr", "br", "bl", "ml"];

function buildNotes() {
  const stage = $("rose-stage");
  const messages = CONFIG.roseMessages.slice(0, 6).map(personalize);
  while (messages.length < 6) messages.push("You are loved");
  messages.forEach((text, index) => {
    const note = document.createElement("p");
    note.className = `note note-${NOTE_SPOTS[index]}`;
    note.setAttribute("aria-hidden", "true");
    note.textContent = text;
    stage.append(note);
  });
}

function hideNotes() {
  const stage = $("rose-stage");
  stage.classList.remove("is-instant");
  stage.querySelectorAll(".note").forEach((note) => {
    note.classList.remove("is-in");
    note.setAttribute("aria-hidden", "true");
  });
}

function showNotes(instant) {
  const stage = $("rose-stage");
  stage.classList.toggle("is-instant", instant);
  stage.querySelectorAll(".note").forEach((note) => {
    note.classList.add("is-in");
    note.setAttribute("aria-hidden", "false");
  });
}

function onEnterRoses() {
  const bouquet = $("bouquet");
  if (state.rosesOpened) {
    state.roseEntered = true;
    bouquet.classList.add("is-in");
    showNotes(true);
    $("rose-continue").hidden = false;
    bouquet.setAttribute("aria-label", "Rose bouquet");
    return;
  }
  hideNotes();
  bouquet.classList.remove("is-in");
  later(() => {
    if (state.screen !== "roses" || state.rosesOpened) return;
    state.roseEntered = true;
    bouquet.classList.add("is-in");
  }, prefersReducedMotion() ? 0 : 520);
}

function openBouquet() {
  if (!state.roseEntered || state.rosesOpened) return;
  state.rosesOpened = true;
  const notes = [...$("rose-stage").querySelectorAll(".note")];
  $("rose-stage").classList.remove("is-instant");
  $("bouquet").setAttribute("aria-label", "Rose bouquet");
  burst($("bouquet"), 20);
  playChime("magic");
  const step = prefersReducedMotion() ? 0 : 420;
  notes.forEach((note, index) => {
    later(() => {
      if (!state.rosesOpened) return;
      note.classList.add("is-in");
      note.setAttribute("aria-hidden", "false");
    }, step * index);
  });
  later(() => {
    if (!state.rosesOpened) return;
    const button = $("rose-continue");
    button.hidden = false;
    if (state.screen === "roses") {
      button.scrollIntoView({
        behavior: prefersReducedMotion() ? "auto" : "smooth",
        block: "nearest",
      });
    }
  }, step * notes.length + (prefersReducedMotion() ? 0 : 180));
}

function playWelcome() {
  const screen = document.querySelector('[data-screen="welcome"]');
  const ask = $("welcome-ask");
  screen.classList.remove("is-greeting", "is-ask");
  ask.setAttribute("inert", "");
  void screen.offsetWidth;
  if (prefersReducedMotion()) {
    screen.classList.add("is-greeting", "is-ask");
    ask.removeAttribute("inert");
    return;
  }
  screen.classList.add("is-greeting");
  later(() => {
    if (state.screen !== "welcome") return;
    screen.classList.add("is-ask");
    ask.removeAttribute("inert");
  }, 1500);
}

function buildMemories() {
  const stack = $("memory-stack");
  const memories = CONFIG.memories.length ? CONFIG.memories : [];
  const emojis = ["🎂", "🌸", "✨", "💗", "🎈"];
  memories.forEach((memory, index) => {
    const card = document.createElement("article");
    card.className = "memory-card";
    const figure = document.createElement("figure");
    const photo = document.createElement("div");
    photo.className = "photo";
    const img = document.createElement("img");
    img.alt = "";
    img.draggable = false;
    const fallback = document.createElement("div");
    fallback.className = "photo-fallback";
    fallback.hidden = true;
    const emoji = document.createElement("span");
    emoji.textContent = emojis[index % emojis.length];
    const label = document.createElement("small");
    label.textContent = "Add a photo in app.js";
    fallback.append(emoji, label);
    if (memory.src) {
      img.addEventListener("error", () => {
        img.hidden = true;
        fallback.hidden = false;
      });
      img.src = memory.src;
    } else {
      img.hidden = true;
      fallback.hidden = false;
    }
    photo.append(img, fallback);
    const caption = document.createElement("figcaption");
    caption.textContent = personalize(memory.caption || "");
    figure.append(photo, caption);
    card.append(figure);
    stack.append(card);
  });
  layoutMemories();
}

function layoutMemories() {
  const cards = [...$("memory-stack").querySelectorAll(".memory-card")];
  const total = cards.length || 1;
  cards.forEach((card, index) => {
    const offset = index - state.memoryIndex;
    card.classList.remove("is-current", "is-next", "is-next-2", "is-prev", "is-far");
    if (offset === 0) card.classList.add("is-current");
    else if (offset === 1) card.classList.add("is-next");
    else if (offset === 2) card.classList.add("is-next-2");
    else if (offset < 0) card.classList.add("is-prev");
    else card.classList.add("is-far");
    card.setAttribute("aria-hidden", offset === 0 ? "false" : "true");
  });
  const shown = Math.min(state.memoryIndex + 1, cards.length || 1);
  $("memory-counter").textContent = `${cards.length ? shown : 0} / ${cards.length}`;
  $("memory-prev").disabled = state.memoryIndex <= 0;
  $("memory-next").disabled = state.memoryIndex >= cards.length - 1;
  const last = cards.length > 0 && state.memoryIndex === cards.length - 1;
  $("memory-celebrate").hidden = !last;
  $("memory-continue").hidden = !last;
}

function syncMemories() {
  $("memory-stack").querySelectorAll(".memory-card").forEach((card) => {
    card.style.transform = "";
    card.style.transition = "";
  });
  memoryBusy = false;
  drag = null;
  layoutMemories();
}

function stepMemory(direction) {
  const cards = $("memory-stack").querySelectorAll(".memory-card").length;
  const next = state.memoryIndex + direction;
  if (memoryBusy || next < 0 || next >= cards) return;
  state.memoryIndex = next;
  layoutMemories();
}

function onPointerDown(event) {
  if (memoryBusy) return;
  if (event.pointerType === "mouse" && event.button !== 0) return;
  const card = event.target.closest(".memory-card.is-current");
  if (!card) return;
  drag = {
    id: event.pointerId,
    x: event.clientX,
    y: event.clientY,
    dx: 0,
    card,
    active: false,
  };
}

function onPointerMove(event) {
  if (!drag || event.pointerId !== drag.id) return;
  const dx = event.clientX - drag.x;
  const dy = event.clientY - drag.y;
  if (!drag.active) {
    if (Math.abs(dx) < 8) return;
    if (Math.abs(dy) > Math.abs(dx)) {
      drag = null;
      return;
    }
    drag.active = true;
    drag.card.style.transition = "none";
    $("memory-stack").setPointerCapture(event.pointerId);
  }
  drag.dx = dx;
  const rot = Math.max(-12, Math.min(12, dx / 18));
  drag.card.style.transform = `translateX(${dx}px) rotate(${rot}deg)`;
}

function onPointerUp(event) {
  if (!drag || event.pointerId !== drag.id) return;
  const { card, dx, active } = drag;
  drag = null;
  if (!active) return;
  const total = $("memory-stack").querySelectorAll(".memory-card").length;
  const width = card.offsetWidth || 200;
  const goNext = dx <= -width * 0.28 && state.memoryIndex < total - 1;
  const goPrev = dx >= width * 0.28 && state.memoryIndex > 0;
  if (!goNext && !goPrev) {
    card.style.transition = "transform 0.35s ease";
    card.style.transform = "";
    card.addEventListener("transitionend", () => {
      card.style.transition = "";
    }, { once: true });
    return;
  }
  memoryBusy = true;
  card.style.transition = "transform 0.4s ease";
  card.style.transform = `translateX(${goNext ? "-130%" : "130%"}) rotate(${goNext ? -12 : 12}deg)`;
  const finish = (endEvent) => {
    if (endEvent.propertyName !== "transform") return;
    card.removeEventListener("transitionend", finish);
    state.memoryIndex += goNext ? 1 : -1;
    layoutMemories();
    card.style.transition = "";
    card.style.transform = "";
    memoryBusy = false;
  };
  card.addEventListener("transitionend", finish);
}

function syncLetter() {
  const envelope = $("envelope");
  const card = $("letter-card");
  const opened = state.letterPhase === "typing" || state.letterPhase === "done";
  envelope.classList.toggle("is-open", state.letterPhase !== "closed");
  envelope.hidden = opened;
  card.hidden = !opened;
  $("letter-hint").hidden = opened;
  $("letter-next").hidden = state.letterPhase !== "done";
  if (state.letterPhase === "closed") {
    $("letter-body").textContent = "";
    $("letter-body").classList.remove("is-typing");
  }
  if (state.letterPhase === "done") {
    $("letter-body").textContent = personalize(CONFIG.letter.body || "");
    $("letter-body").classList.remove("is-typing");
  }
}

function finishLetter() {
  state.letterPhase = "done";
  $("letter-body").classList.remove("is-typing");
  $("letter-next").hidden = false;
  $("live").textContent = "Your letter is ready.";
}

function startTypewriter() {
  clearTimeout(typeTimer);
  const text = personalize(CONFIG.letter.body || "");
  const body = $("letter-body");
  $("letter-next").hidden = true;
  if (prefersReducedMotion()) {
    body.textContent = text;
    body.classList.remove("is-typing");
    finishLetter();
    return;
  }
  body.textContent = "";
  body.classList.add("is-typing");
  let index = 0;
  const step = () => {
    if (state.letterPhase !== "typing") return;
    if (index >= text.length) {
      finishLetter();
      return;
    }
    const char = text[index];
    index += 1;
    body.textContent += char;
    const delay = /[.!?]/.test(char) ? 240 : char === "\n" ? 140 : 34;
    typeTimer = setTimeout(step, delay);
  };
  step();
}

function openEnvelope() {
  if (state.letterPhase !== "closed") return;
  state.letterPhase = "opening";
  $("envelope").classList.add("is-open");
  playChime("soft");
  later(() => {
    if (state.letterPhase !== "opening") return;
    state.letterPhase = "typing";
    syncLetter();
    startTypewriter();
  }, prefersReducedMotion() ? 0 : 680);
}

function updateGiftLabel() {
  const left = 3 - state.giftTaps;
  $("gift-badge").hidden = false;
  $("gift-badge").textContent = String(left);
  const label = left === 1 ? "1 more tap to unwrap" : `${left} more taps to unwrap`;
  $("gift-status").textContent = label;
  $("gift").setAttribute("aria-label", `Gift box. ${label}.`);
}

function syncGift() {
  const opened = state.giftTaps >= 3;
  $("gift-intro").hidden = opened;
  $("gift-card").hidden = !opened;
  if (opened) {
    $("gift-message").textContent = personalize(CONFIG.finalGiftMessage);
    return;
  }
  $("gift").classList.remove("is-open");
  updateGiftLabel();
}

function tapGift() {
  if (state.giftTaps >= 3) return;
  state.giftTaps += 1;
  const gift = $("gift");
  gift.classList.remove("is-wiggle");
  void gift.offsetWidth;
  gift.classList.add("is-wiggle");
  burst(gift, 14);
  if (state.giftTaps < 3) {
    updateGiftLabel();
    playChime("pop");
    return;
  }
  playChime("magic");
  $("gift-status").textContent = "Opening your wish…";
  $("gift-badge").hidden = true;
  gift.classList.add("is-open");
  gift.setAttribute("aria-label", "Gift opened");
  later(() => {
    if (state.giftTaps < 3) return;
    syncGift();
    $("live").textContent = personalize(CONFIG.finalGiftMessage);
  }, prefersReducedMotion() ? 0 : 640);
}

function show(screen) {
  state.screen = screen;
  document.querySelectorAll(".screen").forEach((section) => {
    const active = section.dataset.screen === screen;
    section.classList.toggle("is-active", active);
    section.setAttribute("aria-hidden", active ? "false" : "true");
    if (active) section.removeAttribute("inert");
    else section.setAttribute("inert", "");
  });

  const preparing = screen === "preparing";
  $("topbar").hidden = preparing;
  const hideBack = preparing || screen === "welcome";
  const back = $("back-btn");
  back.classList.toggle("is-invisible", hideBack);
  back.setAttribute("aria-hidden", hideBack ? "true" : "false");
  back.tabIndex = hideBack ? -1 : 0;

  const index = FLOW.indexOf(screen);
  if (index >= 0) {
    $("progress").textContent = `${index + 1} / ${FLOW.length}`;
    $("progress").setAttribute("aria-label", `Step ${index + 1} of ${FLOW.length}`);
  }

  if (screen === "welcome") requestAnimationFrame(() => playWelcome());
  if (screen === "balloons") syncBalloons();
  if (screen === "cake") syncCake();
  if (screen === "roses") onEnterRoses();
  if (screen === "memories") layoutMemories();
  if (screen === "letter") syncLetter();
  if (screen === "gift") syncGift();

  $("live").textContent = SCREEN_TITLES[screen] || "";
  const heading = document.querySelector(`[data-screen="${screen}"] h1`);
  if (heading && !preparing && !window.matchMedia("(pointer: coarse)").matches) {
    heading.tabIndex = -1;
    heading.focus({ preventScroll: true });
  }
}

function goTo(screen) {
  if (!screen || state.screen === screen) return;
  if (state.screen && state.screen !== "preparing") state.history.push(state.screen);
  show(screen);
}

function goBack() {
  navGen += 1;
  if (!state.history.length) return;
  const previous = state.history.pop();
  if (!previous) return;
  show(previous);
}

function replay() {
  navGen += 1;
  noBusy = false;
  clearLater();
  const soundOn = state.soundOn;
  const name = state.name;
  state.history = [];
  state.balloons = [false, false, false, false];
  state.candleBlown = false;
  state.rosesOpened = false;
  state.roseEntered = false;
  state.memoryIndex = 0;
  state.letterPhase = "closed";
  state.giftTaps = 0;
  state.soundOn = soundOn;
  state.name = name;
  $("toast").hidden = true;
  syncBalloons();
  syncCake();
  hideNotes();
  $("bouquet").classList.remove("is-in");
  $("bouquet").setAttribute("aria-label", "Open the rose bouquet");
  $("rose-continue").hidden = true;
  syncMemories();
  syncLetter();
  syncGift();
  show("welcome");
}

function bindEvents() {
  $("back-btn").addEventListener("click", goBack);
  $("yes-btn").addEventListener("click", () => {
    navGen += 1;
    noBusy = false;
    goTo("balloons");
  });
  $("no-btn").addEventListener("click", () => {
    if (noBusy) return;
    noBusy = true;
    showToast("Too late — the birthday magic is already on its way! 😄");
    const gen = navGen + 1;
    navGen = gen;
    later(() => {
      noBusy = false;
      if (gen !== navGen) return;
      goTo("balloons");
    }, 1000);
  });
  $("balloon-continue").addEventListener("click", () => goTo("cake"));
  $("blow-btn").addEventListener("click", blowCandle);
  $("wish-done").addEventListener("click", () => goTo("roses"));
  $("bouquet").addEventListener("click", openBouquet);
  $("rose-continue").addEventListener("click", () => goTo("memories"));
  $("memory-prev").addEventListener("click", () => stepMemory(-1));
  $("memory-next").addEventListener("click", () => stepMemory(1));
  $("memory-continue").addEventListener("click", () => goTo("letter"));
  $("envelope").addEventListener("click", openEnvelope);
  $("letter-next").addEventListener("click", () => goTo("gift"));
  $("gift").addEventListener("click", tapGift);
  $("replay-btn").addEventListener("click", replay);

  const stack = $("memory-stack");
  stack.addEventListener("pointerdown", onPointerDown);
  stack.addEventListener("pointermove", onPointerMove);
  stack.addEventListener("pointerup", onPointerUp);
  stack.addEventListener("pointercancel", onPointerUp);

  document.addEventListener("keydown", (event) => {
    if (state.screen !== "memories") return;
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    const tag = document.activeElement && document.activeElement.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA") return;
    event.preventDefault();
    stepMemory(event.key === "ArrowRight" ? 1 : -1);
  });
}

function init() {
  state.name = readName();
  state.soundOn = Boolean(CONFIG.sound);
  applyCopy();
  buildBalloons();
  buildNotes();
  buildMemories();
  bindEvents();
  show("preparing");
  later(() => show("welcome"), 1200);
}

init();
