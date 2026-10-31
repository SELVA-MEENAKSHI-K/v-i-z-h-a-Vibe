-- CreateTable
CREATE TABLE "EventCategory" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventType" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "defaultStyles" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "categoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "name" TEXT,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "phone" TEXT,
    "passwordHash" TEXT,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "targetId" TEXT,
    "detail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventPlan" (
    "id" TEXT NOT NULL,
    "shareToken" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "eventTypeId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "guestCount" INTEGER NOT NULL DEFAULT 50,
    "budget" INTEGER NOT NULL DEFAULT 0,
    "styles" TEXT,
    "preferences" TEXT,
    "notes" TEXT,
    "ownerId" TEXT,
    "selectedVenueId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Venue" (
    "id" TEXT NOT NULL,
    "providerId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'sample',
    "name" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "rating" DOUBLE PRECISION,
    "reviewCount" INTEGER,
    "website" TEXT,
    "phone" TEXT,
    "openingHours" TEXT,
    "photos" TEXT,
    "venueTypes" TEXT,
    "mapsUrl" TEXT,
    "attribution" TEXT,
    "lastCheckedAt" TIMESTAMP(3),
    "isSample" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Venue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatalogVenue" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "venueType" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT NOT NULL,
    "area" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "capacityMin" INTEGER,
    "capacityMax" INTEGER,
    "priceMin" INTEGER,
    "priceMax" INTEGER,
    "amenities" TEXT,
    "placeId" TEXT,
    "mapsUrl" TEXT,
    "sourceName" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "verification" TEXT NOT NULL DEFAULT 'unverified',
    "lastVerifiedAt" TIMESTAMP(3),
    "published" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CatalogVenue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedVenue" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedVenue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VenueLayout" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "roomWidth" DOUBLE PRECISION NOT NULL DEFAULT 24,
    "roomDepth" DOUBLE PRECISION NOT NULL DEFAULT 18,
    "illustrative" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VenueLayout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlacedObject" (
    "id" TEXT NOT NULL,
    "layoutId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "label" TEXT,
    "posX" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "posY" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "posZ" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "rotY" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "scale" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "seats" INTEGER NOT NULL DEFAULT 0,
    "style" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlacedObject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BudgetItem" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitCostMin" INTEGER NOT NULL DEFAULT 0,
    "unitCostMax" INTEGER NOT NULL DEFAULT 0,
    "estimated" BOOLEAN NOT NULL DEFAULT true,
    "assumption" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BudgetItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Menu" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "style" TEXT NOT NULL,
    "dietary" TEXT NOT NULL DEFAULT 'veg',
    "courses" TEXT NOT NULL,
    "notes" TEXT,
    "estimated" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Menu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimelineTask" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "detail" TEXT,
    "dueDate" TIMESTAMP(3),
    "offsetDays" INTEGER NOT NULL DEFAULT 0,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "startDate" TIMESTAMP(3),
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "assignee" TEXT,
    "vendorId" TEXT,
    "dependsOnId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TimelineTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vendor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "area" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "photos" TEXT,
    "rating" DOUBLE PRECISION,
    "reviewCount" INTEGER,
    "packages" TEXT,
    "source" TEXT NOT NULL DEFAULT 'sample',
    "sourceName" TEXT,
    "sourceUrl" TEXT,
    "verification" TEXT NOT NULL DEFAULT 'unverified',
    "isSample" BOOLEAN NOT NULL DEFAULT true,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedVendor" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ENQUIRED',
    "favourite" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT,
    "packageName" TEXT,
    "agreedCost" INTEGER,
    "enquiry" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SavedVendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiRecommendation" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'demo',
    "payload" TEXT NOT NULL,
    "prompt" TEXT,
    "isGenerated" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EventCategory_slug_key" ON "EventCategory"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "EventType_slug_key" ON "EventType"("slug");

-- CreateIndex
CREATE INDEX "EventType_categoryId_idx" ON "EventType"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_status_idx" ON "User"("status");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");

-- CreateIndex
CREATE INDEX "PasswordResetToken_userId_idx" ON "PasswordResetToken"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_idx" ON "AuditLog"("actorId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE UNIQUE INDEX "EventPlan_shareToken_key" ON "EventPlan"("shareToken");

-- CreateIndex
CREATE UNIQUE INDEX "EventPlan_selectedVenueId_key" ON "EventPlan"("selectedVenueId");

-- CreateIndex
CREATE INDEX "EventPlan_eventTypeId_idx" ON "EventPlan"("eventTypeId");

-- CreateIndex
CREATE INDEX "EventPlan_ownerId_idx" ON "EventPlan"("ownerId");

-- CreateIndex
CREATE INDEX "EventPlan_city_idx" ON "EventPlan"("city");

-- CreateIndex
CREATE UNIQUE INDEX "Venue_providerId_key" ON "Venue"("providerId");

-- CreateIndex
CREATE INDEX "Venue_city_idx" ON "Venue"("city");

-- CreateIndex
CREATE INDEX "Venue_source_idx" ON "Venue"("source");

-- CreateIndex
CREATE INDEX "CatalogVenue_city_idx" ON "CatalogVenue"("city");

-- CreateIndex
CREATE INDEX "CatalogVenue_venueType_idx" ON "CatalogVenue"("venueType");

-- CreateIndex
CREATE INDEX "CatalogVenue_verification_idx" ON "CatalogVenue"("verification");

-- CreateIndex
CREATE INDEX "SavedVenue_planId_idx" ON "SavedVenue"("planId");

-- CreateIndex
CREATE UNIQUE INDEX "SavedVenue_planId_venueId_key" ON "SavedVenue"("planId", "venueId");

-- CreateIndex
CREATE UNIQUE INDEX "VenueLayout_planId_key" ON "VenueLayout"("planId");

-- CreateIndex
CREATE INDEX "PlacedObject_layoutId_idx" ON "PlacedObject"("layoutId");

-- CreateIndex
CREATE INDEX "BudgetItem_planId_idx" ON "BudgetItem"("planId");

-- CreateIndex
CREATE INDEX "Menu_planId_idx" ON "Menu"("planId");

-- CreateIndex
CREATE INDEX "TimelineTask_planId_idx" ON "TimelineTask"("planId");

-- CreateIndex
CREATE INDEX "TimelineTask_vendorId_idx" ON "TimelineTask"("vendorId");

-- CreateIndex
CREATE INDEX "Vendor_category_idx" ON "Vendor"("category");

-- CreateIndex
CREATE INDEX "Vendor_city_idx" ON "Vendor"("city");

-- CreateIndex
CREATE INDEX "SavedVendor_planId_idx" ON "SavedVendor"("planId");

-- CreateIndex
CREATE INDEX "SavedVendor_vendorId_idx" ON "SavedVendor"("vendorId");

-- CreateIndex
CREATE UNIQUE INDEX "SavedVendor_planId_vendorId_key" ON "SavedVendor"("planId", "vendorId");

-- CreateIndex
CREATE INDEX "AiRecommendation_planId_idx" ON "AiRecommendation"("planId");

-- CreateIndex
CREATE INDEX "AiRecommendation_kind_idx" ON "AiRecommendation"("kind");

-- AddForeignKey
ALTER TABLE "EventType" ADD CONSTRAINT "EventType_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "EventCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventPlan" ADD CONSTRAINT "EventPlan_eventTypeId_fkey" FOREIGN KEY ("eventTypeId") REFERENCES "EventType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventPlan" ADD CONSTRAINT "EventPlan_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventPlan" ADD CONSTRAINT "EventPlan_selectedVenueId_fkey" FOREIGN KEY ("selectedVenueId") REFERENCES "SavedVenue"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedVenue" ADD CONSTRAINT "SavedVenue_planId_fkey" FOREIGN KEY ("planId") REFERENCES "EventPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedVenue" ADD CONSTRAINT "SavedVenue_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VenueLayout" ADD CONSTRAINT "VenueLayout_planId_fkey" FOREIGN KEY ("planId") REFERENCES "EventPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlacedObject" ADD CONSTRAINT "PlacedObject_layoutId_fkey" FOREIGN KEY ("layoutId") REFERENCES "VenueLayout"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetItem" ADD CONSTRAINT "BudgetItem_planId_fkey" FOREIGN KEY ("planId") REFERENCES "EventPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Menu" ADD CONSTRAINT "Menu_planId_fkey" FOREIGN KEY ("planId") REFERENCES "EventPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimelineTask" ADD CONSTRAINT "TimelineTask_planId_fkey" FOREIGN KEY ("planId") REFERENCES "EventPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimelineTask" ADD CONSTRAINT "TimelineTask_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "SavedVendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedVendor" ADD CONSTRAINT "SavedVendor_planId_fkey" FOREIGN KEY ("planId") REFERENCES "EventPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedVendor" ADD CONSTRAINT "SavedVendor_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiRecommendation" ADD CONSTRAINT "AiRecommendation_planId_fkey" FOREIGN KEY ("planId") REFERENCES "EventPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

