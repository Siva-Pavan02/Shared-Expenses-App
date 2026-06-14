import { AuthRepository } from '../repositories/auth.repository';
import { RegisterUserDto, LoginUserDto } from '../dtos/auth.dto';
import { hashPassword, comparePassword } from '../../../shared/utils/password';
import { generateToken } from '../../../shared/utils/jwt';

export class AuthService {
  private repository = new AuthRepository();

  async register(data: RegisterUserDto) {
    const existingUser = await this.repository.findByEmail(data.email);
    if (existingUser) {
      throw new Error('Email is already in use');
    }

    const passwordHash = await hashPassword(data.password);
    const user = await this.repository.create(data, passwordHash);

    const token = generateToken({ userId: user.id, email: user.email });

    return {
      user: { id: user.id, email: user.email, name: user.name },
      token
    };
  }

  async login(data: LoginUserDto) {
    const user = await this.repository.findByEmail(data.email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    const isPasswordValid = await comparePassword(data.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    const token = generateToken({ userId: user.id, email: user.email });

    return {
      user: { id: user.id, email: user.email, name: user.name },
      token
    };
  }

  async getCurrentUser(userId: string) {
    const user = await this.repository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    return { id: user.id, email: user.email, name: user.name };
  }
}
