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
        const btn = document.createElement("button");
        btn.className = "mitarbeiter-btn";
        btn.textContent = name;
        btn.style.background = getFarbe(name);
        btn.draggable = true;

        btn.addEventListener("dragstart", (e) => {
            e.dataTransfer.setData("text/plain", name);
        });

        btn.addEventListener("contextmenu", (e) => {
            e.preventDefault();
            if (confirm(`${name} löschen?`)) {
                mitarbeiter.splice(index, 1);
                saveMitarbeiter();
                renderMitarbeiter();
                updateAbwesenheitDropdown();
            }
        });

        grid.appendChild(btn);
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

    if (!name || !von || !bis) {
        alert("Bitte Mitarbeiter und Datum auswählen.");
        return;
    }

    abwesenheiten.push({ name, von, bis });
    saveAbwesenheiten();
    renderAbwesenheiten();
});

function renderAbwesenheiten() {
    const liste = document.getElementById("abwesenheit-liste");
    liste.innerHTML = "";

    abwesenheiten.forEach((a, index) => {
        const li = document.createElement("li");
        li.textContent = `${a.name}: ${a.von} bis ${a.bis}`;

        li.addEventListener("click", () => {
            if (confirm("Diese Abwesenheit löschen?")) {
                abwesenheiten.splice(index, 1);
                saveAbwesenheiten();
                renderAbwesenheiten();
            }
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
            <label>Datum von: <input type="date"></label>
            <label>bis: <input type="date"></label>

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

    enableDragAndDrop();
    enablePlusButtons();
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

                        <div class="mitarbeiter-spaet schicht-slot">
                            <div class="schicht-label">Spätschicht</div>
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

    html2canvas(plan, { scale: 2 }).then(canvas => {
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

