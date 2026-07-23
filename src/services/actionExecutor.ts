import { useMessageStore } from '../stores/messageStore'
import { useNavigationStore } from '../stores/navigationStore'
import type { Button } from '../types/models'
import { logButtonPress } from './TrackingService'
import { ttsService } from './TTSService'

// §12.1: button actions execute in order on a single tap
export function executeButtonActions(button: Button): void {
  const message = useMessageStore.getState()
  const navigation = useNavigationStore.getState()

  logButtonPress(button, button.pageId) // no-op unless caregiver opted in

  for (const action of button.actions) {
    switch (action.type) {
      case 'append_to_message':
        message.appendToken(action.text ?? button.label)
        break
      case 'speak_label':
        ttsService.speak(button.label)
        break
      case 'speak_message':
        message.speakMessage()
        break
      case 'navigate':
        navigation.navigateTo(action.pageId)
        break
      case 'navigate_back':
        navigation.navigateBack()
        break
      case 'navigate_home':
        navigation.navigateHome()
        break
      case 'clear_message':
        message.clearMessage()
        break
      case 'delete_last_word':
        message.deleteLastToken()
        break
    }
  }
}
