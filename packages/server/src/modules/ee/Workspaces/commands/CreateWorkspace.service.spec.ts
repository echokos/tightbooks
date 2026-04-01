import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { CreateWorkspaceService } from './CreateWorkspace.service';
import { UserTenant } from '@/modules/System/models/UserTenant.model';
import { TenantRepository } from '@/modules/System/repositories/Tenant.repository';
import { OrganizationBuildQueue, OrganizationBuildQueueJob } from '@/modules/Organization/Organization.types';
import { SystemKnexConnection } from '@/modules/System/SystemDB/SystemDB.constants';

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
  let organizationBuildQueue: jest.Mocked<Queue>;
  let mockKnexTransaction: jest.Mock;

  const mockTenant = {
    id: 1,
    organizationId: 'org_abc123',
    initializedAt: null,
    seededAt: null,
    builtAt: null,
    buildJobId: null,
  };

  const mockJob = {
    id: 'job_123',
    name: 'organization-build',
    data: {},
    opts: {},
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

    const mockQueue = {
      add: jest.fn().mockResolvedValue(mockJob),
    };

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
          provide: getQueueToken(OrganizationBuildQueue),
          useValue: mockQueue,
        },
        {
          provide: SystemKnexConnection,
          useValue: mockSystemKnex,
        },
      ],
    }).compile();

    service = module.get<CreateWorkspaceService>(CreateWorkspaceService);
    tenantRepository = module.get(TenantRepository);
    userTenantModel = module.get(UserTenant.name);
    organizationBuildQueue = module.get(getQueueToken(OrganizationBuildQueue));
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
        jobId: mockJob.id,
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

    it('should enqueue the organization build job outside the transaction', async () => {
      const callOrder: string[] = [];

      mockKnexTransaction.mockImplementationOnce(async (callback) => {
        const trx = {};
        const result = await callback(trx);
        callOrder.push('transactionCommitted');
        return result;
      });

      (organizationBuildQueue.add as jest.Mock).mockImplementationOnce(async () => {
        callOrder.push('enqueueJob');
        return mockJob;
      });

      await service.createWorkspace(userId, dto);

      expect(callOrder).toEqual(['transactionCommitted', 'enqueueJob']);
    });

    it('should return organization id and job id', async () => {
      const result = await service.createWorkspace(userId, dto);

      expect(result).toHaveProperty('organizationId');
      expect(result).toHaveProperty('jobId');
      expect(result.organizationId).toBe(mockTenant.organizationId);
      expect(result.jobId).toBe(mockJob.id);
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

    it('should not enqueue job if transaction fails', async () => {
      tenantRepository.createWithUniqueOrgId.mockRejectedValueOnce(
        new Error('Database error'),
      );

      await expect(service.createWorkspace(userId, dto)).rejects.toThrow(
        'Database error',
      );

      expect(organizationBuildQueue.add).not.toHaveBeenCalled();
    });

    it('should handle queue add failure after successful transaction', async () => {
      organizationBuildQueue.add.mockRejectedValueOnce(
        new Error('Queue error'),
      );

      // Transaction should succeed but then queue add should fail
      await expect(service.createWorkspace(userId, dto)).rejects.toThrow(
        'Queue error',
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

      (organizationBuildQueue.add as jest.Mock).mockImplementationOnce(async () => {
        callOrder.push('enqueueJob');
        return mockJob;
      });

      await service.createWorkspace(userId, dto);

      expect(callOrder).toEqual(['createTenant', 'linkUser', 'saveMetadata', 'transactionCommitted', 'enqueueJob']);
    });
  });
});
