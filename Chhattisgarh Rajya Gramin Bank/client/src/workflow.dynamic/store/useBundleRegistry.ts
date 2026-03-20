import { useEffect, useState } from "react";
import { WF_BUNDLE_CHANGED_EVENT } from "./bundle.events";
import { listBundles, type BundleRegistryRow } from "./bundle.store";

export function useBundleRegistry(): BundleRegistryRow[] {
  const [rows, setRows] = useState<BundleRegistryRow[]>(() => listBundles());

  useEffect(() => {
    const onLocal = () => setRows(listBundles());
    const onStorage = (e: StorageEvent) => {
      if (e.key === "wf_bundle_registry_v1") onLocal();
    };

    window.addEventListener(WF_BUNDLE_CHANGED_EVENT, onLocal);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(WF_BUNDLE_CHANGED_EVENT, onLocal);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return rows;
}