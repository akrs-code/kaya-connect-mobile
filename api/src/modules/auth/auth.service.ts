import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import * as argon2 from 'argon2';
import { createHash, randomBytes } from 'crypto';
import { Model } from 'mongoose';
import { RegisterDto } from './auth.dto';

const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');
const dto = (u: any) => ({
  id: u.id,
  fullName: u.fullName,
  email: u.email,
  role: u.role,
  avatarUrl: u.avatarUrl,
});

@Injectable()
export class AuthService {
  constructor(
    private jwt: JwtService,
    @InjectModel('User') private users: Model<any>,
    @InjectModel('Profile') private profiles: Model<any>,
    @InjectModel('RefreshToken') private tokens: Model<any>,
  ) {}

  private async issueTokens(u: { id: string; role: string }) {
    const accessToken = await this.jwt.signAsync(
      { role: u.role },
      { subject: u.id },
    );
    const refreshToken = randomBytes(48).toString('hex'); // opaque; only its hash is stored
    await this.tokens.create({
      user: u.id,
      tokenHash: sha256(refreshToken),
      expiresAt: new Date(Date.now() + 7 * 864e5),
    });
    return { accessToken, refreshToken };
  }

  async register(d: RegisterDto) {
    if (await this.users.exists({ email: d.email }))
      throw new ConflictException('Email is already registered');
    const passwordHash = await argon2.hash(d.password, {
      type: argon2.argon2id,
    });
    const user = await this.users.create({
      fullName: d.fullName,
      email: d.email,
      passwordHash,
    });
    await this.profiles.create({ user: user.id });
    return { user: dto(user), ...(await this.issueTokens(user)) };
  }

  async login(email: string, password: string) {
    const user = await this.users.findOne({ email }).select('+passwordHash');
    const ok = user && (await argon2.verify(user.passwordHash, password));
    if (!user || !ok)
      throw new UnauthorizedException('Invalid email or password'); // same message for both cases
    if (user.accountStatus !== 'active')
      throw new ForbiddenException('Account is not active');
    return { user: dto(user), ...(await this.issueTokens(user)) };
  }

  async refresh(token: string) {
    const rec = await this.tokens.findOneAndDelete({
      tokenHash: sha256(token),
    }); // rotation: single use
    if (!rec || rec.expiresAt < new Date())
      throw new UnauthorizedException('Invalid refresh token');
    const user = await this.users.findById(rec.user);
    if (!user || user.accountStatus !== 'active')
      throw new ForbiddenException('Account unavailable');
    return this.issueTokens(user);
  }

  logout(token: string) {
    return this.tokens.deleteOne({ tokenHash: sha256(token) });
  }
  revokeAll(userId: string) {
    return this.tokens.deleteMany({ user: userId });
  }
}
