import { AlertBlock } from "@/components/shared/alert-block";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { api } from "@/utils/api";
import { AlertTriangle, Moon, Sun } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

interface Props {
	composeId: string;
}

interface AutoSleepFormData {
	autoSleep: boolean;
	sleepTimeoutMinutes: number;
}

export const ShowAutoSleep = ({ composeId }: Props) => {
	const utils = api.useUtils();
	const { data } = api.compose.one.useQuery(
		{
			composeId,
		},
		{
			enabled: !!composeId,
		},
	);

	const { mutateAsync: updateAutoSleep, isLoading } =
		api.compose.updateAutoSleep.useMutation();
	const { mutateAsync: sleepCompose, isLoading: isSleeping } =
		api.compose.sleep.useMutation();
	const { mutateAsync: wakeCompose, isLoading: isWaking } =
		api.compose.wake.useMutation();

	const {
		register,
		handleSubmit,
		reset,
		watch,
		formState: { errors },
	} = useForm<AutoSleepFormData>({
		defaultValues: {
			autoSleep: false,
			sleepTimeoutMinutes: 30,
		},
	});

	const autoSleepEnabled = watch("autoSleep");

	useEffect(() => {
		if (data) {
			reset({
				autoSleep: data.autoSleep || false,
				sleepTimeoutMinutes: data.sleepTimeoutMinutes || 30,
			});
		}
	}, [data, reset]);

	const onSubmit = async (formData: AutoSleepFormData) => {
		try {
			await updateAutoSleep({
				composeId,
				...formData,
			});

			await utils.compose.one.invalidate({
				composeId,
			});

			toast.success("Auto-sleep settings updated successfully");
		} catch (error) {
			toast.error("Error updating auto-sleep settings");
		}
	};

	const handleManualSleep = async () => {
		try {
			await sleepCompose({ composeId });
			await utils.compose.one.invalidate({ composeId });
			toast.success("Compose services put to sleep");
		} catch (error) {
			toast.error("Error putting compose services to sleep");
		}
	};

	const handleManualWake = async () => {
		try {
			await wakeCompose({ composeId });
			await utils.compose.one.invalidate({ composeId });
			toast.success("Compose services woken up");
		} catch (error) {
			toast.error("Error waking up compose services");
		}
	};

	return (
		<div className="flex w-full flex-col gap-5">
			<Card className="bg-background">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Moon className="size-5" />
						Auto-Sleep Settings
					</CardTitle>
					<CardDescription>
						Configure automatic sleep mode for your compose stack to save
						resources when idle.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<AlertBlock type="info">
						When enabled, all services in this compose stack will automatically
						stop after the specified timeout period. They can be woken up
						manually or through scheduled tasks.
					</AlertBlock>

					{data?.isSleeping && (
						<AlertBlock type="warning">
							<AlertTriangle className="size-4" />
							This compose stack is currently sleeping.
						</AlertBlock>
					)}

					<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
						<div className="flex items-center justify-between">
							<div className="space-y-0.5">
								<Label>Enable Auto-Sleep</Label>
								<p className="text-sm text-muted-foreground">
									Automatically put all compose services to sleep when idle
								</p>
							</div>
							<Switch {...register("autoSleep")} />
						</div>

						{autoSleepEnabled && (
							<div className="space-y-2">
								<Label htmlFor="sleepTimeoutMinutes">
									Sleep Timeout (minutes)
								</Label>
								<Input
									id="sleepTimeoutMinutes"
									type="number"
									min="1"
									max="1440"
									{...register("sleepTimeoutMinutes", {
										required: "Timeout is required",
										min: { value: 1, message: "Minimum timeout is 1 minute" },
										max: {
											value: 1440,
											message: "Maximum timeout is 1440 minutes (24 hours)",
										},
									})}
								/>
								{errors.sleepTimeoutMinutes && (
									<p className="text-sm text-destructive">
										{errors.sleepTimeoutMinutes.message}
									</p>
								)}
								<p className="text-sm text-muted-foreground">
									Compose stack will sleep after this many minutes of
									inactivity
								</p>
							</div>
						)}

						<Button type="submit" isLoading={isLoading}>
							Update Auto-Sleep Settings
						</Button>
					</form>

					<div className="border-t pt-4">
						<h4 className="text-sm font-semibold mb-3">Manual Control</h4>
						<div className="flex gap-2">
							<Button
								variant="outline"
								size="sm"
								onClick={handleManualSleep}
								isLoading={isSleeping}
								disabled={data?.isSleeping}
							>
								<Moon className="size-4 mr-2" />
								Sleep Now
							</Button>
							<Button
								variant="outline"
								size="sm"
								onClick={handleManualWake}
								isLoading={isWaking}
								disabled={!data?.isSleeping}
							>
								<Sun className="size-4 mr-2" />
								Wake Up
							</Button>
						</div>
						<p className="text-xs text-muted-foreground mt-2">
							Use these controls to manually sleep or wake your compose stack
						</p>
					</div>
				</CardContent>
			</Card>
		</div>
	);
};