export function getServerEnv(name: string): string | undefined {
  // In server context, process.env is always available (both dev and production).
  // Dynamic import.meta.env[name] is NOT supported by Vite module runner.
  return process.env[name];
}
