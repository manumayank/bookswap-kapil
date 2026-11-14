// Shared class strings for dense data tables (admin area).
// Wrapper scrolls both ways so the header row can stick while rows scroll.

export const TABLE_WRAP = 'card-flat max-h-[70vh] overflow-auto';
export const TABLE = 'w-full min-w-[720px] border-separate border-spacing-0 text-sm';
export const TH =
  'sticky top-0 z-10 h-11 whitespace-nowrap border-b-2 border-edge bg-muted-extra-light px-4 text-left text-[13px] font-semibold text-muted';
export const TH_RIGHT = `${TH} text-right`;
export const TR = 'transition-colors hover:bg-muted-extra-light [&:last-child>td]:border-b-0';
export const TD = 'h-[52px] border-b border-card-border px-4 py-2 align-middle';
export const TD_RIGHT = `${TD} text-right`;
