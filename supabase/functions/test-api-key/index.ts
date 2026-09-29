import { serve } from "@std/http/server.ts";
import { handleTestApiKey } from "./handler.ts";

serve(handleTestApiKey);
