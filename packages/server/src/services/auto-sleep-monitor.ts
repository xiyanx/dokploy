import * as schedule from "node-schedule";
import { checkAndSleepInactiveServices } from "./auto-sleep";
import { createSchedule } from "./schedule";
import { wakeApplication, wakeCompose } from "./auto-sleep";

let autoSleepMonitorJob: schedule.Job | null = null;

export const startAutoSleepMonitor = () => {
	// Stop existing monitor if running
	if (autoSleepMonitorJob) {
		autoSleepMonitorJob.cancel();
	}

	// Run every 5 minutes to check for inactive services
	autoSleepMonitorJob = schedule.scheduleJob("*/5 * * * *", async () => {
		try {
			console.log("Running auto-sleep monitor...");
			const results = await checkAndSleepInactiveServices();
			if (results.length > 0) {
				console.log("Auto-sleep monitor results:", results);
			}
		} catch (error) {
			console.error("Error in auto-sleep monitor:", error);
		}
	});

	console.log("Auto-sleep monitor started - checking every 5 minutes");
};

export const stopAutoSleepMonitor = () => {
	if (autoSleepMonitorJob) {
		autoSleepMonitorJob.cancel();
		autoSleepMonitorJob = null;
		console.log("Auto-sleep monitor stopped");
	}
};

export const createWakeSchedule = async (
	applicationId: string | null,
	composeId: string | null,
	cronExpression: string,
	name: string,
	userId: string,
) => {
	const scheduleType = applicationId ? "wake-application" : "wake-compose";
	const command = applicationId 
		? `echo "Waking application ${applicationId}"` 
		: `echo "Waking compose ${composeId}"`;

	return await createSchedule({
		name,
		cronExpression,
		scheduleType,
		command,
		applicationId,
		composeId,
		userId,
		enabled: true,
		shellType: "bash",
	});
};

export const executeWakeSchedule = async (
	applicationId: string | null,
	composeId: string | null,
) => {
	try {
		if (applicationId) {
			console.log(`Waking application ${applicationId} via schedule`);
			await wakeApplication(applicationId);
		} else if (composeId) {
			console.log(`Waking compose ${composeId} via schedule`);
			await wakeCompose(composeId);
		}
	} catch (error) {
		console.error("Error executing wake schedule:", error);
		throw error;
	}
};