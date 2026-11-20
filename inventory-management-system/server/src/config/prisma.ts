import { Prisma, PrismaClient } from '@prisma/client';

const basePrisma = new PrismaClient();

export const prisma = basePrisma.$extends({
  query: {
    $allModels: {
      async $allOperations({ args, query }) {
        try {
          return await query(args);
        } catch (err) {
          if (
            err instanceof Prisma.PrismaClientKnownRequestError &&
            err.code === 'P1001'
          ) {
            await new Promise((resolve) => setTimeout(resolve, 600));
            return query(args);
          }
          throw err;
        }
      },
    },
  },
});
