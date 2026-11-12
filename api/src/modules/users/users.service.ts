import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { MediaService } from '../media/media.service';
import { ReviewsService } from '../reviews/reviews.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel('User') private users: Model<any>,
    @InjectModel('Profile') private profiles: Model<any>,
    private media: MediaService,
    private reviews: ReviewsService,
  ) {}

  async getMe(id: string) {
    const [user, profile] = await Promise.all([
      this.users.findById(id),
      this.profiles.findOne({ user: id }),
    ]);
    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl,
      profile,
    };
  }
  async submitAccountAppeal(id: string, reason: string) {
    const user = await this.users.findOne({
      _id: id,
      role: 'user',
      accountStatus: { $in: ['suspended', 'deactivated'] },
    });
    if (!user) throw new NotFoundException('Restricted user account not found');
    if (user.accountAppeal?.status === 'pending')
      throw new ConflictException('An account appeal is already pending');
    user.accountAppeal = { status: 'pending', reason, submittedAt: new Date() };
    await user.save();
    return {
      status: user.accountAppeal.status,
      submittedAt: user.accountAppeal.submittedAt,
    };
  }
  updateMe(id: string, d: { fullName: string }) {
    return this.users.findByIdAndUpdate(
      id,
      { fullName: d.fullName },
      { new: true, runValidators: true },
    );
  }
  upsertProfile(id: string, d: object) {
    return this.profiles.findOneAndUpdate(
      { user: id },
      { $set: d },
      { new: true, upsert: true, runValidators: true },
    );
  }

  async uploadAvatar(userId: string, file?: Express.Multer.File) {
    if (!file) throw new BadRequestException('Image is required');
    const user = await this.users.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    const image = await this.media.uploadImage(file.buffer, 'avatars');
    const previousPublicId = user.avatarPublicId;
    user.avatarUrl = image.url;
    user.avatarPublicId = image.publicId;
    await user.save();
    if (previousPublicId) await this.media.destroyImage(previousPublicId);
    return { avatarUrl: user.avatarUrl };
  }

  async getPublicProfile(id: string) {
    const user = await this.users
      .findOne({ _id: id, accountStatus: { $ne: 'suspended' } })
      .select('fullName createdAt avatarUrl');
    const p: any = await this.profiles.findOne({ user: id }).lean();
    if (!user || !p) throw new NotFoundException('User not found');
    return {
      id,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl,
      memberSince: user.createdAt,
      biography: p.biography,
      skills: p.skills,
      serviceArea: p.serviceArea,
      ...(p.visibility?.experience && { experience: p.experience }),
      ...(p.visibility?.availability && { availability: p.availability }),
      ...(p.visibility?.portfolio && {
        portfolio: p.portfolio?.map(({ title, description, imageUrl }) => ({
          title,
          description,
          imageUrl,
        })),
      }),
      reviewSummary: await this.reviews.summary(id), // email and credentials are never exposed
    };
  }

  async addPortfolio(
    userId: string,
    d: { title: string; description?: string },
    file?: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Image is required');
    const p = await this.profiles.findOne({ user: userId });
    if (!p) throw new NotFoundException('Profile not found');
    if (p.portfolio.length >= 10)
      throw new ConflictException('Portfolio is limited to 10 items');
    const img = await this.media.uploadImage(file.buffer, 'portfolio');
    p.portfolio.push({ ...d, imageUrl: img.url, publicId: img.publicId });
    await p.save();
    return p.portfolio[p.portfolio.length - 1];
  }
  async removePortfolio(userId: string, itemId: string) {
    const p = await this.profiles.findOne({
      user: userId,
      'portfolio._id': new Types.ObjectId(itemId),
    });
    if (!p) throw new NotFoundException('Portfolio item not found');
    const item = p.portfolio.find((i: any) => i._id.toString() === itemId);
    await this.profiles.updateOne(
      { user: userId },
      { $pull: { portfolio: { _id: new Types.ObjectId(itemId) } } },
    );
    if (item?.publicId) await this.media.destroyImage(item.publicId);
  }
}
