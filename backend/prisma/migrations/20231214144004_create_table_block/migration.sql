-- CreateTable
CREATE TABLE "Block" (
    "id" BIGSERIAL NOT NULL,
    "hash" BYTEA NOT NULL,
    "height" BIGINT NOT NULL,
    "slot" BIGINT NOT NULL,
    "time" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Block_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Block_hash_key" ON "Block"("hash");

-- CreateIndex
CREATE UNIQUE INDEX "Block_slot_key" ON "Block"("slot");

-- CreateIndex
CREATE INDEX "Block_slot_idx" ON "Block"("slot");
