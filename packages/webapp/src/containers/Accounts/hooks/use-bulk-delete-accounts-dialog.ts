// @ts-nocheck
import { DialogsName } from '@/constants/dialogs';
import { useValidateBulkDeleteAccountsTrpc } from '@/hooks/trpc';
import { useBulkDeleteDialog } from '@/hooks/dialogs/useBulkDeleteDialog';

export const useBulkDeleteAccountsDialog = () => {
  const validateBulkDeleteMutation = useValidateBulkDeleteAccountsTrpc();
  const {
    openBulkDeleteDialog,
    closeBulkDeleteDialog,
    isValidatingBulkDelete,
  } = useBulkDeleteDialog(DialogsName.AccountBulkDelete, validateBulkDeleteMutation);

  return {
    openBulkDeleteDialog,
    closeBulkDeleteDialog,
    isValidatingBulkDeleteAccounts: isValidatingBulkDelete,
  };
};

