import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CreateWorkspaceService } from './CreateWorkspace.service';
import { UserTenant } from '@/modules/System/models/UserTenant.model';
import { TenantRepository } from '@/modules/System/repositories/Tenant.repository';
import { BuildOrganizationService } from '@/modules/Organization/commands/BuildOrganization.service';
import { SystemKnexConnection } from '@/modules/System/SystemDB/SystemDB.constants';
import { events } from '@/common/events/events';

// Mock the Organization.utils module
jest.mock('@/modules/Organization/Organization.utils', () => ({
  transformBuildDto: jest.fn((dto) => ({
    ...dto,
    dateFormat: dto.dateFormat || 'DD MMM YYYY',
  })),
}));

describe('CreateWorkspaceService', () => {
  let service: CreateWorkspaceService;
  let tenantRepository: jest.Mocked<any>;
  let userTenantModel: jest.Mocked<any>;
  let mockBuildOrganizationService: jest.Mocked<BuildOrganizationService>;
  let mockEventEmitter: jest.Mocked<EventEmitter2>;
  let mockKnexTransaction: jest.Mock;

  const mockTenant = {
    id: 1,
    organizationId: 'org_abc123',
    initializedAt: null,
    seededAt: null,
    builtAt: null,
    buildJobId: null,
  };

  const createMockQuery = () => ({
    insert: jest.fn().mockResolvedValue({ id: 1, userId: 1, tenantId: 1, role: 'owner' }),
    findById: jest.fn().mockResolvedValue(mockTenant),
    update: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
  });

  beforeEach(async () => {
    const mockQuery = createMockQuery();

    const mockUserTenantModel = {
      query: jest.fn().mockReturnValue(mockQuery),
    };

    const mockTenantRepository = {
      createWithUniqueOrgId: jest.fn().mockResolvedValue(mockTenant),
      saveMetadata: jest.fn().mockResolvedValue(undefined),
      markAsBuilding: jest.fn().mockReturnThis(),
      findById: jest.fn().mockResolvedValue(mockTenant),
    };

    // Mock build organization service
    mockBuildOrganizationService = {
      buildForTenant: jest.fn().mockResolvedValue(undefined),
    } as any;

    // Mock event emitter
    mockEventEmitter = {
      emitAsync: jest.fn().mockResolvedValue([]),
    } as any;

    // Mock knex transaction
    mockKnexTransaction = jest.fn(async (callback) => {
      const trx = {};
      return callback(trx);
    });

    const mockSystemKnex = {
      transaction: mockKnexTransaction,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateWorkspaceService,
        {
          provide: UserTenant.name,
          useValue: mockUserTenantModel,
        },
        {
          provide: TenantRepository,
          useValue: mockTenantRepository,
        },
        {
          provide: BuildOrganizationService,
          useValue: mockBuildOrganizationService,
        },
        {
          provide: SystemKnexConnection,
          useValue: mockSystemKnex,
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
      ],
    }).compile();

    service = module.get<CreateWorkspaceService>(CreateWorkspaceService);
    tenantRepository = module.get(TenantRepository);
    userTenantModel = module.get(UserTenant.name);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createWorkspace', () => {
    const userId = 1;
    const dto = {
      name: 'Test Organization',
      baseCurrency: 'USD',
      location: 'US',
      timezone: 'America/New_York',
      fiscalYear: 'January',
      language: 'en-US',
      industry: 'Technology',
    };

    it('should create a workspace successfully', async () => {
      const result = await service.createWorkspace(userId, dto);

      expect(result).toEqual({
        organizationId: mockTenant.organizationId,
        jobId: null,
      });
    });

    it('should wrap database operations in a transaction', async () => {
      await service.createWorkspace(userId, dto);

      expect(mockKnexTransaction).toHaveBeenCalledTimes(1);
    });

    it('should create a new tenant with unique organization id within transaction', async () => {
      await service.createWorkspace(userId, dto);

      expect(tenantRepository.createWithUniqueOrgId).toHaveBeenCalledTimes(1);
      expect(tenantRepository.createWithUniqueOrgId).toHaveBeenCalledWith(undefined, expect.anything());
    });

    it('should link the user as owner of the workspace within transaction', async () => {
      await service.createWorkspace(userId, dto);

      expect(userTenantModel.query).toHaveBeenCalled();
      // First call should be with the transaction object
      expect(userTenantModel.query.mock.calls[0][0]).toBeDefined();
    });

    it('should save organization metadata within transaction', async () => {
      await service.createWorkspace(userId, dto);

      expect(tenantRepository.saveMetadata).toHaveBeenCalledWith(
        mockTenant.id,
        expect.objectContaining({
          name: dto.name,
          baseCurrency: dto.baseCurrency,
          location: dto.location,
          timezone: dto.timezone,
          fiscalYear: dto.fiscalYear,
          language: dto.language,
          industry: dto.industry,
          dateFormat: 'DD MMM YYYY',
        }),
        expect.anything(), // transaction object
      );
    });

    it('should call buildForTenant after transaction commit', async () => {
      await service.createWorkspace(userId, dto);

      expect(mockBuildOrganizationService.buildForTenant).toHaveBeenCalledWith(
        mockTenant.id,
        userId,
        expect.objectContaining({
          name: dto.name,
          baseCurrency: dto.baseCurrency,
          location: dto.location,
          timezone: dto.timezone,
          fiscalYear: dto.fiscalYear,
          language: dto.language,
          industry: dto.industry,
          dateFormat: 'DD MMM YYYY',
        }),
      );
    });

    it('should return organization id with null job id', async () => {
      const result = await service.createWorkspace(userId, dto);

      expect(result).toHaveProperty('organizationId');
      expect(result).toHaveProperty('jobId');
      expect(result.organizationId).toBe(mockTenant.organizationId);
      expect(result.jobId).toBeNull();
    });

    it('should handle tenant creation failure and rollback transaction', async () => {
      tenantRepository.createWithUniqueOrgId.mockRejectedValueOnce(
        new Error('Database error'),
      );

      await expect(service.createWorkspace(userId, dto)).rejects.toThrow(
        'Database error',
      );
    });

    it('should handle user tenant linking failure and rollback transaction', async () => {
      const mockQuery = createMockQuery();
      mockQuery.insert.mockRejectedValueOnce(new Error('Linking error'));
      userTenantModel.query.mockReturnValueOnce(mockQuery);

      await expect(service.createWorkspace(userId, dto)).rejects.toThrow(
        'Linking error',
      );
    });

    it('should handle metadata save failure and rollback transaction', async () => {
      tenantRepository.saveMetadata.mockRejectedValueOnce(
        new Error('Metadata save error'),
      );

      await expect(service.createWorkspace(userId, dto)).rejects.toThrow(
        'Metadata save error',
      );
    });

    it('should not call buildForTenant if transaction fails', async () => {
      tenantRepository.createWithUniqueOrgId.mockRejectedValueOnce(
        new Error('Database error'),
      );

      await expect(service.createWorkspace(userId, dto)).rejects.toThrow(
        'Database error',
      );

      expect(mockBuildOrganizationService.buildForTenant).not.toHaveBeenCalled();
    });

    it('should handle buildForTenant failure after successful transaction', async () => {
      mockBuildOrganizationService.buildForTenant.mockRejectedValueOnce(
        new Error('Build error'),
      );

      // Transaction should succeed but then build should fail
      await expect(service.createWorkspace(userId, dto)).rejects.toThrow(
        'Build error',
      );

      // Transaction should have completed
      expect(tenantRepository.createWithUniqueOrgId).toHaveBeenCalled();
    });

    it('should work with minimal DTO (only required fields)', async () => {
      const minimalDto = {
        name: 'Minimal Org',
        baseCurrency: 'EUR',
        location: 'DE',
        timezone: 'Europe/Berlin',
        fiscalYear: 'January',
        language: 'en-US',
      };

      const result = await service.createWorkspace(userId, minimalDto);

      expect(result.organizationId).toBe(mockTenant.organizationId);
      expect(tenantRepository.saveMetadata).toHaveBeenCalledWith(
        mockTenant.id,
        expect.objectContaining({
          name: minimalDto.name,
          baseCurrency: minimalDto.baseCurrency,
          location: minimalDto.location,
          timezone: minimalDto.timezone,
          fiscalYear: minimalDto.fiscalYear,
          language: minimalDto.language,
          dateFormat: 'DD MMM YYYY',
        }),
        expect.anything(),
      );
    });

    it('should preserve custom date format if provided', async () => {
      const dtoWithDateFormat = {
        ...dto,
        dateFormat: 'MM/DD/YYYY',
      };

      await service.createWorkspace(userId, dtoWithDateFormat);

      expect(tenantRepository.saveMetadata).toHaveBeenCalledWith(
        mockTenant.id,
        expect.objectContaining({
          dateFormat: 'MM/DD/YYYY',
        }),
        expect.anything(),
      );
    });

    it('should call all operations in correct sequence', async () => {
      const callOrder: string[] = [];

      (tenantRepository.createWithUniqueOrgId as jest.Mock).mockImplementationOnce(async () => {
        callOrder.push('createTenant');
        return mockTenant;
      });
      (userTenantModel.query as jest.Mock).mockImplementationOnce(() => {
        callOrder.push('linkUser');
        return {
          insert: jest.fn().mockResolvedValue({ id: 1 }),
        };
      });
      (tenantRepository.saveMetadata as jest.Mock).mockImplementationOnce(async () => {
        callOrder.push('saveMetadata');
        return 1;
      });

      mockKnexTransaction.mockImplementationOnce(async (callback) => {
        const trx = {};
        await callback(trx);
        callOrder.push('transactionCommitted');
        return mockTenant;
      });

      (mockEventEmitter.emitAsync as jest.Mock).mockImplementationOnce(async () => {
        callOrder.push('emitEvent');
        return [];
      });

      (mockBuildOrganizationService.buildForTenant as jest.Mock).mockImplementationOnce(async () => {
        callOrder.push('buildForTenant');
      });

      await service.createWorkspace(userId, dto);

      expect(callOrder).toEqual(['createTenant', 'linkUser', 'saveMetadata', 'transactionCommitted', 'emitEvent', 'buildForTenant']);
    });

    it('should emit workspace created event after transaction commit', async () => {
      await service.createWorkspace(userId, dto);

      expect(mockEventEmitter.emitAsync).toHaveBeenCalledWith(
        events.workspace.created,
        expect.objectContaining({
          tenantId: mockTenant.id,
          organizationId: mockTenant.organizationId,
          userId,
          buildDTO: expect.objectContaining({
            name: dto.name,
            baseCurrency: dto.baseCurrency,
            location: dto.location,
          }),
        }),
      );
    });

    it('should emit event after transaction commit and before build', async () => {
      const callOrder: string[] = [];

      mockKnexTransaction.mockImplementationOnce(async (callback) => {
        const trx = {};
        const result = await callback(trx);
        callOrder.push('transactionCommitted');
        return result;
      });

      (mockEventEmitter.emitAsync as jest.Mock).mockImplementationOnce(async () => {
        callOrder.push('emitEvent');
        return [];
      });

      (mockBuildOrganizationService.buildForTenant as jest.Mock).mockImplementationOnce(async () => {
        callOrder.push('buildForTenant');
      });

      await service.createWorkspace(userId, dto);

      expect(callOrder).toEqual(['transactionCommitted', 'emitEvent', 'buildForTenant']);
    });
  });
});
