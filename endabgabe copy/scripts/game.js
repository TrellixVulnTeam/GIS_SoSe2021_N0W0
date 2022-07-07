"use strict";
let url;
let spielFertig = true;
let karten = [];
let ersteKarte = {};
let ersteKarteIndex;
let zweiteKarte = {};
let spielGewonnen = false;
let versucheCounter = 0;
let timer = 0;
let timerInterval;
let spielPause = true;
let versuche = document.getElementById("versuche");
let timeMinutenAnzeige = document.getElementById("time-minutes");
let timeSekundenAnzeige = document.getElementById("time-seconds");
let einstelltungenButton = document.getElementById("admin");
einstelltungenButton.addEventListener("click", openEinstellungen);
let showHighscoreButton = document.getElementById("iconShowHighscore");
showHighscoreButton.addEventListener("click", openHighscore);
let startButton = document.getElementById("start");
startButton.addEventListener("click", startGame);
let stoppButtom = document.getElementById("stopp");
stoppButtom.addEventListener("click", pauseGame);
let newGame = document.getElementById("newGame");
newGame.addEventListener("click", neueKarten);
//Verlinkungen auf andere Seiten
function openEinstellungen() {
    window.open("admin.html", "_self");
    console.log("open Einstellungen");
}
function openHighscore() {
    window.open("highscore.html", "_self");
    console.log("open Highscore");
}
neueKarten();
//Alles auf Null setzten, Karten "mischen" und Bilder zuweisen
async function neueKarten() {
    resetTime();
    spielPause = true;
    karten = [];
    versucheCounter = 0;
    ersteKarte = {};
    zweiteKarte = {};
    ersteKarteIndex = null;
    spielFertig = false;
    url = "https://gis2021vs.herokuapp.com/";
    //url = "http://localhost:8100/";
    console.log("Daten empfangen");
    url += "bildReceive";
    let response = await fetch(url);
    let showAnswer = await response.text();
    let tempDaten = JSON.parse(showAnswer);
    let tempArray = Array.from(Array(tempDaten.length).keys());
    tempArray = shuffle(tempArray);
    tempArray = tempArray.slice(0, 8);
    let daten = [];
    tempArray.forEach(entry => {
        daten.push(tempDaten[entry]);
    });
    //Daten verdoppeln
    daten = daten.concat(daten);
    let kacheln = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
    kacheln = shuffle(kacheln);
    kacheln.forEach((value, index) => {
        karten.push({ kachelId: value, vergleichUrl: daten[index].url, sichtbarkeit: false, gesperrt: false });
    });
    initSpielfeld();
    updateSpielfeld();
}
// Quelle: https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
// Randomize array in-place using Durstenfeld shuffle algorithm 
function shuffle(a) {
    let j, x, i;
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
    return a;
}
// Funktionen im Hintergrund
function initSpielfeld() {
    let spielBilder = document.getElementsByClassName("spiel");
    karten.forEach((karte, index) => {
        let element = spielBilder[karte.kachelId];
        let elementClone = element.cloneNode(true);
        elementClone.addEventListener("click", spieleLogik.bind(null, index));
        element.parentNode.replaceChild(elementClone, element);
    });
}
// Spielfeld updaten
function updateSpielfeld() {
    let spielBilder = document.getElementsByClassName("spiel");
    karten.forEach(karte => {
        if (karte.sichtbarkeit) {
            spielBilder[karte.kachelId].setAttribute("src", karte.vergleichUrl);
        }
        else {
            spielBilder[karte.kachelId].setAttribute("src", "dateien/icon_rueckseite_03.png");
        }
    });
    versuche.innerHTML = versucheCounter.toString();
}
async function spieleLogik(index) {
    if (!spielPause) {
        if (!karten[index].gesperrt) {
            if (Object.keys(ersteKarte).length == 0) {
                // erste Karte umdrehen und "Spielfähig machen"
                flip(index);
                karten[index].gesperrt = true;
                ersteKarte = karten[index];
                ersteKarteIndex = index;
            }
            else if (Object.keys(ersteKarte).length > 0 && Object.keys(zweiteKarte).length == 0) {
                // nach überprüfen, ob die ausgewählte zweite Karte auch die zweite Karte ist und "Spielfähig machen"
                flip(index);
                karten[index].gesperrt = true;
                zweiteKarte = karten[index];
                versucheCounter = versucheCounter + 1;
                updateSpielfeld();
                await delay(1000);
                let gleicheKarten = vergleicheKarten(index);
                if (gleicheKarten) {
                    ersteKarte = {};
                    zweiteKarte = {};
                    ersteKarteIndex = null;
                }
                else {
                    karten[ersteKarteIndex].gesperrt = false;
                    karten[index].gesperrt = false;
                    flip(ersteKarteIndex);
                    flip(index);
                    ersteKarte = {};
                    zweiteKarte = {};
                    ersteKarteIndex = null;
                }
                überprüfeSpielGewonnen();
            }
        }
    }
}
// Karten umdrehen und Spielfeld aktualisieren
function flip(index) {
    if (karten[index].sichtbarkeit) {
        karten[index].sichtbarkeit = false;
    }
    else {
        karten[index].sichtbarkeit = true;
    }
    updateSpielfeld();
}
// URL der beiden offenen Karten vergleichen
function vergleicheKarten(zweiteKarteIndex) {
    return karten[ersteKarteIndex].vergleichUrl == karten[zweiteKarteIndex].vergleichUrl;
}
// Bestimmen, ob das Spiel zuende ist (sichergehen, dass alle Karten sicherbar sind)
function überprüfeSpielGewonnen() {
    spielGewonnen = true;
    karten.forEach(karte => {
        if (!karte.sichtbarkeit) {
            spielGewonnen = false;
        }
    });
    if (spielGewonnen) {
        postHighscore();
        pauseGame();
        spielFertig = true;
    }
}
// Zeit und Versuche in einem LokalStorage speichern und auf die Login-Seite wechseln
function postHighscore() {
    spielFertig = true;
    localStorage.setItem("Zeit", timer.toString());
    localStorage.setItem("Versuche", versucheCounter.toString());
    window.open("login.html", "_self");
    console.log("open Login");
    console.log(timer);
    console.log(versucheCounter);
}
// https://stackoverflow.com/questions/38956121/how-to-add-delay-to-promise-inside-then
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
function startGame() {
    if (!spielFertig) {
        spielPause = false;
    }
}
function pauseGame() {
    if (!spielFertig) {
        spielPause = true;
    }
}
time();
// Die während dem Spiel laufende Zeit erstellen
async function time() {
    timerInterval = window.setInterval(() => {
        if (!spielPause) {
            timer++;
            timeMinutenAnzeige.innerHTML = Math.floor(timer / 60).toString();
            timeSekundenAnzeige.innerHTML = timer % 60 < 10 ? "0" + (timer % 60) : (timer % 60).toString();
        }
    }, 1000);
}
// Die Zeit wieder auf Null setzten (beim neuen Spiel)
function resetTime() {
    timer = 0;
    timeMinutenAnzeige.innerHTML = Math.floor(timer / 60).toString();
    timeSekundenAnzeige.innerHTML = timer % 60 < 10 ? "0" + (timer % 60) : (timer % 60).toString();
}
//# sourceMappingURL=game.js.map