import type { StringKey } from './en'

// Brazilian Portuguese UI strings. Typed as a complete map of `StringKey`, so
// adding a key to `en.ts` without translating it here fails the build.
//
// Variety: pt-BR, not pt-PT. The two diverge enough in everyday register
// (`você` vs `tu`, gerund vs `a` + infinitive for the progressive, `celular`
// vs `telemóvel`) that serving one string set to both would read as foreign to
// each. Brazil is also where the reach is.
//
// Register: informal `você`, matching the other tables — the reader is a
// parent, teacher or fonoaudiólogo setting up a device for someone they know.
// Terminology follows Brazilian CAA usage: "prancha" for a board, "símbolo"
// for a pictogram, "fonoaudiólogo" for the clinician, "cuidador" for the
// caregiver.

export const PT: Record<StringKey, string> = {
  // ---- app-wide ----------------------------------------------------------
  'app.name': 'SayThrough',
  'common.back': '← Voltar',
  'common.done': 'Pronto',
  'common.cancel': 'Cancelar',
  'common.remove': 'Remover',
  'common.add': '+ Adicionar',
  'common.none': 'nenhum',

  // ---- onboarding --------------------------------------------------------
  'onboarding.subtitle': 'Toque em símbolos e palavras — o SayThrough fala em voz alta.',
  'onboarding.tagline':
    'Um aplicativo de comunicação (CAA) livre e gratuito para pessoas não falantes ou com fala limitada. Sem conta e sem assinatura — funciona offline e suas palavras ficam neste aparelho.',
  'onboarding.setUp': 'Vamos criar uma voz',
  'onboarding.setUpLabel': 'Configurar o SayThrough',
  'onboarding.tryIt': 'Experimente primeiro — nada é salvo',
  'onboarding.tryItLabel': 'Experimentar o SayThrough',
  'onboarding.backToWelcome': 'Voltar para o início',
  'onboarding.whoFor': 'Para quem é esta voz?',
  'onboarding.namePlaceholder': 'Nome (por exemplo, Maya)',
  'onboarding.nameLabel': 'Nome do usuário',
  'onboarding.language': 'Idioma',
  'onboarding.languageHint':
    'Define o vocabulário da prancha, a voz e as palavras do próprio aplicativo. Você pode mudar depois nos Ajustes.',
  'onboarding.startingVocabulary': 'Vocabulário inicial',
  'onboarding.startWith': 'Começar com {name}',
  'onboarding.pinHeading': 'PIN do cuidador (recomendado)',
  'onboarding.pinPlaceholder': 'PIN (4 a 8 dígitos, opcional)',
  'onboarding.pinLabel': 'PIN do cuidador',
  'onboarding.pinConfirmPlaceholder': 'Confirmar PIN',
  'onboarding.pinConfirmLabel': 'Confirmar o PIN do cuidador',
  'onboarding.finish': 'Concluir a configuração',
  'onboarding.errorName': 'Digite um nome — dá para mudar depois.',
  'onboarding.errorPinDigits': 'O PIN precisa ter de 4 a 8 dígitos (ou deixe vazio).',
  'onboarding.errorPinMatch': 'Os PINs não são iguais.',
  'onboarding.audience':
    'Feito para usuários de CAA e para as famílias, professores e fonoaudiólogos que os acompanham.',
  'onboarding.vocabHint':
    'O vocabulário nuclear é o recomendado para a maioria — ele é construído em torno das palavras que formam quase toda a fala do dia a dia.',
  'onboarding.pinHint':
    'Protege o modo de edição e os ajustes. Sem PIN, um toque longo em qualquer botão abre a edição. Você pode definir um depois nos Ajustes.',
  'onboarding.settingUp': 'Configurando…',
  'onboarding.startTalking': 'Começar a falar',

  // ---- message bar -------------------------------------------------------
  'message.speak': 'Falar',
  'message.speakLabel': 'Falar a mensagem',
  'message.deleteLast': 'Apagar a última palavra',
  'message.actions': 'Ações da mensagem',
  'message.copy': 'Copiar a mensagem',
  'message.share': 'Compartilhar a mensagem',
  'message.clear': 'Limpar a mensagem',
  'message.recent': 'Mensagens recentes',
  'message.attention': 'Chamar a atenção',
  'message.emergency': 'Falar a frase de emergência',
  'message.closeRecent': 'Fechar as mensagens recentes',
  'message.favorites': 'Favoritas',
  'message.recentSection': 'Recentes',
  'message.usePhrase': 'Usar a frase: {text}',
  'message.star': 'Marcar como favorita: {text}',
  'message.unstar': 'Desmarcar como favorita: {text}',

  // ---- top bar / navigation ----------------------------------------------
  'nav.home': 'Início',
  'nav.search': 'Buscar no vocabulário',
  'nav.editMode': 'Modo de edição',
  'nav.sectionCurrent': 'Seção {label}, atual',
  'nav.section': 'Seção {label}',

  'toolbar.core': 'Nuclear',
  'toolbar.quick': 'Rápidas',
  'toolbar.keys': 'Teclas',

  // ---- search ------------------------------------------------------------
  'search.placeholder': 'Encontrar uma palavra…',
  'search.close': 'Fechar a busca',
  'search.addResult': 'Adicionar {word}, de {page}',
  'search.speakResult': 'Falar {word}',

  // ---- prediction / keyboard ---------------------------------------------
  'prediction.bar': 'Palavras sugeridas',
  'prediction.insert': 'Inserir {word}',
  'keyboard.space': 'espaço',
  'keyboard.speak': '▶ Falar',
  'keyboard.done': 'Pronto',

  // ---- word forms --------------------------------------------------------
  'forms.title': 'Formas de “{word}”',
  'forms.insert': 'Inserir {word}',

  // ---- edit mode ---------------------------------------------------------
  'edit.doneEditing': 'Terminar a edição',
  'edit.undo': 'Desfazer',
  'edit.redo': 'Refazer',
  'edit.pageOptions': 'Opções da página',
  'edit.page': 'Página…',
  'edit.openSettings': 'Abrir os ajustes',
  'edit.settings': 'Ajustes',
  'edit.label': 'Etiqueta',
  'edit.labelPlaceholder': 'O que este botão deve dizer?',
  'edit.labelAccessibility': 'Etiqueta do botão',
  'edit.symbol': 'Símbolo',
  'edit.changeSymbol': 'Trocar…',
  'edit.changeSymbolLabel': 'Trocar o símbolo',
  'edit.photo': 'Foto…',
  'edit.photoLabel': 'Usar uma foto como símbolo',
  'edit.removeSymbol': 'Remover o símbolo',
  'edit.opens': 'Este botão abre',
  'edit.linkToPage': 'Ligar o botão a uma página',
  'edit.goToPage': 'Ir para a página',
  'edit.goToLinkedPage': 'Ir para a página ligada',
  'edit.color': 'Cor',
  'edit.colorSwatch': 'Cor {color}',
  'edit.deleteButton': 'Excluir o botão',
  'edit.deleteButtonLabel': 'Excluir o botão',
  'edit.saveButton': 'Salvar o botão',
  'edit.opensTitle': 'Este botão abre…',
  'edit.linkToNamedPage': 'Ligar à página {name}',
  'edit.orNewPage': '…ou uma página nova',
  'edit.newPagePlaceholder': 'Nome da página nova (por exemplo, Minecraft)',
  'edit.newPageLabel': 'Nome da página nova',
  'edit.includeCore': 'Incluir o vocabulário nuclear na página nova',
  'edit.createAndLink': 'Criar a página e ligar',
  'edit.removeLink': 'Remover a ligação',
  'edit.cancelLink': 'Cancelar a ligação de página',
  'edit.searchSymbols': 'Buscar símbolos…',
  'edit.searchSymbolsLabel': 'Buscar símbolos',
  'edit.closePicker': 'Fechar o seletor de símbolos',
  'edit.symbolResult': 'Símbolo {label}',
  'edit.editingPage': 'Editando: {name}',
  'edit.tapForList': 'Toque nas palavras da lista: {name}',
  'edit.addButtonAt': 'Adicionar um botão na linha {row}, coluna {column}',

  // ---- PIN ---------------------------------------------------------------
  'pin.title': 'Digite o PIN do cuidador',
  'pin.input': 'Campo do PIN',
  'pin.cancel': 'Cancelar a digitação do PIN',
  'pin.submit': 'Enviar o PIN',
  'pin.newPlaceholder': 'PIN novo',
  'pin.confirmPlaceholder': 'Confirmar PIN',
  'pin.save': 'Salvar o PIN',
  'pin.set': 'Definir um PIN',
  'pin.change': 'Trocar o PIN',
  'pin.remove': 'Remover o PIN',

  // ---- settings ----------------------------------------------------------
  'settings.title': 'Ajustes',
  'settings.backToCommunication': 'Voltar para a comunicação',

  'settings.profile': 'Perfil',
  'settings.name': 'Nome',
  'settings.nameLabel': 'Nome do perfil',
  'settings.switchProfile': 'Trocar de perfil',
  'settings.newProfilePlaceholder': 'Nome do perfil novo',
  'settings.newProfileLabel': 'Nome do perfil novo',
  'settings.addProfile': 'Adicionar um perfil',

  'settings.language': 'Idioma',
  'settings.languageHint':
    'Muda o vocabulário da prancha, a voz padrão e as palavras do próprio aplicativo. Suas páginas, listas de palavras e histórico são mantidos.',
  'settings.languageSwitch': 'Mudar para {name}',

  'settings.speech': 'Fala',
  'settings.voice': 'Voz',
  'settings.selectVoice': 'Escolher a voz {name}',
  'settings.previewVoice': 'Ouvir a voz {name}',
  'settings.noVoices': 'Este aparelho ainda não informou nenhuma voz.',
  'settings.speed': 'Velocidade',
  'settings.pitch': 'Tom',
  'settings.speakOnSelect': 'Falar cada palavra ao tocar',
  'settings.returnHome': 'Voltar ao início depois de falar',
  'settings.clearAfter': 'Limpar a mensagem depois de falar',

  'settings.quickButtons': 'Botões rápidos',
  'settings.attentionBell': 'Sino de atenção',
  'settings.emergencyPhrase': 'Frase de emergência',
  'settings.emergencyPlaceholder': 'Preciso de ajuda.',

  'settings.accessMethod': 'Método de acesso',
  'settings.howSelects': 'Como esta pessoa seleciona',
  'settings.touch': 'Toque',
  'settings.dwell': 'Espera (passar por cima)',
  'settings.scanning': 'Varredura com acionador',
  'settings.holdToActivate': 'Segurar para ativar',
  'settings.ignoreRepeat': 'Ignorar toques repetidos por',
  'settings.ignoreSecondTouch': 'Ignorar o segundo toque',
  'settings.hoverTime': 'Tempo de espera para selecionar',
  'settings.dwellHint':
    'Mantenha o ponteiro sobre um botão (mouse, mouse de cabeça ou olhar que move o cursor); a seleção acontece quando a barra enche. Afaste o ponteiro para cancelar.',
  'settings.scanStyle': 'Tipo de varredura',
  'settings.scanAuto': 'Automática (1 acionador)',
  'settings.scanStep': 'Por passos (2 acionadores)',
  'settings.pattern': 'Padrão',
  'settings.rowColumn': 'Linha e depois coluna',
  'settings.linear': 'Um por vez',
  'settings.scanSpeed': 'Velocidade da varredura',
  'settings.scanAuditory': 'Falar cada item ao destacar',
  'settings.scanAuditoryLabel': 'Aviso sonoro da varredura',
  'settings.scanHint':
    'O acionador é a barra de espaço (selecionar) e, no modo por passos, Enter (avançar). A maioria dos acionadores Bluetooth imita essas teclas. O mapeamento de dois acionadores e a varredura por blocos vêm em seguida.',

  'settings.display': 'Tela',
  'settings.appearance': 'Aparência',
  'settings.themeLight': 'Claro',
  'settings.themeDark': 'Escuro',
  'settings.themeSystem': 'Do sistema',
  'settings.barPosition': 'Posição da barra de mensagem',
  'settings.barTop': 'Em cima',
  'settings.barBottom': 'Embaixo (mais fácil de alcançar)',
  'settings.buttonGap': 'Espaço entre os botões',
  'settings.gapCompact': 'Compacto',
  'settings.gapNormal': 'Normal',
  'settings.gapWide': 'Amplo',
  'settings.textSize': 'Tamanho do texto dos botões',

  'settings.vocabulary': 'Vocabulário',
  'settings.activePageSet': 'Conjunto de páginas ativo',

  'settings.vocabularyFilter': 'Filtro de vocabulário',
  'settings.filterHint':
    'Limita quais palavras ficam ativas durante a terapia. As palavras fora da lista continuam visíveis (para o parceiro poder modelar), mas não respondem.',
  'settings.wordLists': 'Listas de palavras',
  'settings.selectWords': 'Escolher palavras (toque nelas na prancha)',
  'settings.deleteList': 'Excluir a lista',
  'settings.newListPlaceholder': 'Nome da lista (por exemplo, Palavras da semana 1)',
  'settings.newListLabel': 'Nome da lista de palavras nova',
  'settings.addList': 'Adicionar uma lista de palavras',
  'settings.filterOn': 'Filtro ligado (também na barra superior: ⊘)',
  'settings.filterEnabled': 'Filtro de vocabulário ligado',

  'settings.security': 'Segurança',
  'settings.pinHint':
    'O PIN do cuidador protege o modo de edição e os ajustes. Serve para uma criança não entrar sem querer, não como segurança de dados.',

  'settings.enhancedVoice': 'Voz aprimorada',
  'settings.enhancedVoiceHint':
    'Uma voz de som natural que funciona inteiramente NESTE APARELHO — nada é enviado para nenhum servidor. É um download único de cerca de 60 MB e depois funciona offline. A voz padrão continua funcionando de qualquer jeito.',
  'settings.enhancedVoiceToggle': 'Voz aprimorada',
  'settings.enhancedVoiceDownloading': 'Baixando…',

  'settings.vocabularyLevel': 'Nível de vocabulário',
  'settings.levelHint':
    'Mostra menos palavras enquanto alguém está aprendendo a prancha. As palavras ficam no MESMO lugar em todos os níveis — subir o nível só revela mais, então nada que a pessoa já aprendeu a alcançar sai do lugar.',
  'settings.levelBasic': 'Básico',
  'settings.levelIntermediate': 'Intermediário',
  'settings.levelFull': 'Completo',

  'settings.wordPrediction': 'Previsão de palavras',
  'settings.predictionHint':
    'Sugere palavras acima do teclado enquanto você digita. Aprende com as mensagens faladas — inclusive com as palavras tocadas na prancha — então as palavras que você realmente usa aparecem primeiro. As palavras aprendidas ficam NESTE APARELHO.',
  'settings.predictionToggle': 'Sugerir palavras ao digitar',
  'settings.predictionLabel': 'Previsão de palavras ligada',
  'settings.clearLearned': 'Limpar as palavras aprendidas',
  'settings.learnedCleared': 'Palavras aprendidas limpas',

  'settings.dataTracking': 'Registro de dados',
  'settings.trackingHint':
    'Desligado por padrão. Quando um cuidador liga, os toques nos botões e as mensagens faladas são registrados SOMENTE NESTE APARELHO e não são enviados a lugar nenhum. Fonoaudiólogos usam isso para documentar o progresso.',
  'settings.trackingToggle': 'Registrar os dados de comunicação',
  'settings.trackingLabel': 'Registro de dados ligado',
  'settings.viewReport': 'Ver o relatório',

  'settings.privacy': 'Privacidade',
  'settings.privacyHint':
    'Enquanto o aplicativo está aberto ele envia um aviso, para o projeto saber se alguém está usando. O aviso leva um código aleatório que muda toda vez que você abre o aplicativo e nunca é guardado — sem nome, sem mensagem, sem nada do que você escreve.',
  'settings.usageToggle': 'Avisar que o aplicativo está em uso',
  'settings.usageLabel': 'Aviso de uso do aplicativo',

  'settings.backup': 'Backup',
  'settings.backupHint':
    'Um backup completo salva TUDO que está neste aparelho — perfis, ajustes de voz e de acesso, suas páginas, listas de palavras, histórico e registros — em um único arquivo. Use para passar para um aparelho novo ou recuperar se o armazenamento do navegador for apagado.',
  'settings.saveBackup': 'Salvar um backup completo',
  'settings.restoreBackup': 'Restaurar de um backup',
  'settings.chooseDifferent': 'Escolher outro arquivo',
  'settings.confirmRestore': 'Confirmar a restauração',
  'settings.obfHint':
    'O formato Open Board (.obz) move SOMENTE O VOCABULÁRIO entre aplicativos — funciona com CoughDrop, TD Snap e outros, mas não leva perfis nem ajustes. Para isso use o backup completo acima.',
  'settings.exportObz': 'Exportar o conjunto ativo (.obz)',
  'settings.importObz': 'Importar .obz',
  'settings.restoreBuiltIn': 'Restaurar os conjuntos originais',
  'settings.restoreArmed': 'Toque de novo para restaurar',

  'settings.install': 'Instalação',
  'settings.installed': 'Instalado ✓ — o SayThrough abre em tela cheia e funciona offline.',
  'settings.installHint':
    'Instale o SayThrough na tela de início: ele abre como um aplicativo normal, funciona offline e o navegador protege melhor o armazenamento dele.',
  'settings.installButton': 'Instalar o aplicativo',
  'settings.installIosHint':
    'Para instalar no iPad ou iPhone: no Safari, toque em Compartilhar (□↑) → “Adicionar à Tela de Início”. O SayThrough vai abrir em tela cheia e funcionar offline.',

  'settings.about': 'Sobre',

  'settings.grammaticalGender': 'Gênero gramatical',
  'settings.genderHint':
    'O polonês marca o gênero de quem fala no passado — “byłem” para um homem, “byłam” para uma mulher. Com isso definido, a forma correspondente é oferecida primeiro, para a prancha não errar o gênero do próprio usuário. Sem definir, as duas formas aparecem identificadas.',
  'settings.genderMasculine': 'Masculino',
  'settings.genderFeminine': 'Feminino',
  'settings.genderUnset': 'Perguntar toda vez',

  // ---- setting presets ---------------------------------------------------
  'preset.slow': 'Devagar',
  'preset.normal': 'Normal',
  'preset.fast': 'Rápido',
  'preset.low': 'Grave',
  'preset.high': 'Agudo',
  'preset.off': 'Desligado',
  'preset.d300': '0,3 s',
  'preset.d500': '0,5 s',
  'preset.d600': '0,6 s',
  'preset.d1000': '1 s',
  'preset.d1500': '1,5 s',
  'preset.d2500': '2,5 s',
  'preset.scanSlow': 'Devagar (2,5 s)',
  'preset.scanMedium': 'Médio (1,5 s)',
  'preset.scanFast': 'Rápido (1 s)',
  'settings.standardVoice': 'Voz padrão',
  'settings.useStandardVoice': 'Usar a voz padrão',
  'settings.previewText': 'Oi! É assim que eu falo.',
  'status.voiceFailed': '{reason} A voz padrão continua sendo usada.',
  'status.voiceFailedDefault': 'Não foi possível carregar a voz aprimorada.',
  'status.rebuildArmed':
    'Isso reconstrói do zero as pranchas originais e as frases rápidas — suas próprias páginas e perfis são mantidos. Toque de novo para confirmar.',

  // ---- communication screen ----------------------------------------------
  'guest.banner': 'Modo de demonstração — nada é salvo.',
  'guest.setUp': 'Configurar o SayThrough',
  'nudge.text': 'Seu vocabulário tem mudanças não salvas — fazer um backup agora?',
  'nudge.action': 'Fazer backup',
  'nudge.dismiss': 'Dispensar o aviso de backup',
  'page.title': 'Página: {name}',
  'page.nameLabel': 'Nome da página',
  'page.rename': 'Renomear',
  'page.renameLabel': 'Renomear a página',
  'page.deleteLabel': 'Excluir a página',
  'page.delete': 'Excluir a página (os botões que a abrem viram palavras comuns)',
  'page.homeUndeletable': 'A página inicial não pode ser excluída.',

  // ---- status messages ---------------------------------------------------
  'status.exporting': 'Exportando…',
  'status.exported': 'Exportado.',
  'status.restoring': 'Restaurando…',
  'status.restored': 'Restaurado.',
  'status.importing': 'Importando…',
  'status.backupSaved':
    'Backup completo salvo. Guarde em um lugar seguro — ele contém os perfis e o histórico deste aparelho.',
  'status.backupDescribed':
    'Backup de {when} — {count} perfil(is): {names}. Restaurar SUBSTITUI tudo que está agora neste aparelho. Toque em “Confirmar a restauração” para continuar.',
  'status.restoreFailed': 'Falha ao restaurar: {error}',
  'status.imported': '“{name}” importado — selecione em Vocabulário.',
  'status.importFailed': 'Falha ao importar: {error}',
  'status.builtInRestored': 'Conjuntos de páginas originais restaurados.',
  'status.voiceDownloading': 'Baixando a voz… {percent}%',
  'status.voiceReady': 'Voz aprimorada pronta.',
  'settings.aboutBody':
    'SayThrough — CAA livre e de código aberto. O código do aplicativo tem licença MIT.',
  'settings.aboutSymbols':
    'Símbolos pictográficos © Governo de Aragão (Espanha), criados por Sergio Palao para o ARASAAC (https://arasaac.org), distribuídos sob Creative Commons BY-NC-SA 4.0.',
  'settings.aboutMulberry': 'Símbolos Mulberry © Steve Lee, CC BY-SA 4.0.',

  // ---- tracking report ---------------------------------------------------
  'report.title': 'Dados de comunicação',
  'report.backToSettings': 'Voltar para os ajustes',
  'report.pressesToday': 'Botões hoje',
  'report.messagesToday': 'Mensagens hoje',
  'report.presses7d': 'Botões (7 dias)',
  'report.messages7d': 'Mensagens (7 dias)',
  'report.mostUsed': 'Palavras mais usadas (7 dias)',
}
