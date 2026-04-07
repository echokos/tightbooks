import { Injectable } from '@nestjs/common';
import * as moment from 'moment';
import { Knex } from 'knex';
import { ConfigService } from '@nestjs/config';
import { knexSnakeCaseMappers } from 'objection';
import { ACCOUNT_TYPE } from '@/constants/accounts';
import { ACCOUNT_ROOT_TYPE } from '@/modules/Accounts/Accounts.constants';

interface WorkspaceFinancialData {
  tenantId: number;
  totalIncome: number;
  totalExpenses: number;
}

interface AccountTransaction {
  credit: number;
  debit: number;
  accountNormal: string;
  accountRootType: string;
}

/**
 * Service to retrieve financial data (income and expenses) for multiple workspaces.
 * This service creates dynamic connections to tenant databases to fetch aggregated data.
 */
@Injectable()
export class GetWorkspacesFinancialService {
  constructor(private readonly configService: ConfigService) {}

  /**
   * Get a knex instance for a specific tenant database.
   */
  private getTenantKnex(organizationId: string): Knex {
    const database = `bigcapital_tenant_${organizationId}`;

    return require('knex')({
      client: this.configService.get('tenantDatabase.client'),
      connection: {
        host: this.configService.get('tenantDatabase.host'),
        user: this.configService.get('tenantDatabase.user'),
        password: this.configService.get('tenantDatabase.password'),
        database,
        charset: 'utf8',
      },
      pool: { min: 0, max: 2, acquireTimeoutMillis: 5000, idleTimeoutMillis: 10000 },
      ...knexSnakeCaseMappers({ upperCase: true }),
    });
  }

  /**
   * Calculate total income from account transactions.
   * Income accounts have credit normal, so income = credit - debit.
   */
  private calculateIncome(transactions: AccountTransaction[]): number {
    return transactions
      .filter((t) => t.accountRootType === ACCOUNT_ROOT_TYPE.INCOME)
      .reduce((sum, t) => sum + (t.credit - t.debit), 0);
  }

  /**
   * Calculate total expenses from account transactions.
   * Expense accounts have debit normal, so expenses = debit - credit.
   */
  private calculateExpenses(transactions: AccountTransaction[]): number {
    return transactions
      .filter((t) => t.accountRootType === ACCOUNT_ROOT_TYPE.EXPENSE)
      .reduce((sum, t) => sum + (t.debit - t.credit), 0);
  }

  /**
   * Fetch financial data for a single tenant.
   */
  private async fetchTenantFinancialData(
    tenantId: number,
    organizationId: string,
  ): Promise<WorkspaceFinancialData> {
    const knex = this.getTenantKnex(organizationId);

    try {
      // Get the current year date range
      const fromDate = moment().startOf('year').format('YYYY-MM-DD');
      const toDate = moment().endOf('year').format('YYYY-MM-DD');

      // Query to get aggregated transactions by account with account type info
      const transactions = await knex('accounts_transactions as at')
        .join('accounts as a', 'at.account_id', 'a.id')
        .whereBetween('at.date', [fromDate, toDate])
        .select(
          knex.raw('SUM(at.credit) as credit'),
          knex.raw('SUM(at.debit) as debit'),
          'a.account_normal as accountNormal',
          'a.root_type as accountRootType',
        )
        .groupBy('at.account_id', 'a.account_normal', 'a.root_type');

      const totalIncome = this.calculateIncome(transactions);
      const totalExpenses = this.calculateExpenses(transactions);

      return {
        tenantId,
        totalIncome: Math.max(0, totalIncome),
        totalExpenses: Math.max(0, totalExpenses),
      };
    } catch (error) {
      // If tenant database doesn't exist or other error, return zeros
      return {
        tenantId,
        totalIncome: 0,
        totalExpenses: 0,
      };
    } finally {
      await knex.destroy();
    }
  }

  /**
   * Get financial data (total income and expenses) for a list of workspaces.
   * @param workspaces - Array of workspace info with tenantId and organizationId
   * @returns Map of tenantId to financial data
   */
  async getWorkspacesFinancial(
    workspaces: Array<{ tenantId: number; organizationId: string; isReady: boolean }>,
  ): Promise<Map<number, WorkspaceFinancialData>> {
    const results = new Map<number, WorkspaceFinancialData>();

    // Filter only ready workspaces (have initialized databases)
    const readyWorkspaces = workspaces.filter((w) => w.isReady);

    // Fetch financial data for each workspace in parallel
    const promises = readyWorkspaces.map(async (workspace) => {
      const data = await this.fetchTenantFinancialData(
        workspace.tenantId,
        workspace.organizationId,
      );
      return data;
    });

    const financialDataList = await Promise.all(promises);

    // Build the map
    financialDataList.forEach((data) => {
      results.set(data.tenantId, data);
    });

    // Add zero values for non-ready workspaces
    workspaces
      .filter((w) => !w.isReady)
      .forEach((w) => {
        results.set(w.tenantId, {
          tenantId: w.tenantId,
          totalIncome: 0,
          totalExpenses: 0,
        });
      });

    return results;
  }
}
