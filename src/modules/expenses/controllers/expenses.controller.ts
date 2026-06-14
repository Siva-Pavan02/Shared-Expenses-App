import { Request, Response } from 'express';
import { ExpenseService } from '../services/expenses.service';

export class ExpenseController {
  private expenseService = new ExpenseService();

  createExpense = async (req: Request, res: Response) => {
    try {
      console.log('--- RUNTIME FAILURE TRACE ---');
      console.log('1. Controller - req.user:', req.user);
      console.log('1. Controller - validated DTO (req.body):', JSON.stringify(req.body, null, 2));
      console.log('1. Controller - req.params.groupId:', req.params.groupId);
      
      const expenseData = {
        ...req.body,
        groupId: req.params.groupId as string
      };
      
      const result = await this.expenseService.createExpense(expenseData, req.user!.userId);
      res.status(201).json({ status: 'success', data: result });
    } catch (error: any) {
      console.error('--- CRASH IN CONTROLLER ---');
      console.error('Error Type:', error.constructor.name);
      console.error('Error Message:', error.message);
      console.error('Stack Trace:', error.stack);
      const status = error.message.includes('Forbidden') ? 403 : 400;
      res.status(status).json({ status: 'error', message: error.message });
    }
  };

  getExpense = async (req: Request, res: Response) => {
    try {
      const result = await this.expenseService.getExpense(req.params.expenseId as string);
      res.status(200).json({ status: 'success', data: result });
    } catch (error: any) {
      res.status(404).json({ status: 'error', message: error.message });
    }
  };

  deleteExpense = async (req: Request, res: Response) => {
    try {
      await this.expenseService.deleteExpense(req.params.expenseId as string);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ status: 'error', message: error.message });
    }
  };

  listGroupExpenses = async (req: Request, res: Response) => {
    try {
      // Note: route is typically mounted under /groups/:groupId/expenses
      const result = await this.expenseService.listGroupExpenses(req.params.groupId as string, req.user!.userId);
      res.status(200).json({ status: 'success', data: result });
    } catch (error: any) {
      const status = error.message.includes('Forbidden') ? 403 : 400;
      res.status(status).json({ status: 'error', message: error.message });
    }
  };
}
