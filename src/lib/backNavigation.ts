// Pure back-navigation decisions, kept separate from the BackHandler
// wiring itself so the branching logic is unit-testable without mocking a
// native module. Request Help is the only screen in this round with real
// step-to-step branching; every other screen back-targets a single fixed
// destination (Home, or the previous Perks frame) via its existing onBack/
// pop callback - there's no decision to extract there, only wiring.

export type RequestHelpStep = 'type' | 'details' | 'location'

const REQUEST_HELP_STEPS: RequestHelpStep[] = ['type', 'details', 'location']

export type RequestHelpBackTarget = { kind: 'previous-step'; step: RequestHelpStep } | { kind: 'home' }

export function resolveRequestHelpBack(currentStep: RequestHelpStep): RequestHelpBackTarget {
  const index = REQUEST_HELP_STEPS.indexOf(currentStep)
  if (index <= 0) return { kind: 'home' }
  return { kind: 'previous-step', step: REQUEST_HELP_STEPS[index - 1]! }
}
