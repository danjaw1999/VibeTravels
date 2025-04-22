import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { CreateTravelNoteCommand } from "@/types";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createTravelNoteSchema } from "@/lib/schemas/travel-note.schema";
import { useTravelNotes } from "@/hooks/useTravelNotes";

export default function TravelNoteForm() {
	const { createTravelNote, isLoading, error } = useTravelNotes();
	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<CreateTravelNoteCommand>({
		resolver: zodResolver(createTravelNoteSchema),
		defaultValues: {
			is_public: true,
		},
	});

	const onSubmit = async (data: CreateTravelNoteCommand) => {
		const note = await createTravelNote(data);
		if (note?.id) {
			window.location.href = `/travel-notes/${note.id}`;
		}
	};

	return (
		<form
			onSubmit={handleSubmit(onSubmit)}
			className="space-y-6"
			data-testid="travel-note-form"
		>
			<div className="space-y-2">
				<Label htmlFor="name">Destination</Label>
				<Input
					id="name"
					placeholder="Enter destination name"
					data-testid="name-input"
					aria-invalid={!!errors.name}
					aria-describedby={errors.name ? "name-error" : undefined}
					className={
						errors.name
							? "border-destructive focus-visible:ring-destructive"
							: ""
					}
					{...register("name")}
				/>
				{errors.name && (
					<p
						id="name-error"
						className="text-sm font-medium text-destructive"
						data-testid="name-error"
					>
						{errors.name.message}
					</p>
				)}
			</div>

			<div className="space-y-2">
				<Label htmlFor="description">Description</Label>
				<Textarea
					id="description"
					placeholder="Enter travel note description"
					data-testid="description-input"
					aria-invalid={!!errors.description}
					aria-describedby={
						errors.description ? "description-error" : undefined
					}
					className={
						errors.description
							? "border-destructive focus-visible:ring-destructive"
							: ""
					}
					{...register("description")}
				/>
				{errors.description && (
					<p
						id="description-error"
						className="text-sm font-medium text-destructive"
						data-testid="description-error"
					>
						{errors.description.message}
					</p>
				)}
			</div>

			<div className="flex items-center space-x-2">
				<Checkbox
					id="is_public"
					data-testid="is-public-checkbox"
					{...register("is_public")}
				/>
				<Label htmlFor="is_public">Make this note public</Label>
			</div>

			{error && (
				<div
					className="text-sm font-medium text-destructive"
					data-testid="error-message"
				>
					{error}
				</div>
			)}

			<Button
				type="submit"
				disabled={isLoading}
				className="w-full"
				data-testid="submit-button"
			>
				{isLoading ? "Creating..." : "Create Travel Note"}
			</Button>
		</form>
	);
}
