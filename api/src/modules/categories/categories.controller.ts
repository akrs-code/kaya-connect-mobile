import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { CategoriesService } from './categories.service';

@Controller('categories')
@ApiTags('Categories')
export class CategoriesController {
  constructor(private svc: CategoriesService) {}
  @Public() @Get() list() {
    return this.svc.listActive();
  }
}
