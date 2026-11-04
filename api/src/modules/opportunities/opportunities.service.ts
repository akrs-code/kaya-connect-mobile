import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  assertCompensation,
  assertSchedule,
} from '../../common/utils/compensation';
import { paginate } from '../../common/utils/zod';
import { NotificationsService } from '../notifications/notifications.service';

/** Business rules live here as plain methods, independent of HTTP (NFR-028). */
@Injectable()
export class OpportunitiesService {
  constructor(
    @InjectModel('Opportunity') private opps: Model<any>,
    @InjectModel('Category') private cats: Model<any>,
    @InjectModel('Application') private apps: Model<any>,
    private notifications: NotificationsService,
  ) {}

  private assertRules(d: any) {
    assertSchedule(d.schedule);
    assertCompensation(d);
    if (d.opportunityType === 'volunteer' && d.compensationType !== 'unpaid')
      throw new BadRequestException('Volunteer listings must be unpaid');
    if (d.opportunityType !== 'volunteer' && d.compensationType === 'unpaid')
      throw new BadRequestException('Only volunteer listings can be unpaid');
  }
  private async assertCategory(id: unknown) {
    if (!(await this.cats.exists({ _id: id, isActive: true })))
      throw new BadRequestException('Unknown or inactive category');
  }

  async create(userId: string, { publish, ...d }: any) {
    this.assertRules(d);
    await this.assertCategory(d.category);
    return this.opps.create({
      ...d,
      requester: userId,
      status: publish ? 'published' : 'draft',
    });
  }

  async list(q: any) {
    const f: any = {
      status: 'published',
      'schedule.end': { $gte: new Date() },
    };
    if (q.q) f.$text = { $search: q.q };
    if (q.category) f.category = q.category;
    if (q.type) f.opportunityType = q.type;
    if (q.area) f['location.area'] = q.area.toLowerCase();
    if (q.compensationType) f.compensationType = q.compensationType;
    if (q.from || q.to)
      f['schedule.start'] = {
        ...(q.from && { $gte: q.from }),
        ...(q.to && { $lte: q.to }),
      };
    const { skip, limit } = paginate(q);
    const [items, total] = await Promise.all([
      this.opps
        .find(f)
        .populate('category', 'name')
        .populate('requester', 'fullName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.opps.countDocuments(f),
    ]);
    return { items, total, page: q.page, limit: q.limit };
  }

  async getOne(id: string, userId: string) {
    const o: any = await this.opps
      .findById(id)
      .populate('category', 'name')
      .populate('requester', 'fullName')
      .lean();
    const isOwner = o && o.requester._id.toString() === userId;
    if (!o || (o.status !== 'published' && !isOwner))
      throw new NotFoundException('Opportunity not found');
    return o;
  }
  mine(userId: string) {
    return this.opps.find({ requester: userId }).sort({ createdAt: -1 }).lean();
  }

  private async ownOpen(id: string, userId: string) {
    const o = await this.opps.findOne({ _id: id, requester: userId });
    if (!o) throw new NotFoundException('Opportunity not found');
    if (!['draft', 'published'].includes(o.status))
      throw new ConflictException(
        `Listing is ${o.status} and can no longer be changed`,
      );
    return o;
  }
  async update(id: string, userId: string, d: any) {
    const o = await this.ownOpen(id, userId);
    const cur = o.toObject();
    this.assertRules({
      ...cur,
      ...d,
      schedule: { ...cur.schedule, ...d.schedule },
    });
    if (d.category) await this.assertCategory(d.category);
    o.set(d);
    return o.save();
  }
  async publish(id: string, userId: string) {
    const o = await this.ownOpen(id, userId);
    this.assertRules(o.toObject());
    o.status = 'published';
    return o.save();
  }
  async close(id: string, userId: string) {
    const o = await this.ownOpen(id, userId);
    o.status = 'closed';
    await o.save();
    const pending = await this.apps
      .find({ opportunity: id, status: 'submitted' })
      .select('provider');
    await this.apps.updateMany(
      { opportunity: id, status: 'submitted' },
      { status: 'declined', active: false },
    );
    pending.forEach((a) =>
      this.notifications.notify(
        a.provider,
        'listing.closed',
        `"${o.title}" was closed by the requester`,
        'opportunity',
        o.id,
      ),
    );
    return o;
  }
}
