import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { NoSqlGuard } from './common/guards/no-sql.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { Env, validateEnv } from './config/env';
import { DatabaseModule } from './database/database.module';
import { AdminModule } from './modules/admin/admin.module';
import { ApplicationsModule } from './modules/applications/applications.module';
import { AssignmentsModule } from './modules/assignments/assignments.module';
import { AuditModule } from './modules/audit/audit.module';
import { AuthModule } from './modules/auth/auth.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { ConversationsModule } from './modules/conversations/conversations.module';
import { HealthController } from './modules/health.controller';
import { MediaModule } from './modules/media/media.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { OpportunitiesModule } from './modules/opportunities/opportunities.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { ReportsModule } from './modules/reports/reports.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService<Env, true>) => ({
        uri: cfg.getOrThrow('MONGODB_URI'),
      }),
    }),
    ThrottlerModule.forRoot([{ ttl: 15 * 60_000, limit: 300 }]),
    DatabaseModule,
    AuditModule,
    NotificationsModule,
    MediaModule,
    AuthModule,
    UsersModule,
    CategoriesModule,
    OpportunitiesModule,
    ApplicationsModule,
    AssignmentsModule,
    PaymentsModule,
    ReviewsModule,
    ConversationsModule,
    ReportsModule,
    AdminModule,
  ],
  controllers: [HealthController],
  providers: [
    // Global guards run in this order: rate limit -> input sanity -> authentication -> role check
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: NoSqlGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
