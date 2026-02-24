-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('ADMIN', 'CONTABIL', 'AUDIT');

-- CreateEnum
CREATE TYPE "public"."TransactionType" AS ENUM ('INCOME', 'EXPENSE');

-- CreateEnum
CREATE TYPE "public"."TransactionKind" AS ENUM ('NORMAL', 'OPENING', 'TRANSFER', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "public"."Currency" AS ENUM ('RON', 'EUR', 'GBP', 'RUB');

-- CreateEnum
CREATE TYPE "public"."periodBudget" AS ENUM ('WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "public"."statusBudget" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "public"."budgetPeriodStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "roles" "public"."Role"[] DEFAULT ARRAY[]::"public"."Role"[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Wallet" (
    "id" SERIAL NOT NULL,
    "publicId" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "currency" "public"."Currency" NOT NULL,
    "balanceMinor" INTEGER NOT NULL DEFAULT 0,
    "allowOverdraft" BOOLEAN NOT NULL DEFAULT false,
    "status" "public"."statusBudget" NOT NULL DEFAULT 'ACTIVE',
    "archivedAt" TIMESTAMPTZ,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "orderIndex" INTEGER,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Transaction" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "walletId" INTEGER NOT NULL,
    "amountMinor" INTEGER NOT NULL,
    "currency" "public"."Currency" NOT NULL,
    "type" "public"."TransactionType" NOT NULL,
    "kind" "public"."TransactionKind" NOT NULL DEFAULT 'NORMAL',
    "transferGroupId" UUID,
    "date" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Budget" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "limitAmountMinor" INTEGER NOT NULL,
    "currency" "public"."Currency" NOT NULL,
    "status" "public"."statusBudget" NOT NULL DEFAULT 'ACTIVE',
    "rollover" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "anchorDayOfMonth" INTEGER,
    "anchorWeekday" INTEGER,
    "period" "public"."periodBudget" NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Budget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BudgetPeriod" (
    "id" SERIAL NOT NULL,
    "budgetId" INTEGER NOT NULL,
    "periodStart" TIMESTAMPTZ NOT NULL,
    "periodEnd" TIMESTAMPTZ NOT NULL,
    "limitAmountMinor" INTEGER NOT NULL,
    "carriedOverMinor" INTEGER NOT NULL DEFAULT 0,
    "spentMinor" INTEGER NOT NULL DEFAULT 0,
    "status" "public"."budgetPeriodStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "BudgetPeriod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BudgetWallet" (
    "budgetId" INTEGER NOT NULL,
    "walletId" INTEGER NOT NULL,

    CONSTRAINT "BudgetWallet_pkey" PRIMARY KEY ("budgetId","walletId")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "Wallet_userId_status_idx" ON "public"."Wallet"("userId", "status");

-- CreateIndex
CREATE INDEX "Wallet_userId_currency_idx" ON "public"."Wallet"("userId", "currency");

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_userId_name_status_key" ON "public"."Wallet"("userId", "name", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_publicId_key" ON "public"."Wallet"("publicId");

-- CreateIndex
CREATE INDEX "Transaction_userId_date_idx" ON "public"."Transaction"("userId", "date");

-- CreateIndex
CREATE INDEX "Transaction_userId_walletId_date_idx" ON "public"."Transaction"("userId", "walletId", "date");

-- CreateIndex
CREATE INDEX "Transaction_transferGroupId_idx" ON "public"."Transaction"("transferGroupId");

-- CreateIndex
CREATE INDEX "Budget_userId_idx" ON "public"."Budget"("userId");

-- CreateIndex
CREATE INDEX "Budget_userId_status_idx" ON "public"."Budget"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Budget_userId_name_status_key" ON "public"."Budget"("userId", "name", "status");

-- CreateIndex
CREATE INDEX "BudgetPeriod_budgetId_periodStart_periodEnd_idx" ON "public"."BudgetPeriod"("budgetId", "periodStart", "periodEnd");

-- CreateIndex
CREATE UNIQUE INDEX "BudgetPeriod_budgetId_periodStart_periodEnd_key" ON "public"."BudgetPeriod"("budgetId", "periodStart", "periodEnd");

-- CreateIndex
CREATE INDEX "BudgetWallet_walletId_idx" ON "public"."BudgetWallet"("walletId");

-- AddForeignKey
ALTER TABLE "public"."Wallet" ADD CONSTRAINT "Wallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Transaction" ADD CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Transaction" ADD CONSTRAINT "Transaction_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "public"."Wallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Budget" ADD CONSTRAINT "Budget_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BudgetPeriod" ADD CONSTRAINT "BudgetPeriod_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "public"."Budget"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BudgetWallet" ADD CONSTRAINT "BudgetWallet_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "public"."Budget"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BudgetWallet" ADD CONSTRAINT "BudgetWallet_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "public"."Wallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
