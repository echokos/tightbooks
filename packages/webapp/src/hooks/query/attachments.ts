import { useMutation, UseMutationOptions } from '@tanstack/react-query';
import { deleteAttachment, fetchAttachmentPresignedUrl, uploadAttachment } from '@bigcapital/sdk-ts';
import { useApiFetcher } from '../useRequest';

type UploadAttachmentResponse = Awaited<ReturnType<typeof uploadAttachment>>;

function toFormData(values: FormData | Record<string, unknown>): FormData {
  if (values instanceof FormData) {
    return values;
  }
  const formData = new FormData();
  const record = values as Record<string, unknown>;
  if (record.file instanceof File) {
    formData.append('file', record.file);
  }
  return formData;
}

/**
 * Uploads the given attachments.
 */
export function useUploadAttachments(
  props?: UseMutationOptions<UploadAttachmentResponse, Error, FormData | Record<string, unknown>>
) {
  const fetcher = useApiFetcher();
  return useMutation({
    mutationFn: (values) => uploadAttachment(fetcher, toFormData(values)),
    ...props,
  });
}

/**
 * Deletes the given attachment key.
 */
export function useDeleteAttachment(props?: UseMutationOptions<void, Error, string>) {
  const fetcher = useApiFetcher();
  return useMutation({
    mutationFn: (key: string) => deleteAttachment(fetcher, key),
    ...props,
  });
}

/**
 * Uploads the given attachments.
 */
export function useGetPresignedUrlAttachment(
  props?: UseMutationOptions<unknown, Error, string>
) {
  const fetcher = useApiFetcher();
  return useMutation({
    mutationFn: (key: string) => fetchAttachmentPresignedUrl(fetcher, key),
    ...props,
  });
}
