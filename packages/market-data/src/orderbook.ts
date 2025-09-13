export type Side = "buy" | "sell";
export class Book {
  bids = new Map<number, number>();
  asks = new Map<number, number>();
  applyChange(side: Side, priceStr: string, qtyStr: string) {
    const price = Number(priceStr), qty = Number(qtyStr);
    const m = side === "buy" ? this.bids : this.asks;
    if (qty === 0) m.delete(price); else m.set(price, qty);
  }
  best() {
    const bid = this.bids.size ? Math.max(...this.bids.keys()) : undefined;
    const ask = this.asks.size ? Math.min(...this.asks.keys()) : undefined;
    return { bid, ask };
  }
}
