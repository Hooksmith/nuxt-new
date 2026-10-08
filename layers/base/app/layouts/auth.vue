<template>
  <div class="flex min-h-screen flex-col items-center justify-center bg-canvas px-4 py-10">
    <AppSkipLink />
    <main id="main-content" tabindex="-1" class="w-full max-w-md focus:outline-none">
      <slot />
    </main>
  </div>
</template>
