import { Test } from '@nestjs/testing';
import { ClsService } from 'nestjs-cls';
import { Knex } from 'knex';
import { AuditLogService } from './AuditLog.service';
import { AuditLog } from './models/AuditLog.model';
import { TENANCY_DB_CONNECTION } from '@/modules/Tenancy/TenancyDB/TenancyDB.constants';

describe('AuditLogService', () => {
  const trx = { tag: 'trx-mock' } as unknown as Knex.Transaction;
  let insertMock: jest.Mock;
  let queryMock: jest.Mock;
  let modelFactory: jest.Mock;
  let tenantKnexMock: jest.Mock;

  beforeEach(() => {
    insertMock = jest.fn().mockResolvedValue(undefined);
    queryMock = jest.fn().mockReturnValue({ insert: insertMock });
    modelFactory = jest.fn().mockReturnValue({ query: queryMock });
    tenantKnexMock = jest.fn().mockReturnValue({ tag: 'knex-mock' });
  });

  async function createService(clsValues: Record<string, unknown>) {
    const cls = {
      get: jest.fn((key: string) => clsValues[key]),
    } as unknown as ClsService;

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuditLogService,
        { provide: ClsService, useValue: cls },
        { provide: AuditLog.name, useValue: modelFactory },
        { provide: TENANCY_DB_CONNECTION, useValue: tenantKnexMock },
      ],
    }).compile();

    return { service: moduleRef.get(AuditLogService), cls };
  }

  it('inserts through Objection using the provided transaction', async () => {
    const { service } = await createService({ userId: 42, ip: '10.0.0.1' });

    await service.record({
      trx,
      action: 'created',
      subject: 'Bill',
      subjectId: 7,
      metadata: { billNumber: 'B-1' },
    });

    expect(modelFactory).toHaveBeenCalled();
    expect(queryMock).toHaveBeenCalledWith(trx);
    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 42,
        action: 'created',
        subject: 'Bill',
        subjectId: 7,
        metadata: { billNumber: 'B-1' },
        ip: '10.0.0.1',
        createdAt: expect.any(String),
      }),
    );
  });

  it('uses tenant knex when trx is omitted (post-commit path)', async () => {
    const { service } = await createService({ userId: null, ip: null });
    const knexHandle = tenantKnexMock();

    await service.record({
      action: 'locking_changed',
      subject: 'TransactionsLocking',
      subjectId: null,
      metadata: { module: 'all' },
    });

    expect(queryMock).toHaveBeenCalledWith(knexHandle);
    expect(insertMock).toHaveBeenCalled();
  });
});
