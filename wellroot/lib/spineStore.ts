// Tiny pub/sub bridging the 3D scene and the 2D FlowSpine overlay.
// The tooth projects its root tip to document-space coordinates on layout
// changes (ScrollTrigger refresh / resize) and writes them here. FlowSpine
// reads the anchor to glue the start of the teal line to the roots.
//
// Updates are low-frequency (layout events, not per-frame), so subscribers can
// safely re-render on change.

export type Point = { x: number; y: number };

type State = {
  // Root-tip anchor in DOCUMENT coordinates (includes scroll offset at the
  // moment of measurement). null until the canvas reports one.
  rootAnchor: Point | null;
};

let state: State = { rootAnchor: null };
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export const spineStore = {
  getState(): State {
    return state;
  },
  setRootAnchor(p: Point) {
    const prev = state.rootAnchor;
    if (prev && Math.abs(prev.x - p.x) < 0.5 && Math.abs(prev.y - p.y) < 0.5) {
      return; // ignore sub-pixel noise to avoid needless re-renders
    }
    state = { ...state, rootAnchor: p };
    emit();
  },
  subscribe(cb: () => void) {
    listeners.add(cb);
    return () => {
      listeners.delete(cb);
    };
  },
};
