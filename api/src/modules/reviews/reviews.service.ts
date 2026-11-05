import { ConflictException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { paginate } from '../../common/utils/zod';
import { AssignmentsService } from '../assignments/assignments.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateReviewDto } from './reviews.dto';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectModel('Review') private reviews: Model<any>,
    private assignments: AssignmentsService,
    private notifications: NotificationsService,
  ) {}

  async create(assignmentId: string, uid: string, d: CreateReviewDto) {
    const a = await this.assignments.load(assignmentId, uid);
    if (a.status !== 'completed')
      throw new ConflictException(
        'Reviews open only after completion is confirmed',
      );
    const reviewee = a.requester.toString() === uid ? a.provider : a.requester;
    const rv = await this.reviews.create({
      assignment: assignmentId,
      reviewer: uid,
      reviewee,
      ...d,
    }); // duplicate -> 409 via unique index
    this.notifications.notify(
      reviewee,
      'review.new',
      'You received a new review',
      'assignment',
      assignmentId,
    );
    return rv;
  }

  listForUser(userId: string, q: { page: number; limit: number }) {
    const { skip, limit } = paginate(q);
    return this.reviews
      .find({ reviewee: userId, moderationStatus: 'visible' })
      .populate('reviewer', 'fullName')
      .select('rating comment createdAt reviewer')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
  }

  async summary(userId: string) {
    const [r] = await this.reviews.aggregate([
      {
        $match: {
          reviewee: new Types.ObjectId(userId),
          moderationStatus: 'visible',
        },
      },
      {
        $group: { _id: null, average: { $avg: '$rating' }, count: { $sum: 1 } },
      },
    ]);
    return {
      average: r ? Math.round(r.average * 10) / 10 : null,
      count: r?.count ?? 0,
    };
  }
}
