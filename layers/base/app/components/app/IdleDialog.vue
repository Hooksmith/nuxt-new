<script setup lang="ts">
/** Native <dialog> gives us focus trapping, Esc handling and inert background for free. */
const { warningVisible, secondsLeft, staySignedIn, signOut } = useIdleLogout()
const dialog = ref<HTMLDialogElement>()

watch(warningVisible, (visible) => {
  if (visible) dialog.value?.showModal()
  else dialog.value?.close()
})
</script>

<template>
  <dialog
    ref="dialog"
    aria-labelledby="idle-title"
    aria-describedby="idle-description"
    class="m-auto max-w-md rounded-xl border border-border bg-surface p-6 text-fg shadow-xl backdrop:bg-black/50"
    @cancel.prevent="staySignedIn"
  >
    <h2 id="idle-title" class="text-lg font-semibold">Are you still there?</h2>
    <p id="idle-description" class="mt-2 text-sm text-fg-muted">
      For your security you will be signed out in
      <strong class="tabular text-fg">{{ secondsLeft }} seconds</strong>.
    </p>
    <div class="mt-6 flex justify-end gap-3">
      <UiButton variant="secondary" @click="signOut">Sign out</UiButton>
      <!-- eslint-disable-next-line vuejs-accessibility/no-autofocus -- initial focus inside a modal <dialog> is the pattern the HTML spec recommends -->
      <UiButton autofocus @click="staySignedIn">Stay signed in</UiButton>
    </div>
  </dialog>
</template>
