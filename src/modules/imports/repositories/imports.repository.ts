import { prisma } from '../../../config/prisma';

export class ImportRepository {
  async createImportJob(groupId: string, filename: string) {
    return prisma.importJob.create({
      data: {
        groupId,
        filename,
        status: 'PENDING_REVIEW'
      }
    });
  }

  async storeImportRows(importJobId: string, rows: any[]) {
    // Map parsed rows to ImportRow schema
    const mappedRows = rows.map((row, index) => ({
      importJobId,
      rowNumber: index + 2, // Accounting for 1-indexed and header row
      rawData: row.raw,
      normalizedData: row.normalized,
      processingStatus: 'PENDING'
    }));

    return prisma.importRow.createMany({
      data: mappedRows
    });
  }

  async getImportJob(id: string) {
    return prisma.importJob.findUnique({
      where: { id },
      include: { rows: true, anomalies: true }
    });
  }

  async listGroupImports(groupId: string) {
    return prisma.importJob.findMany({
      where: { groupId },
      orderBy: { createdAt: 'desc' }
    });
  }
}
