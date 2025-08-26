import {
	checkAndSleepInactiveServices,
	createWakeSchedule,
	executeWakeSchedule,
	startAutoSleepMonitor,
	stopAutoSleepMonitor,
} from "@dokploy/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

export const autoSleepRouter = createTRPCRouter({
	checkInactiveServices: protectedProcedure.query(async () => {
		try {
			return await checkAndSleepInactiveServices();
		} catch (error) {
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Failed to check inactive services",
			});
		}
	}),
	
	startMonitor: protectedProcedure.mutation(async ({ ctx }) => {
		if (ctx.session.user.role !== "owner") {
			throw new TRPCError({
				code: "UNAUTHORIZED",
				message: "Only owners can manage the auto-sleep monitor",
			});
		}

		try {
			startAutoSleepMonitor();
			return { success: true, message: "Auto-sleep monitor started" };
		} catch (error) {
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Failed to start auto-sleep monitor",
			});
		}
	}),
	
	stopMonitor: protectedProcedure.mutation(async ({ ctx }) => {
		if (ctx.session.user.role !== "owner") {
			throw new TRPCError({
				code: "UNAUTHORIZED",
				message: "Only owners can manage the auto-sleep monitor",
			});
		}

		try {
			stopAutoSleepMonitor();
			return { success: true, message: "Auto-sleep monitor stopped" };
		} catch (error) {
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Failed to stop auto-sleep monitor",
			});
		}
	}),

	createWakeSchedule: protectedProcedure
		.input(
			z.object({
				applicationId: z.string().optional(),
				composeId: z.string().optional(),
				cronExpression: z.string().min(1),
				name: z.string().min(1),
			}),
		)
		.mutation(async ({ input, ctx }) => {
			if (!input.applicationId && !input.composeId) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Either applicationId or composeId must be provided",
				});
			}

			try {
				return await createWakeSchedule(
					input.applicationId || null,
					input.composeId || null,
					input.cronExpression,
					input.name,
					ctx.session.user.id,
				);
			} catch (error) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to create wake schedule",
				});
			}
		}),

	executeWakeSchedule: protectedProcedure
		.input(
			z.object({
				applicationId: z.string().optional(),
				composeId: z.string().optional(),
			}),
		)
		.mutation(async ({ input }) => {
			if (!input.applicationId && !input.composeId) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Either applicationId or composeId must be provided",
				});
			}

			try {
				await executeWakeSchedule(
					input.applicationId || null,
					input.composeId || null,
				);
				return { success: true };
			} catch (error) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to execute wake schedule",
				});
			}
		}),
});