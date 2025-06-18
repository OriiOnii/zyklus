const firebaseConfig = {
  apiKey: "AIzaSyCu1TUO7ZRYhPu3yQFir94jN89_6rebytU",
  authDomain: "periode-zyklus.firebaseapp.com",
  databaseURL: "https://periode-zyklus-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "periode-zyklus",
  storageBucket: "periode-zyklus.firebasestorage.app",
  messagingSenderId: "623369742916",
  appId: "1:623369742916:web:2d5bd0d0299e8fb0a9ea11"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();

const cycleLength = 32;
const periodLength = 6;

// Das Passwort für Aktionen (Speichern, Markieren, Verzögern)
const EDIT_PASSWORD = "blutbad";  // <-- Hier dein gewünschtes Passwort eintragen

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

    const monthName = firstDay.toLocaleString("de-DE", { month: "long", year: "numeric" });
    container.append(`<div class="month-header" style="grid-column: span 7; font-weight:bold; text-align:center; margin: 10px 0;">${monthName}</div>`);

    const weekdays = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
    weekdays.forEach(w => container.append(`<div style="font-weight: bold; text-align: center;">${w}</div>`));

    const firstWeekday = (firstDay.getDay() + 6) % 7;
    for (let i = 0; i < firstWeekday; i++) {
      container.append(`<div></div>`);
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

      const todayDate = new Date();
      todayDate.setHours(0, 0, 0, 0);
      const normalizedCurrentDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());

      if (normalizedCurrentDate.getTime() === todayDate.getTime()) {
        dayEl.addClass("today");
      }

      container.append(dayEl);
    }
  }
}

function loadLastStart() {
  const ref = db.ref("lastStart");
  ref.on("value", (snapshot) => {
    const val = snapshot.val();
    if (val) {
      $("#lastStart").val(val);
      renderCalendar(val);
      showFunnyMessage(val);
    } else {
      const fallbackDate = new Date();
      fallbackDate.setDate(fallbackDate.getDate() - 3);
      const fallbackStr = fallbackDate.toISOString().slice(0, 10);
      $("#lastStart").val(fallbackStr);
      renderCalendar(fallbackStr);
      showFunnyMessage(fallbackStr);
    }
  });
}

function saveLastStart(dateStr) {
  db.ref("lastStart").set(dateStr)
    .then(() => alert("Datum gespeichert!"))
    .catch((error) => alert("Fehler beim Speichern: " + error));
}

function checkEditPassword() {
  const input = prompt("Bitte Passwort für diese Aktion eingeben:");
  if (input === EDIT_PASSWORD) {
    return true;
  } else {
    alert("Falsches Passwort!");
    return false;
  }
}

$(function () {
  // Firebase-Login-Status prüfen
  auth.onAuthStateChanged(user => {
    if (user) {
      $("#loginOverlay").hide();
      loadLastStart();
    } else {
      $("#loginOverlay").show();
    }
  });

  // Login-Button (Overlay)
  $("#loginBox button").click(() => {
    const email = "admin@meinzyklus.de";
    const password = $("#loginPassword").val();

    auth.signInWithEmailAndPassword(email, password)
      .then(() => {
        $("#loginPassword").val("");
        $("#loginError").hide();
      })
      .catch(() => {
        $("#loginError").show();
      });
  });

  // Enter-Taste im Passwortfeld
  $("#loginPassword").keydown(function (e) {
    if (e.key === "Enter") {
      $("#loginBox button").click();
    }
  });

  // Speichern-Button
  $("#saveBtn").click(() => {
    if (!checkEditPassword()) return;
    const dateStr = $("#lastStart").val();
    if (dateStr) {
      saveLastStart(dateStr);
    } else {
      alert("Bitte ein Datum eingeben!");
    }
  });

  // Heute-markieren-Button
  $("#markTodayBtn").click(() => {
    if (!checkEditPassword()) return;
    const todayStr = new Date().toISOString().slice(0, 10);
    $("#lastStart").val(todayStr);
    saveLastStart(todayStr);
  });

  // Verzögern-Button
  $("#delayBtn").click(() => {
    if (!checkEditPassword()) return;

    let currentDate = $("#lastStart").val();
    if (!currentDate) {
      alert("Kein Datum gespeichert.");
      return;
    }

    let date = new Date(currentDate);
    date.setDate(date.getDate() + 1);

    const newDateStr = date.toISOString().slice(0, 10);
    $("#lastStart").val(newDateStr);
    saveLastStart(newDateStr);
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

const toggleBtn = document.getElementById('darkModeToggle');

// Dark Mode standardmäßig aktivieren, wenn nichts gespeichert ist
if (localStorage.getItem('darkMode') !== 'disabled') {
  document.body.classList.add('dark');
}

// Button-Klick: Umschalten und speichern
toggleBtn.addEventListener('click', () => {
  document.body.classList.toggle('dark');

  if (document.body.classList.contains('dark')) {
    localStorage.setItem('darkMode', 'enabled');
  } else {
    localStorage.setItem('darkMode', 'disabled');
  }
});


