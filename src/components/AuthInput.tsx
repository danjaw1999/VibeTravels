import { transitions } from "@/styles/theme";
import React from "react";

interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
	label: string;
	error?: string;
}

const AuthInput = React.forwardRef<HTMLInputElement, AuthInputProps>(
	({ label, error, id, ...inputProps }, ref) => {
		return (
			<div className="space-y-2">
				<label
					className="block text-sm font-medium text-foreground"
					htmlFor={id}
				>
					{label}
				</label>
				<input
					id={id}
					ref={ref}
					{...inputProps}
					data-testid={`auth-input-${id}`}
					className={`
            w-full px-3 py-2 bg-background border rounded-md text-foreground placeholder:text-muted-foreground
            focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring
            disabled:cursor-not-allowed disabled:opacity-50
            transition-colors duration-${transitions.duration.medium} ${transitions.timing.default}
            ${error ? "border-destructive" : "border-input hover:border-ring"}
          `}
				/>
				{error && (
					<p className="text-sm font-medium text-destructive">{error}</p>
				)}
			</div>
		);
	},
);
AuthInput.displayName = "AuthInput";
export default AuthInput;
