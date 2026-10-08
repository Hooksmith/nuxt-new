<template>
  <div class="grid gap-5 sm:grid-cols-2">
    <div class="sm:col-span-2">
      <FormTextField name="fullName" label="Full name (as on your ID card)" autocomplete="name" />
    </div>
    <FormTextField name="email" label="Email address" type="email" autocomplete="email" inputmode="email" />
    <FormTextField
      name="phone"
      label="Mobile number"
      type="tel"
      autocomplete="tel"
      inputmode="tel"
      hint="For example 012 345 678"
    />
    <FormTextField
      name="nationalId"
      label="National ID number"
      inputmode="numeric"
      hint="9 or 10 digits. Not stored on this device."
    />
    <FormTextField name="dateOfBirth" label="Date of birth" type="date" autocomplete="bday" />
  </div>
</template>
