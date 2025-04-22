import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface CreateNoteCardButtonProps {
  isLoggedIn: boolean;
}

export function CreateNoteCardButton({ isLoggedIn }: CreateNoteCardButtonProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            asChild
            className={`w-full group ${!isLoggedIn ? "opacity-50 cursor-not-allowed" : ""}`}
            disabled={!isLoggedIn}
          >
            <a
              href={isLoggedIn ? "/travel-notes/new" : undefined}
              className="inline-flex items-center gap-2"
              tabIndex={isLoggedIn ? undefined : -1}
              aria-disabled={!isLoggedIn}
              data-testid="create-note-card-button"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              <span>Create Note</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 transform group-hover:translate-x-1 transition-transform"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </Button>
        </TooltipTrigger>
        {!isLoggedIn && (
          <TooltipContent>
            <p>You need to be logged in to create notes</p>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
}
