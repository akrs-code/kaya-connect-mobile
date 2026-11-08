import * as ImagePicker from 'expo-image-picker';

export const MAX_PORTFOLIO_FILE_SIZE = 5 * 1024 * 1024;
export const MAX_PORTFOLIO_ITEMS = 10;

export type PortfolioImageSource = 'library' | 'camera';

export interface SelectedPortfolioImage {
  uri: string;
  fileName: string;
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
  fileSize?: number;
}

const allowedMimeTypes = new Set<SelectedPortfolioImage['mimeType']>([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

function inferMimeType(fileName?: string | null): SelectedPortfolioImage['mimeType'] | null {
  const extension = fileName?.split('.').pop()?.toLowerCase();
  if (extension === 'jpg' || extension === 'jpeg') return 'image/jpeg';
  if (extension === 'png') return 'image/png';
  if (extension === 'webp') return 'image/webp';
  return null;
}

export async function pickPortfolioImage(source: PortfolioImageSource): Promise<SelectedPortfolioImage | null> {
  const permission = source === 'camera'
    ? await ImagePicker.requestCameraPermissionsAsync()
    : await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    throw new Error(`Photo ${source === 'camera' ? 'camera' : 'library'} permission is required to add a portfolio sample.`);
  }

  const options: ImagePicker.ImagePickerOptions = {
    mediaTypes: ['images'],
    allowsEditing: false,
    quality: 0.9,
  };
  const result = source === 'camera'
    ? await ImagePicker.launchCameraAsync(options)
    : await ImagePicker.launchImageLibraryAsync(options);

  if (result.canceled || !result.assets?.[0]) return null;

  const asset = result.assets[0];
  const mimeType = asset.mimeType && allowedMimeTypes.has(asset.mimeType as SelectedPortfolioImage['mimeType'])
    ? asset.mimeType as SelectedPortfolioImage['mimeType']
    : inferMimeType(asset.fileName);

  if (!mimeType) throw new Error('Choose a JPEG, PNG, or WebP image.');
  if (asset.fileSize && asset.fileSize > MAX_PORTFOLIO_FILE_SIZE) {
    throw new Error('Choose an image smaller than 5 MB.');
  }

  const extension = mimeType === 'image/jpeg' ? 'jpg' : mimeType.split('/')[1];
  return {
    uri: asset.uri,
    fileName: asset.fileName || `portfolio-${Date.now()}.${extension}`,
    mimeType,
    fileSize: asset.fileSize,
  };
}

export function createPortfolioFormData(
  image: SelectedPortfolioImage,
  title: string,
  description?: string,
): FormData {
  const formData = new FormData();
  formData.append('title', title.trim());
  if (description?.trim()) formData.append('description', description.trim());
  formData.append('image', {
    uri: image.uri,
    name: image.fileName,
    type: image.mimeType,
  } as any);
  return formData;
}
