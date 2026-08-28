// English UI strings — the canonical table. Every other language is typed
// against `StringKey` (derived from this object), so a missing translation is
// a compile error rather than a blank label on someone's communication device.
//
// Keys are grouped by surface. `{placeholders}` are substituted by
// `translate()`; keep them identical across languages.

export const EN = {
  // ---- app-wide ----------------------------------------------------------
  'app.name': 'SayThrough',
  'common.back': '← Back',
  'common.done': 'Done',
  'common.cancel': 'Cancel',
  'common.remove': 'Remove',
  'common.add': '+ Add',
  'common.none': 'none',

  // ---- onboarding (§5.2) -------------------------------------------------
  'onboarding.subtitle': 'Tap symbols and words — SayThrough speaks them out loud.',
  'onboarding.tagline':
    'A free, open communication app (AAC) for people who are nonspeaking or have limited speech. No account, no subscription — it works offline and your words stay on this device.',
  'onboarding.setUp': "Let's set up a voice",
  'onboarding.setUpLabel': 'Set up SayThrough',
  'onboarding.tryIt': 'Try it first — nothing is saved',
  'onboarding.tryItLabel': 'Try SayThrough',
  'onboarding.backToWelcome': 'Back to welcome',
  'onboarding.whoFor': 'Who is this voice for?',
  'onboarding.namePlaceholder': 'Name (e.g. Maya)',
  'onboarding.nameLabel': 'User name',
  'onboarding.language': 'Language',
  'onboarding.languageHint':
    'This sets the board vocabulary, the voice, and the app’s own words. It can be changed later in Settings.',
  'onboarding.startingVocabulary': 'Starting vocabulary',
  'onboarding.startWith': 'Start with {name}',
  'onboarding.pinHeading': 'Caregiver PIN (recommended)',
  'onboarding.pinPlaceholder': 'PIN (4–8 digits, optional)',
  'onboarding.pinLabel': 'Caregiver PIN',
  'onboarding.pinConfirmPlaceholder': 'Confirm PIN',
  'onboarding.pinConfirmLabel': 'Confirm caregiver PIN',
  'onboarding.finish': 'Finish setup',
  'onboarding.errorName': 'Please enter a name — it can be changed later.',
  'onboarding.errorPinDigits': 'The PIN must be 4–8 digits (or leave it empty).',
  'onboarding.errorPinMatch': 'The PINs do not match.',
  'onboarding.audience':
    'Made for AAC users and the families, teachers, and speech-language pathologists who support them.',
  'onboarding.vocabHint':
    "Core Vocabulary is recommended for most users — it's built around the words that make up most of daily speech.",
  'onboarding.pinHint':
    'Protects edit mode and settings. Without a PIN, a long-press on any button opens editing. You can set one later in Settings.',
  'onboarding.settingUp': 'Setting up…',
  'onboarding.startTalking': 'Start talking',

  // ---- message bar (§6) --------------------------------------------------
  'message.speak': 'Speak',
  'message.speakLabel': 'Speak message',
  'message.deleteLast': 'Delete last word',
  'message.actions': 'Message actions',
  'message.copy': 'Copy message',
  'message.share': 'Share message',
  'message.clear': 'Clear message',
  'message.recent': 'Recent messages',
  'message.attention': 'Get attention',
  'message.emergency': 'Speak emergency phrase',
  'message.closeRecent': 'Close recent messages',
  'message.favorites': 'Favorites',
  'message.recentSection': 'Recent',
  'message.usePhrase': 'Use phrase: {text}',

  // ---- top bar / navigation ----------------------------------------------
  'nav.home': 'Home',
  'nav.search': 'Search vocabulary',
  'nav.editMode': 'Edit mode',
  'nav.sectionCurrent': '{label} section, current',
  'nav.section': '{label} section',

  'toolbar.core': 'Core',
  'toolbar.quick': 'Quick',
  'toolbar.keys': 'Keys',

  // ---- search ------------------------------------------------------------
  'search.placeholder': 'Find a word…',
  'search.close': 'Close search',
  'search.addResult': 'Add {word}, from {page}',
  'search.speakResult': 'Speak {word}',

  // ---- prediction / keyboard ---------------------------------------------
  'prediction.bar': 'Word suggestions',
  'prediction.insert': 'Insert {word}',
  'keyboard.space': 'space',
  'keyboard.speak': '▶ Speak',
  'keyboard.done': 'Done',

  // ---- word forms --------------------------------------------------------
  'forms.title': 'Forms of “{word}”',
  'forms.insert': 'Insert {word}',

  // ---- edit mode ---------------------------------------------------------
  'edit.doneEditing': 'Done editing',
  'edit.undo': 'Undo',
  'edit.redo': 'Redo',
  'edit.pageOptions': 'Page options',
  'edit.page': 'Page…',
  'edit.openSettings': 'Open settings',
  'edit.settings': 'Settings',
  'edit.label': 'Label',
  'edit.labelPlaceholder': 'What should this button say?',
  'edit.labelAccessibility': 'Button label',
  'edit.symbol': 'Symbol',
  'edit.changeSymbol': 'Change…',
  'edit.changeSymbolLabel': 'Change symbol',
  'edit.photo': 'Photo…',
  'edit.photoLabel': 'Use a photo as symbol',
  'edit.removeSymbol': 'Remove symbol',
  'edit.opens': 'This button opens',
  'edit.linkToPage': 'Link button to a page',
  'edit.goToPage': 'Go to page',
  'edit.goToLinkedPage': 'Go to linked page',
  'edit.color': 'Color',
  'edit.colorSwatch': 'Color {color}',
  'edit.deleteButton': 'Delete Button',
  'edit.deleteButtonLabel': 'Delete button',
  'edit.saveButton': 'Save button',
  'edit.opensTitle': 'This button opens…',
  'edit.linkToNamedPage': 'Link to page {name}',
  'edit.orNewPage': '…or a new page',
  'edit.newPagePlaceholder': 'New page name (e.g. Minecraft)',
  'edit.newPageLabel': 'New page name',
  'edit.includeCore': 'Include core words on new page',
  'edit.createAndLink': 'Create page and link',
  'edit.removeLink': 'Remove link',
  'edit.cancelLink': 'Cancel page link',
  'edit.searchSymbols': 'Search symbols…',
  'edit.searchSymbolsLabel': 'Search symbols',
  'edit.closePicker': 'Close symbol picker',
  'edit.symbolResult': 'Symbol {label}',

  // ---- PIN ---------------------------------------------------------------
  'pin.title': 'Enter caregiver PIN',
  'pin.input': 'PIN input',
  'pin.cancel': 'Cancel PIN entry',
  'pin.submit': 'Submit PIN',
  'pin.newPlaceholder': 'New PIN',
  'pin.confirmPlaceholder': 'Confirm PIN',
  'pin.save': 'Save PIN',
  'pin.set': 'Set PIN',
  'pin.change': 'Change PIN',
  'pin.remove': 'Remove PIN',

  // ---- settings ----------------------------------------------------------
  'settings.title': 'Settings',
  'settings.backToCommunication': 'Back to communication',

  'settings.profile': 'Profile',
  'settings.name': 'Name',
  'settings.nameLabel': 'Profile name',
  'settings.switchProfile': 'Switch profile',
  'settings.newProfilePlaceholder': 'New profile name',
  'settings.newProfileLabel': 'New profile name',
  'settings.addProfile': 'Add profile',

  'settings.language': 'Language',
  'settings.languageHint':
    'Changes the board vocabulary, the default voice, and the app’s own words. Your pages, word lists and history are kept.',
  'settings.languageSwitch': 'Switch to {name}',

  'settings.speech': 'Speech',
  'settings.voice': 'Voice',
  'settings.selectVoice': 'Select voice {name}',
  'settings.previewVoice': 'Preview voice {name}',
  'settings.noVoices': 'No voices reported by this device yet.',
  'settings.speed': 'Speed',
  'settings.pitch': 'Pitch',
  'settings.speakOnSelect': 'Speak each word when tapped',
  'settings.returnHome': 'Return to home after speaking',
  'settings.clearAfter': 'Clear message after speaking',

  'settings.quickButtons': 'Quick Buttons',
  'settings.attentionBell': 'Attention bell',
  'settings.emergencyPhrase': 'Emergency phrase',
  'settings.emergencyPlaceholder': 'I need help.',

  'settings.accessMethod': 'Access Method',
  'settings.howSelects': 'How this user selects',
  'settings.touch': 'Touch',
  'settings.dwell': 'Dwell (hover)',
  'settings.scanning': 'Switch scanning',
  'settings.holdToActivate': 'Hold to activate',
  'settings.ignoreRepeat': 'Ignore repeat taps for',
  'settings.ignoreSecondTouch': 'Ignore second touch',
  'settings.hoverTime': 'Hover time to select',
  'settings.dwellHint':
    'Hover the pointer over a button (mouse, head mouse, or eye gaze that moves the cursor); it selects when the bar fills. Move away to cancel.',
  'settings.scanStyle': 'Scan style',
  'settings.scanAuto': 'Auto (1 switch)',
  'settings.scanStep': 'Step (2 switches)',
  'settings.pattern': 'Pattern',
  'settings.rowColumn': 'Row then column',
  'settings.linear': 'One at a time',
  'settings.scanSpeed': 'Scan speed',
  'settings.scanAuditory': 'Speak each item as it highlights',
  'settings.scanAuditoryLabel': 'Scan auditory cue',
  'settings.scanHint':
    'Switch = Space (select) and, in step mode, Enter (advance). Most Bluetooth switches emulate these keys. Two-switch mapping and block scanning are coming next.',

  'settings.display': 'Display',
  'settings.appearance': 'Appearance',
  'settings.themeLight': 'Light',
  'settings.themeDark': 'Dark',
  'settings.themeSystem': 'System',
  'settings.barPosition': 'Message bar position',
  'settings.barTop': 'Top',
  'settings.barBottom': 'Bottom (easier reach)',
  'settings.buttonGap': 'Space between buttons',
  'settings.gapCompact': 'Compact',
  'settings.gapNormal': 'Normal',
  'settings.gapWide': 'Wide',
  'settings.textSize': 'Button text size',

  'settings.vocabulary': 'Vocabulary',
  'settings.activePageSet': 'Active page set',

  'settings.vocabularyFilter': 'Vocabulary Filter',
  'settings.filterHint':
    "Limit which words are active during therapy. Words not in the list stay visible (so a partner can model) but don't respond.",
  'settings.wordLists': 'Word lists',
  'settings.selectWords': 'Select words (tap them in the grid)',
  'settings.deleteList': 'Delete list',
  'settings.newListPlaceholder': 'New list name (e.g. Week 1 Words)',
  'settings.newListLabel': 'New word list name',
  'settings.addList': 'Add word list',
  'settings.filterOn': 'Filter on (also in top bar: ⊘)',
  'settings.filterEnabled': 'Vocabulary filter enabled',

  'settings.security': 'Security',
  'settings.pinHint':
    'The caregiver PIN protects edit mode and settings. It is child-proofing, not security.',

  'settings.enhancedVoice': 'Enhanced Voice',
  'settings.enhancedVoiceHint':
    'A natural-sounding voice that runs entirely ON THIS DEVICE — nothing is sent to a server. It is a one-time ~60 MB download and works offline afterwards. The standard voice keeps working either way.',
  'settings.enhancedVoiceToggle': 'Enhanced voice',
  'settings.enhancedVoiceDownloading': 'Downloading…',

  'settings.vocabularyLevel': 'Vocabulary Level',
  'settings.levelHint':
    'Show fewer words while someone is learning the board. Words stay in the SAME place at every level — raising the level only reveals more, so nothing a user has already learned to reach ever moves.',
  'settings.levelBasic': 'Basic',
  'settings.levelIntermediate': 'Intermediate',
  'settings.levelFull': 'Full',

  'settings.wordPrediction': 'Word Prediction',
  'settings.predictionHint':
    'Suggests words above the keyboard as you type. It learns from messages you speak — including words tapped on the grid — so the words you actually use come first. Learned words stay ON THIS DEVICE.',
  'settings.predictionToggle': 'Suggest words while typing',
  'settings.predictionLabel': 'Word prediction enabled',
  'settings.clearLearned': 'Clear learned words',
  'settings.learnedCleared': 'Learned words cleared',

  'settings.dataTracking': 'Data Tracking',
  'settings.trackingHint':
    'Off by default. When a caregiver turns it on, button presses and spoken messages are recorded ON THIS DEVICE ONLY and are never sent anywhere. SLPs use this to document progress.',
  'settings.trackingToggle': 'Track communication data',
  'settings.trackingLabel': 'Data tracking enabled',
  'settings.viewReport': 'View report',

  'settings.privacy': 'Privacy',
  'settings.privacyHint':
    'While the app is open it checks in, so the project can tell whether anyone is using it. The check-in carries a random code that changes every time you open the app and is never stored — no name, no message, nothing you type.',
  'settings.usageToggle': 'Report that the app is in use',
  'settings.usageLabel': 'Report app usage',

  'settings.backup': 'Backup & Restore',
  'settings.backupHint':
    'A full backup saves EVERYTHING on this device — profiles, voice and access settings, your pages, word lists, history and tracking — to one file. Use it to move to a new device or recover if browser storage is cleared.',
  'settings.saveBackup': 'Save full backup',
  'settings.restoreBackup': 'Restore from backup',
  'settings.chooseDifferent': 'Choose a different file',
  'settings.confirmRestore': 'Confirm restore',
  'settings.obfHint':
    'Open Board Format (.obz) moves VOCABULARY ONLY between apps — it works with CoughDrop, TD Snap and others, but does not carry profiles or settings. Use a full backup above for those.',
  'settings.exportObz': 'Export active page set (.obz)',
  'settings.importObz': 'Import .obz',
  'settings.restoreBuiltIn': 'Restore built-in page sets',
  'settings.restoreArmed': 'Tap again to restore',

  'settings.install': 'Install',
  'settings.installed': 'Installed ✓ — SayThrough opens full-screen and works offline.',
  'settings.installHint':
    'Install SayThrough to the home screen: it opens like a regular app, works offline, and the browser protects its storage better.',
  'settings.installButton': 'Install app',
  'settings.installIosHint':
    'To install on iPad/iPhone: in Safari, tap Share (□↑) → "Add to Home Screen". SayThrough will open full-screen and work offline.',

  'settings.about': 'About',

  // ---- setting presets ---------------------------------------------------
  'preset.slow': 'Slow',
  'preset.normal': 'Normal',
  'preset.fast': 'Fast',
  'preset.low': 'Low',
  'preset.high': 'High',
  'preset.off': 'Off',
  'preset.d300': '0.3s',
  'preset.d500': '0.5s',
  'preset.d600': '0.6s',
  'preset.d1000': '1s',
  'preset.d1500': '1.5s',
  'preset.d2500': '2.5s',
  'preset.scanSlow': 'Slow (2.5s)',
  'preset.scanMedium': 'Medium (1.5s)',
  'preset.scanFast': 'Fast (1s)',
  'settings.standardVoice': 'Standard voice',
  'settings.useStandardVoice': 'Use standard voice',

  // ---- status messages ---------------------------------------------------
  'status.exporting': 'Exporting…',
  'status.exported': 'Exported.',
  'status.restoring': 'Restoring…',
  'status.restored': 'Restored.',
  'status.importing': 'Importing…',
  'status.backupSaved':
    'Full backup saved. Keep it somewhere safe — it contains this device’s profiles and history.',
  'status.backupDescribed':
    'Backup from {when} — {count} profile(s): {names}. Restoring REPLACES everything currently on this device. Tap "Confirm restore" to continue.',
  'status.restoreFailed': 'Restore failed: {error}',
  'status.imported': 'Imported "{name}" — select it under Vocabulary.',
  'status.importFailed': 'Import failed: {error}',
  'status.builtInRestored': 'Built-in page sets restored.',
  'status.voiceDownloading': 'Downloading voice… {percent}%',
  'status.voiceReady': 'Enhanced voice ready.',
  'settings.aboutBody':
    'SayThrough — free, open-source AAC. Application code is MIT licensed.',
  'settings.aboutSymbols':
    'Pictographic symbols © Government of Aragón (Spain), created by Sergio Palao for ARASAAC (https://arasaac.org), distributed under Creative Commons BY-NC-SA 4.0.',
  'settings.aboutMulberry': 'Mulberry Symbols © Steve Lee, CC BY-SA 4.0.',

  'settings.previewText': 'Hi! This is what I sound like.',
  'status.voiceFailed': '{reason} Still using the standard voice.',
  'status.voiceFailedDefault': 'Could not load the enhanced voice.',
  'status.rebuildArmed':
    'This rebuilds the built-in boards and quick phrases from scratch — your own pages and profiles are kept. Tap again to confirm.',

  // ---- communication screen ----------------------------------------------
  'guest.banner': 'Demo mode — nothing is saved.',
  'guest.setUp': 'Set up SayThrough',
  'nudge.text': 'Your vocabulary has unsaved changes — back up now?',
  'nudge.action': 'Back up now',
  'nudge.dismiss': 'Dismiss backup reminder',
  'page.title': 'Page: {name}',
  'page.nameLabel': 'Page name',
  'page.rename': 'Rename',
  'page.renameLabel': 'Rename page',
  'page.deleteLabel': 'Delete page',
  'page.delete': 'Delete page (buttons that open it become plain words)',
  'page.homeUndeletable': 'The home page cannot be deleted.',

  'settings.grammaticalGender': 'Grammatical gender',
  'settings.genderHint':
    'Polish marks the speaker’s own gender in the past tense — “byłem” for a man, “byłam” for a woman. Set this and the matching form is offered first, so the board does not misgender its user. Leave it unset and both forms are offered, labelled.',
  'settings.genderMasculine': 'Masculine',
  'settings.genderFeminine': 'Feminine',
  'settings.genderUnset': 'Ask each time',

  'edit.editingPage': 'Editing: {name}',
  'edit.tapForList': 'Tap words for list: {name}',
  'edit.addButtonAt': 'Add button at row {row}, column {column}',
  'message.star': 'Star: {text}',
  'message.unstar': 'Unstar: {text}',

  // ---- tracking report ---------------------------------------------------
  'report.title': 'Communication Data',
  'report.backToSettings': 'Back to settings',
  'report.pressesToday': 'Buttons today',
  'report.messagesToday': 'Messages today',
  'report.presses7d': 'Buttons (7 days)',
  'report.messages7d': 'Messages (7 days)',
  'report.mostUsed': 'Most used words (7 days)',
} as const

export type StringKey = keyof typeof EN
