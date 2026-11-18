const controllers = new Set<AbortController>();
export const cancelRequests = () => {
  controllers.forEach((controller) => controller.abort());
  controllers.clear();
};

export async function request(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const controller = new AbortController();
  controllers.add(controller);
  const timer = setTimeout(() => controller.abort(), 90000);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } catch (error) {
    if (controller.signal.aborted)
      throw new Error("Request cancelled or timed out. Please retry.");
    throw error;
  } finally {
    clearTimeout(timer);
    controllers.delete(controller);
  }
}
