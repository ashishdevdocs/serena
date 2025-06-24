export const VERSION = '2025-06-21';

import { getGitStatus } from './git';

export function serenaVersion(): string {
  let version = VERSION;
  try {
    const status = getGitStatus();
    if (status) {
      version += `-${status.commit.slice(0, 8)}`;
      if (status.hasUnstagedChanges || status.hasStagedUncommittedChanges || status.hasUntrackedFiles) {
        version += '-dirty';
      }
    }
  } catch {
    // ignore errors when git is not available
  }
  return version;
}
