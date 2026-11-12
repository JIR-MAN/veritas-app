/** Adobe's free, open-source TrustMark decoder models (MIT licence). Downloaded only when the user asks. */
export const MODEL_BASE_URL = 'https://cai-watermark.adobe.net/watermarking/trustmark-models/';
export const MODEL_FILES = ['decoder_Q.onnx', 'decoder_P.onnx', 'resizer.onnx'] as const;
export type ModelName = (typeof MODEL_FILES)[number];

/**
 * Expected SHA-256 of each model file. When set, a download that doesn't match
 * is discarded. Values come from the CI run that downloads and tests the models.
 */
export const MODEL_SHA256: Partial<Record<ModelName, string>> = {
  // Recorded by the "TrustMark reader" workflow on 12 Nov 2026.
  'decoder_Q.onnx': 'ee3268f057c9dabef680e169302f5973d0589feea86189ed229a896cc3aa88df',
  'decoder_P.onnx': 'be6d7c33f8a7b376f179e75f3f7c58ff816a9ac7bb6d37fd0a729a635f624c35',
  'resizer.onnx': 'e7d6014def382e20d3748fc793761bfddce62578a5905fa6ef3d348c69a787c3',
};

/** Total download size of the three files (about 95 MB). */
export const MODELS_TOTAL_BYTES = 47401222 + 47400467 + 454;

export async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const d = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes as BufferSource));
  return Array.from(d, (b) => b.toString(16).padStart(2, '0')).join('');
}
