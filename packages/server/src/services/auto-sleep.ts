import { TRPCError } from "@trpc/server";
import { eq, and, lte } from "drizzle-orm";
import { db } from "../db";
import { applications } from "../db/schema/application";
import { compose } from "../db/schema/compose";
import { findServerById } from "./server";
import { execAsync, execAsyncRemote } from "../utils/process/execAsync";

export interface AutoSleepConfig {
	autoSleep: boolean;
	sleepTimeoutMinutes: number;
}

export const updateApplicationAutoSleep = async (
	applicationId: string,
	config: AutoSleepConfig,
) => {
	const application = await db.query.applications.findFirst({
		where: eq(applications.applicationId, applicationId),
	});

	if (!application) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Application not found",
		});
	}

	const [updatedApplication] = await db
		.update(applications)
		.set({
			autoSleep: config.autoSleep,
			sleepTimeoutMinutes: config.sleepTimeoutMinutes,
		})
		.where(eq(applications.applicationId, applicationId))
		.returning();

	return updatedApplication;
};

export const updateComposeAutoSleep = async (
	composeId: string,
	config: AutoSleepConfig,
) => {
	const composeEntry = await db.query.compose.findFirst({
		where: eq(compose.composeId, composeId),
	});

	if (!composeEntry) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Compose not found",
		});
	}

	const [updatedCompose] = await db
		.update(compose)
		.set({
			autoSleep: config.autoSleep,
			sleepTimeoutMinutes: config.sleepTimeoutMinutes,
		})
		.where(eq(compose.composeId, composeId))
		.returning();

	return updatedCompose;
};

export const updateLastActivity = async (
	applicationId: string,
	composeId?: string,
) => {
	const now = new Date().toISOString();

	if (applicationId) {
		await db
			.update(applications)
			.set({ 
				lastActivity: now,
				isSleeping: false 
			})
			.where(eq(applications.applicationId, applicationId));
	}

	if (composeId) {
		await db
			.update(compose)
			.set({ 
				lastActivity: now,
				isSleeping: false 
			})
			.where(eq(compose.composeId, composeId));
	}
};

export const sleepApplication = async (applicationId: string) => {
	const application = await db.query.applications.findFirst({
		where: eq(applications.applicationId, applicationId),
		with: {
			server: true,
		},
	});

	if (!application) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Application not found",
		});
	}

	if (application.isSleeping) {
		return application;
	}

	const command = `CONTAINERS=$(docker ps -q --filter "name=${application.appName}"); [ ! -z "$CONTAINERS" ] && docker stop $CONTAINERS || true`;

	try {
		if (application.serverId) {
			await execAsyncRemote(application.serverId, command);
		} else {
			await execAsync(command);
		}

		// Mark as sleeping
		const [updatedApplication] = await db
			.update(applications)
			.set({ isSleeping: true })
			.where(eq(applications.applicationId, applicationId))
			.returning();

		return updatedApplication;
	} catch (error) {
		console.error(`Failed to sleep application ${application.appName}:`, error);
		throw new TRPCError({
			code: "INTERNAL_SERVER_ERROR",
			message: "Failed to sleep application",
		});
	}
};

export const wakeApplication = async (applicationId: string) => {
	const application = await db.query.applications.findFirst({
		where: eq(applications.applicationId, applicationId),
		with: {
			server: true,
		},
	});

	if (!application) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Application not found",
		});
	}

	if (!application.isSleeping) {
		return application;
	}

	const command = `CONTAINERS=$(docker ps -aq --filter "name=${application.appName}"); [ ! -z "$CONTAINERS" ] && docker start $CONTAINERS || true`;

	try {
		if (application.serverId) {
			await execAsyncRemote(application.serverId, command);
		} else {
			await execAsync(command);
		}

		// Mark as awake and update last activity
		const now = new Date().toISOString();
		const [updatedApplication] = await db
			.update(applications)
			.set({ 
				isSleeping: false,
				lastActivity: now 
			})
			.where(eq(applications.applicationId, applicationId))
			.returning();

		return updatedApplication;
	} catch (error) {
		console.error(`Failed to wake application ${application.appName}:`, error);
		throw new TRPCError({
			code: "INTERNAL_SERVER_ERROR",
			message: "Failed to wake application",
		});
	}
};

export const sleepCompose = async (composeId: string) => {
	const composeEntry = await db.query.compose.findFirst({
		where: eq(compose.composeId, composeId),
		with: {
			server: true,
		},
	});

	if (!composeEntry) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Compose not found",
		});
	}

	if (composeEntry.isSleeping) {
		return composeEntry;
	}

	const command = `cd ${composeEntry.appName} && docker compose stop`;

	try {
		if (composeEntry.serverId) {
			await execAsyncRemote(composeEntry.serverId, command);
		} else {
			await execAsync(command);
		}

		// Mark as sleeping
		const [updatedCompose] = await db
			.update(compose)
			.set({ isSleeping: true })
			.where(eq(compose.composeId, composeId))
			.returning();

		return updatedCompose;
	} catch (error) {
		console.error(`Failed to sleep compose ${composeEntry.appName}:`, error);
		throw new TRPCError({
			code: "INTERNAL_SERVER_ERROR",
			message: "Failed to sleep compose",
		});
	}
};

export const wakeCompose = async (composeId: string) => {
	const composeEntry = await db.query.compose.findFirst({
		where: eq(compose.composeId, composeId),
		with: {
			server: true,
		},
	});

	if (!composeEntry) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Compose not found",
		});
	}

	if (!composeEntry.isSleeping) {
		return composeEntry;
	}

	const command = `cd ${composeEntry.appName} && docker compose up -d`;

	try {
		if (composeEntry.serverId) {
			await execAsyncRemote(composeEntry.serverId, command);
		} else {
			await execAsync(command);
		}

		// Mark as awake and update last activity
		const now = new Date().toISOString();
		const [updatedCompose] = await db
			.update(compose)
			.set({ 
				isSleeping: false,
				lastActivity: now 
			})
			.where(eq(compose.composeId, composeId))
			.returning();

		return updatedCompose;
	} catch (error) {
		console.error(`Failed to wake compose ${composeEntry.appName}:`, error);
		throw new TRPCError({
			code: "INTERNAL_SERVER_ERROR",
			message: "Failed to wake compose",
		});
	}
};

export const checkAndSleepInactiveServices = async () => {
	const now = new Date();
	const results = [];

	// Check applications
	const inactiveApplications = await db.query.applications.findMany({
		where: and(
			eq(applications.autoSleep, true),
			eq(applications.isSleeping, false),
		),
	});

	for (const app of inactiveApplications) {
		if (app.lastActivity && app.sleepTimeoutMinutes) {
			const lastActivityDate = new Date(app.lastActivity);
			const minutesSinceActivity = (now.getTime() - lastActivityDate.getTime()) / (1000 * 60);

			if (minutesSinceActivity >= app.sleepTimeoutMinutes) {
				try {
					await sleepApplication(app.applicationId);
					results.push({ type: 'application', id: app.applicationId, name: app.appName, action: 'slept' });
				} catch (error) {
					results.push({ type: 'application', id: app.applicationId, name: app.appName, action: 'error', error: error instanceof Error ? error.message : String(error) });
				}
			}
		}
	}

	// Check compose services
	const inactiveComposeServices = await db.query.compose.findMany({
		where: and(
			eq(compose.autoSleep, true),
			eq(compose.isSleeping, false),
		),
	});

	for (const comp of inactiveComposeServices) {
		if (comp.lastActivity && comp.sleepTimeoutMinutes) {
			const lastActivityDate = new Date(comp.lastActivity);
			const minutesSinceActivity = (now.getTime() - lastActivityDate.getTime()) / (1000 * 60);

			if (minutesSinceActivity >= comp.sleepTimeoutMinutes) {
				try {
					await sleepCompose(comp.composeId);
					results.push({ type: 'compose', id: comp.composeId, name: comp.appName, action: 'slept' });
				} catch (error) {
					results.push({ type: 'compose', id: comp.composeId, name: comp.appName, action: 'error', error: error instanceof Error ? error.message : String(error) });
				}
			}
		}
	}

	return results;
};