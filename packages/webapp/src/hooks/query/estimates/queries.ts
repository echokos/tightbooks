import {
  useQueryClient,
  useMutation,
  useQuery,
  UseQueryOptions,
  UseQueryResult,
  UseMutationOptions,
} from '@tanstack/react-query';
import type {
  SaleEstimate,
  SaleEstimatesListResponse,
  CreateSaleEstimateBody,
  EditSaleEstimateBody,
  SaleEstimateHtmlContentResponse,
} from '@bigcapital/sdk-ts';
import {
  fetchSaleEstimates,
  fetchSaleEstimate,
  createSaleEstimate,
  editSaleEstimate,
  deleteSaleEstimate,
  bulkDeleteSaleEstimates,
  validateBulkDeleteSaleEstimates,
  deliverSaleEstimate,
  approveSaleEstimate,
  rejectSaleEstimate,
  notifySaleEstimateBySms,
  fetchSaleEstimateSmsDetails,
  fetchSaleEstimateMail,
  sendSaleEstimateMail,
  fetchSaleEstimatesState,
  fetchSaleEstimateHtmlContent,
} from '@bigcapital/sdk-ts';
import { useApiFetcher } from '../../useRequest';
import { estimatesKeys, EstimatesQueryKeys } from './query-keys';
import { itemsKeys } from '../items/query-keys';
import { useRequestPdf } from '../../useRequestPdf';

export type BulkDeleteEstimatesBody = { ids: number[]; skipUndeletable?: boolean };
export type ValidateBulkDeleteEstimatesResponse = {
  deletableCount: number;
  nonDeletableCount: number;
  deletableIds: number[];
  nonDeletableIds: number[];
};

// Keys that don't have factory methods yet - keeping inline
const SETTING = 'SETTING';
const SETTING_ESTIMATES = 'SETTING_ESTIMATES';

const commonInvalidateQueries = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.invalidateQueries({ queryKey: estimatesKeys.all() });
  queryClient.invalidateQueries({ queryKey: itemsKeys.associatedEstimates(null).slice(0, 1) });
};

export function useCreateEstimate(
  props?: UseMutationOptions<void, Error, CreateSaleEstimateBody>
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    ...props,
    mutationFn: (values: CreateSaleEstimateBody) =>
      createSaleEstimate(fetcher, values),
    onSuccess: () => {
      commonInvalidateQueries(queryClient);
      queryClient.invalidateQueries({ queryKey: [SETTING, SETTING_ESTIMATES] });
    },
  });
}

export function useEditEstimate(
  props?: UseMutationOptions<void, Error, [number, EditSaleEstimateBody]>
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    ...props,
    mutationFn: ([id, values]: [number, EditSaleEstimateBody]) =>
      editSaleEstimate(fetcher, id, values),
    onSuccess: (_data, [id]) => {
      commonInvalidateQueries(queryClient);
      queryClient.invalidateQueries({ queryKey: estimatesKeys.detail(id) });
    },
  });
}

export function useEstimate(
  id: number | null | undefined,
  props?: Omit<UseQueryOptions<SaleEstimate>, 'queryKey' | 'queryFn'>
) {
  const fetcher = useApiFetcher();
  return useQuery({
    ...props,
    queryKey: estimatesKeys.detail(id),
    queryFn: () => fetchSaleEstimate(fetcher, id!),
    enabled: id != null,
  });
}

export function useEstimates(
  query?: Record<string, unknown>,
  props?: Omit<UseQueryOptions<SaleEstimatesListResponse>, 'queryKey' | 'queryFn'>
) {
  const fetcher = useApiFetcher();
  return useQuery({
    ...props,
    queryKey: estimatesKeys.list(query),
    queryFn: () => fetchSaleEstimates(fetcher, query),
  });
}


export function useDeleteEstimate(
  props?: UseMutationOptions<void, Error, number>
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    ...props,
    mutationFn: (id: number) => deleteSaleEstimate(fetcher, id),
    onSuccess: (_data, id) => {
      commonInvalidateQueries(queryClient);
      queryClient.invalidateQueries({ queryKey: estimatesKeys.detail(id) });
    },
  });
}

export function useBulkDeleteEstimates(
  props?: UseMutationOptions<void, Error, BulkDeleteEstimatesBody>
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    ...props,
    mutationFn: (body: BulkDeleteEstimatesBody) =>
      bulkDeleteSaleEstimates(fetcher, body),
    onSuccess: () => commonInvalidateQueries(queryClient),
  });
}

export function useValidateBulkDeleteEstimates(
  props?: UseMutationOptions<ValidateBulkDeleteEstimatesResponse, Error, number[]>
) {
  const fetcher = useApiFetcher({ enableCamelCaseTransform: true });

  return useMutation({
    ...props,
    mutationFn: (ids: number[]) => validateBulkDeleteSaleEstimates(fetcher, ids),
  });
}

export function useDeliverEstimate(
  props?: UseMutationOptions<void, Error, number>
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    ...props,
    mutationFn: (id: number) => deliverSaleEstimate(fetcher, id),
    onSuccess: (_data, id) => {
      commonInvalidateQueries(queryClient);
      queryClient.invalidateQueries({ queryKey: estimatesKeys.detail(id) });
    },
  });
}

export function useApproveEstimate(
  props?: UseMutationOptions<void, Error, number>
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    ...props,
    mutationFn: (id: number) => approveSaleEstimate(fetcher, id),
    onSuccess: (_data, id) => {
      commonInvalidateQueries(queryClient);
      queryClient.invalidateQueries({ queryKey: estimatesKeys.detail(id) });
    },
  });
}

export function useRejectEstimate(
  props?: UseMutationOptions<void, Error, number>
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    ...props,
    mutationFn: (id: number) => rejectSaleEstimate(fetcher, id),
    onSuccess: (_data, id) => {
      commonInvalidateQueries(queryClient);
      queryClient.invalidateQueries({ queryKey: estimatesKeys.detail(id) });
    },
  });
}

export function usePdfEstimate(estimateId: number) {
  return useRequestPdf({
    url: `sale-estimates/${estimateId}`,
  });
}

export function useRefreshEstimates() {
  const queryClient = useQueryClient();

  return {
    refresh: () => {
      queryClient.invalidateQueries({ queryKey: estimatesKeys.all() });
    },
  };
}

export function useCreateNotifyEstimateBySMS(
  props?: UseMutationOptions<void, Error, [number, Record<string, unknown>]>
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    ...props,
    mutationFn: ([id, values]: [number, Record<string, unknown>]) =>
      notifySaleEstimateBySms(fetcher, id, values),
    onSuccess: (_data, [id]) => {
      queryClient.invalidateQueries({ queryKey: [EstimatesQueryKeys.NOTIFY_SALE_ESTIMATE_BY_SMS, id] });
      commonInvalidateQueries(queryClient);
    },
  });
}

export function useEstimateSMSDetail(
  estimateId: number | null | undefined,
  props?: Record<string, unknown>,
  requestProps?: Record<string, unknown>
) {
  const fetcher = useApiFetcher();
  return useQuery({
    ...props,
    queryKey: estimatesKeys.smsDetail(estimateId),
    queryFn: () => fetchSaleEstimateSmsDetails(fetcher, estimateId!),
    enabled: estimateId != null,
    ...requestProps,
  });
}

export function useSendSaleEstimateMail(
  props?: UseMutationOptions<void, Error, [number, Record<string, unknown>]>
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    ...props,
    mutationFn: ([id, values]: [number, Record<string, unknown>]) =>
      sendSaleEstimateMail(fetcher, id, values),
    onSuccess: () => commonInvalidateQueries(queryClient),
  });
}

export interface SaleEstimateMailStateResponse {
  attachEstimate: boolean;
  companyLogoUri: string;
  companyName: string;
  customerName: string;
  entries: Array<unknown>;
  estimateDate: string;
  estimateDateFormatted: string;
  expirationDate: string;
  expirationDateFormatted: string;
  primaryColor: string;
  total: number;
  totalFormatted: string;
  subtotal: number;
  subtotalFormatted: string;
  discountAmount: number;
  discountAmountFormatted: string;
  discountLabel: string;
  discountPercentage: number | null;
  discountPercentageFormatted: string;
  adjustment: number;
  adjustmentFormatted: string;
  estimateNumber: string;
  formatArgs: {
    customerName: string;
    estimateAmount: string;
  };
  from: Array<string>;
  fromOptions: Array<unknown>;
  message: string;
  subject: string;
  to: Array<string>;
  toOptions: Array<unknown>;
}

export function useSaleEstimateMailState(
  estimateId: number,
  props?: UseQueryOptions<SaleEstimateMailStateResponse, Error>
): UseQueryResult<SaleEstimateMailStateResponse, Error> {
  const fetcher = useApiFetcher({ enableCamelCaseTransform: true });
  return useQuery({
    ...props,
    queryKey: [EstimatesQueryKeys.SALE_ESTIMATE_MAIL_OPTIONS, estimateId],
    queryFn: () => fetchSaleEstimateMail(fetcher, estimateId) as Promise<SaleEstimateMailStateResponse>,
  });
}

export interface ISaleEstimatesStateResponse {
  defaultTemplateId: number;
}

export function useGetSaleEstimatesState(
  options?: UseQueryOptions<ISaleEstimatesStateResponse, Error>
): UseQueryResult<ISaleEstimatesStateResponse, Error> {
  const fetcher = useApiFetcher({ enableCamelCaseTransform: true });

  return useQuery({
    ...options,
    queryKey: ['SALE_ESTIMATE_STATE'],
    queryFn: () => fetchSaleEstimatesState(fetcher) as Promise<ISaleEstimatesStateResponse>,
  });
}

/**
 * Retrieves the sale estimate html content.
 */
export const useGetSaleEstimateHtml = (
  estimateId: number,
  options?: UseQueryOptions<SaleEstimateHtmlContentResponse>
): UseQueryResult<SaleEstimateHtmlContentResponse> => {
  const fetcher = useApiFetcher();

  return useQuery({
    ...options,
    queryKey: ['SALE_ESTIMATE_HTML', estimateId],
    queryFn: () => fetchSaleEstimateHtmlContent(fetcher, estimateId),
  });
};
