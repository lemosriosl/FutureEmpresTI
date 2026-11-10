import { Prisma, type PrismaClient } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { dueDate, loanLimit } from '@/lib/emprestimos';
import { tenantTransaction, type TenantAccess } from '@/server/tenant';

function unavailable() {
  return new TRPCError({ code: 'CONFLICT', message: 'Este equipamento não está disponível para empréstimo.' });
}

export function listMyLoans(db: PrismaClient, access: TenantAccess, now = new Date()) {
  const { tenantId, userId } = access;
  return tenantTransaction(db, access, async (tx) => {
    const loans = await tx.loan.findMany({
      where: { tenantId, borrowerId: userId, returnedAt: null, equipment: { tenantId } },
      orderBy: [{ dueAt: 'asc' }, { id: 'asc' }],
      select: {
        id: true,
        dueAt: true,
        equipment: { select: { patrimonio: true, name: true, category: true } },
      },
    });
    return loans.map((loan) => ({ ...loan, overdue: loan.dueAt < now }));
  });
}

export async function requestLoan(db: PrismaClient, access: TenantAccess, patrimonio: string) {
  const { tenantId, userId } = access;

  for (let attempt = 0; attempt < 3; attempt++) {
    const borrowedAt = new Date();
    const dueAt = dueDate(borrowedAt);
    try {
      return await tenantTransaction(db, access, async (tx) => {
        const equipment = await tx.equipment.findUnique({
          where: { tenantId_patrimonio: { tenantId, patrimonio } },
          select: {
            id: true,
            status: true,
            loans: { where: { tenantId, returnedAt: null }, select: { id: true }, take: 1 },
          },
        });
        if (!equipment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Equipamento não encontrado.' });
        if (equipment.status !== 'AVAILABLE' || equipment.loans.length) throw unavailable();

        const openLoans = await tx.loan.findMany({
          where: { tenantId, borrowerId: userId, returnedAt: null },
          select: { dueAt: true },
          orderBy: { dueAt: 'asc' },
          take: loanLimit,
        });
        if (openLoans.some((loan) => loan.dueAt < borrowedAt)) {
          throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'Devolva o item em atraso antes de solicitar outro.' });
        }
        if (openLoans.length >= loanLimit) {
          throw new TRPCError({ code: 'PRECONDITION_FAILED', message: `Você já atingiu o limite de ${loanLimit} empréstimos em aberto.` });
        }

        const loan = await tx.loan.create({
          data: { tenantId, borrowerId: userId, equipmentId: equipment.id, borrowedAt, dueAt },
          select: { id: true, dueAt: true },
        });
        await tx.auditLog.create({
          data: { tenantId, actorId: userId, action: 'REQUEST_LOAN', resourceType: 'Loan', resourceId: loan.id },
          select: { id: true },
        });
        return loan;
      }, Prisma.TransactionIsolationLevel.Serializable);
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError)) throw error;
      if (error.code === 'P2002') throw unavailable();
      if (error.code !== 'P2034') throw error;
    }
  }

  throw new TRPCError({ code: 'CONFLICT', message: 'Houve outra solicitação ao mesmo tempo. Atualize e tente novamente.' });
}
