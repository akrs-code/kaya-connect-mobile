import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private logger = new Logger('Exceptions');

  catch(e: any, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse();
    let status = 500;
    let body: any = { message: 'Internal server error' }; // NFR-019: never leak stack traces or DB details
    if (e instanceof HttpException) {
      status = e.getStatus();
      const r: any = e.getResponse();
      body =
        typeof r === 'string'
          ? { message: r }
          : { message: r.message, errors: r.errors };
    } else if (e?.code === 11000) {
      status = 409;
      body = { message: 'Duplicate record' };
    } else if (e?.name === 'CastError') {
      status = 400;
      body = { message: 'Invalid id' };
    } else this.logger.error(e?.stack ?? String(e)); // logged server-side only
    res.status(status).json({ statusCode: status, ...body });
  }
}
