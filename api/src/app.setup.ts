import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import compression from 'compression';
import helmet from 'helmet';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { Env } from './config/env';

/** Shared by main.ts and the e2e tests so both run the exact same pipeline. */
export function configureApp(app: INestApplication) {
  const cfg = app.get(ConfigService<Env, true>);
  (app.getHttpAdapter().getInstance() as any).set('trust proxy', 1);
  app.setGlobalPrefix('api/v1');
  app.use(helmet());
  app.use(compression());
  app.enableCors({
    origin: cfg.getOrThrow<string>('CLIENT_ORIGIN').split(','),
  });
  app.useGlobalFilters(new AllExceptionsFilter());
}
