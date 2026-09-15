import type { StringKey } from './en'

// Italian UI strings. Typed as a complete map of `StringKey`, so adding a key
// to `en.ts` without translating it here fails the build.
//
// Terminology: **CAA** (Comunicazione Aumentativa e Alternativa) is the term
// Italian practice uses, and **pittogrammi** rather than `simboli` — ARASAAC
// is widely adopted in Italian special education and that is the word its
// materials use, so the app should sound like the rest of a teacher's shelf.
//
// Register: informal `tu`, matching the other tables — the reader is a parent,
// teacher or logopedista setting up a device for someone they know, not a
// customer being addressed by a company.

export const IT: Record<StringKey, string> = {
  // ---- app-wide ----------------------------------------------------------
  'app.name': 'SayThrough',
  'common.back': '← Indietro',
  'common.done': 'Fatto',
  'common.cancel': 'Annulla',
  'common.remove': 'Rimuovi',
  'common.add': '+ Aggiungi',
  'common.none': 'nessuno',

  // ---- onboarding (§5.2) -------------------------------------------------
  'onboarding.subtitle': 'Tocca pittogrammi e parole — SayThrough le dice ad alta voce.',
  'onboarding.tagline':
    'Un’app di comunicazione (CAA) gratuita e aperta, per chi non parla o parla poco. Nessun account, nessun abbonamento — funziona offline e le tue parole restano su questo dispositivo.',
  'onboarding.setUp': 'Creiamo una voce',
  'onboarding.setUpLabel': 'Configura SayThrough',
  'onboarding.tryIt': 'Prova prima — non viene salvato nulla',
  'onboarding.tryItLabel': 'Prova SayThrough',
  'onboarding.backToWelcome': 'Torna alla schermata iniziale',
  'onboarding.whoFor': 'Per chi è questa voce?',
  'onboarding.namePlaceholder': 'Nome (es. Maya)',
  'onboarding.nameLabel': 'Nome utente',
  'onboarding.language': 'Lingua',
  'onboarding.languageHint':
    'Imposta il vocabolario della tavola, la voce e le parole dell’app. Si può cambiare più avanti nelle Impostazioni.',
  'onboarding.startingVocabulary': 'Vocabolario iniziale',
  'onboarding.startWith': 'Inizia con {name}',
  'onboarding.pinHeading': 'PIN per chi assiste (consigliato)',
  'onboarding.pinPlaceholder': 'PIN (4–8 cifre, facoltativo)',
  'onboarding.pinLabel': 'PIN per chi assiste',
  'onboarding.pinConfirmPlaceholder': 'Conferma il PIN',
  'onboarding.pinConfirmLabel': 'Conferma il PIN per chi assiste',
  'onboarding.finish': 'Termina la configurazione',
  'onboarding.errorName': 'Inserisci un nome — si può cambiare più avanti.',
  'onboarding.errorPinDigits': 'Il PIN deve avere 4–8 cifre (oppure lascialo vuoto).',
  'onboarding.errorPinMatch': 'I PIN non coincidono.',
  'onboarding.audience':
    'Pensata per chi usa la CAA e per le famiglie, gli insegnanti e i logopedisti che li sostengono.',
  'onboarding.vocabHint':
    'Il Vocabolario nucleare è consigliato per la maggior parte delle persone: è costruito sulle parole che coprono quasi tutto il parlato quotidiano.',
  'onboarding.pinHint':
    'Protegge la modifica e le impostazioni. Senza PIN, una pressione prolungata su un pulsante apre la modifica. Puoi impostarlo più avanti nelle Impostazioni.',
  'onboarding.settingUp': 'Configurazione in corso…',
  'onboarding.startTalking': 'Inizia a parlare',

  // ---- message bar (§6) --------------------------------------------------
  'message.placeholder': 'Tocca i pulsanti per comporre un messaggio…',
  'message.speak': 'Parla',
  'message.speakLabel': 'Pronuncia il messaggio',
  'message.deleteLast': 'Cancella l’ultima parola',
  'message.actions': 'Azioni sul messaggio',
  'message.copy': 'Copia il messaggio',
  'message.share': 'Condividi il messaggio',
  'message.clear': 'Svuota il messaggio',
  'message.recent': 'Messaggi recenti',
  'message.attention': 'Richiama l’attenzione',
  'message.emergency': 'Pronuncia la frase di emergenza',
  'message.closeRecent': 'Chiudi i messaggi recenti',
  'message.favorites': 'Preferiti',
  'message.recentSection': 'Recenti',
  'message.usePhrase': 'Usa la frase: {text}',

  // ---- top bar / navigation ----------------------------------------------
  'nav.home': 'Home',
  'nav.search': 'Cerca nel vocabolario',
  'nav.editMode': 'Modalità modifica',
  'nav.sectionCurrent': 'Sezione {label}, attuale',
  'nav.section': 'Sezione {label}',

  'toolbar.core': 'Nucleo',
  'toolbar.quick': 'Rapide',
  'toolbar.keys': 'Tastiera',

  // ---- search ------------------------------------------------------------
  'search.placeholder': 'Trova una parola…',
  'search.close': 'Chiudi la ricerca',
  'search.addResult': 'Aggiungi {word}, da {page}',
  'search.speakResult': 'Pronuncia {word}',

  // ---- prediction / keyboard ---------------------------------------------
  'prediction.bar': 'Parole suggerite',
  'prediction.insert': 'Inserisci {word}',
  'keyboard.space': 'spazio',
  'keyboard.speak': '▶ Parla',
  'keyboard.done': 'Fatto',

  // ---- word forms --------------------------------------------------------
  'forms.title': 'Forme di «{word}»',
  'forms.insert': 'Inserisci {word}',

  // ---- edit mode ---------------------------------------------------------
  'edit.doneEditing': 'Fine modifica',
  'edit.undo': 'Annulla',
  'edit.redo': 'Ripeti',
  'edit.pageOptions': 'Opzioni della pagina',
  'edit.page': 'Pagina…',
  'edit.openSettings': 'Apri le impostazioni',
  'edit.settings': 'Impostazioni',
  'edit.label': 'Etichetta',
  'edit.labelPlaceholder': 'Che cosa deve dire questo pulsante?',
  'edit.labelAccessibility': 'Etichetta del pulsante',
  'edit.symbol': 'Pittogramma',
  'edit.changeSymbol': 'Cambia…',
  'edit.changeSymbolLabel': 'Cambia il pittogramma',
  'edit.photo': 'Foto…',
  'edit.photoLabel': 'Usa una foto come pittogramma',
  'edit.removeSymbol': 'Rimuovi il pittogramma',
  'edit.opens': 'Questo pulsante apre',
  'edit.linkToPage': 'Collega il pulsante a una pagina',
  'edit.goToPage': 'Vai alla pagina',
  'edit.goToLinkedPage': 'Vai alla pagina collegata',
  'edit.color': 'Colore',
  'edit.colorSwatch': 'Colore {color}',
  'edit.deleteButton': 'Elimina pulsante',
  'edit.deleteButtonLabel': 'Elimina il pulsante',
  'edit.saveButton': 'Salva il pulsante',
  'edit.opensTitle': 'Questo pulsante apre…',
  'edit.linkToNamedPage': 'Collega alla pagina {name}',
  'edit.orNewPage': '…oppure una nuova pagina',
  'edit.newPagePlaceholder': 'Nome della nuova pagina (es. Minecraft)',
  'edit.newPageLabel': 'Nome della nuova pagina',
  'edit.includeCore': 'Includi le parole nucleari nella nuova pagina',
  'edit.createAndLink': 'Crea la pagina e collega',
  'edit.removeLink': 'Rimuovi il collegamento',
  'edit.cancelLink': 'Annulla il collegamento alla pagina',
  'edit.searchSymbols': 'Cerca pittogrammi…',
  'edit.searchSymbolsLabel': 'Cerca pittogrammi',
  'edit.closePicker': 'Chiudi la ricerca dei pittogrammi',
  'edit.symbolResult': 'Pittogramma {label}',

  // ---- PIN ---------------------------------------------------------------
  'pin.title': 'Inserisci il PIN di chi assiste',
  'pin.input': 'Campo del PIN',
  'pin.cancel': 'Annulla l’inserimento del PIN',
  'pin.submit': 'Conferma il PIN',
  'pin.newPlaceholder': 'Nuovo PIN',
  'pin.confirmPlaceholder': 'Conferma il PIN',
  'pin.save': 'Salva il PIN',
  'pin.set': 'Imposta un PIN',
  'pin.change': 'Cambia il PIN',
  'pin.remove': 'Rimuovi il PIN',

  // ---- settings ----------------------------------------------------------
  'settings.title': 'Impostazioni',
  'settings.backToCommunication': 'Torna alla comunicazione',

  'settings.profile': 'Profilo',
  'settings.name': 'Nome',
  'settings.nameLabel': 'Nome del profilo',
  'settings.switchProfile': 'Cambia profilo',
  'settings.newProfilePlaceholder': 'Nome del nuovo profilo',
  'settings.newProfileLabel': 'Nome del nuovo profilo',
  'settings.addProfile': 'Aggiungi profilo',

  'settings.language': 'Lingua',
  'settings.languageHint':
    'Cambia il vocabolario della tavola, la voce predefinita e le parole dell’app. Le tue pagine, le liste di parole e la cronologia restano.',
  'settings.languageSwitch': 'Passa a {name}',

  'settings.speech': 'Voce',
  'settings.voice': 'Voce',
  'settings.selectVoice': 'Scegli la voce {name}',
  'settings.previewVoice': 'Ascolta la voce {name}',
  'settings.noVoices': 'Questo dispositivo non ha ancora segnalato nessuna voce.',
  'settings.speed': 'Velocità',
  'settings.pitch': 'Tono',
  'settings.speakOnSelect': 'Pronuncia ogni parola quando viene toccata',
  'settings.returnHome': 'Torna alla home dopo aver parlato',
  'settings.clearAfter': 'Svuota il messaggio dopo aver parlato',

  'settings.quickButtons': 'Pulsanti rapidi',
  'settings.attentionBell': 'Campanello di richiamo',
  'settings.emergencyPhrase': 'Frase di emergenza',
  'settings.emergencyPlaceholder': 'Ho bisogno di aiuto.',

  'settings.accessMethod': 'Metodo di accesso',
  'settings.howSelects': 'Come seleziona questa persona',
  'settings.touch': 'Tocco',
  'settings.dwell': 'Permanenza (hover)',
  'settings.scanning': 'Scansione con sensore',
  'settings.holdToActivate': 'Tieni premuto per attivare',
  'settings.ignoreRepeat': 'Ignora i tocchi ripetuti per',
  'settings.ignoreSecondTouch': 'Ignora il secondo tocco',
  'settings.hoverTime': 'Tempo di permanenza per selezionare',
  'settings.dwellHint':
    'Tieni il puntatore fermo su un pulsante (mouse, mouse a testa o puntamento oculare che muove il cursore); si seleziona quando la barra si riempie. Spostati per annullare.',
  'settings.scanStyle': 'Tipo di scansione',
  'settings.scanAuto': 'Automatica (1 sensore)',
  'settings.scanStep': 'A passi (2 sensori)',
  'settings.pattern': 'Schema',
  'settings.rowColumn': 'Prima la riga, poi la colonna',
  'settings.linear': 'Uno alla volta',
  'settings.scanSpeed': 'Velocità di scansione',
  'settings.scanAuditory': 'Pronuncia ogni elemento mentre viene evidenziato',
  'settings.scanAuditoryLabel': 'Segnale sonoro della scansione',
  'settings.scanHint':
    'Sensore = Spazio (seleziona) e, in modalità a passi, Invio (avanza). La maggior parte dei sensori Bluetooth emula questi tasti. La mappatura a due sensori e la scansione a blocchi arriveranno presto.',

  'settings.display': 'Aspetto',
  'settings.appearance': 'Tema',
  'settings.themeLight': 'Chiaro',
  'settings.themeDark': 'Scuro',
  'settings.themeSystem': 'Sistema',
  'settings.barPosition': 'Posizione della barra del messaggio',
  'settings.barTop': 'In alto',
  'settings.barBottom': 'In basso (più facile da raggiungere)',
  'settings.buttonGap': 'Spazio tra i pulsanti',
  'settings.gapCompact': 'Compatto',
  'settings.gapNormal': 'Normale',
  'settings.gapWide': 'Ampio',
  'settings.textSize': 'Dimensione del testo dei pulsanti',

  'settings.vocabulary': 'Vocabolario',
  'settings.activePageSet': 'Set di pagine attivo',

  'settings.vocabularyFilter': 'Filtro del vocabolario',
  'settings.filterHint':
    'Limita quali parole sono attive durante la terapia. Le parole fuori dalla lista restano visibili (così un partner può modellare) ma non rispondono.',
  'settings.wordLists': 'Liste di parole',
  'settings.selectWords': 'Scegli le parole (toccale nella griglia)',
  'settings.deleteList': 'Elimina la lista',
  'settings.newListPlaceholder': 'Nome della nuova lista (es. Parole settimana 1)',
  'settings.newListLabel': 'Nome della nuova lista di parole',
  'settings.addList': 'Aggiungi lista di parole',
  'settings.filterOn': 'Filtro attivo (anche nella barra in alto: ⊘)',
  'settings.filterEnabled': 'Filtro del vocabolario attivo',

  'settings.security': 'Sicurezza',
  'settings.pinHint':
    'Il PIN di chi assiste protegge la modifica e le impostazioni. Serve a tenere fuori un bambino, non è una misura di sicurezza.',

  'settings.enhancedVoice': 'Voce naturale',
  'settings.enhancedVoiceHint':
    'Una voce dal suono naturale che funziona interamente SU QUESTO DISPOSITIVO — non viene inviato nulla a un server. Si scarica una volta sola (~60 MB) e poi funziona offline. La voce standard continua a funzionare in ogni caso.',
  'settings.enhancedVoiceToggle': 'Voce naturale',
  'settings.enhancedVoiceDownloading': 'Download in corso…',

  'settings.vocabularyLevel': 'Livello del vocabolario',
  'settings.levelHint':
    'Mostra meno parole mentre si sta imparando la tavola. Le parole restano nello STESSO posto a ogni livello: alzare il livello ne rivela soltanto altre, così nulla che una persona ha già imparato a raggiungere si sposta.',
  'settings.levelBasic': 'Base',
  'settings.levelIntermediate': 'Intermedio',
  'settings.levelFull': 'Completo',

  'settings.wordPrediction': 'Predizione delle parole',
  'settings.predictionHint':
    'Suggerisce parole sopra la tastiera mentre scrivi. Impara dai messaggi che pronunci — comprese le parole toccate sulla griglia — così le parole che usi davvero vengono per prime. Le parole apprese restano SU QUESTO DISPOSITIVO.',
  'settings.predictionToggle': 'Suggerisci parole mentre scrivo',
  'settings.predictionLabel': 'Predizione delle parole attiva',
  'settings.clearLearned': 'Cancella le parole apprese',
  'settings.learnedCleared': 'Parole apprese cancellate',

  'settings.dataTracking': 'Raccolta dei dati',
  'settings.trackingHint':
    'Disattivata come impostazione predefinita. Quando chi assiste la attiva, le pressioni dei pulsanti e i messaggi pronunciati vengono registrati SOLO SU QUESTO DISPOSITIVO e non vengono mai inviati altrove. I logopedisti la usano per documentare i progressi.',
  'settings.trackingToggle': 'Registra i dati di comunicazione',
  'settings.trackingLabel': 'Raccolta dei dati attiva',
  'settings.viewReport': 'Vedi il report',

  'settings.privacy': 'Privacy',
  'settings.privacyHint':
    'Mentre l’app è aperta segnala la propria presenza, così il progetto può sapere se qualcuno la sta usando. La segnalazione contiene un codice casuale che cambia ogni volta che apri l’app e non viene mai conservato — nessun nome, nessun messaggio, niente di ciò che scrivi.',
  'settings.usageToggle': 'Segnala che l’app è in uso',
  'settings.usageLabel': 'Segnala l’uso dell’app',

  'settings.backup': 'Backup e ripristino',
  'settings.backupHint':
    'Un backup completo salva TUTTO ciò che è su questo dispositivo — profili, impostazioni di voce e accesso, le tue pagine, le liste di parole, la cronologia e i dati — in un unico file. Serve per passare a un altro dispositivo o per recuperare se la memoria del browser viene cancellata.',
  'settings.saveBackup': 'Salva un backup completo',
  'settings.restoreBackup': 'Ripristina da un backup',
  'settings.chooseDifferent': 'Scegli un altro file',
  'settings.confirmRestore': 'Conferma il ripristino',
  'settings.obfHint':
    'Open Board Format (.obz) sposta SOLO IL VOCABOLARIO tra le app — funziona con CoughDrop, TD Snap e altre, ma non porta con sé profili o impostazioni. Per quelli usa il backup completo qui sopra.',
  'settings.exportObz': 'Esporta il set di pagine attivo (.obz)',
  'settings.importObz': 'Importa .obz',
  'settings.restoreBuiltIn': 'Ripristina i set di pagine predefiniti',
  'settings.restoreArmed': 'Tocca di nuovo per ripristinare',

  'settings.printing': 'Stampa',
  'settings.printHint':
    'Stampa la tua tavola su carta — la scorta che un dispositivo non può essere. Sopravvive a una batteria scarica, va nella vasca e in piscina, e non ha bisogno di caricabatterie. Quello che si stampa è LA TUA tavola: i tuoi pulsanti, pittogrammi, foto e colori, negli stessi posti, così la disposizione che già conosci resta valida.',
  'settings.printBoard': 'Stampa questa tavola',
  'settings.printAll': 'Stampa tutte le pagine ({count} fogli)',

  'settings.install': 'Installa',
  'settings.installed': 'Installata ✓ — SayThrough si apre a schermo intero e funziona offline.',
  'settings.installHint':
    'Installa SayThrough nella schermata home: si apre come una normale app, funziona offline e il browser protegge meglio la sua memoria.',
  'settings.installButton': 'Installa l’app',
  'settings.installIosHint':
    'Per installarla su iPad/iPhone: in Safari tocca Condividi (□↑) → «Aggiungi a Home». SayThrough si aprirà a schermo intero e funzionerà offline.',

  'settings.about': 'Informazioni',

  // ---- setting presets ---------------------------------------------------
  'preset.slow': 'Lenta',
  'preset.normal': 'Normale',
  'preset.fast': 'Veloce',
  'preset.low': 'Basso',
  'preset.high': 'Alto',
  'preset.off': 'No',
  'preset.d300': '0,3 s',
  'preset.d500': '0,5 s',
  'preset.d600': '0,6 s',
  'preset.d1000': '1 s',
  'preset.d1500': '1,5 s',
  'preset.d2500': '2,5 s',
  'preset.scanSlow': 'Lenta (2,5 s)',
  'preset.scanMedium': 'Media (1,5 s)',
  'preset.scanFast': 'Veloce (1 s)',
  'settings.standardVoice': 'Voce standard',
  'settings.useStandardVoice': 'Usa la voce standard',

  // ---- status messages ---------------------------------------------------
  'status.exporting': 'Esportazione…',
  'status.exported': 'Esportato.',
  'status.printing': 'Preparazione dei fogli…',
  'status.printed': 'Inviato alla stampante.',
  'status.printEmpty': 'Su questa tavola non c’è ancora niente da stampare.',
  'status.restoring': 'Ripristino…',
  'status.restored': 'Ripristinato.',
  'status.importing': 'Importazione…',
  'status.backupSaved':
    'Backup completo salvato. Tienilo al sicuro — contiene i profili e la cronologia di questo dispositivo.',
  'status.backupDescribed':
    'Backup del {when} — {count} profilo/i: {names}. Il ripristino SOSTITUISCE tutto ciò che è ora su questo dispositivo. Tocca «Conferma il ripristino» per continuare.',
  'status.restoreFailed': 'Ripristino non riuscito: {error}',
  'status.imported': 'Importato «{name}» — selezionalo sotto Vocabolario.',
  'status.importFailed': 'Importazione non riuscita: {error}',
  'status.builtInRestored': 'Set di pagine predefiniti ripristinati.',
  'status.voiceDownloading': 'Download della voce… {percent}%',
  'status.voiceReady': 'Voce naturale pronta.',
  'settings.aboutBody':
    'SayThrough — CAA gratuita e open source. Il codice dell’applicazione è sotto licenza MIT.',
  'settings.aboutSymbols':
    'Pittogrammi © Governo di Aragona (Spagna), creati da Sergio Palao per ARASAAC (https://arasaac.org), distribuiti con licenza Creative Commons BY-NC-SA 4.0.',
  'settings.aboutMulberry': 'Mulberry Symbols © Steve Lee, CC BY-SA 4.0.',

  'settings.previewText': 'Ciao! Ecco come suono.',
  'status.voiceFailed': '{reason} Si continua con la voce standard.',
  'status.voiceFailedDefault': 'Non è stato possibile caricare la voce naturale.',
  'status.rebuildArmed':
    'Questo ricostruisce da zero le tavole predefinite e le frasi rapide — le tue pagine e i tuoi profili restano. Tocca di nuovo per confermare.',

  // ---- communication screen ----------------------------------------------
  'guest.banner': 'Modalità demo — non viene salvato nulla.',
  'guest.setUp': 'Configura SayThrough',
  'nudge.text': 'Il tuo vocabolario ha modifiche non salvate — vuoi fare un backup adesso?',
  'nudge.action': 'Fai il backup adesso',
  'nudge.dismiss': 'Chiudi il promemoria del backup',
  'page.title': 'Pagina: {name}',
  'page.nameLabel': 'Nome della pagina',
  'page.rename': 'Rinomina',
  'page.renameLabel': 'Rinomina la pagina',
  'page.deleteLabel': 'Elimina la pagina',
  'page.delete': 'Elimina la pagina (i pulsanti che la aprono diventano parole semplici)',
  'page.homeUndeletable': 'La pagina home non può essere eliminata.',

  'settings.grammaticalGender': 'Genere grammaticale',
  'settings.genderHint':
    'Il polacco segna il genere di chi parla al passato — «byłem» per un uomo, «byłam» per una donna. Impostandolo, la forma giusta viene offerta per prima, così la tavola non sbaglia il genere della persona che la usa. Se lo lasci vuoto vengono offerte entrambe le forme, con l’etichetta.',
  'settings.genderMasculine': 'Maschile',
  'settings.genderFeminine': 'Femminile',
  'settings.genderUnset': 'Chiedi ogni volta',

  'edit.editingPage': 'Modifica: {name}',
  'edit.tapForList': 'Tocca le parole per la lista: {name}',
  'edit.addButtonAt': 'Aggiungi un pulsante alla riga {row}, colonna {column}',
  'message.star': 'Aggiungi ai preferiti: {text}',
  'message.unstar': 'Togli dai preferiti: {text}',

  // ---- tracking report ---------------------------------------------------
  'report.title': 'Dati di comunicazione',
  'report.backToSettings': 'Torna alle impostazioni',
  'report.pressesToday': 'Pulsanti oggi',
  'report.messagesToday': 'Messaggi oggi',
  'report.presses7d': 'Pulsanti (7 giorni)',
  'report.messages7d': 'Messaggi (7 giorni)',
  'report.mostUsed': 'Parole più usate (7 giorni)',
}
