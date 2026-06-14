import { Request, Response } from 'express';
import { ImportService } from '../services/imports.service';

export class ImportController {
  private importService = new ImportService();

  uploadCsv = async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ status: 'error', message: 'No CSV file uploaded' });
      }

      const groupId = req.params.groupId as string || req.body?.groupId;
      if (!groupId) {
        return res.status(400).json({ status: 'error', message: 'groupId is required in the form data' });
      }

      const result = await this.importService.processCsvUpload(groupId, req.file, req.user!.userId);
      res.status(202).json({ status: 'success', data: result }); // 202 Accepted because processing will happen later
    } catch (error: any) {
      const status = error.message.includes('Forbidden') ? 403 : 400;
      res.status(status).json({ status: 'error', message: error.message });
    }
  };

  getImportJob = async (req: Request, res: Response) => {
    try {
      const result = await this.importService.getImportJob(req.params.id as string);
      res.status(200).json({ status: 'success', data: result });
    } catch (error: any) {
      res.status(404).json({ status: 'error', message: error.message });
    }
  };

  listGroupImports = async (req: Request, res: Response) => {
    try {
      const result = await this.importService.listGroupImports(req.params.groupId as string, req.user!.userId);
      res.status(200).json({ status: 'success', data: result });
    } catch (error: any) {
      res.status(403).json({ status: 'error', message: error.message });
    }
  };

  getReport = async (req: Request, res: Response) => {
    try {
      const { ImportReportService } = require('../services/import-report.service');
      const service = new ImportReportService();
      const result = await service.generateReport(req.params.id as string);
      res.status(200).json({ status: 'success', data: result });
    } catch (error: any) {
      res.status(404).json({ status: 'error', message: error.message });
    }
  };

  finalizeImport = async (req: Request, res: Response) => {
    try {
      const { ImportFinalizationService } = require('../services/import-finalization.service');
      const service = new ImportFinalizationService();
      const result = await service.finalizeImport(req.params.id as string, req.user!.userId);
      res.status(200).json({ status: 'success', data: result });
    } catch (error: any) {
      res.status(400).json({ status: 'error', message: error.message });
    }
  };
}
