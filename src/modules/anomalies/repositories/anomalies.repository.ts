import { prisma } from '../../../config/prisma';
import { Prisma } from '@prisma/client';

export class AnomalyRepository {
  async bulkCreate(anomalies: Prisma.ImportAnomalyCreateManyInput[]) {
    return prisma.importAnomaly.createMany({ data: anomalies });
  }

  async getJobAnomalies(importJobId: string) {
    return prisma.importAnomaly.findMany({
      where: { importJobId },
      orderBy: { rowNumber: 'asc' }
    });
  }

  async findById(id: string) {
    return prisma.importAnomaly.findUnique({ where: { id } });
  }

  async updateStatus(
    id: string, 
    resolutionStatus: string, 
    resolutionAction?: any,
    reviewerId?: string,
    notes?: string
  ) {
    return prisma.importAnomaly.update({
      where: { id },
      data: { 
        resolutionStatus, 
        resolutionAction: resolutionAction ?? Prisma.DbNull,
        reviewedById: reviewerId,
        reviewedAt: reviewerId ? new Date() : null,
        resolutionNotes: notes || null
      }
    });
  }
}
