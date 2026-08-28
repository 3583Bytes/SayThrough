import type { StringKey } from './en'

// Polish UI strings. Typed as a complete map of `StringKey`, so adding a key
// to `en.ts` without translating it here fails the build.
//
// Register: informal (`ty`), matching the Spanish table — the reader is a
// parent, teacher or logopeda setting up a device for someone they know.
// Terminology follows Polish AAC (komunikacja alternatywna i wspomagająca)
// usage: "tablica" for a board, "symbol" for a pictogram, "logopeda" for the
// clinician, "opiekun" for the caregiver.

export const PL: Record<StringKey, string> = {
  // ---- app-wide ----------------------------------------------------------
  'app.name': 'SayThrough',
  'common.back': '← Wstecz',
  'common.done': 'Gotowe',
  'common.cancel': 'Anuluj',
  'common.remove': 'Usuń',
  'common.add': '+ Dodaj',
  'common.none': 'brak',

  // ---- onboarding --------------------------------------------------------
  'onboarding.subtitle': 'Dotykaj symboli i słów — SayThrough powie je na głos.',
  'onboarding.tagline':
    'Darmowa, otwarta aplikacja do komunikacji (AAC) dla osób niemówiących lub mówiących w ograniczonym stopniu. Bez konta i bez abonamentu — działa offline, a Twoje słowa zostają na tym urządzeniu.',
  'onboarding.setUp': 'Stwórzmy głos',
  'onboarding.setUpLabel': 'Skonfiguruj SayThrough',
  'onboarding.tryIt': 'Najpierw wypróbuj — nic nie jest zapisywane',
  'onboarding.tryItLabel': 'Wypróbuj SayThrough',
  'onboarding.backToWelcome': 'Wróć do ekranu powitalnego',
  'onboarding.whoFor': 'Dla kogo jest ten głos?',
  'onboarding.namePlaceholder': 'Imię (na przykład Maja)',
  'onboarding.nameLabel': 'Imię użytkownika',
  'onboarding.language': 'Język',
  'onboarding.languageHint':
    'Ustawia słownictwo tablicy, głos i słowa samej aplikacji. Możesz to zmienić później w Ustawieniach.',
  'onboarding.startingVocabulary': 'Słownictwo początkowe',
  'onboarding.startWith': 'Zacznij od: {name}',
  'onboarding.pinHeading': 'PIN opiekuna (zalecany)',
  'onboarding.pinPlaceholder': 'PIN (4–8 cyfr, opcjonalnie)',
  'onboarding.pinLabel': 'PIN opiekuna',
  'onboarding.pinConfirmPlaceholder': 'Potwierdź PIN',
  'onboarding.pinConfirmLabel': 'Potwierdź PIN opiekuna',
  'onboarding.finish': 'Zakończ konfigurację',
  'onboarding.errorName': 'Wpisz imię — można je później zmienić.',
  'onboarding.errorPinDigits': 'PIN musi mieć od 4 do 8 cyfr (albo zostaw puste).',
  'onboarding.errorPinMatch': 'PIN-y nie są takie same.',
  'onboarding.audience':
    'Stworzona dla użytkowników AAC oraz rodzin, nauczycieli i logopedów, którzy ich wspierają.',
  'onboarding.vocabHint':
    'Słownictwo podstawowe jest zalecane dla większości osób — opiera się na słowach, które stanowią większość codziennej mowy.',
  'onboarding.pinHint':
    'Chroni tryb edycji i ustawienia. Bez PIN-u długie przytrzymanie dowolnego przycisku otwiera edycję. Możesz go ustawić później w Ustawieniach.',
  'onboarding.settingUp': 'Konfigurowanie…',
  'onboarding.startTalking': 'Zacznij mówić',

  // ---- message bar -------------------------------------------------------
  'message.speak': 'Powiedz',
  'message.speakLabel': 'Powiedz wiadomość',
  'message.deleteLast': 'Usuń ostatnie słowo',
  'message.actions': 'Działania na wiadomości',
  'message.copy': 'Kopiuj wiadomość',
  'message.share': 'Udostępnij wiadomość',
  'message.clear': 'Wyczyść wiadomość',
  'message.recent': 'Ostatnie wiadomości',
  'message.attention': 'Zwróć uwagę',
  'message.emergency': 'Powiedz zdanie awaryjne',
  'message.closeRecent': 'Zamknij ostatnie wiadomości',
  'message.favorites': 'Ulubione',
  'message.recentSection': 'Ostatnie',
  'message.usePhrase': 'Użyj zdania: {text}',

  // ---- top bar / navigation ----------------------------------------------
  'nav.home': 'Start',
  'nav.search': 'Szukaj w słownictwie',
  'nav.editMode': 'Tryb edycji',
  'nav.sectionCurrent': 'Sekcja {label}, bieżąca',
  'nav.section': 'Sekcja {label}',

  'toolbar.core': 'Podstawa',
  'toolbar.quick': 'Szybkie',
  'toolbar.keys': 'Klawisze',

  // ---- search ------------------------------------------------------------
  'search.placeholder': 'Znajdź słowo…',
  'search.close': 'Zamknij wyszukiwanie',
  'search.addResult': 'Dodaj {word}, ze strony {page}',
  'search.speakResult': 'Powiedz {word}',

  // ---- prediction / keyboard ---------------------------------------------
  'prediction.bar': 'Podpowiedzi słów',
  'prediction.insert': 'Wstaw {word}',
  'keyboard.space': 'spacja',
  'keyboard.speak': '▶ Powiedz',
  'keyboard.done': 'Gotowe',

  // ---- word forms --------------------------------------------------------
  'forms.title': 'Formy słowa „{word}”',
  'forms.insert': 'Wstaw {word}',

  // ---- edit mode ---------------------------------------------------------
  'edit.doneEditing': 'Zakończ edycję',
  'edit.undo': 'Cofnij',
  'edit.redo': 'Ponów',
  'edit.pageOptions': 'Opcje strony',
  'edit.page': 'Strona…',
  'edit.openSettings': 'Otwórz ustawienia',
  'edit.settings': 'Ustawienia',
  'edit.label': 'Etykieta',
  'edit.labelPlaceholder': 'Co ma mówić ten przycisk?',
  'edit.labelAccessibility': 'Etykieta przycisku',
  'edit.symbol': 'Symbol',
  'edit.changeSymbol': 'Zmień…',
  'edit.changeSymbolLabel': 'Zmień symbol',
  'edit.photo': 'Zdjęcie…',
  'edit.photoLabel': 'Użyj zdjęcia jako symbolu',
  'edit.removeSymbol': 'Usuń symbol',
  'edit.opens': 'Ten przycisk otwiera',
  'edit.linkToPage': 'Połącz przycisk ze stroną',
  'edit.goToPage': 'Przejdź do strony',
  'edit.goToLinkedPage': 'Przejdź do połączonej strony',
  'edit.color': 'Kolor',
  'edit.colorSwatch': 'Kolor {color}',
  'edit.deleteButton': 'Usuń przycisk',
  'edit.deleteButtonLabel': 'Usuń przycisk',
  'edit.saveButton': 'Zapisz przycisk',
  'edit.opensTitle': 'Ten przycisk otwiera…',
  'edit.linkToNamedPage': 'Połącz ze stroną {name}',
  'edit.orNewPage': '…albo nową stronę',
  'edit.newPagePlaceholder': 'Nazwa nowej strony (na przykład Minecraft)',
  'edit.newPageLabel': 'Nazwa nowej strony',
  'edit.includeCore': 'Dodaj słownictwo podstawowe na nowej stronie',
  'edit.createAndLink': 'Utwórz stronę i połącz',
  'edit.removeLink': 'Usuń połączenie',
  'edit.cancelLink': 'Anuluj łączenie strony',
  'edit.searchSymbols': 'Szukaj symboli…',
  'edit.searchSymbolsLabel': 'Szukaj symboli',
  'edit.closePicker': 'Zamknij wybór symboli',
  'edit.symbolResult': 'Symbol {label}',

  // ---- PIN ---------------------------------------------------------------
  'pin.title': 'Wpisz PIN opiekuna',
  'pin.input': 'Pole PIN',
  'pin.cancel': 'Anuluj wpisywanie PIN-u',
  'pin.submit': 'Zatwierdź PIN',
  'pin.newPlaceholder': 'Nowy PIN',
  'pin.confirmPlaceholder': 'Potwierdź PIN',
  'pin.save': 'Zapisz PIN',
  'pin.set': 'Ustaw PIN',
  'pin.change': 'Zmień PIN',
  'pin.remove': 'Usuń PIN',

  // ---- settings ----------------------------------------------------------
  'settings.title': 'Ustawienia',
  'settings.backToCommunication': 'Wróć do komunikacji',

  'settings.profile': 'Profil',
  'settings.name': 'Imię',
  'settings.nameLabel': 'Imię w profilu',
  'settings.switchProfile': 'Przełącz profil',
  'settings.newProfilePlaceholder': 'Nazwa nowego profilu',
  'settings.newProfileLabel': 'Nazwa nowego profilu',
  'settings.addProfile': 'Dodaj profil',

  'settings.language': 'Język',
  'settings.languageHint':
    'Zmienia słownictwo tablicy, domyślny głos i słowa samej aplikacji. Twoje strony, listy słów i historia zostają zachowane.',
  'settings.languageSwitch': 'Przełącz na {name}',

  'settings.speech': 'Mowa',
  'settings.voice': 'Głos',
  'settings.selectVoice': 'Wybierz głos {name}',
  'settings.previewVoice': 'Posłuchaj głosu {name}',
  'settings.noVoices': 'To urządzenie nie zgłosiło jeszcze żadnych głosów.',
  'settings.speed': 'Tempo',
  'settings.pitch': 'Wysokość',
  'settings.speakOnSelect': 'Mów każde słowo po dotknięciu',
  'settings.returnHome': 'Wróć na start po powiedzeniu',
  'settings.clearAfter': 'Wyczyść wiadomość po powiedzeniu',

  'settings.quickButtons': 'Szybkie przyciski',
  'settings.attentionBell': 'Dzwonek uwagi',
  'settings.emergencyPhrase': 'Zdanie awaryjne',
  'settings.emergencyPlaceholder': 'Potrzebuję pomocy.',

  'settings.accessMethod': 'Metoda dostępu',
  'settings.howSelects': 'Jak ta osoba wybiera',
  'settings.touch': 'Dotyk',
  'settings.dwell': 'Zatrzymanie (najazd)',
  'settings.scanning': 'Skanowanie przełącznikiem',
  'settings.holdToActivate': 'Przytrzymaj, aby aktywować',
  'settings.ignoreRepeat': 'Ignoruj powtórne dotknięcia przez',
  'settings.ignoreSecondTouch': 'Ignoruj drugie dotknięcie',
  'settings.hoverTime': 'Czas najazdu do wyboru',
  'settings.dwellHint':
    'Zatrzymaj wskaźnik nad przyciskiem (mysz, mysz sterowana głową albo wzrok poruszający kursorem); wybór następuje, gdy pasek się wypełni. Odsuń wskaźnik, aby anulować.',
  'settings.scanStyle': 'Rodzaj skanowania',
  'settings.scanAuto': 'Automatyczne (1 przełącznik)',
  'settings.scanStep': 'Krokowe (2 przełączniki)',
  'settings.pattern': 'Wzór',
  'settings.rowColumn': 'Wiersz, potem kolumna',
  'settings.linear': 'Po kolei',
  'settings.scanSpeed': 'Szybkość skanowania',
  'settings.scanAuditory': 'Mów każdy element przy podświetleniu',
  'settings.scanAuditoryLabel': 'Sygnał dźwiękowy skanowania',
  'settings.scanHint':
    'Przełącznik to spacja (wybór), a w trybie krokowym Enter (dalej). Większość przełączników Bluetooth udaje te klawisze. Obsługa dwóch przełączników i skanowanie blokami pojawią się wkrótce.',

  'settings.display': 'Wyświetlanie',
  'settings.appearance': 'Wygląd',
  'settings.themeLight': 'Jasny',
  'settings.themeDark': 'Ciemny',
  'settings.themeSystem': 'Systemowy',
  'settings.barPosition': 'Położenie paska wiadomości',
  'settings.barTop': 'Góra',
  'settings.barBottom': 'Dół (łatwiej sięgnąć)',
  'settings.buttonGap': 'Odstęp między przyciskami',
  'settings.gapCompact': 'Ciasny',
  'settings.gapNormal': 'Zwykły',
  'settings.gapWide': 'Szeroki',
  'settings.textSize': 'Wielkość tekstu na przyciskach',

  'settings.vocabulary': 'Słownictwo',
  'settings.activePageSet': 'Aktywny zestaw stron',

  'settings.vocabularyFilter': 'Filtr słownictwa',
  'settings.filterHint':
    'Ogranicza, które słowa są aktywne podczas terapii. Słowa spoza listy pozostają widoczne (żeby partner mógł modelować), ale nie reagują.',
  'settings.wordLists': 'Listy słów',
  'settings.selectWords': 'Wybierz słowa (dotknij ich na tablicy)',
  'settings.deleteList': 'Usuń listę',
  'settings.newListPlaceholder': 'Nazwa listy (na przykład Słowa z tygodnia 1)',
  'settings.newListLabel': 'Nazwa nowej listy słów',
  'settings.addList': 'Dodaj listę słów',
  'settings.filterOn': 'Filtr włączony (także na górnym pasku: ⊘)',
  'settings.filterEnabled': 'Filtr słownictwa włączony',

  'settings.security': 'Bezpieczeństwo',
  'settings.pinHint':
    'PIN opiekuna chroni tryb edycji i ustawienia. To zabezpieczenie przed dzieckiem, a nie zabezpieczenie danych.',

  'settings.enhancedVoice': 'Lepszy głos',
  'settings.enhancedVoiceHint':
    'Naturalnie brzmiący głos, który działa w całości NA TYM URZĄDZENIU — nic nie jest wysyłane na serwer. To jednorazowe pobranie około 60 MB, potem działa offline. Zwykły głos działa dalej tak czy inaczej.',
  'settings.enhancedVoiceToggle': 'Lepszy głos',
  'settings.enhancedVoiceDownloading': 'Pobieranie…',

  'settings.vocabularyLevel': 'Poziom słownictwa',
  'settings.levelHint':
    'Pokazuje mniej słów, gdy ktoś dopiero uczy się tablicy. Słowa zostają w TYM SAMYM miejscu na każdym poziomie — podniesienie poziomu tylko odsłania więcej, więc nic, czego użytkownik już się nauczył, nigdy się nie przesuwa.',
  'settings.levelBasic': 'Podstawowy',
  'settings.levelIntermediate': 'Średni',
  'settings.levelFull': 'Pełny',

  'settings.wordPrediction': 'Podpowiadanie słów',
  'settings.predictionHint':
    'Podpowiada słowa nad klawiaturą podczas pisania. Uczy się z wypowiadanych wiadomości — także ze słów dotykanych na tablicy — więc słowa, których naprawdę używasz, pojawiają się pierwsze. Nauczone słowa zostają NA TYM URZĄDZENIU.',
  'settings.predictionToggle': 'Podpowiadaj słowa podczas pisania',
  'settings.predictionLabel': 'Podpowiadanie słów włączone',
  'settings.clearLearned': 'Wyczyść nauczone słowa',
  'settings.learnedCleared': 'Nauczone słowa wyczyszczone',

  'settings.dataTracking': 'Zbieranie danych',
  'settings.trackingHint':
    'Domyślnie wyłączone. Gdy opiekun to włączy, naciśnięcia przycisków i wypowiedziane wiadomości są zapisywane WYŁĄCZNIE NA TYM URZĄDZENIU i nigdzie nie są wysyłane. Logopedzi używają tego do dokumentowania postępów.',
  'settings.trackingToggle': 'Zbieraj dane o komunikacji',
  'settings.trackingLabel': 'Zbieranie danych włączone',
  'settings.viewReport': 'Zobacz raport',

  'settings.privacy': 'Prywatność',
  'settings.privacyHint':
    'Gdy aplikacja jest otwarta, wysyła sygnał, żeby projekt wiedział, czy ktoś z niej korzysta. Sygnał zawiera losowy kod, który zmienia się przy każdym otwarciu aplikacji i nigdy nie jest zapisywany — bez imienia, bez wiadomości, bez niczego, co piszesz.',
  'settings.usageToggle': 'Zgłaszaj, że aplikacja jest używana',
  'settings.usageLabel': 'Zgłaszanie użycia aplikacji',

  'settings.backup': 'Kopia zapasowa',
  'settings.backupHint':
    'Pełna kopia zapisuje WSZYSTKO z tego urządzenia — profile, ustawienia głosu i dostępu, Twoje strony, listy słów, historię i zebrane dane — do jednego pliku. Użyj jej, żeby przenieść się na nowe urządzenie albo odzyskać dane, jeśli pamięć przeglądarki zostanie wyczyszczona.',
  'settings.saveBackup': 'Zapisz pełną kopię',
  'settings.restoreBackup': 'Przywróć z kopii',
  'settings.chooseDifferent': 'Wybierz inny plik',
  'settings.confirmRestore': 'Potwierdź przywracanie',
  'settings.obfHint':
    'Format Open Board (.obz) przenosi między aplikacjami TYLKO SŁOWNICTWO — działa z CoughDrop, TD Snap i innymi, ale nie zawiera profili ani ustawień. Do tego użyj pełnej kopii powyżej.',
  'settings.exportObz': 'Eksportuj aktywny zestaw (.obz)',
  'settings.importObz': 'Importuj .obz',
  'settings.restoreBuiltIn': 'Przywróć wbudowane zestawy stron',
  'settings.restoreArmed': 'Dotknij ponownie, aby przywrócić',

  'settings.install': 'Instalacja',
  'settings.installed': 'Zainstalowano ✓ — SayThrough otwiera się na pełnym ekranie i działa offline.',
  'settings.installHint':
    'Zainstaluj SayThrough na ekranie głównym: otwiera się jak zwykła aplikacja, działa offline, a przeglądarka lepiej chroni jej dane.',
  'settings.installButton': 'Zainstaluj aplikację',
  'settings.installIosHint':
    'Aby zainstalować na iPadzie lub iPhonie: w Safari dotknij Udostępnij (□↑) → „Dodaj do ekranu początkowego”. SayThrough otworzy się na pełnym ekranie i będzie działać offline.',

  'settings.about': 'O aplikacji',

  // ---- setting presets ---------------------------------------------------
  'preset.slow': 'Wolno',
  'preset.normal': 'Normalnie',
  'preset.fast': 'Szybko',
  'preset.low': 'Niska',
  'preset.high': 'Wysoka',
  'preset.off': 'Wyłączone',
  'preset.d300': '0,3 s',
  'preset.d500': '0,5 s',
  'preset.d600': '0,6 s',
  'preset.d1000': '1 s',
  'preset.d1500': '1,5 s',
  'preset.d2500': '2,5 s',
  'preset.scanSlow': 'Wolno (2,5 s)',
  'preset.scanMedium': 'Średnio (1,5 s)',
  'preset.scanFast': 'Szybko (1 s)',
  'settings.standardVoice': 'Zwykły głos',
  'settings.useStandardVoice': 'Użyj zwykłego głosu',
  'settings.previewText': 'Cześć! Tak brzmię.',
  'status.voiceFailed': '{reason} Nadal używany jest zwykły głos.',
  'status.voiceFailedDefault': 'Nie udało się wczytać lepszego głosu.',
  'status.rebuildArmed':
    'To odbuduje od nowa wbudowane tablice i szybkie zdania — Twoje własne strony i profile zostaną zachowane. Dotknij ponownie, aby potwierdzić.',

  // ---- communication screen ----------------------------------------------
  'guest.banner': 'Tryb demonstracyjny — nic nie jest zapisywane.',
  'guest.setUp': 'Skonfiguruj SayThrough',
  'nudge.text': 'Twoje słownictwo ma niezapisane zmiany — zrobić kopię teraz?',
  'nudge.action': 'Zrób kopię',
  'nudge.dismiss': 'Odrzuć przypomnienie o kopii',
  'page.title': 'Strona: {name}',
  'page.nameLabel': 'Nazwa strony',
  'page.rename': 'Zmień nazwę',
  'page.renameLabel': 'Zmień nazwę strony',
  'page.deleteLabel': 'Usuń stronę',
  'page.delete': 'Usuń stronę (przyciski, które ją otwierają, staną się zwykłymi słowami)',
  'page.homeUndeletable': 'Strony startowej nie można usunąć.',

  // ---- status messages ---------------------------------------------------
  'status.exporting': 'Eksportowanie…',
  'status.exported': 'Wyeksportowano.',
  'status.restoring': 'Przywracanie…',
  'status.restored': 'Przywrócono.',
  'status.importing': 'Importowanie…',
  'status.backupSaved':
    'Pełna kopia zapisana. Przechowuj ją w bezpiecznym miejscu — zawiera profile i historię z tego urządzenia.',
  'status.backupDescribed':
    'Kopia z {when} — profile ({count}): {names}. Przywracanie ZASTĄPI wszystko, co jest teraz na tym urządzeniu. Dotknij „Potwierdź przywracanie”, aby kontynuować.',
  'status.restoreFailed': 'Przywracanie nie powiodło się: {error}',
  'status.imported': 'Zaimportowano „{name}” — wybierz go w sekcji Słownictwo.',
  'status.importFailed': 'Import nie powiódł się: {error}',
  'status.builtInRestored': 'Wbudowane zestawy stron przywrócone.',
  'status.voiceDownloading': 'Pobieranie głosu… {percent}%',
  'status.voiceReady': 'Lepszy głos gotowy.',
  'settings.aboutBody':
    'SayThrough — darmowe AAC o otwartym kodzie. Kod aplikacji na licencji MIT.',
  'settings.aboutSymbols':
    'Symbole graficzne © Rząd Aragonii (Hiszpania), autor Sergio Palao, dla ARASAAC (https://arasaac.org), na licencji Creative Commons BY-NC-SA 4.0.',
  'settings.aboutMulberry': 'Symbole Mulberry © Steve Lee, CC BY-SA 4.0.',

  'settings.grammaticalGender': 'Rodzaj gramatyczny',
  'settings.genderHint':
    'Polski zaznacza rodzaj osoby mówiącej w czasie przeszłym — „byłem” albo „byłam”. Po ustawieniu tej opcji właściwa forma jest proponowana jako pierwsza, żeby tablica nie zwracała się do swojego użytkownika w złym rodzaju. Bez ustawienia pokazywane są obie formy z opisem.',
  'settings.genderMasculine': 'Męski',
  'settings.genderFeminine': 'Żeński',
  'settings.genderUnset': 'Pytaj za każdym razem',

  'edit.editingPage': 'Edytujesz: {name}',
  'edit.tapForList': 'Dotknij słów do listy: {name}',
  'edit.addButtonAt': 'Dodaj przycisk w wierszu {row}, kolumnie {column}',
  'message.star': 'Dodaj do ulubionych: {text}',
  'message.unstar': 'Usuń z ulubionych: {text}',

  // ---- tracking report ---------------------------------------------------
  'report.title': 'Dane o komunikacji',
  'report.backToSettings': 'Wróć do ustawień',
  'report.pressesToday': 'Przyciski dzisiaj',
  'report.messagesToday': 'Wiadomości dzisiaj',
  'report.presses7d': 'Przyciski (7 dni)',
  'report.messages7d': 'Wiadomości (7 dni)',
  'report.mostUsed': 'Najczęściej używane słowa (7 dni)',
}
