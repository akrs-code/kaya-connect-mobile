import { BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { MediaService } from '../../src/modules/media/media.service';

const configuredConfig = {
  get: (key: string) => ({
    CLOUDINARY_CLOUD_NAME: 'demo-cloud',
    CLOUDINARY_API_KEY: 'demo-key',
    CLOUDINARY_API_SECRET: 'demo-secret',
  }[key]),
};

describe('MediaService', () => {
  it('explains when Cloudinary is not configured', () => {
    const service = new MediaService({ get: () => undefined } as any);

    expect(() => service.uploadImage(Buffer.from([0xff, 0xd8, 0xff]), 'portfolio')).toThrow(
      ServiceUnavailableException,
    );
  });

  it('rejects a configured upload with invalid image bytes before contacting Cloudinary', () => {
    const service = new MediaService(configuredConfig as any);

    expect(() => service.uploadImage(Buffer.from('not-an-image'), 'portfolio')).toThrow(
      BadRequestException,
    );
  });
});
