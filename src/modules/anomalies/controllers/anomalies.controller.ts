import { Request, Response } from 'express';
import { AnomalyDetectionService } from '../services/anomaly-detection.service';

export class AnomalyController {
  private anomalyService = new AnomalyDetectionService();

  analyzeImport = async (req: Request, res: Response) => {
    try {
      // Typically the groupId should be inferred from the job or passed in context
      const importJobId = req.params.importJobId as string;
      // We need groupId for context. In a real scenario we fetch the job first to get groupId.
      const { prisma } = require('../../../config/prisma');
      const job = await prisma.importJob.findUnique({ where: { id: importJobId } });
      if (!job) return res.status(404).json({ status: 'error', message: 'Import Job not found' });

      const result = await this.anomalyService.analyzeImportJob(importJobId, job.groupId);
      res.status(200).json({ status: 'success', data: result });
    } catch (error: any) {
      res.status(400).json({ status: 'error', message: error.message });
    }
  };

  getAnomalies = async (req: Request, res: Response) => {
    try {
      const result = await this.anomalyService.getAnomalies(req.params.importJobId as string);
      res.status(200).json({ status: 'success', data: result });
    } catch (error: any) {
      res.status(404).json({ status: 'error', message: error.message });
    }
  };

  reviewAnomaly = async (req: Request, res: Response) => {
    try {
      const { action, resolutionAction, notes } = req.body;
      const result = await this.anomalyService.reviewAnomaly(
        req.params.id as string, 
        action, 
        resolutionAction, 
        req.user!.userId, 
        notes
      );
      res.status(200).json({ status: 'success', data: result });
    } catch (error: any) {
      res.status(400).json({ status: 'error', message: error.message });
    }
  };
}
