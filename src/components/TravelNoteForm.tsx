import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { CreateTravelNoteCommand } from "@/types";
import { useState } from "react";
import { navigate } from "astro:transitions/client";

export default function TravelNoteForm() {
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setIsSubmitting(true);
		setError(null);

		try {
			const formData = new FormData(e.currentTarget);
			const noteData: CreateTravelNoteCommand = {
				name: formData.get("name") as string,
				description: formData.get("description") as string,
				is_public: formData.get("is_public") === "on",
			};

			const response = await fetch("/api/travel-notes", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(noteData),
			});

			if (!response.ok) {
				const errorData = await response.json();
				if (response.status === 401) {
					// Unauthorized - redirect to login
					window.location.href = "/auth/login";
					return;
				}
				throw new Error(errorData.message || "Failed to create travel note");
			}

			const { data: note } = await response.json();
			if (note?.id) {
				navigate(`/travel-notes/${note.id}`);
			}
		} catch (err) {
			console.error("Form submission failed:", err);
			setError(
				err instanceof Error ? err.message : "Failed to create travel note",
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-6">
			<div className="space-y-2">
				<Label htmlFor="name">Destination</Label>
				<Input
					id="name"
					name="name"
					type="text"
					required
					placeholder="Enter destination name"
				/>
			</div>

			<div className="space-y-2">
				<Label htmlFor="description">Description</Label>
				<Textarea
					id="description"
					name="description"
					required
					placeholder="Enter travel note description"
				/>
			</div>

			<div className="flex items-center space-x-2">
				<Checkbox id="is_public" name="is_public" defaultChecked />
				<Label htmlFor="is_public">Make this note public</Label>
			</div>

			{error && (
				<div className="text-sm font-medium text-destructive">{error}</div>
			)}

			<Button type="submit" disabled={isSubmitting} className="w-full">
				{isSubmitting ? "Creating..." : "Create Travel Note"}
			</Button>
		</form>
	);
}
