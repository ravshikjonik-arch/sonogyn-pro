-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "prisma_users" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "name" TEXT,
    "phone" TEXT,
    "phoneVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "role" TEXT NOT NULL DEFAULT 'user',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prisma_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prisma_accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "prisma_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prisma_sessions" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prisma_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prisma_verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "prisma_sms_verifications" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,

    CONSTRAINT "prisma_sms_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prisma_payments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'RUB',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "yookassaId" TEXT,
    "description" TEXT,
    "returnUrl" TEXT,
    "confirmation" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prisma_payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "prisma_users_email_key" ON "prisma_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "prisma_users_phone_key" ON "prisma_users"("phone");

-- CreateIndex
CREATE INDEX "prisma_accounts_userId_idx" ON "prisma_accounts"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "prisma_accounts_provider_providerAccountId_key" ON "prisma_accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "prisma_sessions_sessionToken_key" ON "prisma_sessions"("sessionToken");

-- CreateIndex
CREATE INDEX "prisma_sessions_userId_idx" ON "prisma_sessions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "prisma_verification_tokens_token_key" ON "prisma_verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "prisma_verification_tokens_identifier_token_key" ON "prisma_verification_tokens"("identifier", "token");

-- CreateIndex
CREATE INDEX "prisma_sms_verifications_phone_createdAt_idx" ON "prisma_sms_verifications"("phone", "createdAt");

-- CreateIndex
CREATE INDEX "prisma_sms_verifications_userId_idx" ON "prisma_sms_verifications"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "prisma_payments_yookassaId_key" ON "prisma_payments"("yookassaId");

-- CreateIndex
CREATE INDEX "prisma_payments_userId_status_idx" ON "prisma_payments"("userId", "status");

-- AddForeignKey
ALTER TABLE "prisma_accounts" ADD CONSTRAINT "prisma_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "prisma_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prisma_sessions" ADD CONSTRAINT "prisma_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "prisma_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prisma_sms_verifications" ADD CONSTRAINT "prisma_sms_verifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "prisma_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prisma_payments" ADD CONSTRAINT "prisma_payments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "prisma_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

