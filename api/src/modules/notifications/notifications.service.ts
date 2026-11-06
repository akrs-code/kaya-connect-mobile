import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class NotificationsService {
  constructor(@InjectModel('Notification') private notes: Model<any>) {}
  /** Fire-and-forget: a failed notification must never break the main flow. */
  notify(
    user: unknown,
    type: string,
    message: string,
    refType?: string,
    refId?: unknown,
  ) {
    return this.notes
      .create({ user, type, message, refType, refId })
      .catch(() => undefined);
  }
  listMine(userId: string) {
    return this.notes
      .find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
  }
  markRead(id: string, userId: string) {
    return this.notes.findOneAndUpdate(
      { _id: id, user: userId },
      { read: true },
      { new: true },
    );
  }
}
