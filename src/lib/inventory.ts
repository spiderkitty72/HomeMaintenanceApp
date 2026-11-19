/** Shared helpers for showing a part's stock in an inventory system the same way on every screen. */

type InventoryItemLike = { inventorySystemId: string; quantityOnHand: number; unitCost?: number | null };
type PartLike = { defaultCost?: number | null; inventoryItems?: InventoryItemLike[] | null };

export const NO_SYSTEM = "none";

export function getSystemItem(part: PartLike, systemId: string | null | undefined) {
    if (!systemId || systemId === NO_SYSTEM) return undefined;
    return part.inventoryItems?.find((i) => i.inventorySystemId === systemId);
}

export function getPartStock(part: PartLike, systemId: string | null | undefined) {
    return getSystemItem(part, systemId)?.quantityOnHand ?? 0;
}

export function getPartUnitCost(part: PartLike, systemId: string | null | undefined) {
    return getSystemItem(part, systemId)?.unitCost ?? part.defaultCost ?? 0;
}

export function formatMoney(value: number) {
    return `$${value.toFixed(2)}`;
}
