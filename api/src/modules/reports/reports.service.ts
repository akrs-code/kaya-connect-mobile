import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateReportDto } from './reports.dto';

@Injectable()
export class ReportsService {
  private targets: Record<string, Model<any>>;
  constructor(
    @InjectModel('Report') private reports: Model<any>,
    @InjectModel('Opportunity') opps: Model<any>,
    @InjectModel('User') users: Model<any>,
  ) {
    this.targets = {
      opportunity: opps,
      user: users,
    };
  }

  async create(uid: string, d: CreateReportDto) {
    if (!(await this.targets[d.targetType].exists({ _id: d.targetId })))
      throw new NotFoundException('Reported item not found');
    if (d.targetType === 'user' && d.targetId === uid)
      throw new BadRequestException('You cannot report yourself');
    if (
      await this.reports.exists({
        reporter: uid,
        targetType: d.targetType,
        targetId: d.targetId,
        status: 'open',
      })
    )
      throw new ConflictException(
        'You already have an open report for this item',
      );
    return this.reports.create({ ...d, reporter: uid });
  }
}
