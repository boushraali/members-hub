import type { MembersHubApi } from './api'
import { HttpApi } from './http/httpApi'
import { MockApi } from './mock/mockApi'

/** اختيار مصدر البيانات: VITE_DATA_SOURCE=mock (افتراضي) أو http */
export const DATA_SOURCE: 'mock' | 'http' = import.meta.env.VITE_DATA_SOURCE === 'http' ? 'http' : 'mock'

export const api: MembersHubApi =
  DATA_SOURCE === 'http' ? new HttpApi(import.meta.env.VITE_API_BASE ?? '/members/api/v1') : new MockApi()

export const isMock = DATA_SOURCE === 'mock'

export function resetMockData() {
  if (api instanceof MockApi) api.reset()
}
