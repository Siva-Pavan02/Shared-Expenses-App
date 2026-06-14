import { Request, Response } from 'express';
import { MembershipService } from '../services/memberships.service';

export class MembershipController {
  private membershipService = new MembershipService();

  addMember = async (req: Request, res: Response) => {
    try {
      const result = await this.membershipService.addMember(req.params.groupId as string, req.body.userId, req.user!.userId);
      res.status(201).json({ status: 'success', data: result });
    } catch (error: any) {
      const status = error.message.includes('Forbidden') ? 403 : 400;
      res.status(status).json({ status: 'error', message: error.message });
    }
  };

  removeMember = async (req: Request, res: Response) => {
    try {
      const result = await this.membershipService.removeMember(req.params.groupId as string, req.params.memberId as string, req.user!.userId);
      res.status(200).json({ status: 'success', data: result });
    } catch (error: any) {
      const status = error.message.includes('Forbidden') ? 403 : 400;
      res.status(status).json({ status: 'error', message: error.message });
    }
  };

  getGroupMembers = async (req: Request, res: Response) => {
    try {
      const result = await this.membershipService.getGroupMembers(req.params.groupId as string, req.user!.userId);
      res.status(200).json({ status: 'success', data: result });
    } catch (error: any) {
      res.status(403).json({ status: 'error', message: error.message });
    }
  };
}
