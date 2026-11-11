/**
 * External services the user can choose to use. VERITAS never sends a file to
 * any of these on its own: each one starts only when the user taps it and
 * confirms. Costs were checked on 11 Nov 2026 and must be re-checked before use.
 */

export type WebTool = {
  id: 'google_lens' | 'bing' | 'tineye' | 'synthid';
  name: string;
  what: string;
  /** Page where the user uploads the file themselves. */
  uploadUrl: string;
  /** Search by an image link, when the user saved one. */
  byUrl?: (imageUrl: string) => string;
  company: string;
};

export const SEARCH_TOOLS: WebTool[] = [
  {
    id: 'google_lens',
    name: 'Google Lens',
    what: 'Finds matching and similar images across the web',
    uploadUrl: 'https://lens.google.com/',
    byUrl: (u) => `https://lens.google.com/uploadbyurl?url=${encodeURIComponent(u)}`,
    company: 'Google',
  },
  {
    id: 'tineye',
    name: 'TinEye',
    what: 'Finds earlier copies, often showing where an image first appeared',
    uploadUrl: 'https://tineye.com/',
    byUrl: (u) => `https://tineye.com/search?url=${encodeURIComponent(u)}`,
    company: 'TinEye',
  },
  {
    id: 'bing',
    name: 'Bing Visual Search',
    what: 'Finds matching images and pages',
    uploadUrl: 'https://www.bing.com/visualsearch',
    byUrl: (u) => `https://www.bing.com/images/search?view=detailv2&iss=sbi&q=imgurl:${encodeURIComponent(u)}`,
    company: 'Microsoft',
  },
];

export const SYNTHID: WebTool = {
  id: 'synthid',
  name: 'Google SynthID Detector',
  what: 'Checks for the invisible SynthID watermark used by Google, OpenAI, Nvidia and Kakao',
  uploadUrl: 'https://synthid.com/',
  company: 'Google',
};

export type DetectorService = {
  id: 'hive' | 'sightengine' | 'reality_defender' | 'synthid_api';
  name: string;
  media: string;
  cost: string;
  freeAllowance: string;
  dataNote: string;
  signup: string;
};

/** Paid or access-controlled AI detectors. Switched off until the owner approves an account and budget. */
export const DETECTORS: DetectorService[] = [
  {
    id: 'reality_defender',
    name: 'Reality Defender',
    media: 'Images (free plan); audio and video on paid plans',
    cost: 'Free plan, then paid plans (price on request)',
    freeAllowance: '50 image scans per month',
    dataNote: 'The file is uploaded to Reality Defender for analysis.',
    signup: 'https://www.realitydefender.com/platform/api',
  },
  {
    id: 'hive',
    name: 'Hive AI-generated content detection',
    media: 'Images and video',
    cost: 'About US$6 per 1,000 images',
    freeAllowance: 'US$50 starting credit after adding a payment card',
    dataNote: 'The file is uploaded to Hive for analysis.',
    signup: 'https://thehive.ai/',
  },
  {
    id: 'sightengine',
    name: 'Sightengine AI-generated image detection',
    media: 'Images and video',
    cost: 'Free tier, then from US$29 per month',
    freeAllowance: 'Up to 2,000 checks per month (500 per day)',
    dataNote: 'The file is uploaded to Sightengine for analysis.',
    signup: 'https://sightengine.com/',
  },
  {
    id: 'synthid_api',
    name: 'Google SynthID (automatic check)',
    media: 'Images, video and audio',
    cost: 'No public API yet (trusted-tester preview only)',
    freeAllowance: 'Manual checks are free on synthid.com',
    dataNote: 'Would upload the file to Google.',
    signup: 'https://synthid.com/',
  },
];

/** Address of the VERITAS detection relay (holds provider keys server-side). Unset = not connected. */
export const RELAY_URL: string | undefined = process.env.EXPO_PUBLIC_DETECTOR_RELAY_URL || undefined;
export const ENABLED_DETECTORS: string[] = (process.env.EXPO_PUBLIC_DETECTORS ?? '').split(',').map((s: string) => s.trim()).filter(Boolean);

export function detectorEnabled(id: DetectorService['id']) {
  return !!RELAY_URL && ENABLED_DETECTORS.includes(id) && id !== 'synthid_api';
}
