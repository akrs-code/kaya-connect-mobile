import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MediaService } from '../media/media.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ConversationsService {
  constructor(
    @InjectModel('Conversation') private convs: Model<any>,
    @InjectModel('Message') private msgs: Model<any>,
    @InjectModel('Application') private apps: Model<any>,
    private media: MediaService,
    private notifications: NotificationsService,
  ) {}

  private async load(id: string, uid: string) {
    const c = await this.convs.findOne({ _id: id, participants: uid });
    if (!c) throw new NotFoundException('Conversation not found'); // outsiders cannot tell it exists
    return c;
  }
  listMine(uid: string) {
    return this.convs
      .find({ participants: uid })
      .populate('participants', 'fullName')
      .sort({ lastMessageAt: -1, updatedAt: -1 })
      .lean();
  }

  async messages(
    id: string,
    uid: string,
    q: { before?: string; limit: number },
  ) {
    await this.load(id, uid);
    const f: any = { conversation: id, moderationStatus: 'visible' };
    if (q.before) f._id = { $lt: q.before };
    const rows = await this.msgs
      .find(f)
      .sort({ _id: -1 })
      .limit(q.limit)
      .lean();
    return rows.map((m: any) => ({
      ...m,
      media: m.media.map((x: any) => ({
        url: this.media.signedUrl(x.publicId),
      })),
    })); // short-lived signed URLs
  }

  async send(
    id: string,
    uid: string,
    text: string | undefined,
    file?: Express.Multer.File,
  ) {
    const c = await this.load(id, uid);
    const app = await this.apps.findById(c.application).select('status');
    if (!app || !['submitted', 'selected'].includes(app.status))
      throw new ForbiddenException('This conversation is closed');
    if (!text && !file)
      throw new BadRequestException('Message cannot be empty');
    const media = file
      ? [
          {
            publicId: (
              await this.media.uploadImage(file.buffer, 'messages', true)
            ).publicId,
          },
        ]
      : [];
    const m = await this.msgs.create({
      conversation: id,
      sender: uid,
      text: text ?? '',
      media,
    });
    await this.convs.updateOne({ _id: id }, { lastMessageAt: new Date() });
    this.notifications.notify(
      c.participants.find((p: any) => p.toString() !== uid),
      'message.new',
      'New message',
      'conversation',
      id,
    );
    return m;
  }
}
