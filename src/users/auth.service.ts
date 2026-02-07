import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { promisify } from 'util';
import { scrypt } from 'crypto';

const scryptAsync = promisify(scrypt);

@Injectable()
export class AuthService {
  constructor(private userService: UsersService) {}

  async signup(email: string, password: string) {
    const foundUser = await this.userService.find(email);
    if (foundUser?.length) throw new BadRequestException('email_in_use');
    const user = await this.userService.create(email, password);
    return user;
  }

  async login(email: string, password: string) {
    const [user] = await this.userService.find(email);
    if (!user) throw new NotFoundException('user_not_found');
    const [salt, storedHash] = user.password.split('.');
    const hash = (await scryptAsync(password, salt, 100)) as Buffer;
    if (storedHash !== hash.toString('hex')) {
      throw new BadRequestException('user_credentials_not_match');
    }
    return user;
  }
}
