/**
 * @tesseract.js-data/eng ships the English OCR language bundle
 * (eng.traineddata.gz) and exports `{ code, gzip, langPath }`. It has no
 * type declarations, so declare it here.
 */
declare module "@tesseract.js-data/eng" {
  const data: {
    code: string;
    gzip: boolean;
    langPath: string;
  };
  export = data;
}
