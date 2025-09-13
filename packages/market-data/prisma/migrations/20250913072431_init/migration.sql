-- CreateTable
CREATE TABLE "Candle" (
    "symbol" TEXT NOT NULL,
    "timeframe" TEXT NOT NULL,
    "ts" BIGINT NOT NULL,
    "open" REAL NOT NULL,
    "high" REAL NOT NULL,
    "low" REAL NOT NULL,
    "close" REAL NOT NULL,
    "volume" REAL NOT NULL,

    PRIMARY KEY ("symbol", "timeframe", "ts")
);

-- CreateTable
CREATE TABLE "Quote" (
    "symbol" TEXT NOT NULL,
    "ts" BIGINT NOT NULL,
    "bid" REAL,
    "ask" REAL,
    "last" REAL,

    PRIMARY KEY ("symbol", "ts")
);

-- CreateIndex
CREATE INDEX "Candle_symbol_timeframe_ts_idx" ON "Candle"("symbol", "timeframe", "ts");

-- CreateIndex
CREATE INDEX "Quote_symbol_ts_idx" ON "Quote"("symbol", "ts");
