export const WF_BUNDLE_CHANGED_EVENT = "wf_bundle_registry_changed";

export function emitBundleChanged() {
  window.dispatchEvent(new Event(WF_BUNDLE_CHANGED_EVENT));
}