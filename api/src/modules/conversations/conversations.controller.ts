import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ObjectIdPipe } from '../../common/pipes/object-id.pipe';
import { ZodPipe } from '../../common/pipes/zod.pipe';
import { ImageUpload } from '../../common/utils/upload';
import { messagesQuery, sendSchema } from './conversations.dto';
import { ConversationsService } from './conversations.service';

// There is intentionally no admin route that reads messages (SRD 2.3.4).
@Controller('conversations')
@ApiTags('Conversations')
@ApiBearerAuth('access-token')
export class ConversationsController {
  constructor(private svc: ConversationsService) {}
  @Get() list(@CurrentUser('id') uid: string) {
    return this.svc.listMine(uid);
  }

  @Get(':id/messages')
  messages(
    @Param('id', ObjectIdPipe) id: string,
    @CurrentUser('id') uid: string,
    @Query(new ZodPipe(messagesQuery)) q: any,
  ) {
    return this.svc.messages(id, uid, q);
  }

  @Post(':id/messages')
  @UseInterceptors(ImageUpload())
  send(
    @Param('id', ObjectIdPipe) id: string,
    @CurrentUser('id') uid: string,
    @Body(new ZodPipe(sendSchema)) b: { text?: string },
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.svc.send(id, uid, b.text, file);
  }
}
