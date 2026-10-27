// Builder-wide operational settings and disclosure endpoints.
// Values here are the shared source for the client and static component renderer.
export const builderSettings = Object.freeze({
  network: Object.freeze({
    readTimeoutMs: 4500,
    pollVisibleMs: 1500,
    pollHiddenMs: 5000,
    workerPollVisibleMs: 3000,
    workerPollHiddenMs: 10000,
  }),
  disclosure: Object.freeze({ collapsedHeight: 0, hiddenOpacity: 0, visibleOpacity: 1 }),
  continuationPromptRows: 3,
});
