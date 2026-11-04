import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class CategoriesService {
  constructor(@InjectModel('Category') private cats: Model<any>) {}
  listActive() {
    return this.cats.find({ isActive: true }).sort({ name: 1 }).lean();
  }
  create(name: string) {
    return this.cats.create({ name });
  }
  async update(id: string, d: { name?: string; isActive?: boolean }) {
    const c = await this.cats.findByIdAndUpdate(
      id,
      { $set: d },
      { new: true, runValidators: true },
    );
    if (!c) throw new NotFoundException('Category not found');
    return c;
  }
}
