import type { ApiFetcher } from './fetch-utils';
import type { paths } from './schema';

export const CREDIT_NOTES_ROUTES = {
  LIST: '/api/credit-notes',
  BY_ID: '/api/credit-notes/{id}',
  STATE: '/api/credit-notes/state',
  OPEN: '/api/credit-notes/{id}/open',
  VALIDATE_BULK_DELETE: '/api/credit-notes/validate-bulk-delete',
  BULK_DELETE: '/api/credit-notes/bulk-delete',
  REFUNDS: '/api/credit-notes/{creditNoteId}/refunds',
  REFUND_BY_ID: '/api/credit-notes/refunds/{refundCreditId}',
  APPLIED_INVOICES: '/api/credit-notes/{creditNoteId}/applied-invoices',
  APPLY_INVOICES: '/api/credit-notes/{creditNoteId}/apply-invoices',
  APPLIED_INVOICE_BY_ID: '/api/credit-notes/applied-invoices/{applyCreditToInvoicesId}',
} as const satisfies Record<string, keyof paths>;

type GetCreditNotes = paths[typeof CREDIT_NOTES_ROUTES.LIST]['get'];
type GetCreditNote = paths[typeof CREDIT_NOTES_ROUTES.BY_ID]['get'];
type GetCreditNoteState = paths[typeof CREDIT_NOTES_ROUTES.STATE]['get'];
type CreateCreditNote = paths[typeof CREDIT_NOTES_ROUTES.LIST]['post'];
type EditCreditNote = paths[typeof CREDIT_NOTES_ROUTES.BY_ID]['put'];
type DeleteCreditNote = paths[typeof CREDIT_NOTES_ROUTES.BY_ID]['delete'];
type OpenCreditNote = paths[typeof CREDIT_NOTES_ROUTES.OPEN]['put'];
type ValidateBulkDeleteCreditNotes = paths[typeof CREDIT_NOTES_ROUTES.VALIDATE_BULK_DELETE]['post'];
type BulkDeleteCreditNotes = paths[typeof CREDIT_NOTES_ROUTES.BULK_DELETE]['post'];
type GetCreditNoteRefunds = paths[typeof CREDIT_NOTES_ROUTES.REFUNDS]['get'];
type CreateRefundCreditNote = paths[typeof CREDIT_NOTES_ROUTES.REFUNDS]['post'];
type DeleteRefundCreditNote = paths[typeof CREDIT_NOTES_ROUTES.REFUND_BY_ID]['delete'];
type GetAppliedInvoices = paths[typeof CREDIT_NOTES_ROUTES.APPLIED_INVOICES]['get'];
type GetApplyInvoices = paths[typeof CREDIT_NOTES_ROUTES.APPLY_INVOICES]['get'];
type ApplyCreditNoteToInvoices = paths[typeof CREDIT_NOTES_ROUTES.APPLY_INVOICES]['post'];
type DeleteApplyCreditNoteToInvoices = paths[typeof CREDIT_NOTES_ROUTES.APPLIED_INVOICE_BY_ID]['delete'];

export type CreditNotesListResponse = GetCreditNotes['responses'][200]['content']['application/json'];
export type CreditNote = GetCreditNote['responses'][200]['content']['application/json'];
export type CreateCreditNoteBody = CreateCreditNote['requestBody']['content']['application/json'];
export type EditCreditNoteBody = EditCreditNote['requestBody']['content']['application/json'];
export type ValidateBulkDeleteCreditNotesBody = ValidateBulkDeleteCreditNotes['requestBody']['content']['application/json'];
export type ValidateBulkDeleteCreditNotesResponse = ValidateBulkDeleteCreditNotes['responses'][200]['content']['application/json'];
export type BulkDeleteCreditNotesBody = BulkDeleteCreditNotes['requestBody']['content']['application/json'];
export type CreateRefundCreditNoteBody = CreateRefundCreditNote['requestBody']['content']['application/json'];
export type ApplyCreditNoteToInvoicesBody = ApplyCreditNoteToInvoices['requestBody']['content']['application/json'];

export async function fetchCreditNotes(fetcher: ApiFetcher): Promise<CreditNotesListResponse> {
  const getCreditNotes = fetcher.path(CREDIT_NOTES_ROUTES.LIST).method('get').create();
  const { data } = await getCreditNotes({});
  return data;
}

export async function fetchCreditNote(fetcher: ApiFetcher, id: number): Promise<CreditNote> {
  const getCreditNote = fetcher.path(CREDIT_NOTES_ROUTES.BY_ID).method('get').create();
  const { data } = await getCreditNote({ id });
  return data;
}

export async function fetchCreditNoteState(fetcher: ApiFetcher): Promise<void> {
  const getState = fetcher.path(CREDIT_NOTES_ROUTES.STATE).method('get').create();
  await getState({});
}

export async function createCreditNote(
  fetcher: ApiFetcher,
  values: CreateCreditNoteBody
): Promise<void> {
  const create = fetcher.path(CREDIT_NOTES_ROUTES.LIST).method('post').create();
  await create(values);
}

export async function editCreditNote(
  fetcher: ApiFetcher,
  id: number,
  values: EditCreditNoteBody
): Promise<void> {
  const put = fetcher.path(CREDIT_NOTES_ROUTES.BY_ID).method('put').create();
  await put({ id, ...values });
}

export async function deleteCreditNote(fetcher: ApiFetcher, id: number): Promise<void> {
  const del = fetcher.path(CREDIT_NOTES_ROUTES.BY_ID).method('delete').create();
  await del({ id });
}

export async function openCreditNote(fetcher: ApiFetcher, id: number): Promise<void> {
  const open = fetcher.path(CREDIT_NOTES_ROUTES.OPEN).method('put').create();
  await open({ id });
}

export async function validateBulkDeleteCreditNotes(
  fetcher: ApiFetcher,
  body: ValidateBulkDeleteCreditNotesBody
): Promise<ValidateBulkDeleteCreditNotesResponse> {
  const validate = fetcher.path(CREDIT_NOTES_ROUTES.VALIDATE_BULK_DELETE).method('post').create();
  const { data } = await validate(body);
  return data;
}

export async function bulkDeleteCreditNotes(
  fetcher: ApiFetcher,
  body: BulkDeleteCreditNotesBody
): Promise<void> {
  const bulkDelete = fetcher.path(CREDIT_NOTES_ROUTES.BULK_DELETE).method('post').create();
  await bulkDelete(body);
}

export async function fetchCreditNoteRefunds(
  fetcher: ApiFetcher,
  creditNoteId: number
): Promise<void> {
  const getRefunds = fetcher.path(CREDIT_NOTES_ROUTES.REFUNDS).method('get').create();
  await getRefunds({ creditNoteId });
}

export async function createRefundCreditNote(
  fetcher: ApiFetcher,
  creditNoteId: number,
  values: CreateRefundCreditNoteBody
): Promise<void> {
  const create = fetcher.path(CREDIT_NOTES_ROUTES.REFUNDS).method('post').create();
  await create({ creditNoteId, ...values });
}

export async function deleteRefundCreditNote(
  fetcher: ApiFetcher,
  refundCreditId: number
): Promise<void> {
  const del = fetcher.path(CREDIT_NOTES_ROUTES.REFUND_BY_ID).method('delete').create();
  await del({ refundCreditId });
}

export async function fetchAppliedInvoices(
  fetcher: ApiFetcher,
  creditNoteId: number
): Promise<void> {
  const getApplied = fetcher.path(CREDIT_NOTES_ROUTES.APPLIED_INVOICES).method('get').create();
  await getApplied({ creditNoteId });
}

export async function fetchCreditNoteAssociatedInvoicesToApply(
  fetcher: ApiFetcher,
  creditNoteId: number
): Promise<void> {
  const get = fetcher.path(CREDIT_NOTES_ROUTES.APPLY_INVOICES).method('get').create();
  await get({ creditNoteId });
}

export async function applyCreditNoteToInvoices(
  fetcher: ApiFetcher,
  creditNoteId: number,
  values: ApplyCreditNoteToInvoicesBody
): Promise<void> {
  const apply = fetcher.path(CREDIT_NOTES_ROUTES.APPLY_INVOICES).method('post').create();
  await apply({ creditNoteId, ...values });
}

export async function deleteApplyCreditNoteToInvoices(
  fetcher: ApiFetcher,
  applyCreditToInvoicesId: number
): Promise<void> {
  const del = fetcher.path(CREDIT_NOTES_ROUTES.APPLIED_INVOICE_BY_ID).method('delete').create();
  await del({ applyCreditToInvoicesId });
}
