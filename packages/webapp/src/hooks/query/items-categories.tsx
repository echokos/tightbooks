import {
  useMutation,
  useQuery,
  useQueryClient,
  UseMutationOptions,
  UseQueryOptions,
} from '@tanstack/react-query';
import type {
  ItemCategory,
  ItemCategoriesListResponse,
  CreateItemCategoryBody,
  EditItemCategoryBody,
} from '@bigcapital/sdk-ts';
import {
  fetchItemCategories,
  fetchItemCategory,
  createItemCategory,
  editItemCategory,
  deleteItemCategory,
} from '@bigcapital/sdk-ts';
import { useApiFetcher } from '../useRequest';
import t from './types';

const commonInvalidateQueries = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.invalidateQueries({ queryKey: [t.ITEMS_CATEGORIES] });
  queryClient.invalidateQueries({ queryKey: [t.ITEMS] });
};

export type ItemsCategoriesListResult = {
  itemsCategories: unknown[];
  pagination: Record<string, unknown>;
};

/**
 * Creates a new item category.
 */
export function useCreateItemCategory(
  props?: UseMutationOptions<void, Error, CreateItemCategoryBody>
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: (values: CreateItemCategoryBody) =>
      createItemCategory(fetcher, values),
    onSuccess: () => commonInvalidateQueries(queryClient),
    ...props,
  });
}

/**
 * Edits the item category.
 */
export function useEditItemCategory(
  props?: UseMutationOptions<void, Error, [number, EditItemCategoryBody]>
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: ([id, values]: [number, EditItemCategoryBody]) =>
      editItemCategory(fetcher, id, values),
    onSuccess: (_data, [id]) => {
      queryClient.invalidateQueries({ queryKey: [t.ITEM_CATEGORY, id] });
      commonInvalidateQueries(queryClient);
    },
    ...props,
  });
}

/**
 * Deletes the given item category.
 */
export function useDeleteItemCategory(
  props?: UseMutationOptions<void, Error, number>
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: (id: number) => deleteItemCategory(fetcher, id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: [t.ITEM_CATEGORY, id] });
      commonInvalidateQueries(queryClient);
    },
    ...props,
  });
}

function transformCategories(data: ItemCategoriesListResponse): ItemsCategoriesListResult {
  const arr = Array.isArray(data) ? data : (data as { data?: unknown[] })?.data ?? [];
  const pagination = (data as { pagination?: Record<string, unknown> })?.pagination ?? {};
  return {
    itemsCategories: arr,
    pagination,
  };
}

/**
 * Retrieve the items categories.
 */
export function useItemsCategories(
  query?: Record<string, unknown>,
  props?: Omit<
    UseQueryOptions<ItemCategoriesListResponse, Error, ItemsCategoriesListResult>,
    'queryKey' | 'queryFn' | 'select'
  >
) {
  const fetcher = useApiFetcher();
  return useQuery<ItemCategoriesListResponse, Error, ItemsCategoriesListResult>({
    queryKey: [t.ITEMS_CATEGORIES, query],
    queryFn: () => fetchItemCategories(fetcher),
    select: transformCategories,
    ...props,
  });
}

/**
 * Retrieve the item category details.
 */
export function useItemCategory(
  id: number | null | undefined,
  props?: Omit<UseQueryOptions<ItemCategory>, 'queryKey' | 'queryFn'>
) {
  const fetcher = useApiFetcher();
  return useQuery({
    queryKey: [t.ITEM_CATEGORY, id],
    queryFn: () => fetchItemCategory(fetcher, id!),
    enabled: id != null,
    ...props,
  });
}
