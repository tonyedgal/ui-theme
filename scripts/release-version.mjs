export function selectReleaseVersion(name, currentVersion, releases) {
  const release = releases.find(
    (item) => item.name === name && item.type !== 'none'
  );

  if (release && !release.newVersion)
    throw new Error(`Missing planned version for ${name}`);

  if (!currentVersion) throw new Error(`Missing current version for ${name}`);

  return release?.newVersion ?? currentVersion;
}
