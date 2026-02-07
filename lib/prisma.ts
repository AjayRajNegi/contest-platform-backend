import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../prisma/generated/prisma/client";

const connectionString = `${process.env.DATABASE_URL}`;

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

let connected = true;

export const connectPrisma = async () => {
  if (connected) return;

  try {
    await prisma.$connect();
    console.log("Connected to DB.");
    connected = true;
  } catch (error) {
    console.error("Failed to connect to DB.", error);
    throw error;
  }
};

export const disconnectPrisma = async () => {
  if (!connectPrisma) return;

  await prisma.$disconnect();
  console.log("Prisma disconnected.");
  connected = false;
};

export { prisma };
