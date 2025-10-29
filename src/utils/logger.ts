import pino from "pino";

/**
 * Create and configure Pino logger
 */
export const createLogger = () => {
	return pino({
		level: "info",
		formatters: {
			level: (label) => {
				return { level: label };
			},
		},
		timestamp: pino.stdTimeFunctions.isoTime,
	});
};

/**
 * Default logger instance
 */
export const logger = createLogger();
