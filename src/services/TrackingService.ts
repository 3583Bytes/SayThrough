import { storage } from '../storage'
import { useUserStore } from '../stores/userStore'
import type { Button } from '../types/models'
import { uuid } from '../utils/uuid'

// §4.13 — logs only when the caregiver has opted in (trackingEnabled,
// default OFF per DT-05). All data stays on device. Modeling mode
// arrives with the SLP tooling.
const sessionId = uuid() // groups events within one app launch

function log(event: {
  eventType: 'button_press' | 'message_spoken'
  buttonId?: string
  buttonLabel?: string
  pageId?: string
}): void {
  const user = useUserStore.getState().activeUser
  if (!user?.trackingEnabled) return
  void storage.logTrackingEvent({
    id: uuid(),
    userId: user.id,
    timestamp: Date.now(),
    accessMethod: 'touch', // DT-01; scanning/dwell report theirs in v1.1
    isModeling: false,
    sessionId,
    ...event,
  })
}

export function logButtonPress(button: Button, pageId: string): void {
  log({
    eventType: 'button_press',
    buttonId: button.id,
    buttonLabel: button.label,
    pageId,
  })
}

export function logMessageSpoken(message: string): void {
  log({ eventType: 'message_spoken', buttonLabel: message })
}
