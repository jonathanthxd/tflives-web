/** A successful HTTP status and JSON body are both required before changing UI state. */
export async function readJsonResponse(response: Response) {
  if (!response.ok) throw new Error("request_failed");
  return response.json();
}
