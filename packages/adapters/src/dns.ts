// MX validation via DNS-over-HTTPS (works through the container proxy; spec §6.2 email validity).
export async function hasMx(domain: string): Promise<boolean> {
  try {
    const res = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=MX`, {
      signal: AbortSignal.timeout(8000),
    });
    const data = (await res.json()) as { Answer?: { data: string }[] };
    return Boolean(data.Answer && data.Answer.length > 0);
  } catch {
    return false;
  }
}
