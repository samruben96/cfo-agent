/**
 * Window extension for settings navigation handler.
 * Used to intercept navigation when there are unsaved changes.
 */
export interface WindowWithNavHandler extends Window {
  __handleSettingsNavigation?: (href: string) => void
}
