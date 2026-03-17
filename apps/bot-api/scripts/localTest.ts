// apps/bot-api/scripts/localTest.ts
import prisma from "db";

async function main() {
  const waId = process.argv[2] ?? "test-user";
  const body = process.argv.slice(3).join(" ") || "/start";

  // 1) inbound message
  const msg = await prisma.message.create({
    data: {
      direction: "INBOUND",
      status: "RECEIVED",
      waId,
      type: "text",
      body,
    },
    select: { id: true },
  });

  // 2) job to process inbound
  const job = await prisma.messageJob.create({
    data: {
      messageId: msg.id,
      type: "PROCESS_INBOUND",
      state: "PENDING",
      attempts: 0,
      nextRunAt: new Date(),
    },
    select: { id: true },
  });

  console.log("✅ Created INBOUND message:", msg.id);
  console.log("✅ Created PROCESS_INBOUND job:", job.id);

  // wait a bit for worker to process
  await new Promise((r) => setTimeout(r, 800));

  // 3) read latest outbound
  const out = await prisma.message.findFirst({
    where: { direction: "OUTBOUND", waId },
    orderBy: { createdAt: "desc" },
    select: { status: true, body: true, createdAt: true },
  });

  console.log("\n--- Latest OUTBOUND ---");
  console.log(out ?? "❌ No outbound yet. Worker may not be running.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });