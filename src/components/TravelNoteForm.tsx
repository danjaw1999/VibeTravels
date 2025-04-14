import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { CreateTravelNoteCommand } from "@/types";
import { useCreateTravelNote } from "@/hooks/useCreateTravelNote";
import { navigate } from "astro:transitions/client";

export default function TravelNoteForm() {
	const { createNote, isSubmitting, error } = useCreateTravelNote();

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		try {
			const formData = new FormData(e.currentTarget);
			const noteData: CreateTravelNoteCommand = {
				name: formData.get("name") as string,
				description: formData.get("description") as string,
				is_public: formData.get("is_public") === "on",
			};

			const note = await createNote(noteData);
			// if (note) {
			// 	navigate(`/travel-notes/${note.id}`);
			// }
		} catch (err) {
			console.error("Form submission failed:", err);
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

			{error && <div className="text-red-500">{error}</div>}

			<Button type="submit" disabled={isSubmitting}>
				{isSubmitting ? "Creating..." : "Create Travel Note"}
			</Button>
		</form>
	);
}
