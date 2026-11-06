import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { getModelToken } from '@nestjs/mongoose';
import * as argon2 from 'argon2';
import { Model } from 'mongoose';
import { AppModule } from '../app.module';

(async () => {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error'],
  });
  const cfg = app.get(ConfigService);
  const Category = app.get<Model<any>>(getModelToken('Category'));
  const User = app.get<Model<any>>(getModelToken('User'));
  const Profile = app.get<Model<any>>(getModelToken('Profile'));

  for (const name of [
    'Cleaning',
    'Minor Repairs',
    'Tutoring',
    'Event Preparation',
    'Graphic Design',
    'Other',
  ])
    await Category.updateOne(
      { name },
      { $setOnInsert: { name } },
      { upsert: true },
    );

  const email = cfg.get('ADMIN_SEED_EMAIL'),
    pw = cfg.get('ADMIN_SEED_PASSWORD');
  if (email && pw && !(await User.exists({ email }))) {
    // the only way an admin can be created
    const u = await User.create({
      fullName: 'System Admin',
      email,
      role: 'admin',
      passwordHash: await argon2.hash(pw, { type: argon2.argon2id }),
    });
    await Profile.create({ user: u.id });
  }
  console.log('Seed complete');
  await app.close();
})();
