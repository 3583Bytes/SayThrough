import type { StringKey } from './en'

// Spanish UI strings. Typed as a complete map of `StringKey`, so adding a key
// to `en.ts` without translating it here fails the build.
//
// Register: neutral Spanish, `tú` rather than `usted` — the reader is a
// parent, teacher or therapist setting up a device for someone they know, and
// AAC copy in Spanish is conventionally informal. Terminology follows ARASAAC
// and Spanish CAA (comunicación aumentativa y alternativa) usage: "tablero"
// for a board, "casilla" for a cell, "pictograma" for a symbol.

export const ES: Record<StringKey, string> = {
  // ---- app-wide ----------------------------------------------------------
  'app.name': 'SayThrough',
  'common.back': '← Atrás',
  'common.done': 'Listo',
  'common.cancel': 'Cancelar',
  'common.remove': 'Quitar',
  'common.add': '+ Añadir',
  'common.none': 'ninguno',

  // ---- onboarding --------------------------------------------------------
  'onboarding.subtitle': 'Toca pictogramas y palabras: SayThrough las dice en voz alta.',
  'onboarding.tagline':
    'Una aplicación de comunicación (CAA) libre y gratuita para personas sin habla o con habla limitada. Sin cuenta y sin suscripción: funciona sin conexión y tus palabras se quedan en este dispositivo.',
  'onboarding.setUp': 'Vamos a crear una voz',
  'onboarding.setUpLabel': 'Configurar SayThrough',
  'onboarding.tryIt': 'Pruébalo primero: no se guarda nada',
  'onboarding.tryItLabel': 'Probar SayThrough',
  'onboarding.backToWelcome': 'Volver al inicio',
  'onboarding.whoFor': '¿Para quién es esta voz?',
  'onboarding.namePlaceholder': 'Nombre (por ejemplo, Maya)',
  'onboarding.nameLabel': 'Nombre del usuario',
  'onboarding.language': 'Idioma',
  'onboarding.languageHint':
    'Define el vocabulario del tablero, la voz y las palabras de la propia aplicación. Puedes cambiarlo después en Ajustes.',
  'onboarding.startingVocabulary': 'Vocabulario inicial',
  'onboarding.startWith': 'Empezar con {name}',
  'onboarding.pinHeading': 'PIN del cuidador (recomendado)',
  'onboarding.pinPlaceholder': 'PIN (4–8 dígitos, opcional)',
  'onboarding.pinLabel': 'PIN del cuidador',
  'onboarding.pinConfirmPlaceholder': 'Confirmar PIN',
  'onboarding.pinConfirmLabel': 'Confirmar el PIN del cuidador',
  'onboarding.finish': 'Terminar configuración',
  'onboarding.errorName': 'Escribe un nombre; podrás cambiarlo más adelante.',
  'onboarding.errorPinDigits': 'El PIN debe tener de 4 a 8 dígitos (o déjalo vacío).',
  'onboarding.errorPinMatch': 'Los PIN no coinciden.',
  'onboarding.audience':
    'Hecha para usuarios de CAA y para las familias, docentes y logopedas que les acompañan.',
  'onboarding.vocabHint':
    'El vocabulario nuclear es lo recomendado para la mayoría: está construido alrededor de las palabras que forman casi todo el habla diaria.',
  'onboarding.pinHint':
    'Protege el modo de edición y los ajustes. Sin PIN, una pulsación larga en cualquier botón abre la edición. Puedes ponerlo más tarde en Ajustes.',
  'onboarding.settingUp': 'Configurando…',
  'onboarding.startTalking': 'Empezar a hablar',

  // ---- message bar -------------------------------------------------------
  'message.speak': 'Hablar',
  'message.speakLabel': 'Decir el mensaje',
  'message.deleteLast': 'Borrar la última palabra',
  'message.actions': 'Acciones del mensaje',
  'message.copy': 'Copiar el mensaje',
  'message.share': 'Compartir el mensaje',
  'message.clear': 'Borrar el mensaje',
  'message.recent': 'Mensajes recientes',
  'message.attention': 'Llamar la atención',
  'message.emergency': 'Decir la frase de emergencia',
  'message.closeRecent': 'Cerrar los mensajes recientes',
  'message.favorites': 'Favoritos',
  'message.recentSection': 'Recientes',
  'message.usePhrase': 'Usar la frase: {text}',

  // ---- top bar / navigation ----------------------------------------------
  'nav.home': 'Inicio',
  'nav.search': 'Buscar en el vocabulario',
  'nav.editMode': 'Modo de edición',
  'nav.sectionCurrent': 'Sección {label}, actual',
  'nav.section': 'Sección {label}',

  'toolbar.core': 'Nuclear',
  'toolbar.quick': 'Rápidas',
  'toolbar.keys': 'Teclas',

  // ---- search ------------------------------------------------------------
  'search.placeholder': 'Buscar una palabra…',
  'search.close': 'Cerrar la búsqueda',
  'search.addResult': 'Añadir {word}, de {page}',
  'search.speakResult': 'Decir {word}',

  // ---- prediction / keyboard ---------------------------------------------
  'prediction.bar': 'Palabras sugeridas',
  'prediction.insert': 'Insertar {word}',
  'keyboard.space': 'espacio',
  'keyboard.speak': '▶ Hablar',
  'keyboard.done': 'Listo',

  // ---- word forms --------------------------------------------------------
  'forms.title': 'Formas de «{word}»',
  'forms.insert': 'Insertar {word}',

  // ---- edit mode ---------------------------------------------------------
  'edit.doneEditing': 'Terminar de editar',
  'edit.undo': 'Deshacer',
  'edit.redo': 'Rehacer',
  'edit.pageOptions': 'Opciones de la página',
  'edit.page': 'Página…',
  'edit.openSettings': 'Abrir los ajustes',
  'edit.settings': 'Ajustes',
  'edit.label': 'Etiqueta',
  'edit.labelPlaceholder': '¿Qué debe decir este botón?',
  'edit.labelAccessibility': 'Etiqueta del botón',
  'edit.symbol': 'Pictograma',
  'edit.changeSymbol': 'Cambiar…',
  'edit.changeSymbolLabel': 'Cambiar el pictograma',
  'edit.photo': 'Foto…',
  'edit.photoLabel': 'Usar una foto como pictograma',
  'edit.removeSymbol': 'Quitar el pictograma',
  'edit.opens': 'Este botón abre',
  'edit.linkToPage': 'Enlazar el botón con una página',
  'edit.goToPage': 'Ir a la página',
  'edit.goToLinkedPage': 'Ir a la página enlazada',
  'edit.color': 'Color',
  'edit.colorSwatch': 'Color {color}',
  'edit.deleteButton': 'Eliminar el botón',
  'edit.deleteButtonLabel': 'Eliminar el botón',
  'edit.saveButton': 'Guardar el botón',
  'edit.opensTitle': 'Este botón abre…',
  'edit.linkToNamedPage': 'Enlazar con la página {name}',
  'edit.orNewPage': '…o una página nueva',
  'edit.newPagePlaceholder': 'Nombre de la página nueva (por ejemplo, Minecraft)',
  'edit.newPageLabel': 'Nombre de la página nueva',
  'edit.includeCore': 'Incluir el vocabulario nuclear en la página nueva',
  'edit.createAndLink': 'Crear la página y enlazarla',
  'edit.removeLink': 'Quitar el enlace',
  'edit.cancelLink': 'Cancelar el enlace de página',
  'edit.searchSymbols': 'Buscar pictogramas…',
  'edit.searchSymbolsLabel': 'Buscar pictogramas',
  'edit.closePicker': 'Cerrar el selector de pictogramas',
  'edit.symbolResult': 'Pictograma {label}',

  // ---- PIN ---------------------------------------------------------------
  'pin.title': 'Introduce el PIN del cuidador',
  'pin.input': 'Campo del PIN',
  'pin.cancel': 'Cancelar la introducción del PIN',
  'pin.submit': 'Enviar el PIN',
  'pin.newPlaceholder': 'PIN nuevo',
  'pin.confirmPlaceholder': 'Confirmar PIN',
  'pin.save': 'Guardar el PIN',
  'pin.set': 'Poner un PIN',
  'pin.change': 'Cambiar el PIN',
  'pin.remove': 'Quitar el PIN',

  // ---- settings ----------------------------------------------------------
  'settings.title': 'Ajustes',
  'settings.backToCommunication': 'Volver a la comunicación',

  'settings.profile': 'Perfil',
  'settings.name': 'Nombre',
  'settings.nameLabel': 'Nombre del perfil',
  'settings.switchProfile': 'Cambiar de perfil',
  'settings.newProfilePlaceholder': 'Nombre del perfil nuevo',
  'settings.newProfileLabel': 'Nombre del perfil nuevo',
  'settings.addProfile': 'Añadir un perfil',

  'settings.language': 'Idioma',
  'settings.languageHint':
    'Cambia el vocabulario del tablero, la voz predeterminada y las palabras de la propia aplicación. Tus páginas, listas de palabras e historial se conservan.',
  'settings.languageSwitch': 'Cambiar a {name}',

  'settings.speech': 'Habla',
  'settings.voice': 'Voz',
  'settings.selectVoice': 'Elegir la voz {name}',
  'settings.previewVoice': 'Escuchar la voz {name}',
  'settings.noVoices': 'Este dispositivo aún no ha indicado ninguna voz.',
  'settings.speed': 'Velocidad',
  'settings.pitch': 'Tono',
  'settings.speakOnSelect': 'Decir cada palabra al tocarla',
  'settings.returnHome': 'Volver al inicio después de hablar',
  'settings.clearAfter': 'Borrar el mensaje después de hablar',

  'settings.quickButtons': 'Botones rápidos',
  'settings.attentionBell': 'Timbre de atención',
  'settings.emergencyPhrase': 'Frase de emergencia',
  'settings.emergencyPlaceholder': 'Necesito ayuda.',

  'settings.accessMethod': 'Método de acceso',
  'settings.howSelects': 'Cómo selecciona esta persona',
  'settings.touch': 'Toque',
  'settings.dwell': 'Espera (mantener encima)',
  'settings.scanning': 'Barrido con pulsador',
  'settings.holdToActivate': 'Mantener pulsado para activar',
  'settings.ignoreRepeat': 'Ignorar toques repetidos durante',
  'settings.ignoreSecondTouch': 'Ignorar el segundo toque',
  'settings.hoverTime': 'Tiempo de espera para seleccionar',
  'settings.dwellHint':
    'Mantén el puntero sobre un botón (ratón, ratón de cabeza o mirada que mueva el cursor); se selecciona cuando la barra se llena. Aparta el puntero para cancelar.',
  'settings.scanStyle': 'Tipo de barrido',
  'settings.scanAuto': 'Automático (1 pulsador)',
  'settings.scanStep': 'Por pasos (2 pulsadores)',
  'settings.pattern': 'Patrón',
  'settings.rowColumn': 'Fila y luego columna',
  'settings.linear': 'Uno por uno',
  'settings.scanSpeed': 'Velocidad del barrido',
  'settings.scanAuditory': 'Decir cada elemento al resaltarlo',
  'settings.scanAuditoryLabel': 'Aviso sonoro del barrido',
  'settings.scanHint':
    'El pulsador es la barra espaciadora (seleccionar) y, en modo por pasos, Intro (avanzar). La mayoría de los pulsadores Bluetooth imitan estas teclas. La asignación de dos pulsadores y el barrido por bloques llegarán pronto.',

  'settings.display': 'Pantalla',
  'settings.appearance': 'Apariencia',
  'settings.themeLight': 'Claro',
  'settings.themeDark': 'Oscuro',
  'settings.themeSystem': 'Del sistema',
  'settings.barPosition': 'Posición de la barra de mensaje',
  'settings.barTop': 'Arriba',
  'settings.barBottom': 'Abajo (más fácil de alcanzar)',
  'settings.buttonGap': 'Espacio entre botones',
  'settings.gapCompact': 'Compacto',
  'settings.gapNormal': 'Normal',
  'settings.gapWide': 'Amplio',
  'settings.textSize': 'Tamaño del texto de los botones',

  'settings.vocabulary': 'Vocabulario',
  'settings.activePageSet': 'Conjunto de páginas activo',

  'settings.vocabularyFilter': 'Filtro de vocabulario',
  'settings.filterHint':
    'Limita qué palabras están activas durante la terapia. Las palabras que no están en la lista siguen visibles (para que el interlocutor pueda modelar), pero no responden.',
  'settings.wordLists': 'Listas de palabras',
  'settings.selectWords': 'Elegir palabras (tócalas en el tablero)',
  'settings.deleteList': 'Eliminar la lista',
  'settings.newListPlaceholder': 'Nombre de la lista (por ejemplo, Palabras semana 1)',
  'settings.newListLabel': 'Nombre de la lista de palabras nueva',
  'settings.addList': 'Añadir una lista de palabras',
  'settings.filterOn': 'Filtro activado (también en la barra superior: ⊘)',
  'settings.filterEnabled': 'Filtro de vocabulario activado',

  'settings.security': 'Seguridad',
  'settings.pinHint':
    'El PIN del cuidador protege el modo de edición y los ajustes. Sirve para que un niño no entre sin querer, no como medida de seguridad.',

  'settings.enhancedVoice': 'Voz mejorada',
  'settings.enhancedVoiceHint':
    'Una voz de sonido natural que funciona por completo EN ESTE DISPOSITIVO: no se envía nada a ningún servidor. Es una descarga única de unos 60 MB y después funciona sin conexión. La voz estándar sigue funcionando igualmente.',
  'settings.enhancedVoiceToggle': 'Voz mejorada',
  'settings.enhancedVoiceDownloading': 'Descargando…',

  'settings.vocabularyLevel': 'Nivel de vocabulario',
  'settings.levelHint':
    'Muestra menos palabras mientras alguien está aprendiendo el tablero. Las palabras se quedan en el MISMO sitio en todos los niveles: subir el nivel solo muestra más, así que nada de lo que ya se ha aprendido a alcanzar se mueve nunca.',
  'settings.levelBasic': 'Básico',
  'settings.levelIntermediate': 'Intermedio',
  'settings.levelFull': 'Completo',

  'settings.wordPrediction': 'Predicción de palabras',
  'settings.predictionHint':
    'Sugiere palabras encima del teclado mientras escribes. Aprende de los mensajes que dices —incluidas las palabras tocadas en el tablero—, así que las palabras que de verdad usas salen primero. Las palabras aprendidas se quedan EN ESTE DISPOSITIVO.',
  'settings.predictionToggle': 'Sugerir palabras al escribir',
  'settings.predictionLabel': 'Predicción de palabras activada',
  'settings.clearLearned': 'Borrar las palabras aprendidas',
  'settings.learnedCleared': 'Palabras aprendidas borradas',

  'settings.dataTracking': 'Registro de datos',
  'settings.trackingHint':
    'Desactivado de forma predeterminada. Cuando un cuidador lo activa, las pulsaciones de botones y los mensajes dichos se registran SOLO EN ESTE DISPOSITIVO y no se envían a ninguna parte. Los logopedas lo usan para documentar el progreso.',
  'settings.trackingToggle': 'Registrar los datos de comunicación',
  'settings.trackingLabel': 'Registro de datos activado',
  'settings.viewReport': 'Ver el informe',

  'settings.privacy': 'Privacidad',
  'settings.privacyHint':
    'Mientras la aplicación está abierta envía un aviso, para que el proyecto sepa si alguien la está usando. El aviso lleva un código aleatorio que cambia cada vez que abres la aplicación y que nunca se guarda: ni nombre, ni mensaje, ni nada de lo que escribas.',
  'settings.usageToggle': 'Avisar de que la aplicación está en uso',
  'settings.usageLabel': 'Avisar del uso de la aplicación',

  'settings.backup': 'Copia de seguridad',
  'settings.backupHint':
    'Una copia completa guarda TODO lo que hay en este dispositivo —perfiles, ajustes de voz y de acceso, tus páginas, listas de palabras, historial y registro— en un solo archivo. Úsala para pasar a un dispositivo nuevo o para recuperarlo si se borra el almacenamiento del navegador.',
  'settings.saveBackup': 'Guardar una copia completa',
  'settings.restoreBackup': 'Restaurar desde una copia',
  'settings.chooseDifferent': 'Elegir otro archivo',
  'settings.confirmRestore': 'Confirmar la restauración',
  'settings.obfHint':
    'El formato Open Board (.obz) mueve SOLO EL VOCABULARIO entre aplicaciones: funciona con CoughDrop, TD Snap y otras, pero no lleva perfiles ni ajustes. Para eso usa la copia completa de arriba.',
  'settings.exportObz': 'Exportar el conjunto activo (.obz)',
  'settings.importObz': 'Importar .obz',
  'settings.restoreBuiltIn': 'Restaurar los conjuntos originales',
  'settings.restoreArmed': 'Toca otra vez para restaurar',

  'settings.install': 'Instalación',
  'settings.installed': 'Instalada ✓: SayThrough se abre a pantalla completa y funciona sin conexión.',
  'settings.installHint':
    'Instala SayThrough en la pantalla de inicio: se abre como una aplicación normal, funciona sin conexión y el navegador protege mejor su almacenamiento.',
  'settings.installButton': 'Instalar la aplicación',
  'settings.installIosHint':
    'Para instalarla en iPad o iPhone: en Safari, toca Compartir (□↑) → «Añadir a pantalla de inicio». SayThrough se abrirá a pantalla completa y funcionará sin conexión.',

  'settings.about': 'Acerca de',

  // ---- setting presets ---------------------------------------------------
  'preset.slow': 'Lenta',
  'preset.normal': 'Normal',
  'preset.fast': 'Rápida',
  'preset.low': 'Grave',
  'preset.high': 'Aguda',
  'preset.off': 'Desactivado',
  'preset.d300': '0,3 s',
  'preset.d500': '0,5 s',
  'preset.d600': '0,6 s',
  'preset.d1000': '1 s',
  'preset.d1500': '1,5 s',
  'preset.d2500': '2,5 s',
  'preset.scanSlow': 'Lento (2,5 s)',
  'preset.scanMedium': 'Medio (1,5 s)',
  'preset.scanFast': 'Rápido (1 s)',
  'settings.standardVoice': 'Voz estándar',
  'settings.useStandardVoice': 'Usar la voz estándar',

  // ---- status messages ---------------------------------------------------
  'status.exporting': 'Exportando…',
  'status.exported': 'Exportado.',
  'status.restoring': 'Restaurando…',
  'status.restored': 'Restaurado.',
  'status.importing': 'Importando…',
  'status.backupSaved':
    'Copia completa guardada. Guárdala en un lugar seguro: contiene los perfiles y el historial de este dispositivo.',
  'status.backupDescribed':
    'Copia del {when} — {count} perfil(es): {names}. Restaurar SUSTITUYE todo lo que hay ahora en este dispositivo. Toca «Confirmar la restauración» para continuar.',
  'status.restoreFailed': 'Fallo al restaurar: {error}',
  'status.imported': '«{name}» importado: selecciónalo en Vocabulario.',
  'status.importFailed': 'Fallo al importar: {error}',
  'status.builtInRestored': 'Conjuntos originales restaurados.',
  'status.voiceDownloading': 'Descargando la voz… {percent} %',
  'status.voiceReady': 'Voz mejorada lista.',
  'settings.aboutBody':
    'SayThrough: CAA libre y de código abierto. El código de la aplicación tiene licencia MIT.',
  'settings.aboutSymbols':
    'Pictogramas © Gobierno de Aragón (España), creados por Sergio Palao para ARASAAC (https://arasaac.org), distribuidos con licencia Creative Commons BY-NC-SA 4.0.',
  'settings.aboutMulberry': 'Símbolos Mulberry © Steve Lee, CC BY-SA 4.0.',

  'settings.previewText': '¡Hola! Así es como sueno.',
  'status.voiceFailed': '{reason} Se sigue usando la voz estándar.',
  'status.voiceFailedDefault': 'No se ha podido cargar la voz mejorada.',
  'status.rebuildArmed':
    'Esto reconstruye desde cero los tableros originales y las frases rápidas; tus propias páginas y perfiles se conservan. Toca otra vez para confirmar.',

  // ---- communication screen ----------------------------------------------
  'guest.banner': 'Modo de prueba: no se guarda nada.',
  'guest.setUp': 'Configurar SayThrough',
  'nudge.text': 'Tu vocabulario tiene cambios sin guardar. ¿Hacer una copia ahora?',
  'nudge.action': 'Hacer una copia',
  'nudge.dismiss': 'Descartar el aviso de copia',
  'page.title': 'Página: {name}',
  'page.nameLabel': 'Nombre de la página',
  'page.rename': 'Cambiar el nombre',
  'page.renameLabel': 'Cambiar el nombre de la página',
  'page.deleteLabel': 'Eliminar la página',
  'page.delete': 'Eliminar la página (los botones que la abren pasan a ser palabras)',
  'page.homeUndeletable': 'La página de inicio no se puede eliminar.',

  'settings.grammaticalGender': 'Género gramatical',
  'settings.genderHint':
    'El polaco marca el género de quien habla en el pasado: «byłem» para un hombre, «byłam» para una mujer. Si lo configuras, esa forma se ofrece primero, para que el tablero no se equivoque de género con su usuario. Si lo dejas sin definir, se ofrecen las dos formas, etiquetadas.',
  'settings.genderMasculine': 'Masculino',
  'settings.genderFeminine': 'Femenino',
  'settings.genderUnset': 'Preguntar cada vez',

  'edit.editingPage': 'Editando: {name}',
  'edit.tapForList': 'Toca las palabras de la lista: {name}',
  'edit.addButtonAt': 'Añadir un botón en la fila {row}, columna {column}',
  'message.star': 'Marcar como favorita: {text}',
  'message.unstar': 'Quitar de favoritas: {text}',

  // ---- tracking report ---------------------------------------------------
  'report.title': 'Datos de comunicación',
  'report.backToSettings': 'Volver a los ajustes',
  'report.pressesToday': 'Botones hoy',
  'report.messagesToday': 'Mensajes hoy',
  'report.presses7d': 'Botones (7 días)',
  'report.messages7d': 'Mensajes (7 días)',
  'report.mostUsed': 'Palabras más usadas (7 días)',
}
