import { readFileSync } from "node:fs";

const specUrl = new URL("./openapi.json", import.meta.url);
const openApiSpec = JSON.parse(readFileSync(specUrl, "utf8"));

export default openApiSpec;
