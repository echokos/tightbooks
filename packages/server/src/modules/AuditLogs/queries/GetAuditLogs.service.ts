import { Inject, Injectable } from '@nestjs/common';
import * as moment from 'moment';
import { AuditLog } from '../models/AuditLog.model';
import { TenantModelProxy } from '@/modules/System/models/TenantBaseModel';
import { GetAuditLogsQueryDto } from '../dtos/GetAuditLogsQuery.dto';

export interface AuditLogListItem {
  id: number;
  userId: number | null;
  userName: string | null;
  userEmail: string | null;
  action: string;
  subject: string;
  subjectId: number | null;
  metadata: Record<string, unknown> | null;
  ip: string | null;
  createdAt: string;
}

@Injectable()
export class GetAuditLogsService {
  constructor(
    @Inject(AuditLog.name)
    private readonly auditLogModel: TenantModelProxy<typeof AuditLog>,
  ) {}

  async getAuditLogs(query: GetAuditLogsQueryDto): Promise<{
    data: AuditLogListItem[];
    pagination: { total: number; page: number; pageSize: number };
  }> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const pageIndex = Math.max(0, page - 1);

    let q = this.auditLogModel()
      .query()
      .withGraphFetched('tenantUser')
      .orderBy('createdAt', 'desc');

    if (query.subject) {
      q = q.where('subject', query.subject);
    }
    if (query.action) {
      q = q.where('action', query.action);
    }
    if (query.userId != null) {
      q = q.where('userId', query.userId);
    }
    if (query.from) {
      const from = moment(query.from).startOf('day').format('YYYY-MM-DD HH:mm:ss');
      q = q.where('createdAt', '>=', from);
    }
    if (query.to) {
      const to = moment(query.to).endOf('day').format('YYYY-MM-DD HH:mm:ss');
      q = q.where('createdAt', '<=', to);
    }

    const result = await q.page(pageIndex, pageSize);

    const data: AuditLogListItem[] = result.results.map((row) => {
      const u = row.tenantUser as
        | { fullName?: string; firstName?: string; lastName?: string; email?: string }
        | undefined;
      const userName = u
        ? (u.fullName ||
            `${u.firstName || ''} ${u.lastName || ''}`.trim() ||
            null)
        : null;
      return {
        id: row.id,
        userId: row.userId,
        userName,
        userEmail: u?.email ?? null,
        action: row.action,
        subject: row.subject,
        subjectId: row.subjectId,
        metadata: row.metadata,
        ip: row.ip,
        createdAt:
          typeof row.createdAt === 'string'
            ? row.createdAt
            : (row.createdAt as Date)?.toISOString?.() ?? String(row.createdAt),
      };
    });

    return {
      data,
      pagination: {
        total: result.total,
        page,
        pageSize,
      },
    };
  }
}
