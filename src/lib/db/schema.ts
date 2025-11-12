import * as authSchema from "./auth.schema"; // This will be generated in a later step
import * as neodbSchema from "../neodb/schema";

// Combine all schemas here for migrations
export const schema = {
    ...authSchema,
    ...neodbSchema,
} as const;
