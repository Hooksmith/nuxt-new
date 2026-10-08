<script setup lang="ts">
import { useForm } from 'vee-validate'
import { loginSchema, type LoginInput } from '#contracts'

definePageMeta({ layout: 'auth', public: true })
useSeoMeta({ title: 'Sign in' })

const route = useRoute()
const auth = useAuthStore()
const { navigateToPath } = useZoneLink()
const redirectTo = computed(() => safeRedirect(route.query.redirect))

if (auth.isAuthenticated) await navigateToPath(redirectTo.value, { replace: true })

const notice = computed(() => {
  if (route.query.reason === 'idle') return 'You were signed out after a period of inactivity to protect your account.'
  if (route.query.reason === 'expired') return 'Your session has expired. Please sign in again.'
  return null
})

const { handleSubmit, errors, isSubmitting, submitCount, setErrors } = useForm<LoginInput>({
  validationSchema: zodTypedSchema(loginSchema),
  initialValues: { email: '', password: '' },
})

const formError = ref<string | null>(null)
const summary = useTemplateRef<{ focus: () => void }>('summary')

const onSubmit = handleSubmit(
  async (values) => {
    formError.value = null
    try {
      await auth.login(values)
      await navigateToPath(redirectTo.value, { replace: true })
    } catch (error) {
      const fieldErrors = fieldErrorsFrom(error)
      if (fieldErrors) setErrors(fieldErrors)
      formError.value =
        errorStatus(error) === 401 ? 'The email or password you entered is incorrect.' : errorMessage(error)
    }
  },
  () => summary.value?.focus(),
)
</script>

<template>
  <div class="rounded-2xl border border-border bg-surface p-8 shadow-sm">
    <div class="mb-6 text-center">
      <h1 class="text-2xl font-bold">Sign in to online banking</h1>
      <p class="mt-1 text-sm text-fg-muted">Use your registered email and password.</p>
    </div>

    <div class="space-y-4">
      <UiAlert v-if="notice" tone="info">{{ notice }}</UiAlert>
      <UiAlert v-if="formError" tone="danger">{{ formError }}</UiAlert>
      <FormErrorSummary ref="summary" :errors="submitCount > 0 ? errors : {}" />

      <!--
        method="post": if the form is submitted natively before hydration (slow network),
        credentials go in a request body to this page — never into the URL, history or access logs.
      -->
      <form method="post" novalidate class="space-y-4" @submit="onSubmit">
        <FormTextField name="email" label="Email address" type="email" autocomplete="username" inputmode="email" />
        <FormTextField name="password" label="Password" type="password" autocomplete="current-password" />
        <UiButton type="submit" class="w-full" :loading="isSubmitting">Sign in</UiButton>
      </form>

      <div class="rounded-lg bg-surface-muted p-3 text-xs text-fg-muted">
        <p class="font-semibold text-fg">Demo credentials</p>
        <p>demo@bank.test · Password123!</p>
      </div>
    </div>
  </div>
</template>
