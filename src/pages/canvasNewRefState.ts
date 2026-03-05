export const createNewCanvasStartedRef = { current: false };
export const pendingNewCanvasIdRef = { current: null as string | null };

export function resetPendingNewCanvasIdForTesting() {
  createNewCanvasStartedRef.current = false;
  pendingNewCanvasIdRef.current = null;
}
