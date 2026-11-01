import { BadRequestException, PipeTransform } from '@nestjs/common';
export class ObjectIdPipe implements PipeTransform<string, string> {
  transform(v: string) {
    if (!/^[a-f\d]{24}$/i.test(v)) throw new BadRequestException('Invalid id');
    return v;
  }
}
