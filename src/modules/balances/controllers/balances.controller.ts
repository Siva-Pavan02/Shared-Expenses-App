import { Request, Response } from 'express';
import { BalanceService } from '../services/balances.service';
import { DebtSimplificationService } from '../services/debt-simplification.service';

export class BalanceController {
  private balanceService = new BalanceService();
  private debtService = new DebtSimplificationService();

  getGroupBalances = async (req: Request, res: Response) => {
    try {
      const result = await this.balanceService.getGroupBalances(req.params.groupId as string);
      res.status(200).json({ status: 'success', data: result });
    } catch (error: any) {
      res.status(400).json({ status: 'error', message: error.message });
    }
  };

  getUserBreakdown = async (req: Request, res: Response) => {
    try {
      const result = await this.balanceService.getUserBreakdown(req.params.groupId as string, req.params.userId as string);
      res.status(200).json({ status: 'success', data: result });
    } catch (error: any) {
      res.status(404).json({ status: 'error', message: error.message });
    }
  };

  getSimplifiedBalances = async (req: Request, res: Response) => {
    try {
      const result = await this.debtService.getSimplifiedBalances(req.params.groupId as string);
      res.status(200).json({ status: 'success', data: result });
    } catch (error: any) {
      res.status(400).json({ status: 'error', message: error.message });
    }
  };
}
