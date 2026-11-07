// Fetches MP3 speech from our server route and plays it; resolves when playback ends.
export async function streamSpeech(endpoint: string, text: string, signal?: AbortSignal): Promise<void> {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
    ...(signal ? { signal } : {}),
  });
  if (!res.ok) throw new Error(`TTS failed: ${res.status} ${await res.text()}`);
  const url = URL.createObjectURL(await res.blob());
  const audio = new Audio(url);
  try {
    await new Promise<void>((resolve, reject) => {
      const stop = () => {
        audio.pause();
        reject(new DOMException("Aborted", "AbortError"));
      };
      signal?.addEventListener("abort", stop, { once: true });
      audio.onended = () => resolve();
      audio.onerror = () => reject(new Error("Audio playback failed"));
      audio.play().catch(reject);
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}
