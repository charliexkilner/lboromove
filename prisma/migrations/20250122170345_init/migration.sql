-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Property" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "rooms" INTEGER NOT NULL,
    "bathrooms" INTEGER NOT NULL,
    "address" TEXT,
    "externalId" TEXT NOT NULL,
    "scrapedFrom" TEXT NOT NULL,
    "hash" TEXT NOT NULL,

    CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScrapingLog" (
    "id" TEXT NOT NULL,
    "website" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "message" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endTime" TIMESTAMP(3),
    "itemsScraped" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ScrapingLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Property_scrapedFrom_externalId_key" ON "Property"("scrapedFrom", "externalId");

-- CreateIndex
CREATE INDEX "ScrapingLog_website_startTime_idx" ON "ScrapingLog"("website", "startTime");
