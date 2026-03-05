export const createNewCollectionStartedRef = { current: false };
export const pendingNewCollectionIdRef = { current: null as string | null };

export function resetPendingNewCollectionIdForTesting() {
  createNewCollectionStartedRef.current = false;
  pendingNewCollectionIdRef.current = null;
}
