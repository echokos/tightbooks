import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetCreditNoteAssociatedAppliedInvoices } from './queries/GetCreditNoteAssociatedAppliedInvoices.service';
import { ApiCommonHeaders } from '@/common/decorators/ApiCommonHeaders';
import { RequirePermission } from '@/modules/Roles/RequirePermission.decorator';
import { PermissionGuard } from '@/modules/Roles/Permission.guard';
import { AuthorizationGuard } from '@/modules/Roles/Authorization.guard';
import { AbilitySubject } from '@/modules/Roles/Roles.types';
import { CreditNoteAction } from '../CreditNotes/types/CreditNotes.types';

@Controller('credit-notes')
@ApiTags('Credit Notes Apply Invoice')
@ApiCommonHeaders()
@UseGuards(AuthorizationGuard, PermissionGuard)
export class CreditNotesApplyInvoiceController {
  constructor(
    private readonly getCreditNoteAssociatedAppliedInvoicesService: GetCreditNoteAssociatedAppliedInvoices,
  ) {}

  @Get(':creditNoteId/applied-invoices')
  @RequirePermission(CreditNoteAction.View, AbilitySubject.CreditNote)
  @ApiOperation({ summary: 'Applied credit note to invoices' })
  @ApiResponse({
    status: 200,
    description: 'Credit note successfully applied to invoices',
  })
  @ApiResponse({ status: 404, description: 'Credit note not found' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  appliedCreditNoteToInvoices(@Param('creditNoteId') creditNoteId: number) {
    return this.getCreditNoteAssociatedAppliedInvoicesService.getCreditAssociatedAppliedInvoices(
      creditNoteId,
    );
  }

  @Post(':creditNoteId/apply-invoices')
  @RequirePermission(CreditNoteAction.Edit, AbilitySubject.CreditNote)
  @ApiOperation({ summary: 'Apply credit note to invoices' })
  @ApiResponse({
    status: 200,
    description: 'Credit note successfully applied to invoices',
  })
  @ApiResponse({ status: 404, description: 'Credit note not found' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  applyCreditNoteToInvoices(@Param('creditNoteId') creditNoteId: number) {
    return this.getCreditNoteAssociatedAppliedInvoicesService.getCreditAssociatedAppliedInvoices(
      creditNoteId,
    );
  }
}
