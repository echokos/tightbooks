// @ts-nocheck
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import intl from 'react-intl-universal';
import classNames from 'classnames';
import {
  Button,
  FormGroup,
  H4,
  HTMLTable,
  InputGroup,
  NonIdealState,
  Spinner,
} from '@blueprintjs/core';
import { Card, Can } from '@/components';
import { CLASSES } from '@/constants/classes';
import { AbilitySubject, AuditLogAction } from '@/constants/abilityOption';
import { withDashboardActions } from '@/containers/Dashboard/withDashboardActions';
import { useAuditLogsQuery } from '@/hooks/query';
import { compose } from '@/utils';

function formatMetadata(metadata) {
  if (metadata == null) return '';
  try {
    return JSON.stringify(metadata);
  } catch {
    return '';
  }
}

/**
 * Fetches and lists audit rows (mounted only when the user may view audit logs).
 */
function PreferencesAuditLogContent() {
  const [page, setPage] = useState(1);
  const [draftSubject, setDraftSubject] = useState('');
  const [draftAction, setDraftAction] = useState('');
  const [draftFrom, setDraftFrom] = useState('');
  const [draftTo, setDraftTo] = useState('');

  const [subject, setSubject] = useState('');
  const [action, setAction] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const filters = useMemo(
    () => ({
      page,
      pageSize: 20,
      subject,
      action,
      from,
      to,
    }),
    [page, subject, action, from, to],
  );

  const { data, isLoading, isFetching } = useAuditLogsQuery(filters, {});

  const applyFilters = useCallback(() => {
    setSubject(draftSubject.trim());
    setAction(draftAction.trim());
    setFrom(draftFrom.trim());
    setTo(draftTo.trim());
    setPage(1);
  }, [draftSubject, draftAction, draftFrom, draftTo]);

  const pagination = data?.pagination;
  const rows = data?.data ?? [];
  const totalPages = pagination
    ? Math.max(1, Math.ceil(pagination.total / pagination.pageSize))
    : 1;

  return (
    <Card style={{ padding: 20 }}>
      <H4 style={{ marginBottom: 16 }}>{intl.get('auditing_system')}</H4>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 16,
          alignItems: 'flex-end',
        }}
      >
        <FormGroup label={intl.get('audit_log.filter_subject')}>
          <InputGroup
            value={draftSubject}
            onChange={(e) => setDraftSubject(e.target.value)}
            placeholder="SaleInvoice"
          />
        </FormGroup>
        <FormGroup label={intl.get('audit_log.filter_action')}>
          <InputGroup
            value={draftAction}
            onChange={(e) => setDraftAction(e.target.value)}
            placeholder="created"
          />
        </FormGroup>
        <FormGroup label={intl.get('audit_log.filter_from')}>
          <InputGroup
            type="date"
            value={draftFrom}
            onChange={(e) => setDraftFrom(e.target.value)}
          />
        </FormGroup>
        <FormGroup label={intl.get('audit_log.filter_to')}>
          <InputGroup
            type="date"
            value={draftTo}
            onChange={(e) => setDraftTo(e.target.value)}
          />
        </FormGroup>
        <Button intent="primary" onClick={applyFilters}>
          {intl.get('audit_log.apply_filters')}
        </Button>
      </div>

      {(isLoading || isFetching) && <Spinner size={24} />}

      {!isLoading && rows.length === 0 && (
        <NonIdealState title={intl.get('audit_log.empty')} />
      )}

      {rows.length > 0 && (
        <>
          <HTMLTable striped style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>{intl.get('audit_log.col_time')}</th>
                <th>{intl.get('audit_log.col_user')}</th>
                <th>{intl.get('audit_log.col_action')}</th>
                <th>{intl.get('audit_log.col_subject')}</th>
                <th>{intl.get('audit_log.col_id')}</th>
                <th>{intl.get('audit_log.col_summary')}</th>
                <th>{intl.get('audit_log.col_ip')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.createdAt}</td>
                  <td>{row.userName || row.userEmail || row.userId || '—'}</td>
                  <td>{row.action}</td>
                  <td>{row.subject}</td>
                  <td>{row.subjectId ?? '—'}</td>
                  <td
                    style={{
                      maxWidth: 280,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                    title={formatMetadata(row.metadata)}
                  >
                    {formatMetadata(row.metadata)}
                  </td>
                  <td>{row.ip || '—'}</td>
                </tr>
              ))}
            </tbody>
          </HTMLTable>

          <div
            style={{
              marginTop: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <Button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              {intl.get('audit_log.prev')}
            </Button>
            <span>
              {intl.get('audit_log.pagination', {
                page,
                pages: totalPages,
                total: pagination?.total ?? 0,
              })}
            </span>
            <Button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              {intl.get('audit_log.next')}
            </Button>
          </div>
        </>
      )}
    </Card>
  );
}

/**
 * Preferences — financial audit log (domain events).
 */
function PreferencesAuditLog({ changePreferencesPageTitle }) {
  useEffect(() => {
    changePreferencesPageTitle(intl.get('auditing_system'));
  }, [changePreferencesPageTitle]);

  return (
    <div
      className={classNames(
        CLASSES.PREFERENCES_PAGE_INSIDE_CONTENT,
        CLASSES.PREFERENCES_PAGE_INSIDE_CONTENT_USERS,
      )}
    >
      <Can I={AuditLogAction.View} a={AbilitySubject.AuditLog}>
        <PreferencesAuditLogContent />
      </Can>

      <Can not I={AuditLogAction.View} a={AbilitySubject.AuditLog}>
        <Card style={{ padding: 20 }}>
          <NonIdealState title={intl.get('audit_log.no_access')} />
        </Card>
      </Can>
    </div>
  );
}

export default compose(withDashboardActions)(PreferencesAuditLog);
