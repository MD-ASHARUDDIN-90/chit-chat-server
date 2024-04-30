import morgan from "morgan";

export const useMorgan = (expressInstance) => {
	expressInstance.use(morgan("tiny" /* , { stream: logger.stream } */));
};
