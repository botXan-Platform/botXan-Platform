// .env-ləri yüklə (mütləq PRISMA importundan əvvəl!)
import "../src/config/env.js";
import prisma from "db";

async function main() {
  console.log("🧹 Cleaning tables...");

  await prisma.messageJob.deleteMany();
  await prisma.messageEvent.deleteMany();
  await prisma.message.deleteMany();

  await prisma.conversationLock.deleteMany();
  await prisma.whatsappMessage.deleteMany().catch(() => {});

  await prisma.favorite.deleteMany();
  await prisma.bookingReceipt.deleteMany().catch(() => {});
  await prisma.booking.deleteMany();
  await prisma.bookingDraft.deleteMany();

  await prisma.propertyPricing.deleteMany().catch(() => {});
  await prisma.propertyImage.deleteMany();
  await prisma.property.deleteMany();

  await prisma.ownerToken.deleteMany();
  await prisma.invoice.deleteMany().catch(() => {});
  await prisma.ownerSubscription.deleteMany().catch(() => {});
  await prisma.service.deleteMany().catch(() => {});
  await prisma.owner.deleteMany();

  console.log("✅ Clean complete.");

  console.log("🌱 Seeding services + owner + subscription + properties...");

  const rentHomeService = await prisma.service.create({
    data: {
      key: "RENT_HOME",
      name: "Ev kirayəsi",
      description: "Günlük və qısamüddətli ev kirayəsi xidməti",
      currency: "AZN",
      isActive: true,
      price: 15,
      periodDays: 30,
      standardMonthlyPrice: 15,
      premiumMonthlyPrice: 30,
    },
    select: {
      id: true,
      key: true,
      standardMonthlyPrice: true,
      premiumMonthlyPrice: true,
      currency: true,
    },
  });

  const owner = await prisma.owner.create({
    data: {
      name: "Local Owner",
      phone: "+994500000000",
      email: "owner@local.dev",
      paidUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
    select: { id: true, phone: true, email: true, name: true },
  });

  const paidUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const subscription = await prisma.ownerSubscription.create({
    data: {
      owner: { connect: { id: owner.id } },
      service: { connect: { id: rentHomeService.id } },
      status: "ACTIVE",
      tier: "STANDARD",
      billingCycle: "MONTHLY",
      paidUntil,
    },
    select: {
      id: true,
      status: true,
      tier: true,
      billingCycle: true,
      paidUntil: true,
    },
  });

  const invoice = await prisma.invoice.create({
    data: {
      owner: { connect: { id: owner.id } },
      subscription: { connect: { id: subscription.id } },
      service: { connect: { id: rentHomeService.id } },
      amount: rentHomeService.standardMonthlyPrice ?? 15,
      currency: rentHomeService.currency,
      provider: "mock",
      providerRef: `seed-${Date.now()}`,
      status: "PAID",
      paidAt: new Date(),
      periodDays: 30,
      subscriptionTier: "STANDARD",
      billingCycle: "MONTHLY",
    },
    select: {
      id: true,
      amount: true,
      currency: true,
      status: true,
    },
  });

  const p1 = await prisma.property.create({
    data: {
      ownerId: owner.id,
      serviceId: rentHomeService.id,
      title: "1 otaq Studio (İçərişəhər)",
      roomCount: 1,
      areaName: "İçərişəhər",
      location: "https://maps.google.com/?q=Icherisheher",
      city: "Bakı",
      rulesText: "Siqaret qadağandır. Sakitlik saatı 23:00-dan sonra.",
      checkInTime: "14:00",
      checkOutTime: "12:00",
      quietHours: "23:00",
      isVisible: true,
      images: {
        create: [
          { url: "https://picsum.photos/seed/p1a/800/600", sortOrder: 1 },
          { url: "https://picsum.photos/seed/p1b/800/600", sortOrder: 2 },
        ],
      },
    },
    select: { id: true },
  });

  await prisma.propertyPricing.createMany({
    data: [
      {
        propertyId: p1.id,
        type: "HOURLY",
        unitPrice: 15,
        depositRequired: true,
      },
      {
        propertyId: p1.id,
        type: "DAILY",
        unitPrice: 60,
        depositRequired: true,
      },
      {
        propertyId: p1.id,
        type: "WEEKLY",
        unitPrice: 350,
      },
      {
        propertyId: p1.id,
        type: "MONTHLY",
        unitPrice: 1200,
      },
    ],
  });

  const p2 = await prisma.property.create({
    data: {
      ownerId: owner.id,
      serviceId: rentHomeService.id,
      title: "2 otaq Mənzil (Nərimanov)",
      roomCount: 2,
      areaName: "Nərimanov",
      location: "https://maps.google.com/?q=Narimanov",
      city: "Bakı",
      rulesText: "Ev təmiz saxlanmalıdır. Ev heyvanı razılaşma ilə.",
      checkInTime: "15:00",
      checkOutTime: "11:00",
      isVisible: true,
      images: {
        create: [{ url: "https://picsum.photos/seed/p2a/800/600", sortOrder: 1 }],
      },
    },
    select: { id: true },
  });

  await prisma.propertyPricing.createMany({
    data: [
      {
        propertyId: p2.id,
        type: "HOURLY",
        unitPrice: 20,
        depositRequired: true,
      },
      {
        propertyId: p2.id,
        type: "DAILY",
        unitPrice: 80,
        depositRequired: true,
      },
      {
        propertyId: p2.id,
        type: "WEEKLY",
        unitPrice: 480,
      },
      {
        propertyId: p2.id,
        type: "MONTHLY",
        unitPrice: 1600,
      },
    ],
  });

  const p3 = await prisma.property.create({
    data: {
      ownerId: owner.id,
      serviceId: rentHomeService.id,
      title: "3 otaq Ev (Mərkəz)",
      roomCount: 3,
      areaName: "Mərkəz",
      location: "https://maps.google.com/?q=Ganja",
      city: "Gəncə",
      rulesText: "Şənlik qadağandır. Qonşulara hörmət.",
      checkInTime: "14:00",
      checkOutTime: "12:00",
      isVisible: true,
      images: {
        create: [{ url: "https://picsum.photos/seed/p3a/800/600", sortOrder: 1 }],
      },
    },
    select: { id: true },
  });

  await prisma.propertyPricing.createMany({
    data: [
      {
        propertyId: p3.id,
        type: "DAILY",
        unitPrice: 70,
        depositRequired: true,
      },
      {
        propertyId: p3.id,
        type: "WEEKLY",
        unitPrice: 420,
      },
      {
        propertyId: p3.id,
        type: "MONTHLY",
        unitPrice: 1400,
      },
    ],
  });

  console.log("✅ Seed done:");
  console.log(" - service:", rentHomeService.key);
  console.log(" - standardMonthlyPrice:", rentHomeService.standardMonthlyPrice);
  console.log(" - premiumMonthlyPrice:", rentHomeService.premiumMonthlyPrice);
  console.log(" - owner:", owner.id, owner.phone);
  console.log(" - subscription:", subscription.id, subscription.status, subscription.tier);
  console.log(" - invoice:", invoice.id, invoice.status, invoice.amount, invoice.currency);
  console.log(" - Bakı:", p1.id, p2.id);
  console.log(" - Gəncə:", p3.id);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });