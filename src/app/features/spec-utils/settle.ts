/** Waits one macrotask, letting the page's pending promise chains settle. */
export function settle(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve);
  });
}
