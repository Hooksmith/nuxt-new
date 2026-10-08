import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { useForm } from 'vee-validate'
import { loginSchema } from '#contracts'
import LoanStatusBadge from '../../../../layers/base/app/components/loan/StatusBadge.vue'
import UiPagination from '../../../../layers/base/app/components/ui/Pagination.vue'
import FormTextField from '../../../../layers/base/app/components/form/TextField.vue'
import CreditScoreGauge from '../../app/components/CreditScoreGauge.vue'

describe('LoanStatusBadge', () => {
  it('never relies on colour alone', async () => {
    const wrapper = await mountSuspended(LoanStatusBadge, { props: { status: 'under_review' } })
    expect(wrapper.text()).toContain('Under review')
    expect(wrapper.find('[aria-hidden="true"]').exists()).toBe(true)
  })
})

describe('UiPagination', () => {
  it('marks the current page and emits navigation', async () => {
    const wrapper = await mountSuspended(UiPagination, { props: { page: 5, totalPages: 12 } })
    expect(wrapper.find('nav').attributes('aria-label')).toBe('Pagination')
    expect(wrapper.find('[aria-current="page"]').text()).toContain('5')
    expect(wrapper.text()).toContain('…')

    await wrapper.findAll('button').at(-1)!.trigger('click')
    expect(wrapper.emitted('update:page')).toEqual([[6]])
  })

  it('renders nothing for a single page', async () => {
    const wrapper = await mountSuspended(UiPagination, { props: { page: 1, totalPages: 1 } })
    expect(wrapper.find('nav').exists()).toBe(false)
  })
})

describe('CreditScoreGauge', () => {
  it('exposes the score as a text alternative', async () => {
    const wrapper = await mountSuspended(CreditScoreGauge, { props: { score: 742, band: 'Very good' } })
    expect(wrapper.find('svg').attributes('aria-label')).toBe('Credit score 742 out of 850, rated Very good')
  })
})

describe('FormTextField', () => {
  const LoginForm = defineComponent({
    setup() {
      const form = useForm({
        validationSchema: zodTypedSchema(loginSchema),
        initialValues: { email: '', password: '' },
      })
      return { form }
    },
    render() {
      return h('form', [
        h(FormTextField, { name: 'email', label: 'Email address', type: 'email', hint: 'We never share it' }),
      ])
    },
  })

  it('links label, hint and error message accessibly', async () => {
    const wrapper = await mountSuspended(LoginForm)
    const input = wrapper.find('input')
    expect(wrapper.find('label').attributes('for')).toBe(input.attributes('id'))
    expect(input.attributes('aria-describedby')).toBe('field-email-hint')
    expect(input.attributes('aria-invalid')).toBe('false')

    await input.setValue('not-an-email')
    await input.trigger('blur')

    await vi.waitFor(() => expect(input.attributes('aria-invalid')).toBe('true'))
    expect(input.attributes('aria-describedby')).toBe('field-email-hint field-email-error')
    expect(wrapper.find('#field-email-error').text()).toContain('Enter a valid email address')
  })
})
