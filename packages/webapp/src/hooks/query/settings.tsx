// @ts-nocheck
import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchSettings, saveSettings } from '@bigcapital/sdk-ts';
import { useRequestQuery } from '../useQueryRequest';
import useApiRequest, { useApiFetcher } from '../useRequest';
import { useSetSettings } from '@/hooks/state';
import t from './types';

/**
 * Saves the settings.
 */
export function useSaveSettings(props) {
  const queryClient = useQueryClient();
  const fetcher = useApiFetcher();

  return useMutation({
    mutationFn: (settings) => saveSettings(fetcher, settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [t.SETTING] });
    },
    ...props,
  });
}

function useSettingsQuery(key, query, props) {
  const setSettings = useSetSettings();
  const fetcher = useApiFetcher();

  const settingsQuery = useQuery({
    queryKey: key,
    queryFn: () => fetchSettings(fetcher, query),
    ...props,
  });
  useEffect(() => {
    if (!settingsQuery.isFetching && settingsQuery.isSuccess) {
      setSettings(settingsQuery.data);
    }
  }, [settingsQuery.isFetching, settingsQuery.isSuccess, settingsQuery.data]);

  return settingsQuery;
}

/**
 * Retrieve the all settings of the organization.
 */
export function useSettings() {
  return useSettingsQuery([t.SETTING, 'ALL'], {});
}

/**
 * Retrieve invoices settings.
 */
export function useSettingsInvoices(props) {
  return useSettingsQuery(
    [t.SETTING, t.SETTING_INVOICES],
    { group: 'sale_invoices' },
    props,
  );
}

/**
 * Retrieve invoices settings.
 */
export function useSettingsEstimates(props) {
  return useSettingsQuery(
    [t.SETTING, t.SETTING_ESTIMATES],
    { group: 'sale_estimates' },
    props,
  );
}

/**
 * Retrieve payment receives settings.
 */
export function useSettingsPaymentReceives(props) {
  return useSettingsQuery(
    [t.SETTING, t.SETTING_PAYMENT_RECEIVES],
    { group: 'payment_receives' },
    props,
  );
}

/**
 * Retrieve sale receipts settings.
 * @param {*} props
 */
export function useSettingsReceipts(props) {
  return useSettingsQuery(
    [t.SETTING, t.SETTING_RECEIPTS],
    { group: 'sale_receipts' },
    props,
  );
}

/**
 * Retrieve sale receipts settings.
 * @param {*} props
 */
export function useSettingsManualJournals(props) {
  return useSettingsQuery(
    [t.SETTING, t.SETTING_MANUAL_JOURNALS],
    { group: 'manual_journals' },
    props,
  );
}

/**
 * Retrieve sale receipts settings.
 * @param {*} props
 */
export function useSettingsItems(props) {
  return useSettingsQuery(
    [t.SETTING, t.SETTING_ITEMS],
    { group: 'items' },
    props,
  );
}

/**
 * Retrieve cashflow settings.
 */
export function useSettingCashFlow(props) {
  return useSettingsQuery(
    [t.SETTING, t.SETTING_CASHFLOW],
    { group: 'cashflow' },
    props,
  );
}

/**
 * Retrieve credit notes settings.
 */
export function useSettingsCreditNotes(props) {
  return useSettingsQuery(
    [t.SETTING, t.SETTING_CREDIT_NOTES],
    { group: 'credit_note' },
    props,
  );
}
/**
 * Retrieve vendor credit settings.
 */
export function useSettingsVendorCredits(props) {
  return useSettingsQuery(
    [t.SETTING, t.SETTING_VENDOR_CREDITS],
    { group: 'vendor_credit' },
    props,
  );
}

/**
 * Retrieve warehouse transfer settings.
 */
export function useSettingsWarehouseTransfers(props) {
  return useSettingsQuery(
    [t.SETTING, t.SETTING_WAREHOUSE_TRANSFERS],
    { group: 'warehouse_transfers' },
    props,
  );
}

/**
 * Retrieve SMS Notifications settings.
 */
export function useSettingSMSNotifications(props) {
  return useRequestQuery(
    [t.SETTING_SMS_NOTIFICATIONS],
    { method: 'get', url: `settings/sms-notifications` },
    props,
  );
}

/**
 * Retrieve Specific SMS Notification settings.
 */
export function useSettingSMSNotification(key, props) {
  return useRequestQuery(
    [t.SETTING_SMS_NOTIFICATIONS, key],
    {
      method: 'get',
      url: `settings/sms-notification/${key}`,
    },
    props,
  );
}

/**
 * Retrieve Edit SMS Notification settings.
 */
export function useSettingEditSMSNotification(props) {
  const queryClient = useQueryClient();
  const apiRequest = useApiRequest();

  return useMutation({ mutationFn: (values) => apiRequest.post(`settings/sms-notification`, values),
          onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [t.SETTING_SMS_NOTIFICATIONS] });

        queryClient.invalidateQueries({ queryKey: [t.SALE_INVOICE_SMS_DETAIL] });
        queryClient.invalidateQueries({ queryKey: [t.SALE_RECEIPT_SMS_DETAIL] });
        queryClient.invalidateQueries({ queryKey: [t.PAYMENT_RECEIVE_SMS_DETAIL] });
        queryClient.invalidateQueries({ queryKey: [t.SALE_ESTIMATE_SMS_DETAIL] });
      },
      ...props,
    },
  );
}
