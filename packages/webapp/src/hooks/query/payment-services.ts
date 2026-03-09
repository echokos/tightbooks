// @ts-nocheck
import {
  useMutation,
  useQuery,
  useQueryClient,
  UseMutationOptions,
  UseQueryOptions,
  UseQueryResult,
  UseMutationResult,
} from '@tanstack/react-query';
import {
  fetchGetPaymentServices,
  fetchGetPaymentServicesState,
  fetchGetPaymentService,
  fetchUpdatePaymentMethod,
  fetchDeletePaymentMethod,
  type GetPaymentServicesResponse,
  type GetPaymentServicesStateResponse,
  type GetPaymentServiceResponse,
  type UpdatePaymentMethodBody,
  type UpdatePaymentMethodResponse,
} from '@bigcapital/sdk-ts';
import { useApiFetcher } from '../useRequest';
import { transformToCamelCase } from '@/utils';

const PaymentServicesQueryKey = 'PaymentServices';
const PaymentServicesStateQueryKey = 'PaymentServicesState';

// # Get payment services.
// -----------------------------------------
/**
 * Retrieves the integrated payment services.
 */
export const useGetPaymentServices = (
  options?: UseQueryOptions<GetPaymentServicesResponse, Error>,
): UseQueryResult<GetPaymentServicesResponse, Error> => {
  const fetcher = useApiFetcher();

  return useQuery<GetPaymentServicesResponse, Error>(
    [PaymentServicesQueryKey],
    () =>
      fetchGetPaymentServices(fetcher).then((res) =>
        transformToCamelCase(res?.payment_services) as GetPaymentServicesResponse,
      ),
    { ...options },
  );
};

// # Get payment services state.
// -----------------------------------------
/**
 * Retrieves the state of payment services.
 */
export const useGetPaymentServicesState = (
  options?: UseQueryOptions<GetPaymentServicesStateResponse, Error>,
): UseQueryResult<GetPaymentServicesStateResponse, Error> => {
  const fetcher = useApiFetcher();

  return useQuery<GetPaymentServicesStateResponse, Error>(
    [PaymentServicesStateQueryKey],
    () =>
      fetchGetPaymentServicesState(fetcher).then((data) =>
        transformToCamelCase(data) as GetPaymentServicesStateResponse,
      ),
    { ...options },
  );
};

// # Update payment method
// -----------------------------------------
export interface UpdatePaymentMethodValues {
  paymentMethodId: string | number;
  values: {
    name: string;
    bankAccountId: number;
    clearingAccountId: number;
  };
}
/**
 * Updates a payment method.
 */
export const useUpdatePaymentMethod = (): UseMutationResult<
  UpdatePaymentMethodResponse,
  Error,
  UpdatePaymentMethodValues,
  unknown
> => {
  const fetcher = useApiFetcher();
  const queryClient = useQueryClient();

  return useMutation<
    UpdatePaymentMethodResponse,
    Error,
    UpdatePaymentMethodValues,
    unknown
  >({
    mutationFn: (data: UpdatePaymentMethodValues) =>
      fetchUpdatePaymentMethod(fetcher, Number(data.paymentMethodId), {
        name: data.values.name,
        options: {
          bankAccountId: data.values.bankAccountId,
          clearningAccountId: data.values.clearingAccountId,
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PaymentServicesStateQueryKey] });
      queryClient.invalidateQueries({ queryKey: [PaymentServicesQueryKey] });
    },
  });
};

// # Get payment method
// -----------------------------------------
/**
 * Retrieves a specific payment method.
 */
export const useGetPaymentMethod = (
  paymentMethodId: number,
  options?: UseQueryOptions<GetPaymentServiceResponse, Error>,
): UseQueryResult<GetPaymentServiceResponse, Error> => {
  const fetcher = useApiFetcher();

  return useQuery<GetPaymentServiceResponse, Error>(
    [PaymentServicesQueryKey, paymentMethodId],
    () =>
      fetchGetPaymentService(fetcher, paymentMethodId).then((res) =>
        transformToCamelCase(res?.data) as GetPaymentServiceResponse,
      ),
    options,
  );
};

// # Delete payment method
// -----------------------------------------
export interface DeletePaymentMethodValues {
  paymentMethodId: number;
}
export const useDeletePaymentMethod = (
  options?: UseMutationOptions<void, Error, DeletePaymentMethodValues>,
): UseMutationResult<void, Error, DeletePaymentMethodValues> => {
  const fetcher = useApiFetcher();
  const queryClient = useQueryClient();

  return useMutation<void, Error, DeletePaymentMethodValues>({
    mutationFn: ({ paymentMethodId }) =>
      fetchDeletePaymentMethod(fetcher, paymentMethodId).then(() => undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PaymentServicesStateQueryKey] });
    },
    ...options,
  });
};
