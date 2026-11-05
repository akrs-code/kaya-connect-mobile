import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model } from 'mongoose';

@Injectable()
export class AuditService {
  constructor(@InjectModel('AuditEvent') private events: Model<any>) {}
  log(
    actor: string,
    eventType: string,
    targetType: string,
    targetId: unknown,
    metadata: object = {},
    session?: ClientSession,
  ) {
    return this.events.create(
      [{ actor, eventType, targetType, targetId, metadata }],
      { session },
    );
  }
}
