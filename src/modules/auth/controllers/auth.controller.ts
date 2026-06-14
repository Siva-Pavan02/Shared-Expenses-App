import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';

export class AuthController {
  private authService = new AuthService();

  register = async (req: Request, res: Response) => {
    try {
      const result = await this.authService.register(req.body);
      res.status(201).json({ status: 'success', data: result });
    } catch (error: any) {
      if (error.message === 'Email is already in use') {
        res.status(409).json({ status: 'error', message: error.message });
      } else {
        res.status(500).json({ status: 'error', message: 'Internal Server Error' });
      }
    }
  };

  login = async (req: Request, res: Response) => {
    try {
      const result = await this.authService.login(req.body);
      res.status(200).json({ status: 'success', data: result });
    } catch (error: any) {
      if (error.message === 'Invalid email or password') {
        res.status(401).json({ status: 'error', message: error.message });
      } else {
        res.status(500).json({ status: 'error', message: 'Internal Server Error' });
      }
    }
  };

  getCurrentUser = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ status: 'error', message: 'Unauthorized' });
      }
      
      const user = await this.authService.getCurrentUser(req.user.userId);
      res.status(200).json({ status: 'success', data: { user } });
    } catch (error: any) {
      res.status(404).json({ status: 'error', message: error.message });
    }
  };
}
