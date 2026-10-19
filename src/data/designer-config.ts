/** Site adapter. Keep branding and persistence endpoints out of the reusable model. */
export const designerConfig = {
  storageNamespace: 'ctt-design-v1',
  sessionKey: 'ctt-design-session',
  saveEndpoint: '/api/artwork/save',
  legacyDraftPrefix: 'ctt-draft-',
} as const;
