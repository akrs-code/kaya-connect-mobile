import { Controller, Get, Param, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ObjectIdPipe } from '../../common/pipes/object-id.pipe';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@ApiTags('Notifications')
@ApiBearerAuth('access-token')
export class NotificationsController {
  constructor(private svc: NotificationsService) {}
  @Get() list(@CurrentUser('id') uid: string) {
    return this.svc.listMine(uid);
  }
  
  @Patch(':id/read') read(
    @Param('id', ObjectIdPipe) id: string,
    @CurrentUser('id') uid: string,
  ) {
    return this.svc.markRead(id, uid);
  }
}
