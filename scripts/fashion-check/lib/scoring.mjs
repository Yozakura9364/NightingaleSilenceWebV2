const ACCESSORY_SLOTS = new Set(["ears", "neck", "wrists", "ring", "rightRing", "leftRing"]);

export function goldPointsForSlot(slotId) {
  return ACCESSORY_SLOTS.has(String(slotId)) ? 6 : 8;
}
