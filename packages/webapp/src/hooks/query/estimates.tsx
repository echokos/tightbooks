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
} from '@bigcapital/sdk-ts';

export type BulkDeleteEstimatesBody = { ids: number[]; skipUndeletable?: boolean };
export type ValidateBulkDeleteEstimatesResponse = {
  deletableCount: number;
  nonDeletableCount: number;
  deletableIds: number[];
  nonDeletableIds: number[];
};
import useApiRequest, { useApiFetcher } from '../useRequest';
import { transformToCamelCase } from '@/utils';
import t from './types';
import { useRequestPdf } from '../useRequestPdf';

const commonInvalidateQueries = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.invalidateQueries({ queryKey: [t.SALE_ESTIMATES] });
  queryClient.invalidateQueries({ queryKey: [t.ITEM_ASSOCIATED_WITH_ESTIMATES] });
};

export function useCreateEstimate(
  props?: UseMutationOptions<void, Error, CreateSaleEstimateBody>
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: (values: CreateSaleEstimateBody) =>
      createSaleEstimate(fetcher, values),
    onSuccess: () => {
      commonInvalidateQueries(queryClient);
      queryClient.invalidateQueries({ queryKey: [t.SETTING, t.SETTING_ESTIMATES] });
    },
    ...props,
  });
}

export function useEditEstimate(
  props?: UseMutationOptions<void, Error, [number, EditSaleEstimateBody]>
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: ([id, values]: [number, EditSaleEstimateBody]) =>
      editSaleEstimate(fetcher, id, values),
    onSuccess: (_data, [id]) => {
      commonInvalidateQueries(queryClient);
      queryClient.invalidateQueries({ queryKey: [t.SALE_ESTIMATE, id] });
    },
    ...props,
  });
}

export function useEstimate(
  id: number | null | undefined,
  props?: Omit<UseQueryOptions<SaleEstimate>, 'queryKey' | 'queryFn'>
) {
  const fetcher = useApiFetcher();
  return useQuery({
    queryKey: [t.SALE_ESTIMATE, id],
    queryFn: () => fetchSaleEstimate(fetcher, id!),
    enabled: id != null,
    ...props,
  });
}

export function useEstimates(
  query?: Record<string, unknown>,
  props?: Omit<UseQueryOptions<SaleEstimatesListResponse>, 'queryKey' | 'queryFn'>
) {
  const fetcher = useApiFetcher();
  return useQuery({
    queryKey: [t.SALE_ESTIMATES, query],
    queryFn: () => fetchSaleEstimates(fetcher, query),
    ...props,
  });
}


export function useDeleteEstimate(
  props?: UseMutationOptions<void, Error, number>
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: (id: number) => deleteSaleEstimate(fetcher, id),
    onSuccess: (_data, id) => {
      commonInvalidateQueries(queryClient);
      queryClient.invalidateQueries({ queryKey: [t.SALE_ESTIMATE, id] });
    },
    ...props,
  });
}

export function useBulkDeleteEstimates(
  props?: UseMutationOptions<void, Error, BulkDeleteEstimatesBody>
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: (body: BulkDeleteEstimatesBody) =>
      bulkDeleteSaleEstimates(fetcher, body),
    onSuccess: () => commonInvalidateQueries(queryClient),
    ...props,
  });
}

export function useValidateBulkDeleteEstimates(
  props?: UseMutationOptions<ValidateBulkDeleteEstimatesResponse, Error, number[]>
) {
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: (ids: number[]) =>
      validateBulkDeleteSaleEstimates(fetcher, ids).then((data: Record<string, unknown>) =>
        transformToCamelCase(data) as ValidateBulkDeleteEstimatesResponse
      ),
    ...props,
  });
}

export function useDeliverEstimate(
  props?: UseMutationOptions<void, Error, number>
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: (id: number) => deliverSaleEstimate(fetcher, id),
    onSuccess: (_data, id) => {
      commonInvalidateQueries(queryClient);
      queryClient.invalidateQueries({ queryKey: [t.SALE_ESTIMATE, id] });
    },
    ...props,
  });
}

export function useApproveEstimate(
  props?: UseMutationOptions<void, Error, number>
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: (id: number) => approveSaleEstimate(fetcher, id),
    onSuccess: (_data, id) => {
      commonInvalidateQueries(queryClient);
      queryClient.invalidateQueries({ queryKey: [t.SALE_ESTIMATE, id] });
    },
    ...props,
  });
}

export function useRejectEstimate(
  props?: UseMutationOptions<void, Error, number>
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: (id: number) => rejectSaleEstimate(fetcher, id),
    onSuccess: (_data, id) => {
      commonInvalidateQueries(queryClient);
      queryClient.invalidateQueries({ queryKey: [t.SALE_ESTIMATE, id] });
    },
    ...props,
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
      queryClient.invalidateQueries({ queryKey: [t.SALE_ESTIMATES] });
    },
  };
}

export function useCreateNotifyEstimateBySMS(
  props?: UseMutationOptions<void, Error, [number, Record<string, unknown>]>
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: ([id, values]: [number, Record<string, unknown>]) =>
      notifySaleEstimateBySms(fetcher, id, values),
    onSuccess: (_data, [id]) => {
      queryClient.invalidateQueries({ queryKey: [t.NOTIFY_SALE_ESTIMATE_BY_SMS, id] });
      commonInvalidateQueries(queryClient);
    },
    ...props,
  });
}

export function useEstimateSMSDetail(
  estimateId: number | null | undefined,
  props?: Record<string, unknown>,
  requestProps?: Record<string, unknown>
) {
  const fetcher = useApiFetcher();
  return useQuery({
    queryKey: [t.SALE_ESTIMATE_SMS_DETAIL, estimateId],
    queryFn: () => fetchSaleEstimateSmsDetails(fetcher, estimateId!),
    enabled: estimateId != null,
    ...requestProps,
    ...props,
  });
}

export function useSendSaleEstimateMail(
  props?: UseMutationOptions<void, Error, [number, Record<string, unknown>]>
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: ([id, values]: [number, Record<string, unknown>]) =>
      sendSaleEstimateMail(fetcher, id, values),
    onSuccess: () => commonInvalidateQueries(queryClient),
    ...props,
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
  const fetcher = useApiFetcher();
  return useQuery({
    queryKey: [t.SALE_ESTIMATE_MAIL_OPTIONS, estimateId],
    queryFn: () =>
      fetchSaleEstimateMail(fetcher, estimateId).then((data: Record<string, unknown>) =>
        transformToCamelCase(data) as SaleEstimateMailStateResponse
      ),
    ...props,
  });
}

export interface ISaleEstimatesStateResponse {
  defaultTemplateId: number;
}

export function useGetSaleEstimatesState(
  options?: UseQueryOptions<ISaleEstimatesStateResponse, Error>
): UseQueryResult<ISaleEstimatesStateResponse, Error> {
  const fetcher = useApiFetcher();

  return useQuery({
    queryKey: ['SALE_ESTIMATE_STATE'],
    queryFn: () =>
      fetchSaleEstimatesState(fetcher).then((data: Record<string, unknown>) =>
        transformToCamelCase(data) as ISaleEstimatesStateResponse
      ),
    ...options,
  });
}

interface GetEstimateHtmlResponse {
  htmlContent: string;
}

/**
 * Retrieves the sale estimate html content.
 * Uses custom Accept header; kept on apiRequest until SDK supports per-request headers.
 */
export const useGetSaleEstimateHtml = (
  estimateId: number,
  options?: UseQueryOptions<GetEstimateHtmlResponse>
): UseQueryResult<GetEstimateHtmlResponse> => {
  const apiRequest = useApiRequest();

  return useQuery({
    queryKey: ['SALE_ESTIMATE_HTML', estimateId],
    queryFn: (): Promise<GetEstimateHtmlResponse> =>
      apiRequest
        .get(`sale-estimates/${estimateId}`, {
          headers: {
            Accept: 'application/json+html',
          },
        })
        .then((res) => transformToCamelCase(res.data) as GetEstimateHtmlResponse),
    ...options,
  });
};
