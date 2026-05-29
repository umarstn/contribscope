const NPM_REGISTRY_URL = "https://registry.npmjs.org";

export async function getPackageDownloads(packageName: string): Promise<number> {
  try {
    const response = await fetch(`${NPM_REGISTRY_URL}/downloads/point/last-month/${packageName}`);
    if (!response.ok) return 0;
    const data = await response.json();
    return data.downloads || 0;
  } catch {
    return 0;
  }
}
