// Niche prop illustration sets (see components/Props.tsx). Authored per trade as brand-tintable
// line art (currentColor only). Populated by the prop-authoring pass; an empty set renders nothing
// (PropField degrades to invisible, never breaks a build).
export interface PropPath {
  d: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
}
export interface PropSpec {
  viewBox: string;
  paths: PropPath[];
}

export const PROP_SETS: Record<string, Record<string, PropSpec>> = {
  roofing: {},
};
