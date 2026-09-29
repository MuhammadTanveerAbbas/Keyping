/**
 * Cross component refresh signalling.
 *
 * Saving or deleting data happens on one page, but the counts and lists it
 * affects are rendered on other pages and in the dashboard header. Previously
 * the event was a bare string with one listener that refreshed only the
 * header count, so deleting all data in Settings refreshed nothing a user
 * could see, and each page that also needed a refresh had to call its own
 * hook methods by hand as a second mechanism.
 *
 * The event is now a typed module so the name lives in one place, and the data
 * hooks subscribe to it themselves. A page that mutates data dispatches once and
 * every affected list refreshes itself.
 */

export const DATA_CHANGED_EVENT = "keyping:data-changed";

/** Which dataset changed, so a hook only refetches for data it owns. */
export type Dataset = "key_tests" | "alerts" | "notification_preferences";

/** Announces that a dataset was created, updated, or deleted. */
export function notifyDataChanged(dataset: Dataset): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<Dataset>(DATA_CHANGED_EVENT, { detail: dataset }),
  );
}

/**
 * Runs a callback when any of the given datasets changes.
 *
 * Returns an unsubscribe function. Safe to call in an effect with no
 * window guard needed because it returns immediately outside a browser.
 */
export function onDataChanged(
  datasets: readonly Dataset[],
  callback: (dataset: Dataset) => void,
): () => void {
  if (typeof window === "undefined") return () => undefined;

  const handler = (event: Event) => {
    const dataset = (event as CustomEvent<Dataset>).detail;
    // A dispatch with no detail is treated as "everything changed" so an older
    // or hand written dispatch still refreshes listeners.
    if (dataset === undefined || datasets.includes(dataset)) callback(dataset);
  };

  window.addEventListener(DATA_CHANGED_EVENT, handler);
  return () => window.removeEventListener(DATA_CHANGED_EVENT, handler);
}
