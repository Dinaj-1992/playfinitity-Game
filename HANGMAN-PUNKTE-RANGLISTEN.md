# PLAYFINITY Hangman – Punkte und Ranglisten

Die vorbereiteten Regeln liegen in `tiktok-follower-gate.js`.

## Festgelegte Spielregeln

- Richtiger Buchstabe: **+1 Punkt** pro Spieler und Buchstabe innerhalb einer Runde.
- Mehrfaches Vorkommen desselben Buchstabens im Lösungswort gibt nicht mehrfach Punkte.
- Ganzes Wort zuerst richtig lösen: **+10 Bonuspunkte**.
- Der Wort-Bonus wird pro Runde nur einmal vergeben und geht an den ersten richtigen Löser.
- Es gibt zwei Ranglisten: **rollierende letzte 24 Stunden** und **aktuelle Kalenderwoche**.
- Keine ewige Gesamt-Rangliste.

## Ranglisten-Zeiträume

- 24-Stunden-Rangliste: Score-Ereignisse der jeweils letzten 24 Stunden.
- Wochenrangliste: Montag 00:00 UTC bis zum aktuellen Zeitpunkt.
- Die Zeitzone ist derzeit UTC und kann beim Einbau auf Europe/Berlin umgestellt werden.

## Einbauhinweise

Die Funktionen `awardCorrectLetter` und `awardSolvedWord` müssen ausschließlich serverseitig aufgerufen werden, nachdem der Server den Chat-Eingang validiert hat. Für jeden vergebenen Punkt muss der Server ein dauerhaftes Score-Ereignis mit `userId`, `points` und `timestamp` speichern. `getLeaderboards(scoreEvents)` berechnet daraus beide Ranglisten.

`roundState` muss pro Hangman-Runde serverseitig geführt und beim Start einer neuen Runde neu initialisiert werden. Der Browser darf weder Punkte noch TikTok-Followerstatus selbst festlegen.

## Noch nicht live verbunden

Das Repository enthält weiterhin keine laufende Node.js-Serveranbindung an TikTok LIVE und keine persistente Score-Datenbank. Diese Änderung stellt die Scoring- und Ranglistenlogik bereit; sie aktiviert die Funktion noch nicht im laufenden Spiel. Die TikTok-LIVE-Anbindung muss die Chat-Nachrichten an den Server liefern, bevor die Punktevergabe produktiv genutzt werden kann.
