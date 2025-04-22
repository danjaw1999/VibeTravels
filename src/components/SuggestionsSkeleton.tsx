export function SuggestionsSkeleton() {
	return (
		<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
			{Array(4)
				.fill(0)
				.map((_, index) => (
					<div
						key={index}
						className="bg-card rounded-xl shadow-lg overflow-hidden"
					>
						<div className="aspect-video bg-muted skeleton-loading-bar" />

						<div className="p-6">
							<div className="h-7 bg-muted rounded-md skeleton-loading-bar mb-4 w-3/4" />

							<div className="space-y-2 mb-4">
								<div className="h-4 bg-muted rounded-md skeleton-loading-bar w-full" />
								<div className="h-4 bg-muted rounded-md skeleton-loading-bar w-5/6" />
								<div className="h-4 bg-muted rounded-md skeleton-loading-bar w-4/6" />
							</div>

							<div className="h-6 bg-muted rounded-md skeleton-loading-bar w-36" />
						</div>
					</div>
				))}
		</div>
	);
}
