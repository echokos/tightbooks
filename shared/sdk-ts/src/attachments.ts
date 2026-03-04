import type { ApiFetcher } from './fetch-utils';
import type { paths } from './schema';

export const ATTACHMENTS_ROUTES = {
  BY_ID: '/api/attachments/{id}',
  PRESIGNED_URL: '/api/attachments/{id}/presigned-url',
} as const satisfies Record<string, keyof paths>;

export async function deleteAttachment(fetcher: ApiFetcher, id: string): Promise<void> {
  const del = fetcher.path(ATTACHMENTS_ROUTES.BY_ID).method('delete').create();
  await del({ id });
}

export async function fetchAttachmentPresignedUrl(
  fetcher: ApiFetcher,
  id: string
): Promise<unknown> {
  const get = fetcher.path(ATTACHMENTS_ROUTES.PRESIGNED_URL).method('get').create();
  const { data } = await get({ id });
  return data;
}
