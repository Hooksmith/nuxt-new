export interface NavItem {
  label: string
  zone: 'shell' | 'loans'
  to: string
}

export default defineAppConfig({
  brand: 'Banking Portal',
  /** Navigation is shared by all zones; cross-zone items become full page loads. */
  nav: [
    { label: 'Dashboard', zone: 'shell', to: '/' },
    { label: 'Accounts', zone: 'shell', to: '/accounts' },
    { label: 'Loans', zone: 'loans', to: '/' },
    { label: 'Apply for a loan', zone: 'loans', to: '/apply' },
    { label: 'Credit score', zone: 'shell', to: '/credit-score' },
  ] satisfies NavItem[] as NavItem[],
})
