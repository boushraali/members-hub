import type { Role, Session } from './types'

/**
 * جلسة المعاينة (Prototype only).
 * في الإنتاج تُستبدل كليًا بجلسة نظام العضويات الحالي (PHP session / cookie)
 * ويحدد الخادم الدور والعضو — لا يُوثق بأي قيمة دور قادمة من المتصفح.
 */

const KEY = 'aia-members-hub:session'
const DEFAULT_SESSION: Session = { role: 'visitor', memberId: null }
export const DEMO_MEMBER_ID = 1001

let current: Session = load()
const listeners = new Set<(s: Session) => void>()

function load(): Session {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Session
      if (['visitor', 'member', 'admin'].includes(parsed.role)) return parsed
    }
  } catch {
    /* التخزين غير متاح — نستخدم الافتراضي */
  }
  return DEFAULT_SESSION
}

export function getSession(): Session {
  return current
}

export function setSession(role: Role, memberId: number | null = null) {
  current = { role, memberId: role === 'member' ? memberId ?? DEMO_MEMBER_ID : null }
  try {
    localStorage.setItem(KEY, JSON.stringify(current))
  } catch {
    /* تجاهل */
  }
  listeners.forEach((l) => l(current))
}

export function subscribeSession(listener: (s: Session) => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
