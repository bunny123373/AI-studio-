/** Shared language lists — plain module (usable from server and client). */

export interface LangOption {
  value: string;
  label: string;
}

export const LANGUAGES: LangOption[] = [
  { value: "te", label: "Telugu" },
  { value: "en", label: "English" },
  { value: "hi", label: "Hindi" },
  { value: "ta", label: "Tamil" },
  { value: "kn", label: "Kannada" },
  { value: "ml", label: "Malayalam" },
];