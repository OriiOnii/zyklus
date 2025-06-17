const firebaseConfig = {
  apiKey: "AIzaSyD4klxUoDP_S7i5rJ89jnBCGNMEg5jZx4k",
  authDomain: "melizyklus.firebaseapp.com",
  databaseURL: "https://melizyklus-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "melizyklus",
  storageBucket: "melizyklus.firebasestorage.app",
  messagingSenderId: "744492071683",
  appId: "1:744492071683:web:48c2e6bcdb862a76f84736"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const cycleLength = 32;
const periodLength = 6;

function normalizeDate(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function renderCalendar(startDateStr) {
  const start = new Date(startDateStr);
  const container = $("#calendarContainer");
  container.empty();

  const today = new Date();

  const monthsToShow = 12;

  for (let m = 0; m < monthsToShow; m++) {
    const firstDay = new Date(today.getFullYear(), today.getMonth() + m, 1);
    const month = firstDay.getMonth();
    const year = firstDay.getFullYear();

    // Monatsüberschrift
    const monthName = firstDay.toLocaleString("de-DE", { month: "long", year: "numeric" });
    container.append(`<div class="month-header" style="grid-column: span 7; font-weight:bold; text-align:center; margin: 10px 0;">${monthName}</div>`);

    // Wochentage
    const weekdays = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
    weekdays.forEach(w => container.append(`<div style="font-weight: bold; text-align: center;">${w}</div>`));

    const firstWeekday = (firstDay.getDay() + 6) % 7; // JS: So=0, Mo=1... → Mo=0
    for (let i = 0; i < firstWeekday; i++) {
      container.append(`<div></div>`); // leere Zellen vor Monatsstart
    }

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
  const currentDate = new Date(year, month, d);
  const diff = Math.floor((normalizeDate(currentDate) - normalizeDate(start)) / (1000 * 60 * 60 * 24));
  const dayInCycle = ((diff % cycleLength) + cycleLength) % cycleLength;

  const dayEl = $("<div>").addClass("day").text(d);

  if (dayInCycle >= 0 && dayInCycle < periodLength) {
    dayEl.addClass("period");
    if (dayInCycle < 2) {
      dayEl.addClass("heavy");
    }
  } else if (dayInCycle >= 13 && dayInCycle <= 18) {
    dayEl.addClass("fertile");
    if (dayInCycle === 17) {
      dayEl.addClass("ovulation");
    }
  }

  // **Hier NEU: Heute markieren**
  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0); // Zeit zurücksetzen
  const normalizedCurrentDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());

  if (normalizedCurrentDate.getTime() === todayDate.getTime()) {
    dayEl.addClass("today");
  }

  container.append(dayEl);
}

  }
}

// Lade das letzte Startdatum aus Firebase, oder nutze ein Standarddatum
function loadLastStart() {
  const ref = db.ref("lastStart");
  ref.on("value", (snapshot) => {
    const val = snapshot.val();
    if (val) {
      $("#lastStart").val(val);
      renderCalendar(val);
      showFunnyMessage(val); // ➕ WICHTIG: hier aufrufen!
    } else {
      const fallbackDate = new Date();
      fallbackDate.setDate(fallbackDate.getDate() - 3);
      const fallbackStr = fallbackDate.toISOString().slice(0, 10);
      $("#lastStart").val(fallbackStr);
      renderCalendar(fallbackStr);
      showFunnyMessage(fallbackStr); // ➕ auch hier
    }
  });
}

// Speichere das Datum in Firebase
function saveLastStart(dateStr) {
  db.ref("lastStart").set(dateStr)
    .then(() => alert("Datum gespeichert!"))
    .catch((error) => alert("Fehler beim Speichern: " + error));
}

const PASSWORD = "blut";  // Passwort hier anpassen

function checkPassword() {
  const input = prompt("Bitte Passwort eingeben:");
  if (input === PASSWORD) {
    return true;
  } else {
    alert("Falsches Passwort!");
    return false;
  }
}

$(function () {
  loadLastStart();

  $("#saveBtn").click(() => {
    if (!checkPassword()) return;  // Passwort falsch -> Abbruch
    const dateStr = $("#lastStart").val();
    if (dateStr) {
      saveLastStart(dateStr);
    } else {
      alert("Bitte ein Datum eingeben!");
    }
  });

  $("#markTodayBtn").click(() => {
    if (!checkPassword()) return;  // Passwort falsch -> Abbruch
    const todayStr = new Date().toISOString().slice(0, 10);
    $("#lastStart").val(todayStr);
    saveLastStart(todayStr);
  });
});

function showFunnyMessage(startDateStr) {
  const today = new Date();
  const start = new Date(startDateStr);
  const daysDiff = Math.floor((normalizeDate(today) - normalizeDate(start)) / (1000 * 60 * 60 * 24));
  const cycleDay = ((daysDiff % cycleLength) + cycleLength) % cycleLength;

  let message = "";

  if (cycleDay === 1 || cycleDay === 2) {
    message = "Status: 🩸 Blutbad mit Schmerzgarantie 🩸";
  } else if (cycleDay >= 3 && cycleDay <= 6) {
    message = "Status: 🩸 Blutet aber überlebt 🩸";
  } else if (cycleDay === 17) {
    message = "Status: 💦 Lust-Level auf MAX 💦";
  } else if (cycleDay >= 14 && cycleDay <= 18) {
    message = "Status: 💦 Fruchtbar und unwiderstehlich 💦";
  } else {
    message = "Status: 👌 Wieder bereit für Abenteuer 👌";
  }

  $("#funMessage").text(message);
}