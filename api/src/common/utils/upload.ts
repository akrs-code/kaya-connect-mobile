import { BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

/** Image upload interceptor: memory storage, 5 MB cap, MIME allow-list. Magic bytes are re-checked in MediaService. */
export const ImageUpload = () =>
  FileInterceptor('image', {
    storage: memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024, files: 1 },
    fileFilter: (_req, file, cb) =>
      ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)
        ? cb(null, true)
        : cb(
            new BadRequestException(
              'Only JPEG, PNG or WebP images are allowed',
            ) as any,
            false,
          ),
  });
