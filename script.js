/* ===========================
   Daten
=========================== */

let mitarbeiter = JSON.parse(localStorage.getItem("mitarbeiter")) || [];
let abwesenheiten = JSON.parse(localStorage.getItem("abwesenheiten")) || [];
let farbMap = JSON.parse(localStorage.getItem("farbMap")) || {};

let aktuellerSlot = null;

const farben = [
    "#ffeb3b", "#8bc34a", "#03a9f4", "#e91e63",
    "#ff9800", "#9c27b0", "#009688", "#f44336"
];

/* ===========================
   Datum formatieren TT.MM.JJ
=========================== */

function formatDateShort(isoDate) {
    if (!isoDate) return "";
    const [year, month, day] = isoDate.split("-");
    return `${day}.${month}.${year.slice(2)}`;
}

/* ===========================
   Farben
=========================== */

function getFarbe(name) {
    if (!farbMap[name]) {
        const index = Object.keys(farbMap).length % farben.length;
        farbMap[name] = farben[index];
        localStorage.setItem("farbMap", JSON.stringify(farbMap));
    }
    return farbMap[name];
}

/* ===========================
   Mitarbeiter
=========================== */

function renderMitarbeiter() {
    const grid = document.getElementById("mitarbeiter-grid");
    grid.innerHTML = "";

    mitarbeiter.forEach((name, index) => {
        const wrapper = document.createElement("div");
        wrapper.style.display = "flex";
        wrapper.style.alignItems = "center";
        wrapper.style.gap = "6px";

        const btn = document.createElement("button");
        btn.className = "mitarbeiter-btn";
        btn.textContent = name;
        btn.style.background = getFarbe(name);
        btn.draggable = true;

        btn.addEventListener("dragstart", (e) => {
            e.dataTransfer.setData("text/plain", name);
        });

        const remove = document.createElement("span");
        remove.textContent = "x";
        remove.style.color = "red";
        remove.style.cursor = "pointer";
        remove.style.fontWeight = "bold";
        remove.style.fontSize = "18px";

        remove.addEventListener("click", () => {
            if (confirm(`${name} löschen?`)) {
                mitarbeiter.splice(index, 1);
                saveMitarbeiter();
                renderMitarbeiter();
                updateAbwesenheitDropdown();
            }
        });

        wrapper.appendChild(btn);
        wrapper.appendChild(remove);
        grid.appendChild(wrapper);
    });

    updateAbwesenheitDropdown();
}

document.getElementById("add-mitarbeiter-btn").addEventListener("click", () => {
    const name = prompt("Name des Mitarbeiters:");
    if (name) {
        mitarbeiter.push(name);
        saveMitarbeiter();
        renderMitarbeiter();
    }
});

function saveMitarbeiter() {
    localStorage.setItem("mitarbeiter", JSON.stringify(mitarbeiter));
}

/* ===========================
   Abwesenheiten
=========================== */

function updateAbwesenheitDropdown() {
    const select = document.getElementById("abwesenheit-mitarbeiter");
    select.innerHTML = "";

    mitarbeiter.forEach(name => {
        const opt = document.createElement("option");
        opt.value = name;
        opt.textContent = name;
        select.appendChild(opt);
    });
}

document.getElementById("abwesenheit-hinzufuegen").addEventListener("click", () => {
    const name = document.getElementById("abwesenheit-mitarbeiter").value;
    const von = document.getElementById("abwesenheit-von").value;
    const bis = document.getElementById("abwesenheit-bis").value;
    const grund = prompt("Grund der Abwesenheit (Freitext):");

    if (!name || !von || !bis || !grund) {
        alert("Bitte Mitarbeiter, Datum und Grund eingeben.");
        return;
    }

    abwesenheiten.push({ name, von, bis, grund });
    saveAbwesenheiten();
    renderAbwesenheiten();
});

function renderAbwesenheiten() {
    const liste = document.getElementById("abwesenheit-liste");
    liste.innerHTML = "";

    abwesenheiten.forEach((a, index) => {
        const li = document.createElement("li");

        li.innerHTML = `
            ${a.name} – ${formatDateShort(a.von)} bis ${formatDateShort(a.bis)} – ${a.grund}
            <button class="remove-btn" data-index="${index}">X</button>
        `;

        li.querySelector(".remove-btn").addEventListener("click", () => {
            abwesenheiten.splice(index, 1);
            saveAbwesenheiten();
            renderAbwesenheiten();
        });

        liste.appendChild(li);
    });
}

function saveAbwesenheiten() {
    localStorage.setItem("abwesenheiten", JSON.stringify(abwesenheiten));
}

/* ===========================
   4‑Wochen‑Tabellen
=========================== */

function createWeekTables() {
    const container = document.getElementById("wochen-container");
    container.innerHTML = "";

    const tage = ["Montag","Dienstag","Mittwoch","Donnerstag","Freitag","Samstag","Sonntag"];

    for (let w = 1; w <= 4; w++) {
        const div = document.createElement("div");
        div.className = "woche";

        div.innerHTML = `
            <h2>Woche ${w}</h2>

            <div class="datum-box">
                <label>Datum von:
                    <input type="date" class="datum-von" data-week="${w}">
                </label>

                <label>bis:
                    <input type="date" class="datum-bis" data-week="${w}">
                </label>

                <span class="datum-anzeige" id="datum-anzeige-${w}"></span>
            </div>

            <table>
                <tr>
                    <th>Name</th>
                    ${tage.map(t => `<th>${t}</th>`).join("")}
                </tr>

                ${createMitarbeiterRow(tage)}
                ${createBlockRow("Service", tage)}
                ${createBlockRow("Telefon", tage)}
                ${createBlockRow("Belegung", tage)}
            </table>
        `;

        container.appendChild(div);
    }

    // Datum aktualisieren
    const vonInputs = document.querySelectorAll(".datum-von");
    const bisInputs = document.querySelectorAll(".datum-bis");

    vonInputs.forEach(input => {
        input.addEventListener("change", () => updateWeekDate(input.dataset.week));
    });
    bisInputs.forEach(input => {
        input.addEventListener("change", () => updateWeekDate(input.dataset.week));
    });

    enableDragAndDrop();
    enablePlusButtons();
}

function updateWeekDate(week) {
    const von = document.querySelector(`.datum-von[data-week="${week}"]`).value;
    const bis = document.querySelector(`.datum-bis[data-week="${week}"]`).value;

    const span = document.getElementById(`datum-anzeige-${week}`);

    if (von && bis) {
        span.textContent = `${formatDateShort(von)} – ${formatDateShort(bis)}`;
    } else {
        span.textContent = "";
    }
}

function createMitarbeiterRow(tage) {
    return `
        <tr>
            <td class="block-title">Mitarbeiter</td>
            ${tage.map(() => `
                <td>
                    <div class="mitarbeiter-slot">

                        <div class="mitarbeiter-frueh schicht-slot">
                            <div class="schicht-label">Frühschicht</div>
                            <div class="namen"></div>
                            <button class="add-btn">+</button>
                        </div>

                    </div>
                </td>
            `).join("")}
        </tr>
    `;
}

function createBlockRow(titel, tage) {
    return `
        <tr>
            <td class="block-title">${titel}</td>
            ${tage.map(() => `
                <td>
                    <div class="schicht-slot">
                        <div class="namen"></div>
                        <button class="add-btn">+</button>
                    </div>
                </td>
            `).join("")}
        </tr>
    `;
}

/* ===========================
   Drag & Drop
=========================== */

function enableDragAndDrop() {
    const slots = document.querySelectorAll(".schicht-slot");

    slots.forEach(slot => {
        slot.addEventListener("dragover", (e) => {
            e.preventDefault();
        });

        slot.addEventListener("drop", (e) => {
            e.preventDefault();
            const name = e.dataTransfer.getData("text/plain");
            if (!name) return;
            addNameToSlot(slot, name);
        });
    });
}

/* ===========================
   Plus-Buttons
=========================== */

function enablePlusButtons() {
    const buttons = document.querySelectorAll(".add-btn");

    buttons.forEach(btn => {
        btn.addEventListener("click", () => {
            aktuellerSlot = btn.parentElement;
            openPopup();
        });
    });
}

/* ===========================
   Popup
=========================== */

function openPopup() {
    const popup = document.getElementById("popup");
    const list = document.getElementById("popup-list");

    list.innerHTML = "";

    mitarbeiter.forEach(name => {
        const btn = document.createElement("button");
        btn.textContent = name;
        btn.style.background = getFarbe(name);

        btn.addEventListener("click", () => {
            addNameToSlot(aktuellerSlot, name);
        });

        list.appendChild(btn);
    });

    popup.classList.remove("hidden");
}

document.getElementById("popup-close").addEventListener("click", () => {
    document.getElementById("popup").classList.add("hidden");
});

/* ===========================
   Namen einfügen
=========================== */

function addNameToSlot(slot, name) {
    const namenBox = slot.querySelector(".namen");

    const tag = document.createElement("div");
    tag.className = "name-tag";
    tag.style.background = getFarbe(name);
    tag.style.color = "black";

    tag.innerHTML = `${name} <span>x</span>`;

    tag.querySelector("span").addEventListener("click", () => {
        tag.remove();
    });

    namenBox.appendChild(tag);
}

/* ===========================
   Plan als Bild speichern
=========================== */

document.getElementById("save-plan-btn").addEventListener("click", () => {
    const plan = document.getElementById("wochenplan");

    html2canvas(plan, {
        scale: 2,
        scrollX: 0,
        scrollY: -window.scrollY,
        windowWidth: plan.scrollWidth,
        windowHeight: plan.scrollHeight
    }).then(canvas => {
        const link = document.createElement("a");
        link.download = "Schichtplan.png";
        link.href = canvas.toDataURL("image/png");
        link.click();
    });
});

/* ===========================
   Start
=========================== */

renderMitarbeiter();
renderAbwesenheiten();
createWeekTables();
