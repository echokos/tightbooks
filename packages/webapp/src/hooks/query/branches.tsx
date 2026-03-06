import {
  useMutation,
  useQuery,
  useQueryClient,
  UseMutationOptions,
  UseQueryOptions,
} from '@tanstack/react-query';
import type {
  Branch,
  BranchesListResponse,
  CreateBranchBody,
  EditBranchBody,
} from '@bigcapital/sdk-ts';
import {
  fetchBranches,
  fetchBranch,
  createBranch,
  editBranch,
  deleteBranch,
  activateBranches,
  markBranchAsPrimary,
} from '@bigcapital/sdk-ts';
import { useApiFetcher } from '../useRequest';
import t from './types';

const commonInvalidateQueries = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.invalidateQueries({ queryKey: [t.BRANCHES] });
  queryClient.invalidateQueries({ queryKey: [t.BRANCH] });
  queryClient.invalidateQueries({ queryKey: [t.DASHBOARD_META] });
};

export function useCreateBranch(
  props?: UseMutationOptions<void, Error, CreateBranchBody>
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: (values: CreateBranchBody) => createBranch(fetcher, values),
    onSuccess: () => commonInvalidateQueries(queryClient),
    ...props,
  });
}

export function useEditBranch(
  props?: UseMutationOptions<void, Error, [number | string, EditBranchBody]>
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: ([id, values]: [number | string, EditBranchBody]) =>
      editBranch(fetcher, String(id), values),
    onSuccess: (_data, [id]) => {
      queryClient.invalidateQueries({ queryKey: [t.BRANCH, id] });
      commonInvalidateQueries(queryClient);
    },
    ...props,
  });
}

export function useDeleteBranch(
  props?: UseMutationOptions<void, Error, number | string>
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: (id: number | string) => deleteBranch(fetcher, String(id)),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: [t.BRANCH, id] });
      commonInvalidateQueries(queryClient);
    },
    ...props,
  });
}

export function useBranches(
  query?: Record<string, unknown>,
  props?: Omit<UseQueryOptions<BranchesListResponse>, 'queryKey' | 'queryFn'>
) {
  const fetcher = useApiFetcher();
  return useQuery({
    queryKey: [t.BRANCHES, query],
    queryFn: () => fetchBranches(fetcher),
    select: (data: BranchesListResponse) => data,
    ...props,
  });
}

export function useBranch(
  id: number | string | null | undefined,
  props?: Omit<UseQueryOptions<Branch>, 'queryKey' | 'queryFn'>,
  _requestProps?: Record<string, unknown>
) {
  const fetcher = useApiFetcher();
  return useQuery({
    queryKey: [t.BRANCH, id],
    queryFn: () => fetchBranch(fetcher, String(id!)),
    enabled: id != null,
    ...props,
  });
}

export function useActivateBranches(
  props?: UseMutationOptions<void, Error, number | string>
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: () => activateBranches(fetcher),
    onSuccess: () => commonInvalidateQueries(queryClient),
    ...props,
  });
}

export function useMarkBranchAsPrimary(
  props?: UseMutationOptions<void, Error, number | string>
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: (id: number | string) => markBranchAsPrimary(fetcher, String(id)),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: [t.BRANCH, id] });
      commonInvalidateQueries(queryClient);
    },
    ...props,
  });
}
