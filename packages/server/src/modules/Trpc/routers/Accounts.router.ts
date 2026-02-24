import { Injectable } from '@nestjs/common';
import { Router, Query, Mutation } from 'nestjs-trpc';
import { z } from 'zod';
import { AccountsApplication } from '@/modules/Accounts/AccountsApplication.service';
import { CreateAccountDTO } from '@/modules/Accounts/CreateAccount.dto';
import { EditAccountDTO } from '@/modules/Accounts/EditAccount.dto';
import { IAccountsStructureType } from '@/modules/Accounts/Accounts.types';

const accountResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  code: z.string(),
  index: z.number(),
  accountType: z.string(),
  accountTypeLabel: z.string(),
  parentAccountId: z.number().nullable(),
  predefined: z.boolean(),
  currencyCode: z.string(),
  active: z.boolean(),
  bankBalance: z.number(),
  bankBalanceFormatted: z.string(),
  lastFeedsUpdatedAt: z.union([z.string(), z.date(), z.null()]),
  lastFeedsUpdatedAtFormatted: z.string(),
  amount: z.number(),
  formattedAmount: z.string(),
  plaidItemId: z.string(),
  plaidAccountId: z.string().nullable(),
  isFeedsActive: z.boolean(),
  isSyncingOwner: z.boolean(),
  isFeedsPaused: z.boolean(),
  accountNormal: z.string(),
  accountNormalFormatted: z.string(),
  flattenName: z.string(),
  accountLevel: z.number().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

const accountTypeSchema = z.object({
  label: z.string(),
  key: z.string(),
  normal: z.string(),
  parentType: z.string(),
  rootType: z.string(),
  multiCurrency: z.boolean(),
  balanceSheet: z.boolean(),
  incomeSheet: z.boolean(),
});

const getAccountsQuerySchema = z.object({
  onlyInactive: z.boolean().optional(),
  structure: z.nativeEnum(IAccountsStructureType).optional(),
  page: z.number().optional(),
  pageSize: z.number().optional(),
  searchKeyword: z.string().optional(),
});

const getAccountsResponseSchema = z.object({
  accounts: z.array(z.any()),
  filterMeta: z.object({
    count: z.number(),
    total: z.number(),
    page: z.number(),
    pageSize: z.number(),
  }),
});

const getAccountTransactionsQuerySchema = z.object({
  accountId: z.number(),
});

const createAccountInputSchema = z.object({
  name: z.string().min(3).max(255),
  code: z.string().min(3).max(6).optional(),
  currencyCode: z.string().optional(),
  accountType: z.string().min(3).max(255),
  description: z.string().max(65535).optional(),
  parentAccountId: z.number().optional(),
  active: z.boolean().optional(),
  plaidAccountId: z.string().optional(),
  plaidItemId: z.string().optional(),
});

const editAccountInputSchema = createAccountInputSchema.partial();

const bulkDeleteInputSchema = z.object({
  ids: z.array(z.number()),
  skipUndeletable: z.boolean().optional(),
});

const validateBulkDeleteResponseSchema = z.object({
  deletableIds: z.array(z.number()),
  nonDeletableIds: z.array(z.number()),
  deletableCount: z.number(),
  nonDeletableCount: z.number(),
});

@Injectable()
@Router({ alias: 'accounts' })
export class AccountsTrpcRouter {
  constructor(private readonly accountsApplication: AccountsApplication) {}

  @Query({
    input: getAccountsQuerySchema,
    output: getAccountsResponseSchema,
  })
  async getAccounts(input: z.infer<typeof getAccountsQuerySchema>) {
    return this.accountsApplication.getAccounts(input);
  }

  @Query({
    input: z.object({ id: z.number() }),
    output: accountResponseSchema,
  })
  async getAccount(input: { id: number }) {
    return this.accountsApplication.getAccount(input.id);
  }

  @Query({
    output: z.array(accountTypeSchema),
  })
  async getAccountTypes() {
    return this.accountsApplication.getAccountTypes();
  }

  @Query({
    input: getAccountTransactionsQuerySchema,
    output: z.array(z.any()),
  })
  async getAccountTransactions(input: z.infer<typeof getAccountTransactionsQuerySchema>) {
    return this.accountsApplication.getAccountsTransactions({
      accountId: input.accountId,
      limit: undefined,
    });
  }

  @Mutation({
    input: createAccountInputSchema,
  })
  async createAccount(input: z.infer<typeof createAccountInputSchema>) {
    return this.accountsApplication.createAccount(input as CreateAccountDTO);
  }

  @Mutation({
    input: z.object({
      id: z.number(),
      data: editAccountInputSchema,
    }),
  })
  async editAccount(input: { id: number; data: any }) {
    return this.accountsApplication.editAccount(input.id, input.data as EditAccountDTO);
  }

  @Mutation({
    input: z.object({ id: z.number() }),
  })
  async deleteAccount(input: { id: number }) {
    return this.accountsApplication.deleteAccount(input.id);
  }

  @Mutation({
    input: z.object({ id: z.number() }),
  })
  async activateAccount(input: { id: number }) {
    return this.accountsApplication.activateAccount(input.id);
  }

  @Mutation({
    input: z.object({ id: z.number() }),
  })
  async inactivateAccount(input: { id: number }) {
    return this.accountsApplication.inactivateAccount(input.id);
  }

  @Mutation({
    input: bulkDeleteInputSchema,
  })
  async bulkDeleteAccounts(input: z.infer<typeof bulkDeleteInputSchema>) {
    return this.accountsApplication.bulkDeleteAccounts(input.ids, {
      skipUndeletable: input.skipUndeletable ?? false,
    });
  }

  @Mutation({
    input: z.object({ ids: z.array(z.number()) }),
    output: validateBulkDeleteResponseSchema,
  })
  async validateBulkDeleteAccounts(input: { ids: number[] }) {
    return this.accountsApplication.validateBulkDeleteAccounts(input.ids);
  }
}
