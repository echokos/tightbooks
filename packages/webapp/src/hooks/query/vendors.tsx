import {
  useMutation,
  useQuery,
  useQueryClient,
  UseMutationOptions,
  UseQueryOptions,
} from '@tanstack/react-query';
import type {
  Vendor,
  CreateVendorBody,
  EditVendorBody,
  BulkDeleteVendorsBody,
  ValidateBulkDeleteVendorsResponse,
} from '@bigcapital/sdk-ts';
import type { VendorsListResponse } from '@bigcapital/sdk-ts';
import {
  fetchVendors,
  fetchVendor,
  createVendor,
  editVendor,
  deleteVendor,
  validateBulkDeleteVendors,
  bulkDeleteVendors,
} from '@bigcapital/sdk-ts';
import useApiRequest, { useApiFetcher } from '../useRequest';
import { transformPagination, transformToCamelCase } from '@/utils';
import t from './types';

const commonInvalidateQueries = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.invalidateQueries({ queryKey: [t.VENDORS] });
  queryClient.invalidateQueries({ queryKey: [t.ACCOUNTS] });
  queryClient.invalidateQueries({ queryKey: [t.ACCOUNT] });
  queryClient.invalidateQueries({ queryKey: [t.FINANCIAL_REPORT] });
  queryClient.invalidateQueries({ queryKey: [t.ORGANIZATION_MUTATE_BASE_CURRENCY_ABILITIES] });
};

export type VendorsListResult = {
  vendors: unknown[];
  pagination: ReturnType<typeof transformPagination>;
  filterMeta: Record<string, unknown>;
};

function transformVendorsList(res: VendorsListResponse): VendorsListResult {
  const data = res as { vendors?: unknown[]; pagination?: unknown; filter_meta?: Record<string, unknown> };
  return {
    vendors: data?.vendors ?? [],
    pagination: transformPagination(data?.pagination ?? {}),
    filterMeta: data?.filter_meta ?? {},
  };
}

export function useVendors(
  query?: Record<string, unknown>,
  props?: Omit<UseQueryOptions<VendorsListResult>, 'queryKey' | 'queryFn'>
) {
  const fetcher = useApiFetcher();
  return useQuery({
    queryKey: [t.VENDORS, query],
    queryFn: () =>
      (fetchVendors as (f: ReturnType<typeof useApiFetcher>, q?: Record<string, unknown>) => Promise<VendorsListResponse>)(
        fetcher,
        query
      ).then(transformVendorsList),
    ...props,
  });
}

export function useEditVendor(
  props?: UseMutationOptions<void, Error, [number, EditVendorBody]>
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: ([id, values]: [number, EditVendorBody]) =>
      editVendor(fetcher, id, values),
    onSuccess: (_data: void, [id]: [number, EditVendorBody]) => {
      queryClient.invalidateQueries({ queryKey: [t.VENDOR, id] });
      commonInvalidateQueries(queryClient);
    },
    ...props,
  });
}

export function useDeleteVendor(
  props?: UseMutationOptions<void, Error, number>
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: (id: number) => deleteVendor(fetcher, id),
    onSuccess: (_data: void, id: number) => {
      queryClient.invalidateQueries({ queryKey: [t.VENDOR, id] });
      commonInvalidateQueries(queryClient);
    },
    ...props,
  });
}

export function useBulkDeleteVendors(
  props?: UseMutationOptions<void, Error, { ids: number[]; skipUndeletable?: boolean }>
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: ({
      ids,
      skipUndeletable = false,
    }: {
      ids: number[];
      skipUndeletable?: boolean;
    }) => bulkDeleteVendors(fetcher, { ids, skipUndeletable }),
    onSuccess: () => commonInvalidateQueries(queryClient),
    ...props,
  });
}

export function useValidateBulkDeleteVendors(
  props?: UseMutationOptions<ValidateBulkDeleteVendorsResponse, Error, number[]>
) {
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: (ids: number[]) =>
      validateBulkDeleteVendors(fetcher, { ids, skipUndeletable: false } as BulkDeleteVendorsBody).then(
        (res) => transformToCamelCase(res as Record<string, unknown>) as ValidateBulkDeleteVendorsResponse
      ),
    ...props,
  });
}

export function useCreateVendor(
  props?: UseMutationOptions<void, Error, CreateVendorBody>
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: (values: CreateVendorBody) => createVendor(fetcher, values),
    onSuccess: () => commonInvalidateQueries(queryClient),
    ...props,
  });
}

export function useVendor(
  id: number | null | undefined,
  props?: Omit<UseQueryOptions<Vendor>, 'queryKey' | 'queryFn'>
) {
  const fetcher = useApiFetcher();
  return useQuery({
    queryKey: [t.VENDOR, id],
    queryFn: () => fetchVendor(fetcher, id!),
    enabled: id != null,
    ...props,
  });
}

export function useEditVendorOpeningBalance(
  props?: UseMutationOptions<unknown, Error, [number, Record<string, unknown>]>
) {
  const queryClient = useQueryClient();
  const apiRequest = useApiRequest();

  return useMutation({
    mutationFn: ([id, values]: [number, Record<string, unknown>]) =>
      apiRequest.put(`vendors/${id}/opening-balance`, values),
    onSuccess: (_data: unknown, [id]: [number, Record<string, unknown>]) => {
      queryClient.invalidateQueries({ queryKey: [t.VENDOR, id] });
      commonInvalidateQueries(queryClient);
    },
    ...props,
  });
}

export function useRefreshVendors() {
  const queryClient = useQueryClient();
  return {
    refresh: () => queryClient.invalidateQueries({ queryKey: [t.VENDORS] }),
  };
}
