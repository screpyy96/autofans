export function getServerEnv(name: string): string | undefined {
  return process.env[name] || (import.meta as any)?.env?.[name];
}
