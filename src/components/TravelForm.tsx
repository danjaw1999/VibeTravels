import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Compass } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { type TravelPlan, generateTravelPlan } from "@/lib/openai";

const formSchema = z.object({
	location: z.string().min(2, "Location must be at least 2 characters"),
	notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function TravelForm() {
	const [loading, setLoading] = useState(false);
	const [plan, setPlan] = useState<TravelPlan | null>(null);

	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			location: "",
			notes: "",
		},
	});

	async function onSubmit(values: FormValues) {
		try {
			setLoading(true);
			const travelPlan = await generateTravelPlan(
				values.location,
				values.notes,
			);
			setPlan(travelPlan);
		} catch (error) {
			console.error("Error:", error);
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="max-w-2xl mx-auto">
				<div className="flex items-center gap-2 mb-8">
					<Compass className="w-8 h-8 text-primary" />
					<h1 className="text-3xl font-bold">VibeTravels</h1>
				</div>

				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
						<FormField
							control={form.control}
							name="location"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Location</FormLabel>
									<FormControl>
										<Input placeholder="Enter a location..." {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="notes"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Additional Notes (Optional)</FormLabel>
									<FormControl>
										<Textarea
											placeholder="Add any preferences or specific interests..."
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<Button type="submit" disabled={loading}>
							{loading ? "Generating Plan..." : "Generate Travel Plan"}
						</Button>
					</form>
				</Form>

				{plan && (
					<Card className="mt-8 p-6">
						<h2 className="text-2xl font-bold mb-4">{plan.title}</h2>
						<p className="text-gray-600 mb-6">{plan.description}</p>

						<div className="space-y-4">
							{plan.points.map((point) => (
								<div
									key={`${point.name}-${point.location.lat}-${point.location.lng}`}
									className="border-l-4 border-primary pl-4"
								>
									<div className="flex items-center justify-between">
										<h3 className="font-semibold">{point.name}</h3>
										<a
											href={`https://www.google.com/maps/search/?api=1&query=${point.location.lat},${point.location.lng}`}
											target="_blank"
											rel="noopener noreferrer"
											className="ml-2"
										>
											<Button variant="ghost" size="sm">
												<Compass className="w-4 h-4 mr-1" />
												View on Maps
											</Button>
										</a>
									</div>
									<p className="text-sm text-gray-600">{point.description}</p>
								</div>
							))}
						</div>

						<a
							href={plan.mapsUrl}
							target="_blank"
							rel="noopener noreferrer"
							className="mt-6 inline-block"
						>
							<Button variant="outline">
								<Compass className="w-4 h-4 mr-2" />
								View Full Trip on Maps
							</Button>
						</a>
					</Card>
				)}
			</div>
		</div>
	);
}
