import { Request, Response } from 'express';
import { SettlementService } from '../services/settlements.service';

export class SettlementController {
  private settlementService = new SettlementService();

  createSettlement = async (req: Request, res: Response) => {
    try {
      const settlementData = {
        ...req.body,
        groupId: req.params.groupId as string
      };
      const result = await this.settlementService.createSettlement(settlementData, req.user!.userId);
      res.status(201).json({ status: 'success', data: result });
    } catch (error: any) {
      const status = error.message.includes('Forbidden') ? 403 : 400;
      res.status(status).json({ status: 'error', message: error.message });
    }
  };

  getSettlement = async (req: Request, res: Response) => {
    try {
      const result = await this.settlementService.getSettlement(req.params.id as string);
      res.status(200).json({ status: 'success', data: result });
    } catch (error: any) {
      res.status(404).json({ status: 'error', message: error.message });
    }
  };

  listGroupSettlements = async (req: Request, res: Response) => {
    try {
      const result = await this.settlementService.listGroupSettlements(req.params.groupId as string, req.user!.userId);
      res.status(200).json({ status: 'success', data: result });
    } catch (error: any) {
      const status = error.message.includes('Forbidden') ? 403 : 400;
      res.status(status).json({ status: 'error', message: error.message });
    }
  };

  deleteSettlement = async (req: Request, res: Response) => {
    try {
      await this.settlementService.deleteSettlement(req.params.id as string, req.user!.userId);
      res.status(204).send();
    } catch (error: any) {
      const status = error.message.includes('Forbidden') ? 403 : 400;
      res.status(status).json({ status: 'error', message: error.message });
    }
  };
}
