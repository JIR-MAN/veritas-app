declare module '*.pem' { const s: string; export default s; }
declare module '*.cfg' { const s: string; export default s; }
declare module 'exifr/dist/full.esm.mjs' { export function parse(input: any, opts?: any): Promise<any>; }
