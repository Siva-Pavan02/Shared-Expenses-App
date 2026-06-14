import { prisma } from '../../../config/prisma';
import { ExpenseService } from '../../expenses/services/expenses.service';
import { SettlementService } from '../../settlements/services/settlements.service';
import { MembershipRepository } from '../../memberships/repositories/memberships.repository';

export class ImportFinalizationService {
  private expenseService = new ExpenseService();
  private settlementService = new SettlementService();
  private membershipRepo = new MembershipRepository();

  async finalizeImport(importJobId: string, requesterId: string) {
    // 1. Atomically lock the job to prevent duplicate finalization requests
    const jobUpdate = await prisma.importJob.updateMany({
      where: {
        id: importJobId,
        status: { notIn: ['FINALIZING', 'COMPLETED'] }
      },
      data: { status: 'FINALIZING' }
    });

    if (jobUpdate.count === 0) {
      // It might be already finalized, failed, or just not exist. Check why:
      const existingJob = await prisma.importJob.findUnique({ where: { id: importJobId } });
      if (!existingJob) throw new Error('Import Job not found');
      throw new Error(`Import Job cannot be finalized. Current status: ${existingJob.status}`);
    }

    // Now we safely own the finalization lock
    try {
      const result = await prisma.$transaction(async (tx) => {
        const job = await tx.importJob.findUnique({
          where: { id: importJobId },
          include: {
            rows: true,
            anomalies: true
          }
        });

        if (!job) throw new Error('Import Job not found inside transaction');

        // Ensure all anomalies are resolved (no PENDING status)
        const pendingAnomalies = job.anomalies.filter(a => a.resolutionStatus === 'PENDING');
        if (pendingAnomalies.length > 0) {
          throw new Error(`Cannot finalize: ${pendingAnomalies.length} anomalies are still pending review.`);
        }

        // Group anomalies by rowNumber for easy lookup
        const anomaliesByRow = new Map<number, typeof job.anomalies>();
        for (const anomaly of job.anomalies) {
          if (!anomaliesByRow.has(anomaly.rowNumber)) {
            anomaliesByRow.set(anomaly.rowNumber, []);
          }
          anomaliesByRow.get(anomaly.rowNumber)!.push(anomaly);
        }

        const members = await tx.groupMember.findMany({
          where: { groupId: job.groupId },
          include: { user: true }
        });
        const membersByName = new Map(members.map(m => [m.user.name.toLowerCase(), m]));

        let createdExpenses = 0;
        let createdSettlements = 0;

        for (const row of job.rows) {
          try {
            const rowAnomalies = anomaliesByRow.get(row.rowNumber) || [];
            
            // If ANY anomaly for this row was REJECTED, skip the entire row
            const isRejected = rowAnomalies.some(a => a.resolutionStatus === 'REJECTED');
            if (isRejected) {
              await tx.importRow.update({ where: { id: row.id }, data: { processingStatus: 'IGNORED' } });
              continue;
            }

            // Collect all resolution actions approved for this row
            let isSettlement = false;
            let finalData: any = { ...(row.normalizedData as any) };

            for (const anomaly of rowAnomalies) {
              if (anomaly.resolutionStatus === 'APPROVED') {
                const actionType = anomaly.resolutionAction ? (anomaly.resolutionAction as any).type : 
                                   (anomaly.suggestedAction === 'Convert to Settlement' ? 'CONVERT_TO_SETTLEMENT' : null);
                
                if (actionType === 'CONVERT_TO_SETTLEMENT') isSettlement = true;
                
                if (anomaly.resolutionAction) {
                  const action = anomaly.resolutionAction as any;
                  if (action.type === 'CORRECT_CURRENCY') finalData['currency'] = action.value;
                  if (action.type === 'CORRECT_DATE') finalData['date'] = action.value;
                }
              }
            }

            const payerMember = membersByName.get(String(finalData['paid_by']).toLowerCase());
            if (!payerMember) throw new Error(`Unknown Payer: ${finalData['paid_by']}`);

            if (isSettlement) {
              // Find the receiver from description
              const desc = String(finalData['description']).toLowerCase();
              const receiverMember = members.find(m => m.user.id !== payerMember.userId && desc.includes(m.user.name.toLowerCase()));
              
              if (!receiverMember) throw new Error('Could not identify receiver for settlement from description');

              await this.settlementService.createSettlement({
                groupId: job.groupId,
                fromUserId: payerMember.userId,
                toUserId: receiverMember.userId,
                amount: Number(finalData['amount']),
                currency: finalData['currency'] || 'INR',
                date: new Date(finalData['date']).toISOString()
              }, requesterId, tx);
              createdSettlements++;

            } else {
              // Process as Expense
              const splitType = String(finalData['split_type']).toUpperCase() as any;
              let participants: any[] = [];

              if (splitType === 'EQUAL' && !finalData['split_with']) {
                 const expenseDate = new Date(finalData['date']);
                 const activeMembers = members.filter(m => m.joinedAt <= expenseDate && (!m.leftAt || m.leftAt >= expenseDate));
                 participants = activeMembers.map(m => ({ userId: m.userId }));
              } else if (finalData['split_with']) {
                 const names = String(finalData['split_with']).split(';');
                 for (const name of names) {
                   const pMember = membersByName.get(name.trim().toLowerCase());
                   if (!pMember) throw new Error(`Unknown Participant: ${name}`);
                   participants.push({ userId: pMember.userId });
                 }
                 if (finalData['split_details'] && splitType !== 'EQUAL') {
                   const values = String(finalData['split_details']).split(';');
                   participants = participants.map((p, i) => ({ ...p, value: Number(values[i]) }));
                 }
              }

              await this.expenseService.createExpense({
                groupId: job.groupId,
                description: finalData['description'] || 'Imported Expense',
                amount: Number(finalData['amount']),
                currency: finalData['currency'] || 'INR',
                date: new Date(finalData['date']).toISOString(),
                paidById: payerMember.userId,
                splitType: splitType,
                participants: participants
              }, requesterId, tx);
              createdExpenses++;
            }

            await tx.importRow.update({ where: { id: row.id }, data: { processingStatus: 'PROCESSED' } });
          } catch (rowError: any) {
            console.error(`Row ${row.rowNumber} failed: ${rowError.message}`);
            await tx.importRow.update({ where: { id: row.id }, data: { processingStatus: 'FAILED' } });
          }
        }

        // Mark Job Completed inside transaction
        await tx.importJob.update({
          where: { id: importJobId },
          data: { status: 'COMPLETED' }
        });

        return {
          status: 'COMPLETED',
          createdExpenses,
          createdSettlements
        };
      }, {
        // Set higher timeout for large CSVs
        timeout: 60000 
      });

      return result;

    } catch (err: any) {
      // If transaction fails, it rolls back entirely. We must update the status independently.
      await prisma.importJob.update({
        where: { id: importJobId },
        data: { status: 'FAILED' }
      });
      console.error(`Finalization failed, rolled back: ${err.message}`);
      throw new Error(`Import finalization failed and rolled back safely: ${err.message}`);
    }
  }
}
