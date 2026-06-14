import { AnomalyRepository } from '../repositories/anomalies.repository';
import { prisma } from '../../../config/prisma';
import { Prisma } from '@prisma/client';

export class AnomalyDetectionService {
  private anomalyRepo = new AnomalyRepository();

  async analyzeImportJob(importJobId: string, groupId: string) {
    const job = await prisma.importJob.findUnique({ where: { id: importJobId }, include: { rows: true } });
    if (!job) throw new Error('Import Job not found');

    const groupMembers = await prisma.groupMember.findMany({
      where: { groupId },
      include: { user: true }
    });
    
    const existingExpenses = await prisma.expense.findMany({
      where: { groupId },
      include: { paidBy: true }
    });

    const anomalies: Prisma.ImportAnomalyCreateManyInput[] = [];
    const membersByName = new Map(groupMembers.map(m => [m.user.name.toLowerCase(), m]));

    for (const row of job.rows) {
      const data: any = row.normalizedData;

      // 3. Missing Payer
      if (!data['paid_by']) {
        anomalies.push(this.createAnomaly(job.id, row.rowNumber, data, 'MISSING_PAYER', 'HIGH', 'Missing Payer'));
      }

      // 4. Missing Currency
      if (!data['currency']) {
        anomalies.push(this.createAnomaly(job.id, row.rowNumber, data, 'MISSING_CURRENCY', 'HIGH', 'Missing Currency'));
      }

      // 5. Invalid Date & 6. Ambiguous Date
      const dateStr = data['date'];
      if (!dateStr || isNaN(Date.parse(dateStr))) {
        anomalies.push(this.createAnomaly(job.id, row.rowNumber, data, 'INVALID_DATE', 'HIGH', 'Invalid Date'));
      } else if (dateStr.includes('/')) {
        // Simple heuristic for ambiguous MM/DD/YYYY vs DD/MM/YYYY
        anomalies.push(this.createAnomaly(job.id, row.rowNumber, data, 'AMBIGUOUS_DATE', 'MEDIUM', 'Ambiguous Date Format (e.g., 04/05/2026)'));
      }

      // 7. Unknown Member & 8. Membership Violation
      let payerMember = null;
      if (data['paid_by']) {
        payerMember = membersByName.get(data['paid_by'].toLowerCase());
        if (!payerMember) {
          anomalies.push(this.createAnomaly(job.id, row.rowNumber, data, 'UNKNOWN_MEMBER', 'HIGH', `Unknown Member: ${data['paid_by']}`));
        } else if (dateStr && !isNaN(Date.parse(dateStr))) {
          const expenseDate = new Date(dateStr);
          if (payerMember.joinedAt > expenseDate || (payerMember.leftAt && payerMember.leftAt < expenseDate)) {
            anomalies.push(this.createAnomaly(job.id, row.rowNumber, data, 'MEMBERSHIP_VIOLATION', 'HIGH', 'Membership Violation: Charged outside active dates'));
          }
        }
      }

      const amountStr = data['amount'];
      const amount = parseFloat(amountStr);

      // 10. Negative Amount
      if (amount < 0) {
        anomalies.push(this.createAnomaly(job.id, row.rowNumber, data, 'NEGATIVE_AMOUNT', 'MEDIUM', 'Negative Amount (Refund?)', 'Manual Review'));
      }

      // 11. Zero Amount
      if (amount === 0) {
        anomalies.push(this.createAnomaly(job.id, row.rowNumber, data, 'ZERO_AMOUNT', 'LOW', 'Zero Amount'));
      }

      // 12. Split Type Conflict
      const splitType = data['split_type'];
      const details = data['split_details'];
      if (splitType === 'equal' && details && String(details).trim().length > 0) {
        anomalies.push(this.createAnomaly(job.id, row.rowNumber, data, 'SPLIT_TYPE_CONFLICT', 'HIGH', 'Split Type Conflict: EQUAL but details provided'));
      }

      // 9. Settlement Logged As Expense
      const description = String(data['description'] || '').toLowerCase();
      if (description.includes('paid') && description.includes('back')) {
        anomalies.push(this.createAnomaly(job.id, row.rowNumber, data, 'SETTLEMENT_AS_EXPENSE', 'HIGH', 'Settlement Logged As Expense', 'Convert to Settlement'));
      }

      // 1. Exact Duplicate & 2. Conflicting Duplicate
      if (payerMember && !isNaN(amount) && !isNaN(Date.parse(dateStr))) {
        const potentialDuplicates = existingExpenses.filter(e => 
          e.description === data['description'] &&
          e.date.toISOString().split('T')[0] === new Date(dateStr).toISOString().split('T')[0] &&
          e.paidById === payerMember!.userId
        );

        for (const dup of potentialDuplicates) {
          if (Number(dup.amount) === amount) {
            anomalies.push(this.createAnomaly(job.id, row.rowNumber, data, 'EXACT_DUPLICATE', 'WARNING', 'Exact Duplicate Expense'));
          } else {
            anomalies.push(this.createAnomaly(job.id, row.rowNumber, data, 'CONFLICTING_DUPLICATE', 'HIGH', 'Conflicting Duplicate (Amount differs)'));
          }
        }
      }
    }

    if (anomalies.length > 0) {
      await this.anomalyRepo.bulkCreate(anomalies);
      await prisma.importJob.update({ where: { id: importJobId }, data: { status: 'REVIEW_REQUIRED' } });
    } else {
      await prisma.importJob.update({ where: { id: importJobId }, data: { status: 'READY_TO_IMPORT' } });
    }

    return {
      totalRows: job.rows.length,
      anomaliesDetected: anomalies.length,
      status: anomalies.length > 0 ? 'REVIEW_REQUIRED' : 'READY_TO_IMPORT'
    };
  }

  private createAnomaly(jobId: string, rowNumber: number, rawData: any, type: string, severity: string, desc: string, action?: string) {
    return {
      importJobId: jobId,
      rowNumber,
      rawData: rawData as Prisma.InputJsonValue,
      anomalyType: type,
      severity,
      description: desc,
      suggestedAction: action,
      resolutionStatus: 'PENDING'
    };
  }

  async getAnomalies(importJobId: string) {
    return this.anomalyRepo.getJobAnomalies(importJobId);
  }

  async reviewAnomaly(id: string, action: 'APPROVE' | 'REJECT', resolutionAction?: any, reviewerId?: string, notes?: string) {
    const status = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
    return this.anomalyRepo.updateStatus(id, status, resolutionAction, reviewerId, notes);
  }
}
