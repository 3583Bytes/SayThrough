// Modeling = an adult demonstrating on the user's device (aided language
// stimulation — the core way AAC is taught). It arrives with the SLP tooling;
// until then this is always false.
//
// Two systems must exclude modeled input and must never disagree about it:
// tracking (§4.13 — a therapist's demonstrations are not the user's
// communication and would corrupt their reports) and prediction learning
// (§18.2 — they must not train the user's model). Hence one source of truth.
//
// Deliberately dependency-free: both TrackingService and predictionModel
// import it, and TrackingService reads the user store, so anything with
// imports here would put a cycle between the store and the services.

export function isModeling(): boolean {
  return false
}
