import { defineStore } from 'pinia'
import {
  LOAN_APPLICATION_STEPS,
  SENSITIVE_APPLICATION_FIELDS,
  type LoanApplicationInput,
  type LoanApplicationStep,
} from '#contracts'

const STORAGE_KEY = 'loan-application-draft:v1'

interface PersistedDraft {
  step: LoanApplicationStep
  values: Partial<LoanApplicationInput>
  savedAt: string
}

/**
 * Multi-step wizard state (client state → Pinia). The draft survives reloads
 * via sessionStorage, but PII such as the national ID is never written to
 * browser storage.
 */
export const useLoanApplicationStore = defineStore('loan-application', () => {
  const step = ref<LoanApplicationStep>('personal')
  const values = ref<Partial<LoanApplicationInput>>({})
  const savedAt = ref<string | null>(null)

  const stepIndex = computed(() => LOAN_APPLICATION_STEPS.indexOf(step.value))

  function save(nextValues: Partial<LoanApplicationInput>, nextStep: LoanApplicationStep) {
    values.value = { ...nextValues }
    step.value = nextStep
    savedAt.value = new Date().toISOString()

    const sensitive = new Set<string>(SENSITIVE_APPLICATION_FIELDS)
    const persisted: PersistedDraft = {
      step: nextStep,
      values: Object.fromEntries(Object.entries(nextValues).filter(([key]) => !sensitive.has(key))),
      savedAt: savedAt.value,
    }
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(persisted))
    } catch {
      // Storage can be unavailable (private mode, quota) — the in-memory draft still works.
    }
  }

  /** Returns true when a previously saved draft was restored. */
  function restore(): boolean {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY)
      if (!raw) return false
      const draft = JSON.parse(raw) as PersistedDraft
      if (!LOAN_APPLICATION_STEPS.includes(draft.step)) return false
      values.value = draft.values ?? {}
      step.value = draft.step
      savedAt.value = draft.savedAt
      return true
    } catch {
      return false
    }
  }

  function reset() {
    values.value = {}
    step.value = 'personal'
    savedAt.value = null
    try {
      sessionStorage.removeItem(STORAGE_KEY)
    } catch {
      /* ignore */
    }
  }

  return { step, stepIndex, values, savedAt, save, restore, reset }
})
