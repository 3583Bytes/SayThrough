import type { StringKey } from './en'

// German UI strings. Typed as a complete map of `StringKey`, so adding a key to
// `en.ts` without translating it here fails the build.
//
// Terminology: German practice says **UK** — Unterstützte Kommunikation — not
// "AAC", the same way Spain says SAAC rather than CAA. A German teacher or
// Logopäde searching for this will type "Unterstützte Kommunikation", and the
// app should use the words on the rest of their shelf. Symbols are
// **Symbole**, which is what German UK materials call them.
//
// Register: informal `du`, matching the other tables — the reader is a parent,
// teacher or Logopäde setting up a device for someone they know.
//
// Nouns are capitalised throughout, including inside sentences, because that
// is not a style choice in German.

export const DE: Record<StringKey, string> = {
  // ---- app-wide ----------------------------------------------------------
  'app.name': 'SayThrough',
  'common.back': '← Zurück',
  'common.done': 'Fertig',
  'common.cancel': 'Abbrechen',
  'common.remove': 'Entfernen',
  'common.add': '+ Hinzufügen',
  'common.none': 'keine',

  // ---- onboarding (§5.2) -------------------------------------------------
  'onboarding.subtitle': 'Tippe Symbole und Wörter an — SayThrough spricht sie laut aus.',
  'onboarding.tagline':
    'Eine kostenlose, offene App für Unterstützte Kommunikation (UK) für Menschen, die nicht oder wenig sprechen. Kein Konto, kein Abo — sie funktioniert offline und deine Wörter bleiben auf diesem Gerät.',
  'onboarding.setUp': 'Lass uns eine Stimme einrichten',
  'onboarding.setUpLabel': 'SayThrough einrichten',
  'onboarding.tryIt': 'Erst ausprobieren — nichts wird gespeichert',
  'onboarding.tryItLabel': 'SayThrough ausprobieren',
  'onboarding.backToWelcome': 'Zurück zum Start',
  'onboarding.whoFor': 'Für wen ist diese Stimme?',
  'onboarding.namePlaceholder': 'Name (z. B. Maya)',
  'onboarding.nameLabel': 'Name der Person',
  'onboarding.language': 'Sprache',
  'onboarding.languageHint':
    'Legt den Wortschatz der Tafel, die Stimme und die Sprache der App fest. Lässt sich später in den Einstellungen ändern.',
  'onboarding.startingVocabulary': 'Start-Wortschatz',
  'onboarding.startWith': 'Mit {name} starten',
  'onboarding.pinHeading': 'PIN für Begleitpersonen (empfohlen)',
  'onboarding.pinPlaceholder': 'PIN (4–8 Ziffern, optional)',
  'onboarding.pinLabel': 'PIN für Begleitpersonen',
  'onboarding.pinConfirmPlaceholder': 'PIN bestätigen',
  'onboarding.pinConfirmLabel': 'PIN für Begleitpersonen bestätigen',
  'onboarding.finish': 'Einrichtung abschließen',
  'onboarding.errorName': 'Bitte gib einen Namen ein — er lässt sich später ändern.',
  'onboarding.errorPinDigits': 'Die PIN muss 4–8 Ziffern haben (oder lass sie leer).',
  'onboarding.errorPinMatch': 'Die PINs stimmen nicht überein.',
  'onboarding.audience':
    'Für Menschen, die UK nutzen, und für die Familien, Lehrkräfte und Logopädinnen und Logopäden, die sie begleiten.',
  'onboarding.vocabHint':
    'Der Kernwortschatz ist für die meisten Menschen die richtige Wahl — er ist um die Wörter herum gebaut, die den größten Teil der Alltagssprache ausmachen.',
  'onboarding.pinHint':
    'Schützt den Bearbeiten-Modus und die Einstellungen. Ohne PIN öffnet langes Drücken auf einen Knopf die Bearbeitung. Du kannst sie später in den Einstellungen setzen.',
  'onboarding.settingUp': 'Wird eingerichtet …',
  'onboarding.startTalking': 'Losreden',

  // ---- message bar (§6) --------------------------------------------------
  'message.placeholder': 'Tippe Knöpfe an, um eine Nachricht zu bauen …',
  'message.speak': 'Sprechen',
  'message.speakLabel': 'Nachricht sprechen',
  'message.deleteLast': 'Letztes Wort löschen',
  'message.actions': 'Aktionen für die Nachricht',
  'message.copy': 'Nachricht kopieren',
  'message.share': 'Nachricht teilen',
  'message.clear': 'Nachricht leeren',
  'message.recent': 'Letzte Nachrichten',
  'message.attention': 'Aufmerksamkeit holen',
  'message.emergency': 'Notfallsatz sprechen',
  'message.closeRecent': 'Letzte Nachrichten schließen',
  'message.favorites': 'Favoriten',
  'message.recentSection': 'Zuletzt',
  'message.usePhrase': 'Satz verwenden: {text}',

  // ---- top bar / navigation ----------------------------------------------
  'nav.home': 'Start',
  'nav.search': 'Wortschatz durchsuchen',
  'nav.editMode': 'Bearbeiten-Modus',
  'nav.sectionCurrent': 'Bereich {label}, aktuell',
  'nav.section': 'Bereich {label}',

  'toolbar.core': 'Kern',
  'toolbar.quick': 'Schnell',
  'toolbar.keys': 'Tastatur',

  // ---- search ------------------------------------------------------------
  'search.placeholder': 'Wort finden …',
  'search.close': 'Suche schließen',
  'search.addResult': '{word} hinzufügen, von {page}',
  'search.speakResult': '{word} sprechen',

  // ---- prediction / keyboard ---------------------------------------------
  'prediction.bar': 'Wortvorschläge',
  'prediction.insert': '{word} einfügen',
  'keyboard.space': 'Leer',
  'keyboard.speak': '▶ Sprechen',
  'keyboard.done': 'Fertig',

  // ---- word forms --------------------------------------------------------
  'forms.title': 'Formen von „{word}“',
  'forms.insert': '{word} einfügen',

  // ---- edit mode ---------------------------------------------------------
  'edit.doneEditing': 'Bearbeiten beenden',
  'edit.undo': 'Rückgängig',
  'edit.redo': 'Wiederherstellen',
  'edit.pageOptions': 'Seitenoptionen',
  'edit.page': 'Seite …',
  'edit.openSettings': 'Einstellungen öffnen',
  'edit.settings': 'Einstellungen',
  'edit.label': 'Beschriftung',
  'edit.labelPlaceholder': 'Was soll dieser Knopf sagen?',
  'edit.labelAccessibility': 'Beschriftung des Knopfes',
  'edit.symbol': 'Symbol',
  'edit.changeSymbol': 'Ändern …',
  'edit.changeSymbolLabel': 'Symbol ändern',
  'edit.photo': 'Foto …',
  'edit.photoLabel': 'Ein Foto als Symbol verwenden',
  'edit.removeSymbol': 'Symbol entfernen',
  'edit.opens': 'Dieser Knopf öffnet',
  'edit.linkToPage': 'Knopf mit einer Seite verbinden',
  'edit.goToPage': 'Zur Seite gehen',
  'edit.goToLinkedPage': 'Zur verbundenen Seite gehen',
  'edit.color': 'Farbe',
  'edit.colorSwatch': 'Farbe {color}',
  'edit.deleteButton': 'Knopf löschen',
  'edit.deleteButtonLabel': 'Knopf löschen',
  'edit.saveButton': 'Knopf speichern',
  'edit.opensTitle': 'Dieser Knopf öffnet …',
  'edit.linkToNamedPage': 'Mit Seite {name} verbinden',
  'edit.orNewPage': '… oder eine neue Seite',
  'edit.newPagePlaceholder': 'Name der neuen Seite (z. B. Minecraft)',
  'edit.newPageLabel': 'Name der neuen Seite',
  'edit.includeCore': 'Kernwörter auf der neuen Seite zeigen',
  'edit.createAndLink': 'Seite anlegen und verbinden',
  'edit.removeLink': 'Verbindung entfernen',
  'edit.cancelLink': 'Seitenverbindung abbrechen',
  'edit.searchSymbols': 'Symbole suchen …',
  'edit.searchSymbolsLabel': 'Symbole suchen',
  'edit.closePicker': 'Symbolauswahl schließen',
  'edit.symbolResult': 'Symbol {label}',

  // ---- PIN ---------------------------------------------------------------
  'pin.title': 'PIN der Begleitperson eingeben',
  'pin.input': 'PIN-Eingabe',
  'pin.cancel': 'PIN-Eingabe abbrechen',
  'pin.submit': 'PIN bestätigen',
  'pin.newPlaceholder': 'Neue PIN',
  'pin.confirmPlaceholder': 'PIN bestätigen',
  'pin.save': 'PIN speichern',
  'pin.set': 'PIN festlegen',
  'pin.change': 'PIN ändern',
  'pin.remove': 'PIN entfernen',

  // ---- settings ----------------------------------------------------------
  'settings.title': 'Einstellungen',
  'settings.backToCommunication': 'Zurück zur Kommunikation',

  'settings.profile': 'Profil',
  'settings.name': 'Name',
  'settings.nameLabel': 'Name des Profils',
  'settings.switchProfile': 'Profil wechseln',
  'settings.newProfilePlaceholder': 'Name des neuen Profils',
  'settings.newProfileLabel': 'Name des neuen Profils',
  'settings.addProfile': 'Profil hinzufügen',

  'settings.language': 'Sprache',
  'settings.languageHint':
    'Ändert den Wortschatz der Tafel, die Standardstimme und die Sprache der App. Deine Seiten, Wortlisten und der Verlauf bleiben erhalten.',
  'settings.languageSwitch': 'Zu {name} wechseln',

  'settings.speech': 'Sprache & Stimme',
  'settings.voice': 'Stimme',
  'settings.selectVoice': 'Stimme {name} auswählen',
  'settings.previewVoice': 'Stimme {name} anhören',
  'settings.noVoices': 'Dieses Gerät hat noch keine Stimmen gemeldet.',
  'settings.speed': 'Tempo',
  'settings.pitch': 'Tonhöhe',
  'settings.speakOnSelect': 'Jedes Wort beim Antippen sprechen',
  'settings.returnHome': 'Nach dem Sprechen zur Startseite',
  'settings.clearAfter': 'Nachricht nach dem Sprechen leeren',

  'settings.quickButtons': 'Schnellknöpfe',
  'settings.attentionBell': 'Aufmerksamkeitsglocke',
  'settings.emergencyPhrase': 'Notfallsatz',
  'settings.emergencyPlaceholder': 'Ich brauche Hilfe.',

  'settings.accessMethod': 'Ansteuerung',
  'settings.howSelects': 'Wie diese Person auswählt',
  'settings.touch': 'Tippen',
  'settings.dwell': 'Verweilen (Hover)',
  'settings.scanning': 'Scanning mit Taster',
  'settings.holdToActivate': 'Halten zum Auslösen',
  'settings.ignoreRepeat': 'Wiederholtes Tippen ignorieren für',
  'settings.ignoreSecondTouch': 'Zweite Berührung ignorieren',
  'settings.hoverTime': 'Verweildauer bis zur Auswahl',
  'settings.dwellHint':
    'Halte den Zeiger über einem Knopf still (Maus, Kopfmaus oder Augensteuerung, die den Cursor bewegt); die Auswahl erfolgt, wenn der Balken voll ist. Wegbewegen bricht ab.',
  'settings.scanStyle': 'Art des Scannings',
  'settings.scanAuto': 'Automatisch (1 Taster)',
  'settings.scanStep': 'Schrittweise (2 Taster)',
  'settings.pattern': 'Muster',
  'settings.rowColumn': 'Erst Zeile, dann Spalte',
  'settings.linear': 'Eins nach dem anderen',
  'settings.scanSpeed': 'Scan-Tempo',
  'settings.scanAuditory': 'Jeden Eintrag beim Hervorheben sprechen',
  'settings.scanAuditoryLabel': 'Akustisches Signal beim Scannen',
  'settings.scanHint':
    'Taster = Leertaste (auswählen) und im Schrittmodus Enter (weiter). Die meisten Bluetooth-Taster ahmen diese Tasten nach. Zwei-Taster-Belegung und Block-Scanning kommen als Nächstes.',

  'settings.display': 'Darstellung',
  'settings.appearance': 'Erscheinungsbild',
  'settings.themeLight': 'Hell',
  'settings.themeDark': 'Dunkel',
  'settings.themeSystem': 'System',
  'settings.barPosition': 'Position der Nachrichtenleiste',
  'settings.barTop': 'Oben',
  'settings.barBottom': 'Unten (leichter erreichbar)',
  'settings.buttonGap': 'Abstand zwischen den Knöpfen',
  'settings.gapCompact': 'Kompakt',
  'settings.gapNormal': 'Normal',
  'settings.gapWide': 'Weit',
  'settings.textSize': 'Textgröße der Knöpfe',

  'settings.vocabulary': 'Wortschatz',
  'settings.activePageSet': 'Aktives Seitenset',

  'settings.vocabularyFilter': 'Wortschatz-Filter',
  'settings.filterHint':
    'Begrenzt, welche Wörter während der Therapie aktiv sind. Wörter außerhalb der Liste bleiben sichtbar (damit eine Begleitperson modellieren kann), reagieren aber nicht.',
  'settings.wordLists': 'Wortlisten',
  'settings.selectWords': 'Wörter auswählen (im Raster antippen)',
  'settings.deleteList': 'Liste löschen',
  'settings.newListPlaceholder': 'Name der neuen Liste (z. B. Wörter Woche 1)',
  'settings.newListLabel': 'Name der neuen Wortliste',
  'settings.addList': 'Wortliste hinzufügen',
  'settings.filterOn': 'Filter an (auch in der oberen Leiste: ⊘)',
  'settings.filterEnabled': 'Wortschatz-Filter aktiv',

  'settings.security': 'Sicherheit',
  'settings.pinHint':
    'Die PIN der Begleitperson schützt den Bearbeiten-Modus und die Einstellungen. Sie hält Kinder fern, sie ist keine Sicherheitsmaßnahme.',

  'settings.enhancedVoice': 'Natürliche Stimme',
  'settings.enhancedVoiceHint':
    'Eine natürlich klingende Stimme, die vollständig AUF DIESEM GERÄT läuft — nichts wird an einen Server gesendet. Einmaliger Download von ca. 60 MB, danach offline nutzbar. Die Standardstimme funktioniert in jedem Fall weiter.',
  'settings.enhancedVoiceToggle': 'Natürliche Stimme',
  'settings.enhancedVoiceDownloading': 'Wird geladen …',

  'settings.vocabularyLevel': 'Wortschatz-Stufe',
  'settings.levelHint':
    'Zeigt weniger Wörter, solange jemand die Tafel noch lernt. Die Wörter bleiben auf jeder Stufe am GLEICHEN Platz — eine höhere Stufe zeigt nur mehr, sodass sich nichts verschiebt, was jemand schon gelernt hat.',
  'settings.levelBasic': 'Basis',
  'settings.levelIntermediate': 'Mittel',
  'settings.levelFull': 'Vollständig',

  'settings.wordPrediction': 'Wortvorhersage',
  'settings.predictionHint':
    'Schlägt beim Tippen Wörter über der Tastatur vor. Sie lernt aus gesprochenen Nachrichten — auch aus im Raster angetippten Wörtern — sodass die Wörter, die du wirklich nutzt, zuerst kommen. Gelernte Wörter bleiben AUF DIESEM GERÄT.',
  'settings.predictionToggle': 'Wörter beim Tippen vorschlagen',
  'settings.predictionLabel': 'Wortvorhersage aktiv',
  'settings.clearLearned': 'Gelernte Wörter löschen',
  'settings.learnedCleared': 'Gelernte Wörter gelöscht',

  'settings.dataTracking': 'Datenerfassung',
  'settings.trackingHint':
    'Standardmäßig aus. Wenn eine Begleitperson sie einschaltet, werden Knopfdrücke und gesprochene Nachrichten NUR AUF DIESEM GERÄT aufgezeichnet und nie irgendwohin gesendet. Logopädinnen und Logopäden dokumentieren damit Fortschritte.',
  'settings.trackingToggle': 'Kommunikationsdaten aufzeichnen',
  'settings.trackingLabel': 'Datenerfassung aktiv',
  'settings.viewReport': 'Bericht ansehen',

  'settings.privacy': 'Datenschutz',
  'settings.privacyHint':
    'Solange die App geöffnet ist, meldet sie sich kurz, damit das Projekt sehen kann, ob sie genutzt wird. Diese Meldung enthält einen zufälligen Code, der sich bei jedem Öffnen ändert und nie gespeichert wird — kein Name, keine Nachricht, nichts, was du schreibst.',
  'settings.usageToggle': 'Melden, dass die App genutzt wird',
  'settings.usageLabel': 'Nutzung melden',

  'settings.backup': 'Sicherung & Wiederherstellung',
  'settings.backupHint':
    'Eine vollständige Sicherung speichert ALLES auf diesem Gerät — Profile, Stimm- und Ansteuerungseinstellungen, deine Seiten, Wortlisten, Verlauf und Daten — in einer Datei. Damit wechselst du auf ein neues Gerät oder stellst wieder her, wenn der Browser-Speicher gelöscht wurde.',
  'settings.saveBackup': 'Vollständige Sicherung speichern',
  'settings.restoreBackup': 'Aus Sicherung wiederherstellen',
  'settings.chooseDifferent': 'Andere Datei wählen',
  'settings.confirmRestore': 'Wiederherstellen bestätigen',
  'settings.obfHint':
    'Open Board Format (.obz) bewegt NUR DEN WORTSCHATZ zwischen Apps — es funktioniert mit CoughDrop, TD Snap und anderen, überträgt aber keine Profile oder Einstellungen. Dafür nimm die vollständige Sicherung oben.',
  'settings.exportObz': 'Aktives Seitenset exportieren (.obz)',
  'settings.importObz': '.obz importieren',
  'settings.restoreBuiltIn': 'Mitgelieferte Seitensets wiederherstellen',
  'settings.restoreArmed': 'Zum Wiederherstellen nochmal tippen',

  'settings.printing': 'Drucken',
  'settings.printHint':
    'Drucke deine Tafel auf Papier — die Sicherung, die ein Gerät nicht sein kann. Sie übersteht einen leeren Akku, geht mit in die Badewanne und ins Schwimmbad und braucht kein Ladekabel. Gedruckt wird DEINE Tafel: deine Knöpfe, Symbole, Fotos und Farben, an denselben Stellen, sodass die Anordnung, die du schon kennst, erhalten bleibt.',
  'settings.printBoard': 'Diese Tafel drucken',
  'settings.printAll': 'Alle Seiten drucken ({count} Blätter)',

  'settings.install': 'Installieren',
  'settings.installed': 'Installiert ✓ — SayThrough öffnet im Vollbild und funktioniert offline.',
  'settings.installHint':
    'Installiere SayThrough auf dem Startbildschirm: Sie öffnet wie eine normale App, funktioniert offline, und der Browser schützt ihren Speicher besser.',
  'settings.installButton': 'App installieren',
  'settings.installIosHint':
    'Zum Installieren auf iPad/iPhone: in Safari auf Teilen (□↑) tippen → „Zum Home-Bildschirm“. SayThrough öffnet dann im Vollbild und funktioniert offline.',

  'settings.about': 'Über',

  // ---- setting presets ---------------------------------------------------
  'preset.slow': 'Langsam',
  'preset.normal': 'Normal',
  'preset.fast': 'Schnell',
  'preset.low': 'Tief',
  'preset.high': 'Hoch',
  'preset.off': 'Aus',
  'preset.d300': '0,3 s',
  'preset.d500': '0,5 s',
  'preset.d600': '0,6 s',
  'preset.d1000': '1 s',
  'preset.d1500': '1,5 s',
  'preset.d2500': '2,5 s',
  'preset.scanSlow': 'Langsam (2,5 s)',
  'preset.scanMedium': 'Mittel (1,5 s)',
  'preset.scanFast': 'Schnell (1 s)',
  'settings.standardVoice': 'Standardstimme',
  'settings.useStandardVoice': 'Standardstimme verwenden',

  // ---- status messages ---------------------------------------------------
  'status.exporting': 'Wird exportiert …',
  'status.exported': 'Exportiert.',
  'status.printing': 'Blätter werden vorbereitet …',
  'status.printed': 'An den Drucker gesendet.',
  'status.printEmpty': 'Auf dieser Tafel gibt es noch nichts zu drucken.',
  'status.restoring': 'Wird wiederhergestellt …',
  'status.restored': 'Wiederhergestellt.',
  'status.importing': 'Wird importiert …',
  'status.backupSaved':
    'Vollständige Sicherung gespeichert. Bewahre sie sicher auf — sie enthält die Profile und den Verlauf dieses Geräts.',
  'status.backupDescribed':
    'Sicherung vom {when} — {count} Profil(e): {names}. Das Wiederherstellen ERSETZT alles, was gerade auf diesem Gerät ist. Tippe auf „Wiederherstellen bestätigen“, um fortzufahren.',
  'status.restoreFailed': 'Wiederherstellen fehlgeschlagen: {error}',
  'status.imported': '„{name}“ importiert — wähle es unter Wortschatz aus.',
  'status.importFailed': 'Import fehlgeschlagen: {error}',
  'status.builtInRestored': 'Mitgelieferte Seitensets wiederhergestellt.',
  'status.voiceDownloading': 'Stimme wird geladen … {percent} %',
  'status.voiceReady': 'Natürliche Stimme bereit.',
  'settings.aboutBody':
    'SayThrough — kostenlose, quelloffene UK. Der Anwendungscode steht unter der MIT-Lizenz.',
  'settings.aboutSymbols':
    'Piktogramme © Regierung von Aragonien (Spanien), erstellt von Sergio Palao für ARASAAC (https://arasaac.org), veröffentlicht unter Creative Commons BY-NC-SA 4.0.',
  'settings.aboutMulberry': 'Mulberry Symbols © Steve Lee, CC BY-SA 4.0.',

  'settings.previewText': 'Hallo! So klinge ich.',
  'status.voiceFailed': '{reason} Es wird weiter die Standardstimme genutzt.',
  'status.voiceFailedDefault': 'Die natürliche Stimme konnte nicht geladen werden.',
  'status.rebuildArmed':
    'Damit werden die mitgelieferten Tafeln und Schnellsätze neu aufgebaut — deine eigenen Seiten und Profile bleiben erhalten. Zum Bestätigen nochmal tippen.',

  // ---- communication screen ----------------------------------------------
  'guest.banner': 'Demo-Modus — nichts wird gespeichert.',
  'guest.setUp': 'SayThrough einrichten',
  'nudge.text': 'Dein Wortschatz hat ungesicherte Änderungen — jetzt sichern?',
  'nudge.action': 'Jetzt sichern',
  'nudge.dismiss': 'Erinnerung an die Sicherung schließen',
  'page.title': 'Seite: {name}',
  'page.nameLabel': 'Name der Seite',
  'page.rename': 'Umbenennen',
  'page.renameLabel': 'Seite umbenennen',
  'page.deleteLabel': 'Seite löschen',
  'page.delete': 'Seite löschen (Knöpfe, die sie öffnen, werden zu einfachen Wörtern)',
  'page.homeUndeletable': 'Die Startseite kann nicht gelöscht werden.',

  'settings.grammaticalGender': 'Grammatisches Geschlecht',
  'settings.genderHint':
    'Polnisch markiert im Präteritum das Geschlecht der sprechenden Person — „byłem“ für einen Mann, „byłam“ für eine Frau. Wenn du es einstellst, wird die passende Form zuerst angeboten, damit die Tafel ihre Nutzerin oder ihren Nutzer nicht falsch anspricht. Ohne Angabe werden beide Formen angeboten, jeweils beschriftet.',
  'settings.genderMasculine': 'Männlich',
  'settings.genderFeminine': 'Weiblich',
  'settings.genderUnset': 'Jedes Mal fragen',

  'edit.editingPage': 'Bearbeiten: {name}',
  'edit.tapForList': 'Wörter für die Liste antippen: {name}',
  'edit.addButtonAt': 'Knopf in Zeile {row}, Spalte {column} hinzufügen',
  'message.star': 'Zu Favoriten: {text}',
  'message.unstar': 'Aus Favoriten entfernen: {text}',

  // ---- tracking report ---------------------------------------------------
  'report.title': 'Kommunikationsdaten',
  'report.backToSettings': 'Zurück zu den Einstellungen',
  'report.pressesToday': 'Knöpfe heute',
  'report.messagesToday': 'Nachrichten heute',
  'report.presses7d': 'Knöpfe (7 Tage)',
  'report.messages7d': 'Nachrichten (7 Tage)',
  'report.mostUsed': 'Meistgenutzte Wörter (7 Tage)',
}
