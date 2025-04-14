import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import type {
	AttractionSuggestionDTO,
	TravelNoteDTO,
	CreateAttractionCommand,
} from "@/types";

interface AttractionSuggestionsProps {
	travelNote: TravelNoteDTO;
	onAttractionsAdd?: (attractions: CreateAttractionCommand[]) => Promise<void>;
}

export function AttractionSuggestions({
	travelNote,
	onAttractionsAdd,
}: AttractionSuggestionsProps) {
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [suggestions, setSuggestions] = useState<AttractionSuggestionDTO[]>([]);
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

	const generateSuggestions = useCallback(async () => {
		try {
			setIsLoading(true);
			setError(null);

			const response = await fetch(
				`/api/travel-notes/${travelNote.id}/attractions/generate`,
			);

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || "Failed to generate suggestions");
			}

			const data = await response.json();
			setSuggestions(data.suggestions);
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Failed to generate suggestions",
			);
			console.error("Error generating suggestions:", err);
		} finally {
			setIsLoading(false);
		}
	}, [travelNote.id]);

	const handleCheckboxChange = (suggestionId: string) => {
		const newSelected = new Set(selectedIds);
		if (newSelected.has(suggestionId)) {
			newSelected.delete(suggestionId);
		} else {
			newSelected.add(suggestionId);
		}
		setSelectedIds(newSelected);
	};

	const handleAddSelected = async () => {
		if (selectedIds.size === 0) return;

		try {
			setIsLoading(true);
			setError(null);

			const selectedAttractions = suggestions
				.filter((s) => selectedIds.has(s.id || s.name))
				.map((s) => ({
					name: s.name,
					description: s.description,
					latitude: s.latitude,
					longitude: s.longitude,
					image: s.image?.url,
					image_photographer: s.image?.photographer,
					image_photographer_url: s.image?.photographerUrl,
					image_source: s.image?.source,
				}));

			// Jeśli przekazano onAttractionsAdd, użyj go
			if (onAttractionsAdd) {
				await onAttractionsAdd(selectedAttractions);
			}
			// W przeciwnym razie wykonaj własne wywołanie API
			else {
				const response = await fetch(
					`/api/travel-notes/${travelNote.id}/attractions`,
					{
						method: "POST",
						headers: {
							"Content-Type": "application/json",
						},
						body: JSON.stringify({ attractions: selectedAttractions }),
					},
				);

				if (!response.ok) {
					const data = await response.json();
					throw new Error(data.message || "Failed to add attractions");
				}

				// Odśwież stronę po dodaniu atrakcji
				window.location.reload();
			}
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Failed to add attractions",
			);
			console.error("Error adding attractions:", err);
		} finally {
			setIsLoading(false);
		}
	};

	// Automatycznie generuj sugestie, jeśli nie ma jeszcze żadnych atrakcji
	useEffect(() => {
		if (
			travelNote.attractions.length === 0 &&
			suggestions.length === 0 &&
			!isLoading
		) {
			generateSuggestions();
		}
	}, [
		travelNote.attractions.length,
		suggestions.length,
		isLoading,
		generateSuggestions,
	]);

	if (travelNote.attractions.length > 0) {
		return null;
	}

	return (
		<div className="space-y-4">
			{error && (
				<div
					className="bg-red-50 text-red-700 p-4 rounded-md"
					aria-live="polite"
				>
					{error}
				</div>
			)}

			{isLoading ? (
				<div
					className="flex items-center justify-center p-8"
					aria-live="polite"
				>
					<Loader2
						className="h-8 w-8 animate-spin text-primary"
						aria-hidden="true"
					/>
					<span className="ml-2">
						{suggestions.length === 0
							? "Generowanie sugestii..."
							: "Dodawanie wybranych atrakcji..."}
					</span>
				</div>
			) : suggestions.length > 0 ? (
				<>
					<ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{suggestions.map((suggestion) => (
							<li key={suggestion.id || suggestion.name}>
								<Card className="p-4 hover:shadow-lg transition-shadow">
									<div className="flex items-start space-x-4">
										<Checkbox
											id={`attraction-${suggestion.id || suggestion.name}`}
											checked={selectedIds.has(
												suggestion.id || suggestion.name,
											)}
											onCheckedChange={() =>
												handleCheckboxChange(suggestion.id || suggestion.name)
											}
											aria-label={`Wybierz atrakcję ${suggestion.name}`}
										/>
										<div className="flex-1">
											<h3 className="font-semibold">
												<label
													htmlFor={`attraction-${suggestion.id || suggestion.name}`}
													className="cursor-pointer"
												>
													{suggestion.name}
												</label>
											</h3>
											<p className="text-sm text-gray-600 mt-1">
												{suggestion.description}
											</p>
											{suggestion.image && (
												<div className="relative mt-2">
													<img
														src={suggestion.image.url}
														alt={`Zdjęcie atrakcji ${suggestion.name}`}
														className="rounded-md w-full h-48 object-cover"
													/>
													<div className="absolute bottom-0 right-0 bg-black/50 text-white text-xs p-2">
														Photo by{" "}
														<a
															href={suggestion.image.photographerUrl}
															target="_blank"
															rel="noopener noreferrer"
															className="hover:underline"
														>
															{suggestion.image.photographer}
														</a>
													</div>
												</div>
											)}
											<p className="text-sm text-gray-600 mt-2">
												{suggestion.estimatedPrice}
											</p>
											<a
												href={`https://www.google.com/maps?q=${suggestion.latitude},${suggestion.longitude}`}
												target="_blank"
												rel="noopener noreferrer"
												className="text-sm text-primary hover:underline mt-2 inline-flex items-center"
											>
												<span>Zobacz na mapie</span>
												<svg
													xmlns="http://www.w3.org/2000/svg"
													className="h-4 w-4 ml-1"
													viewBox="0 0 24 24"
													fill="none"
													stroke="currentColor"
													aria-hidden="true"
												>
													<path
														strokeLinecap="round"
														strokeLinejoin="round"
														strokeWidth="2"
														d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
													/>
												</svg>
											</a>
										</div>
									</div>
								</Card>
							</li>
						))}
					</ul>
					<div className="flex justify-end mt-4">
						<Button
							id="add-selected-attractions"
							onClick={handleAddSelected}
							disabled={selectedIds.size === 0 || isLoading}
							className="relative"
						>
							{isLoading ? (
								<>
									<Loader2
										className="mr-2 h-4 w-4 animate-spin"
										aria-hidden="true"
									/>
									<span>Dodawanie...</span>
								</>
							) : (
								<>
									<span>Dodaj wybrane</span>
									{selectedIds.size > 0 && (
										<span className="ml-2 bg-white/20 px-2 py-0.5 rounded-full text-sm">
											{selectedIds.size}
										</span>
									)}
								</>
							)}
						</Button>
					</div>
				</>
			) : null}
		</div>
	);
}
