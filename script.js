let abwesenheiten = [];

// Abwesenheit hinzufügen
function addAbwesenheit() {
    const name = document.getElementById("abwesenheitName").value;
    const datum = document.getElementById("abwesenheitDatum").value;
    const grund = document.getElementById("abwesenheitGrund").value;

    if (!name || !datum || !grund) {
        alert("Bitte Name, Datum und Grund eingeben.");
        return;
    }

    abwesenheiten.push({ name, datum, grund });
    updateAbwesenheiten();
}

// Abwesenheit löschen
function removeAbwesenheit(index) {
    abwesenheiten.splice(index, 1);
    updateAbwesenheiten();
}

// Abwesenheiten anzeigen
function updateAbwesenheiten() {
    const list = document.getElementById("abwesenheitenListe");
    list.innerHTML = "";

    abwesenheiten.forEach((eintrag, index) => {
        const item = document.createElement("div");
        item.className = "abwesenheit-item";
        item.innerHTML = `
            ${eintrag.name} – ${eintrag.datum} – ${eintrag.grund}
            <button class="remove-btn" onclick="removeAbwesenheit(${index})">X</button>
        `;
        list.appendChild(item);
    });
}

// Dummy-Funktion für Frühschicht (kann später erweitert werden)
function addShift(tag, art) {
    alert("Frühschicht hinzugefügt für Tag " + tag);
}
