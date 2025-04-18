import { Button } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";

interface CreateNoteButtonProps {
	isLoggedIn: boolean;
}

export function CreateNoteButton({ isLoggedIn }: CreateNoteButtonProps) {
	return (
		<div className="flex items-center gap-2">
			<TooltipProvider>
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							asChild
							disabled={!isLoggedIn}
							className={!isLoggedIn ? "opacity-50" : ""}
						>
							<a href={isLoggedIn ? "/travel-notes/new" : undefined}>
								<span className="inline-flex items-center gap-2">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										className="h-4 w-4"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth="2"
										strokeLinecap="round"
										strokeLinejoin="round"
										aria-hidden="true"
									>
										<path d="M12 4v16m8-8H4" />
									</svg>
									Create New Note
								</span>
							</a>
						</Button>
					</TooltipTrigger>
					{!isLoggedIn && (
						<TooltipContent side="right">
							<p>You need to be logged in to create notes</p>
						</TooltipContent>
					)}
				</Tooltip>
			</TooltipProvider>

			{!isLoggedIn && (
				<Button asChild variant="outline">
					<a href="/login" className="inline-flex items-center gap-2">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							className="h-4 w-4"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
							aria-hidden="true"
						>
							<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M13.8 12H3" />
						</svg>
						Sign In
					</a>
				</Button>
			)}
		</div>
	);
}
