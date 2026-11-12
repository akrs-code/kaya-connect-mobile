import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { Env } from '../../config/env';

@Injectable()
export class MediaService {
  private readonly isConfigured: boolean;

  constructor(cfg: ConfigService<Env, true>) {
    const cloudName = cfg.get('CLOUDINARY_CLOUD_NAME');
    const apiKey = cfg.get('CLOUDINARY_API_KEY');
    const apiSecret = cfg.get('CLOUDINARY_API_SECRET');
    this.isConfigured = Boolean(cloudName && apiKey && apiSecret);
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true, // secrets stay on the server
    });
  }

  /** Magic-byte check: do not trust the client-supplied MIME type. */
  assertImage(b: Buffer) {
    const jpeg = b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
    const png = b.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47]));
    const webp =
      b.subarray(0, 4).toString() === 'RIFF' &&
      b.subarray(8, 12).toString() === 'WEBP';
    if (!(jpeg || png || webp))
      throw new BadRequestException(
        'File is not a valid JPEG, PNG or WebP image',
      );
  }

  uploadImage(
    buffer: Buffer,
    folder: string,
    priv = false,
  ): Promise<{ url: string; publicId: string }> {
    if (!this.isConfigured) {
      throw new ServiceUnavailableException(
        'Image uploads are unavailable. Configure Cloudinary credentials on the server.',
      );
    }
    this.assertImage(buffer);
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: `kayaconnect/${folder}`,
          resource_type: 'image',
          type: priv ? 'authenticated' : 'upload',
          allowed_formats: ['jpg', 'png', 'webp'],
        },
        (err, r) =>
          err || !r
            ? reject(new BadGatewayException('Image upload failed'))
            : resolve({ url: r.secure_url, publicId: r.public_id }),
      );
      stream.end(buffer);
    });
  }
  signedUrl(publicId: string) {
    return cloudinary.url(publicId, {
      type: 'authenticated',
      sign_url: true,
      secure: true,
    });
  }
  destroyImage(publicId: string, priv = false) {
    return cloudinary.uploader
      .destroy(publicId, { type: priv ? 'authenticated' : 'upload' })
      .catch(() => undefined);
  }
}
