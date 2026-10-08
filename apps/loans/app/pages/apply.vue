<script setup lang="ts">
import { useForm } from 'vee-validate'
import {
  FIELD_STEP,
  LOAN_APPLICATION_STEPS,
  issuesToFieldErrors,
  loanApplicationSchema,
  loanApplicationStepSchemas,
  type LoanApplicationInput,
  type LoanApplicationStep,
} from '#contracts'

useSeoMeta({ title: 'Apply for a loan' })

const STEP_LABELS: Record<LoanApplicationStep, string> = {
  personal: 'About you',
  employment: 'Income',
  loan: 'Loan details',
  review: 'Review',
}

const store = useLoanApplicationStore()
const { polite } = useAnnouncer()
const auth = useAuthStore()
const submitApplication = useSubmitLoanApplication()

const step = ref<LoanApplicationStep>('personal')
const stepIndex = computed(() => LOAN_APPLICATION_STEPS.indexOf(step.value))
const isLastStep = computed(() => step.value === 'review')

const initialValues: Partial<LoanApplicationInput> = {
  fullName: auth.user?.name ?? '',
  email: auth.user?.email ?? '',
  phone: '',
  nationalId: '',
  dateOfBirth: '',
  employerName: '',
  purpose: '',
}

// One form across all steps; only the active step's schema is enforced.
const { handleSubmit, values, errors, setErrors, resetForm, submitCount, validate } = useForm<LoanApplicationInput>({
  validationSchema: computed(() => zodTypedSchema(loanApplicationStepSchemas[step.value])),
  initialValues,
  keepValuesOnUnmount: true,
})

const heading = useTemplateRef<HTMLHeadingElement>('heading')
const summary = useTemplateRef<{ focus: () => void }>('summary')
const showSummary = ref(false)
const formError = ref<string | null>(null)

async function goTo(next: LoanApplicationStep) {
  step.value = next
  showSummary.value = false
  await nextTick()
  heading.value?.focus()
  polite(`Step ${stepIndex.value + 1} of ${LOAN_APPLICATION_STEPS.length}: ${STEP_LABELS[next]}`)
}

/** Sends the customer to the first step with an error and shows the messages there. */
async function showErrorsOnStep(fieldErrors: Record<string, string>) {
  const firstStep = LOAN_APPLICATION_STEPS.find((s) =>
    Object.keys(fieldErrors).some((field) => FIELD_STEP[field as keyof typeof FIELD_STEP] === s),
  )
  if (firstStep && firstStep !== step.value) await goTo(firstStep)
  await validate()
  setErrors(fieldErrors)
  showSummary.value = true
  summary.value?.focus()
}

function onInvalid() {
  showSummary.value = true
  summary.value?.focus()
}

const next = handleSubmit(async () => {
  const nextStep = LOAN_APPLICATION_STEPS[stepIndex.value + 1]!
  store.save({ ...values }, nextStep)
  await goTo(nextStep)
}, onInvalid)

const submit = handleSubmit(async () => {
  formError.value = null
  // Final guard with the full contract (same one the BFF uses).
  const parsed = loanApplicationSchema.safeParse(values)
  if (!parsed.success) return showErrorsOnStep(issuesToFieldErrors(parsed.error.issues))

  try {
    const loan = await submitApplication.mutateAsync(parsed.data)
    store.reset()
    await navigateTo({ path: `/${loan.id}`, query: { submitted: '1' } })
  } catch (error) {
    const fieldErrors = fieldErrorsFrom(error)
    if (fieldErrors) return showErrorsOnStep(fieldErrors)
    formError.value = errorMessage(error)
  }
}, onInvalid)

function back() {
  const previous = LOAN_APPLICATION_STEPS[stepIndex.value - 1]
  if (previous) void goTo(previous)
}

function startOver() {
  store.reset()
  resetForm({ values: initialValues })
  void goTo('personal')
}

onMounted(() => {
  if (store.restore()) {
    resetForm({ values: { ...initialValues, ...store.values } })
    step.value = store.step
    polite('We restored your saved application. For your security, re-enter your national ID and date of birth.')
  }
})
</script>

<template>
  <div class="mx-auto max-w-3xl space-y-6">
    <div>
      <h1 class="text-2xl font-bold sm:text-3xl">Apply for a loan</h1>
      <p class="mt-1 text-fg-muted">It takes about 5 minutes. Your progress is saved on this device as you go.</p>
    </div>

    <ApplyStepper :current="step" :labels="STEP_LABELS" />

    <UiCard>
      <!-- method="post" keeps PII out of the URL if submitted before hydration. -->
      <form method="post" novalidate class="space-y-6" @submit.prevent="isLastStep ? submit() : next()">
        <h2 ref="heading" tabindex="-1" class="text-lg font-semibold focus:outline-none">
          <span class="sr-only">Step {{ stepIndex + 1 }} of {{ LOAN_APPLICATION_STEPS.length }}:</span>
          {{ STEP_LABELS[step] }}
        </h2>

        <UiAlert v-if="store.savedAt && step === 'personal' && submitCount === 0" tone="info">
          Continuing your saved application.
          <button type="button" class="font-semibold underline" @click="startOver">Start over</button>
        </UiAlert>
        <UiAlert v-if="formError" tone="danger">{{ formError }}</UiAlert>
        <FormErrorSummary ref="summary" :errors="showSummary ? errors : {}" />

        <ApplyStepPersonal v-if="step === 'personal'" />
        <ApplyStepEmployment v-else-if="step === 'employment'" />
        <ApplyStepLoan v-else-if="step === 'loan'" />
        <ApplyStepReview v-else @edit="goTo" />

        <div class="flex flex-wrap justify-between gap-3 border-t border-border pt-5">
          <UiButton v-if="stepIndex > 0" variant="secondary" @click="back">Back</UiButton>
          <span v-else />
          <UiButton type="submit" :loading="submitApplication.isPending.value">
            {{ isLastStep ? 'Submit application' : 'Continue' }}
          </UiButton>
        </div>
      </form>
    </UiCard>
  </div>
</template>
