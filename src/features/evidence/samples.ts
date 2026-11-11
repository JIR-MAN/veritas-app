/**
 * Bundled sample files for the reviewer/demo path. Signed with the public
 * c2pa-rs TEST certificate, so the production app reports them as signed by an
 * unrecognised source: an honest result, not a staged one.
 */
export const SAMPLES = [
  { key: 'ai', title: 'AI-generated (test signature)', subtitle: 'Declares AI generation', module: require('../../../assets/samples/sample-ai-declared.jpg'), name: 'sample-ai-declared.jpg' },
  { key: 'camera', title: 'Camera capture (test signature)', subtitle: 'Declares a capture device', module: require('../../../assets/samples/sample-camera.jpg'), name: 'sample-camera.jpg' },
  { key: 'tampered', title: 'Altered after signing', subtitle: 'Pixels changed after signing', module: require('../../../assets/samples/sample-tampered.jpg'), name: 'sample-tampered.jpg' },
  { key: 'none', title: 'No credentials', subtitle: 'Ordinary photo', module: require('../../../assets/samples/sample-no-credentials.jpg'), name: 'sample-no-credentials.jpg' },
] as const;
export type SampleKey = (typeof SAMPLES)[number]['key'];
