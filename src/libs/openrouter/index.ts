type ResponseUsage = {
	prompt_tokens: number;
	completion_tokens: number;
	total_tokens: number;
};

type ErrorResponse = {
	code: number;
	message: string;
	metadata?: Record<string, unknown>;
};

type NonStreamingChoice = {
	finish_reason: string | null;
	native_finish_reason: string | null;
	message: {
		content: string | null;
		role: string;
	};
	error?: ErrorResponse;
};

type OpenRouterResponse = {
	id: string;
	choices: NonStreamingChoice[];
	created: number;
	model: string;
	object: "chat.completion" | "chat.completion.chunk";

	system_fingerprint?: string;

	usage?: ResponseUsage;
};

export async function request(prompt: string, model: string, apiKey: string) {
	const response = await fetch(
		"https://openrouter.ai/api/v1/chat/completions",
		{
			method: "POST",
			headers: {
				Authorization: `Bearer ${apiKey}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				model,
				messages: [
					{
						role: "user",
						content: prompt,
					},
				],
				max_tokens: 1000,
				temperature: 0.7,
			}),
		},
	);

	if (!response.ok) {
		const error = await response.text();
		throw new Error(`OpenRouter API error: ${error}`);
	}

	const data = (await response.json()) as OpenRouterResponse;

	return data;
}
