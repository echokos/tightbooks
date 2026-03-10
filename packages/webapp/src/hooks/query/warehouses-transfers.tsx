import {
  useMutation,
  useQuery,
  useQueryClient,
  UseMutationOptions,
  UseQueryOptions,
} from '@tanstack/react-query';
import type {
  CreateWarehouseTransferBody,
  EditWarehouseTransferBody,
  WarehouseTransfer,
  WarehouseTransfersListResponse,
} from '@bigcapital/sdk-ts';
import {
  fetchWarehouseTransfers,
  fetchWarehouseTransfer,
  createWarehouseTransfer,
  editWarehouseTransfer,
  deleteWarehouseTransfer,
  initiateWarehouseTransfer,
  transferredWarehouseTransfer,
} from '@bigcapital/sdk-ts';
import { useApiFetcher } from '../useRequest';
import t from './types';

/** Query params for listing warehouse transfers (pagination, filter, etc.). */
type GetWarehouseTransfersQuery = Record<string, string | number | boolean | undefined>;

const commonInvalidateQueries = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.invalidateQueries({ queryKey: [t.WAREHOUSE_TRANSFERS] });
  queryClient.invalidateQueries({ queryKey: [t.ITEM_WAREHOUSES_LOCATION] });
  queryClient.invalidateQueries({ queryKey: [t.ITEMS] });
  queryClient.invalidateQueries({ queryKey: [t.ITEM] });
};

/**
 * Create a new warehouse transfer.
 */
export function useCreateWarehouseTransfer(
  props?: UseMutationOptions<void, Error, CreateWarehouseTransferBody>
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: (values: CreateWarehouseTransferBody) =>
      createWarehouseTransfer(fetcher, values),
    onSuccess: () => commonInvalidateQueries(queryClient),
    ...props,
  });
}

/**
 * Edits the given warehouse transfer.
 */
export function useEditWarehouseTransfer(
  props?: UseMutationOptions<void, Error, [number, EditWarehouseTransferBody]>
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: ([id, values]: [number, EditWarehouseTransferBody]) =>
      editWarehouseTransfer(fetcher, id, values),
    onSuccess: (_, [id]) => {
      queryClient.invalidateQueries({ queryKey: [t.WAREHOUSE_TRANSFER, id] });
      commonInvalidateQueries(queryClient);
    },
    ...props,
  });
}

/**
 * Deletes the given warehouse Transfer.
 */
export function useDeleteWarehouseTransfer(
  props?: UseMutationOptions<void, Error, number>
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: (id: number) => deleteWarehouseTransfer(fetcher, id),
    onSuccess: () => commonInvalidateQueries(queryClient),
    ...props,
  });
}

/**
 * Retrieve Warehouses list.
 */
export function useWarehousesTransfers(
  query?: GetWarehouseTransfersQuery | null,
  props?: Omit<
    UseQueryOptions<WarehouseTransfersListResponse>,
    'queryKey' | 'queryFn'
  >
) {
  const fetcher = useApiFetcher();
  return useQuery({
    queryKey: [t.WAREHOUSE_TRANSFERS, query],
    queryFn: () =>
      (
        fetchWarehouseTransfers as (
          fetcher: unknown,
          query?: GetWarehouseTransfersQuery
        ) => Promise<WarehouseTransfersListResponse>
      )(fetcher, query ?? undefined),
    ...props,
  });
}

/**
 * Retrieve the warehouse transfer details.
 */
export function useWarehouseTransfer(
  id: number | null | undefined,
  props?: Omit<UseQueryOptions<WarehouseTransfer>, 'queryKey' | 'queryFn'>,
  _requestProps?: Record<string, unknown>
) {
  const fetcher = useApiFetcher();
  return useQuery({
    queryKey: [t.WAREHOUSE_TRANSFER, id],
    queryFn: () => fetchWarehouseTransfer(fetcher, id!),
    enabled: id != null,
    ...props,
  });
}

/**
 * Initiate warehouse transfer.
 */
export function useInitiateWarehouseTransfer(
  props?: UseMutationOptions<void, Error, number>
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: (id: number) => initiateWarehouseTransfer(fetcher, id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: [t.WAREHOUSE_TRANSFER, id] });
      commonInvalidateQueries(queryClient);
    },
    ...props,
  });
}

/**
 * Mark warehouse transfer as transferred.
 */
export function useTransferredWarehouseTransfer(
  props?: UseMutationOptions<void, Error, number>
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: (id: number) => transferredWarehouseTransfer(fetcher, id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: [t.WAREHOUSE_TRANSFER, id] });
      commonInvalidateQueries(queryClient);
    },
    ...props,
  });
}

export function useRefreshWarehouseTransfers() {
  const queryClient = useQueryClient();

  return {
    refresh: () => {
      queryClient.invalidateQueries({ queryKey: [t.WAREHOUSE_TRANSFERS] });
    },
  };
}
