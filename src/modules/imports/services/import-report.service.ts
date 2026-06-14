import { prisma } from '../../../config/prisma';

export class ImportReportService {
  async generateReport(importJobId: string) {
    const job = await prisma.importJob.findUnique({
      where: { id: importJobId },
      include: {
        rows: true,
        anomalies: true
      }
    });

    if (!job) throw new Error('Import Job not found');

    const totalRows = job.rows.length;
    
    // Group anomalies by rowNumber to find unique rows with issues
    const rowsWithIssuesSet = new Set(job.anomalies.map(a => a.rowNumber));
    const rowsWithIssuesCount = rowsWithIssuesSet.size;
    const validRowsCount = totalRows - rowsWithIssuesCount;

    // Breakdown by type
    const anomaliesByType: Record<string, number> = {};
    const anomaliesBySeverity: Record<string, number> = {};
    const resolutionStatusSummary: Record<string, number> = {
      PENDING: 0,
      APPROVED: 0,
      REJECTED: 0
    };

    for (const anomaly of job.anomalies) {
      anomaliesByType[anomaly.anomalyType] = (anomaliesByType[anomaly.anomalyType] || 0) + 1;
      anomaliesBySeverity[anomaly.severity] = (anomaliesBySeverity[anomaly.severity] || 0) + 1;
      resolutionStatusSummary[anomaly.resolutionStatus] = (resolutionStatusSummary[anomaly.resolutionStatus] || 0) + 1;
    }

    return {
      totalRows,
      parsedRows: totalRows,
      validRows: validRowsCount,
      rowsWithIssues: rowsWithIssuesCount,
      anomaliesByType,
      anomaliesBySeverity,
      resolutionStatusSummary
    };
  }
}
