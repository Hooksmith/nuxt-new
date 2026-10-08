import { mountSuspended } from '@nuxt/test-utils/runtime'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { useForm } from 'vee-validate'
import StepEmployment from '../../app/components/apply/StepEmployment.vue'
import RepaymentEstimate from '../../app/components/apply/RepaymentEstimate.vue'
import { useLoanApplicationStore } from '../../app/stores/loanApplication'

describe('loan application draft store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    sessionStorage.clear()
  })

  it('persists the draft but never the national ID or date of birth', () => {
    const store = useLoanApplicationStore()
    store.save({ fullName: 'Dara Sok', nationalId: '123456789', dateOfBirth: '1990-01-01', amount: 5000 }, 'employment')

    const persisted = JSON.parse(sessionStorage.getItem('loan-application-draft:v1')!)
    expect(persisted.step).toBe('employment')
    expect(persisted.values).toEqual({ fullName: 'Dara Sok', amount: 5000 })
    // The in-memory draft keeps everything for the current session.
    expect(store.values.nationalId).toBe('123456789')
  })

  it('restores a saved draft and can be reset', () => {
    useLoanApplicationStore().save({ fullName: 'Dara Sok' }, 'loan')

    setActivePinia(createPinia())
    const restored = useLoanApplicationStore()
    expect(restored.restore()).toBe(true)
    expect(restored.step).toBe('loan')
    expect(restored.values.fullName).toBe('Dara Sok')

    restored.reset()
    expect(sessionStorage.getItem('loan-application-draft:v1')).toBeNull()
    expect(restored.restore()).toBe(false)
  })

  it('ignores corrupted storage', () => {
    sessionStorage.setItem('loan-application-draft:v1', '{not json')
    expect(useLoanApplicationStore().restore()).toBe(false)
  })
})

describe('StepEmployment', () => {
  function withForm(initialValues: Record<string, unknown>) {
    return defineComponent({
      setup() {
        useForm({ initialValues })
        return () => h(StepEmployment)
      },
    })
  }

  it('asks for an employer only when employed or self-employed', async () => {
    const wrapper = await mountSuspended(withForm({ employmentStatus: 'retired' }))
    expect(wrapper.find('#field-employerName').exists()).toBe(false)

    await wrapper.find('input[value="employed"]').setValue(true)
    await nextTick()
    expect(wrapper.find('#field-employerName').exists()).toBe(true)
    expect(wrapper.find('fieldset legend').text()).toBe('Employment status')
  })
})

describe('RepaymentEstimate', () => {
  it('shows the monthly repayment and flags unaffordable loans', async () => {
    const wrapper = await mountSuspended(RepaymentEstimate, {
      props: { product: 'personal', amount: 20_000, termMonths: 12, monthlyIncome: 1_000 },
    })
    expect(wrapper.text()).toContain('$1,772.30')
    expect(wrapper.find('.text-red-700').text()).toBe('177%')
  })

  it('renders nothing until the inputs are complete', async () => {
    const wrapper = await mountSuspended(RepaymentEstimate, { props: { product: 'personal' } })
    expect(wrapper.find('aside').exists()).toBe(false)
  })
})
