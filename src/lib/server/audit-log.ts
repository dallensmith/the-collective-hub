import { db } from '$lib/server/db';
import { auditLog } from '$lib/server/db/schema';

/**
 * Insert a single audit log entry. Fire-and-forget — callers should not await
 * this in the hot path unless they need to guarantee the log was written before
 * returning a response.
 */
export async function logAuditEvent(params: {
	siteId: string;
	userId: string;
	userEmail?: string | null;
	action: 'create' | 'update' | 'delete';
	entityType: 'event' | 'asset' | 'link' | 'branding' | 'homepage' | 'settings' | 'team' | 'site';
	entityId?: string;
	details?: string;
}) {
	await db.insert(auditLog).values({
		id: crypto.randomUUID(),
		siteId: params.siteId,
		userId: params.userId,
		userEmail: params.userEmail ?? null,
		action: params.action,
		entityType: params.entityType,
		entityId: params.entityId ?? null,
		details: params.details ?? null
	});
}
