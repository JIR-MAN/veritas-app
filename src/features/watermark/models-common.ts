/** Adobe's free, open-source TrustMark decoder models (MIT licence). Downloaded only when the user asks. */
export const MODEL_BASE_URL = 'https://cai-watermark.adobe.net/watermarking/trustmark-models/';
export const MODEL_FILES = ['decoder_Q.onnx', 'decoder_P.onnx', 'resizer.onnx'] as const;
export type ModelName = (typeof MODEL_FILES)[number];

/**
 * Expected SHA-256 of each model file. When set, a download that doesn't match
 * is discarded. Values come from the CI run that downloads and tests the models.
 */
export const MODEL_SHA256: Partial<Record<ModelName, string>> = {};

export async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const d = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes as BufferSource));
  return Array.from(d, (b) => b.toString(16).padStart(2, '0')).join('');
}
