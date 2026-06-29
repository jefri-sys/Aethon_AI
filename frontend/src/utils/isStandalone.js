export function isStandalone() {
  const isDisplayStandalone = window.matchMedia('(display-mode: standalone)').matches;
  const isNavigatorStandalone = window.navigator.standalone === true;
  return isDisplayStandalone || isNavigatorStandalone;
}
