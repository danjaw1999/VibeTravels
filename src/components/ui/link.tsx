import * as React from "react";
import { type VariantProps, cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const linkVariants = cva(
	"inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background",
	{
		variants: {
			variant: {
				default: "text-primary underline-offset-4 hover:underline",
				subtle: "text-muted-foreground hover:text-foreground",
				button: "bg-primary text-primary-foreground hover:bg-primary/90",
				outline:
					"border border-input hover:bg-accent hover:text-accent-foreground",
				ghost: "hover:bg-accent hover:text-accent-foreground",
				tab: "bg-background hover:text-foreground hover:bg-accent px-3 py-1.5",
				nav: "text-muted-foreground hover:text-foreground",
			},
			size: {
				default: "h-10 py-2",
				sm: "h-9 px-3",
				lg: "h-11 px-8",
				icon: "h-10 w-10",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	},
);

export interface LinkProps
	extends React.AnchorHTMLAttributes<HTMLAnchorElement>,
		VariantProps<typeof linkVariants> {
	asChild?: boolean;
}

const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(
	({ className, variant, size, asChild = false, ...props }, ref) => {
		return (
			<a
				className={cn(linkVariants({ variant, size }), className)}
				ref={ref}
				{...props}
			/>
		);
	},
);

Link.displayName = "Link";

export { Link };
