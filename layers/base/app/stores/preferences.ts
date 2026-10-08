import { defineStore } from 'pinia'

/**
 * UI preferences (pure client state, no server round-trip). Stored in a
 * cookie rather than localStorage so SSR renders the same markup.
 */
export const usePreferencesStore = defineStore('preferences', () => {
  const cookie = useCookie<boolean>('pref_hide_balances', {
    default: () => false,
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 365,
  })

  const hideBalances = computed({
    get: () => cookie.value,
    set: (value: boolean) => {
      cookie.value = value
    },
  })

  function toggleBalances() {
    hideBalances.value = !hideBalances.value
  }

  return { hideBalances, toggleBalances }
})
