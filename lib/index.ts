import { connectPrisma, prisma } from "./prisma";

let initialized = false;

export const initConfig = async () => {
  if (initialized) return;

  await connectPrisma();
  initialized = true;
};

export { prisma };
