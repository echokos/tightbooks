import {
  useMutation,
  useQuery,
  useQueryClient,
  UseMutationOptions,
  UseQueryOptions,
} from '@tanstack/react-query';
import type { SettingValues } from '@bigcapital/sdk-ts';
import {
  fetchSettings,
  fetchSettingsInvoices,
  fetchSettingsEstimates,
  fetchSettingsPaymentReceives,
  fetchSettingsReceipts,
  fetchSettingsManualJournals,
  fetchSettingsItems,
  fetchSettingCashFlow,
  fetchSettingsCreditNotes,
  fetchSettingsVendorCredits,
  fetchSettingsWarehouseTransfers,
  fetchSettingSMSNotifications,
  fetchSettingSMSNotification,
  editSettingSMSNotification,
} from '@bigcapital/sdk-ts';
import { useApiFetcher } from '../../useRequest';
import {
  settingsKeys,
  SETTING,
  SETTING_INVOICES,
  SETTING_ESTIMATES,
  SETTING_PAYMENT_RECEIVES,
  SETTING_RECEIPTS,
  SETTING_MANUAL_JOURNALS,
  SETTING_ITEMS,
  SETTING_CASHFLOW,
  SETTING_CREDIT_NOTES,
  SETTING_VENDOR_CREDITS,
  SETTING_WAREHOUSE_TRANSFER,
  SETTING_SMS_NOTIFICATIONS,
  SETTING_SMS_NOTIFICATION,
  SETTING_EDIT_SMS_NOTIFICATION,
} from './query-keys';

export function useSaveSettings(
  props?: UseMutationOptions<void, Error, SettingValues>
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    ...props,
    mutationFn: async (values: SettingValues) => {
      const { editSettings } = await import('@bigcapital/sdk-ts');
      return editSettings(fetcher, values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SETTING] });
    },
  });
}

export function useSettings(
  props?: Omit<UseQueryOptions<unknown>, 'queryKey' | 'queryFn'>
) {
  const fetcher = useApiFetcher();

  return useQuery({
    ...props,
    queryKey: settingsKeys.all(),
    queryFn: () => fetchSettings(fetcher),
  });
}

export function useSettingsInvoices(
  props?: Omit<UseQueryOptions<unknown>, 'queryKey' | 'queryFn'>
) {
  const fetcher = useApiFetcher();

  return useQuery({
    ...props,
    queryKey: settingsKeys.invoices(),
    queryFn: () => fetchSettingsInvoices(fetcher),
  });
}

export function useSettingsEstimates(
  props?: Omit<UseQueryOptions<unknown>, 'queryKey' | 'queryFn'>
) {
  const fetcher = useApiFetcher();

  return useQuery({
    ...props,
    queryKey: settingsKeys.estimates(),
    queryFn: () => fetchSettingsEstimates(fetcher),
  });
}

export function useSettingsPaymentReceives(
  props?: Omit<UseQueryOptions<unknown>, 'queryKey' | 'queryFn'>
) {
  const fetcher = useApiFetcher();

  return useQuery({
    ...props,
    queryKey: settingsKeys.paymentReceives(),
    queryFn: () => fetchSettingsPaymentReceives(fetcher),
  });
}

export function useSettingsReceipts(
  props?: Omit<UseQueryOptions<unknown>, 'queryKey' | 'queryFn'>
) {
  const fetcher = useApiFetcher();

  return useQuery({
    ...props,
    queryKey: settingsKeys.receipts(),
    queryFn: () => fetchSettingsReceipts(fetcher),
  });
}

export function useSettingsManualJournals(
  props?: Omit<UseQueryOptions<unknown>, 'queryKey' | 'queryFn'>
) {
  const fetcher = useApiFetcher();

  return useQuery({
    ...props,
    queryKey: settingsKeys.manualJournals(),
    queryFn: () => fetchSettingsManualJournals(fetcher),
  });
}
export function useSettingsItems(
  props?: Omit<UseQueryOptions<unknown>, 'queryKey' | 'queryFn'>
) {
  const fetcher = useApiFetcher();

  return useQuery({
    ...props,
    queryKey: settingsKeys.items(),
    queryFn: () => fetchSettingsItems(fetcher),
  });
}

export function useSettingCashFlow(
  props?: Omit<UseQueryOptions<unknown>, 'queryKey' | 'queryFn'>
) {
  const fetcher = useApiFetcher();

  return useQuery({
    ...props,
    queryKey: settingsKeys.cashflow(),
    queryFn: () => fetchSettingCashFlow(fetcher),
  });
}

/**
 * Retrieve credit notes settings.
 */
export function useSettingsCreditNotes(
  props?: Omit<UseQueryOptions<unknown>, 'queryKey' | 'queryFn'>
) {
  const fetcher = useApiFetcher();

  return useQuery({
    ...props,
    queryKey: settingsKeys.creditNotes(),
    queryFn: () => fetchSettingsCreditNotes(fetcher),
  });
}

export function useSettingsVendorCredits(
  props?: Omit<UseQueryOptions<unknown>, 'queryKey' | 'queryFn'>
) {
  const fetcher = useApiFetcher();

  return useQuery({
    ...props,
    queryKey: settingsKeys.vendorCredits(),
    queryFn: () => fetchSettingsVendorCredits(fetcher),
  });
}

export function useSettingsWarehouseTransfers(
  props?: Omit<UseQueryOptions<unknown>, 'queryKey' | 'queryFn'>
) {
  const fetcher = useApiFetcher();

  return useQuery({
    ...props,
    queryKey: settingsKeys.warehouseTransfers(),
    queryFn: () => fetchSettingsWarehouseTransfers(fetcher),
  });
}
 function useSettingSMSNotifications(
  props?: Omit<UseQueryOptions<unknown>, 'queryKey' | 'queryFn'>
) {
  const fetcher = useApiFetcher();

  return useQuery({
    ...props,
    queryKey: settingsKeys.smsNotifications(),
    queryFn: () => fetchSettingSMSNotifications(fetcher),
  });
}

export function useSettingSMSNotification(
  key: string,
  props?: Omit<UseQueryOptions<unknown>, 'queryKey' | 'queryFn'>
) {
  const fetcher = useApiFetcher();

  return useQuery({
    ...props,
    queryKey: [SETTING_SMS_NOTIFICATIONS, key],
    queryFn: () => fetchSettingSMSNotification(fetcher, key),
    enabled: !!key,
  });
}

export function useSettingEditSMSNotification(
  props?: UseMutationOptions<void, Error, { key: string; values: Record<string, unknown> }>
) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    ...props,
    mutationFn: ({ key, values }: { key: string; values: Record<string, unknown> }) =>
      editSettingSMSNotification(fetcher, key, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SETTING_SMS_NOTIFICATIONS] });
    },
  });
}
