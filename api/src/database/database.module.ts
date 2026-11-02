import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MODELS } from './models';

/** Registers every model once. Global, so any service can @InjectModel without per-module forFeature boilerplate. */
@Global()
@Module({
  imports: [MongooseModule.forFeature(MODELS)],
  exports: [MongooseModule],
})
export class DatabaseModule {}
