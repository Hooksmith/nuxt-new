<script setup lang="ts">
import { LOAN_PRODUCTS, canTransition } from '#contracts'

const route = useRoute()
const loanId = computed(() => String(route.params.id))
const loanQuery = useLoanQuery(loanId)
const { data: loan, isPending } = loanQuery
useNotFoundGuard(loanQuery, 'Loan not found')
useSeoMeta({ title: () => (loan.value ? `Loan ${loan.value.reference}` : 'Loan') })

useLoanStream()

const justSubmitted = computed(() => route.query.submitted === '1')
const withdraw = useWithdrawLoan(loanId)
const canWithdraw = computed(() => loan.value && canTransition(loan.value.status, 'withdrawn'))
const dialog = useTemplateRef<HTMLDialogElement>('dialog')

async function confirmWithdraw() {
  dialog.value?.close()
  await withdraw.mutateAsync().catch(() => undefined)
}
</script>

<template>
  <div class="space-y-6">
    <NuxtLink to="/" class="text-sm font-medium text-brand-700 hover:underline dark:text-brand-100">
      <span aria-hidden="true">←</span> All loans
    </NuxtLink>

    <UiAlert v-if="justSubmitted" tone="success" title="Application submitted">
      We have received your application. You'll see status updates here as soon as our team reviews it.
    </UiAlert>
    <UiAlert v-if="withdraw.isError.value" tone="danger">{{ errorMessage(withdraw.error.value) }}</UiAlert>

    <UiSkeleton v-if="isPending" class="h-64 w-full" />

    <template v-else-if="loan">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold sm:text-3xl">{{ LOAN_PRODUCTS[loan.product].label }}</h1>
          <p class="text-fg-muted tabular">{{ loan.reference }}</p>
        </div>
        <div class="flex items-center gap-3">
          <LoanStatusBadge :status="loan.status" />
          <UiButton
            v-if="canWithdraw"
            variant="secondary"
            size="sm"
            :loading="withdraw.isPending.value"
            @click="dialog?.showModal()"
          >
            Withdraw application
          </UiButton>
        </div>
      </div>

      <div class="grid gap-6 lg:grid-cols-3">
        <UiCard title="Summary" class="lg:col-span-2">
          <dl class="grid gap-4 text-sm sm:grid-cols-3">
            <div>
              <dt class="text-fg-muted">Loan amount</dt>
              <dd class="text-lg font-semibold"><UiAmount :money="loan.principal" /></dd>
            </div>
            <div>
              <dt class="text-fg-muted">Monthly repayment</dt>
              <dd class="text-lg font-semibold"><UiAmount :money="loan.monthlyPayment" /></dd>
            </div>
            <div>
              <dt class="text-fg-muted">Interest rate</dt>
              <dd class="text-lg font-semibold tabular">{{ formatPercent(loan.annualRate, 2) }} p.a.</dd>
            </div>
            <div>
              <dt class="text-fg-muted">Term</dt>
              <dd class="font-semibold">{{ loan.termMonths }} months</dd>
            </div>
            <div>
              <dt class="text-fg-muted">Outstanding</dt>
              <dd class="font-semibold"><UiAmount :money="loan.outstanding" /></dd>
            </div>
            <div>
              <dt class="text-fg-muted">Applied</dt>
              <dd class="font-semibold">{{ formatDate(loan.createdAt) }}</dd>
            </div>
            <div class="sm:col-span-3">
              <dt class="text-fg-muted">Purpose</dt>
              <!-- Rendered as text (never v-html), so user-supplied content can't inject markup. -->
              <dd>{{ loan.purpose }}</dd>
            </div>
          </dl>
        </UiCard>

        <UiCard title="Status history">
          <LoanTimeline :history="loan.history" />
        </UiCard>
      </div>

      <UiCard title="Repayment schedule" description="Based on equal monthly instalments">
        <LoanAmortizationTable :loan="loan" />
      </UiCard>

      <dialog
        ref="dialog"
        aria-labelledby="withdraw-title"
        class="m-auto max-w-md rounded-xl border border-border bg-surface p-6 text-fg shadow-xl backdrop:bg-black/50"
      >
        <h2 id="withdraw-title" class="text-lg font-semibold">Withdraw this application?</h2>
        <p class="mt-2 text-sm text-fg-muted">
          {{ loan.reference }} will be closed. You can submit a new application at any time.
        </p>
        <div class="mt-6 flex justify-end gap-3">
          <!-- eslint-disable-next-line vuejs-accessibility/no-autofocus -- initial focus inside a modal <dialog> is the pattern the HTML spec recommends -->
          <UiButton variant="secondary" autofocus @click="dialog?.close()">Keep application</UiButton>
          <UiButton variant="danger" @click="confirmWithdraw">Withdraw</UiButton>
        </div>
      </dialog>
    </template>
  </div>
</template>
