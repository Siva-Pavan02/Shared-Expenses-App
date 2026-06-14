import { Request, Response } from 'express';
import { GroupService } from '../services/groups.service';

export class GroupController {
  private groupService = new GroupService();

  createGroup = async (req: Request, res: Response) => {
    try {
      const result = await this.groupService.createGroup(req.body, req.user!.userId);
      res.status(201).json({ status: 'success', data: result });
    } catch (error: any) {
      res.status(400).json({ status: 'error', message: error.message });
    }
  };

  getGroupDetails = async (req: Request, res: Response) => {
    try {
      const result = await this.groupService.getGroupDetails(req.params.id as string, req.user!.userId);
      res.status(200).json({ status: 'success', data: result });
    } catch (error: any) {
      const status = error.message.includes('Forbidden') ? 403 : 404;
      res.status(status).json({ status: 'error', message: error.message });
    }
  };

  updateGroup = async (req: Request, res: Response) => {
    try {
      const result = await this.groupService.updateGroup(req.params.id as string, req.body, req.user!.userId);
      res.status(200).json({ status: 'success', data: result });
    } catch (error: any) {
      const status = error.message.includes('Forbidden') ? 403 : 400;
      res.status(status).json({ status: 'error', message: error.message });
    }
  };

  deleteGroup = async (req: Request, res: Response) => {
    try {
      await this.groupService.deleteGroup(req.params.id as string, req.user!.userId);
      res.status(204).send();
    } catch (error: any) {
      const status = error.message.includes('Forbidden') ? 403 : 400;
      res.status(status).json({ status: 'error', message: error.message });
    }
  };

  listUserGroups = async (req: Request, res: Response) => {
    try {
      const result = await this.groupService.listUserGroups(req.user!.userId);
      res.status(200).json({ status: 'success', data: result });
    } catch (error: any) {
      res.status(500).json({ status: 'error', message: error.message });
    }
  };
}
