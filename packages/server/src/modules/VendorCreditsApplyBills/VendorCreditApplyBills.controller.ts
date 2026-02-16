import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { VendorCreditApplyBillsApplicationService } from './VendorCreditApplyBillsApplication.service';
import { IVendorCreditApplyToInvoicesDTO } from './types/VendorCreditApplyBills.types';
import { ApiTags } from '@nestjs/swagger';
import { ApiCommonHeaders } from '@/common/decorators/ApiCommonHeaders';
import { RequirePermission } from '@/modules/Roles/RequirePermission.decorator';
import { PermissionGuard } from '@/modules/Roles/Permission.guard';
import { AuthorizationGuard } from '@/modules/Roles/Authorization.guard';
import { AbilitySubject } from '@/modules/Roles/Roles.types';
import { VendorCreditAction } from '../VendorCredit/types/VendorCredit.types';

@Controller('vendor-credits')
@ApiTags('Vendor Credits Apply Bills')
@ApiCommonHeaders()
@UseGuards(AuthorizationGuard, PermissionGuard)
export class VendorCreditApplyBillsController {
  constructor(
    private readonly vendorCreditApplyBillsApplication: VendorCreditApplyBillsApplicationService,
  ) {}

  @Get(':vendorCreditId/bills-to-apply')
  @RequirePermission(VendorCreditAction.View, AbilitySubject.VendorCredit)
  async getVendorCreditToApplyBills(
    @Param('vendorCreditId') vendorCreditId: number,
  ) {
    return this.vendorCreditApplyBillsApplication.getVendorCreditToApplyBills(
      vendorCreditId,
    );
  }

  @Post(':vendorCreditId/apply-to-bills')
  @RequirePermission(VendorCreditAction.Edit, AbilitySubject.VendorCredit)
  async applyVendorCreditToBills(
    @Param('vendorCreditId') vendorCreditId: number,
    @Body() applyCreditToBillsDTO: IVendorCreditApplyToInvoicesDTO,
  ) {
    return this.vendorCreditApplyBillsApplication.applyVendorCreditToBills(
      vendorCreditId,
      applyCreditToBillsDTO,
    );
  }

  @Delete('applied-bills/:vendorCreditAppliedBillId')
  @RequirePermission(VendorCreditAction.Edit, AbilitySubject.VendorCredit)
  async deleteAppliedBillToVendorCredit(
    @Param('vendorCreditAppliedBillId') vendorCreditAppliedBillId: number,
  ) {
    return this.vendorCreditApplyBillsApplication.deleteAppliedBillToVendorCredit(
      vendorCreditAppliedBillId,
    );
  }

  @Get(':vendorCreditId/applied-bills')
  @RequirePermission(VendorCreditAction.View, AbilitySubject.VendorCredit)
  async getAppliedBillsToVendorCredit(
    @Param('vendorCreditId') vendorCreditId: number,
  ) {
    return this.vendorCreditApplyBillsApplication.getAppliedBillsToVendorCredit(
      vendorCreditId,
    );
  }
}
