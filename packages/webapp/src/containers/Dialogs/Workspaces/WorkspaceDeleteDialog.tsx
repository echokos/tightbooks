// @ts-nocheck
import React from 'react';
import { Button, Classes, Dialog, Intent, Callout } from '@blueprintjs/core';
import { FormattedMessage as T, AppToaster } from '@/components';
import intl from 'react-intl-universal';

import { useDeleteWorkspace } from '@/hooks/query';
import withDialogRedux from '@/components/DialogReduxConnect';
import { withDialogActions } from '@/containers/Dialog/withDialogActions';
import { compose } from '@/utils';

function WorkspaceDeleteDialog({
  dialogName,
  isOpen,
  payload: { organizationId, workspaceName } = {},

  // #withDialogActions
  closeDialog,
}) {
  const { mutateAsync: deleteWorkspace, isLoading } = useDeleteWorkspace();

  const handleCancel = () => {
    closeDialog(dialogName);
  };

  const handleConfirmDelete = () => {
    deleteWorkspace(organizationId)
      .then(() => {
        AppToaster.show({
          message: intl.get('workspaces.workspace_deleted_successfully', {
            fallback: 'Workspace has been deleted successfully',
          }),
          intent: Intent.SUCCESS,
        });
        closeDialog(dialogName);
      })
      .catch((error) => {
        const errorMessage =
          error?.response?.data?.errors?.[0]?.message ||
          intl.get('workspaces.cannot_delete_workspace', {
            fallback: 'Cannot delete workspace',
          });
        AppToaster.show({
          message: errorMessage,
          intent: Intent.DANGER,
        });
        closeDialog(dialogName);
      });
  };

  return (
    <Dialog
      title={intl.get('workspaces.delete_workspace', { fallback: 'Delete Workspace' })}
      isOpen={isOpen}
      onClose={handleCancel}
      canEscapeKeyClose={!isLoading}
      canOutsideClickClose={!isLoading}
      className="workspace-delete-dialog"
    >
      <div className={Classes.DIALOG_BODY}>
        <Callout intent={Intent.DANGER} icon="warning-sign">
          <p
            dangerouslySetInnerHTML={{
              __html: intl.get('workspaces.delete_workspace_confirmation', {
                name: workspaceName || organizationId,
                fallback: `Are you sure you want to delete <b>${workspaceName || organizationId}</b>? This action cannot be undone and all data will be permanently lost.`,
              }),
            }}
          />
        </Callout>

        <div className="workspace-delete-dialog__details">
          <p>{intl.get('workspaces.delete_workspace_details', {
            fallback: 'Deleting this workspace will permanently remove:',
          })}</p>
          <ul>
            <li>{intl.get('workspaces.delete_workspace_all_data', { fallback: 'All organization data including transactions, accounts, and contacts' })}</li>
            <li>{intl.get('workspaces.delete_workspace_all_users', { fallback: 'All user associations and permissions' })}</li>
            <li>{intl.get('workspaces.delete_workspace_database', { fallback: 'The entire database for this workspace' })}</li>
          </ul>
          <p className="workspace-delete-dialog__warning">
            {intl.get('workspaces.delete_workspace_irreversible', {
              fallback: 'This action is irreversible. Please make sure you have exported any important data before proceeding.',
            })}
          </p>
        </div>
      </div>

      <div className={Classes.DIALOG_FOOTER}>
        <div className={Classes.DIALOG_FOOTER_ACTIONS}>
          <Button onClick={handleCancel} disabled={isLoading}>
            <T id={'cancel'} />
          </Button>

          <Button
            intent={Intent.DANGER}
            onClick={handleConfirmDelete}
            loading={isLoading}
            icon="trash"
          >
            <T id={'delete'} />
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

export default compose(
  withDialogRedux(),
  withDialogActions,
)(WorkspaceDeleteDialog);
