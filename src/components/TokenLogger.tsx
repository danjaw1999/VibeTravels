import { useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../db/database.types";

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseKey = import.meta.env.PUBLIC_SUPABASE_KEY;
const autoLoginEmail = import.meta.env.VITE_AUTO_LOGIN_EMAIL;
const autoLoginPassword = import.meta.env.VITE_AUTO_LOGIN_PASSWORD;

export function TokenLogger() {
	useEffect(() => {
		async function getToken() {
			const supabase = createClient<Database>(supabaseUrl, supabaseKey);

			// First try to get existing session
			const {
				data: { session: existingSession },
				error: sessionError,
			} = await supabase.auth.getSession();

			let session = existingSession;
			let user = existingSession?.user;

			// If no valid session exists, create new one
			if (!session?.access_token || sessionError) {
				const { data, error } = await supabase.auth.signInWithPassword({
					email: autoLoginEmail,
					password: autoLoginPassword,
				});

				if (error) {
					console.error("Authentication Error:", error.message);
					console.error("Error Details:", error);
					return;
				}

				session = data.session;
				user = data.user;
			}

			if (!session?.access_token || !user?.id) {
				console.error("Missing token or user ID in response");
				return;
			}

			const exampleBody = {
				name: "Wycieczka do Paryża",
				description: "Plan na tydzień w Paryżu",
			};

			// Log any session validation errors
			if (
				session.expires_at &&
				new Date(session.expires_at * 1000) < new Date()
			) {
				console.error("\nWARNING: This session has already expired!");
			}

			console.log("\n=== END ===");
		}

		getToken();
	}, []);

	return null;
}
