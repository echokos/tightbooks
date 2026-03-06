import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { io } from 'socket.io-client';
import t from '@/hooks/query/types';
import { AppToaster } from '@/components';
import { Intent } from '@blueprintjs/core';

export function DashboardSockets() {
  const socket = useRef<any>();
  const client = useQueryClient();

  useEffect(() => {
    socket.current = io('/', { path: '/socket' });
  
    socket.current.on('NEW_TRANSACTIONS_DATA', () => {
      client.invalidateQueries({ queryKey: [t.ACCOUNTS] });
      client.invalidateQueries({ queryKey: [t.ACCOUNT_TRANSACTION] });
      client.invalidateQueries({ queryKey: [t.CASH_FLOW_ACCOUNTS] });
      client.invalidateQueries({ queryKey: [t.CASH_FLOW_TRANSACTIONS] });

      AppToaster.show({
        message: 'The Plaid connected accounts have been updated.',
        intent: Intent.SUCCESS,
      });
    });
    socket.current.on('SUBSCRIPTION_CHANGED', () => {
      client.invalidateQueries({ queryKey: ['GetSubscriptions'] });
    });
    return () => {
      socket.current.removeAllListeners();
      socket.current.close();
    };
  }, []);
}
