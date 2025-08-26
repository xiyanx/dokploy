import { updateLastActivity } from "../../services/auto-sleep";

export interface ActivityTracker {
	trackActivity(applicationId: string): Promise<void>;
	trackActivity(applicationId: string, composeId?: string): Promise<void>;
	trackComposeActivity(composeId: string): Promise<void>;
}

export const activityTracker: ActivityTracker = {
	async trackActivity(applicationId: string, composeId?: string): Promise<void> {
		try {
			await updateLastActivity(applicationId, composeId);
		} catch (error) {
			console.error("Failed to track activity:", error);
			// Don't throw error to prevent disrupting the main request
		}
	},

	async trackComposeActivity(composeId: string): Promise<void> {
		try {
			await updateLastActivity("", composeId);
		} catch (error) {
			console.error("Failed to track compose activity:", error);
			// Don't throw error to prevent disrupting the main request
		}
	},
};

// Helper functions for different activity types
export const trackApplicationActivity = (applicationId: string) => {
	return activityTracker.trackActivity(applicationId);
};

export const trackComposeActivity = (composeId: string) => {
	return activityTracker.trackComposeActivity(composeId);
};