import { execFileSync } from 'node:child_process';
import { lstatSync, mkdtempSync, rmSync } from 'node:fs';
import { dirname, join, parse, resolve } from 'node:path';

import type { CaptureStaging } from './unified-capture-controller.js';

const windowsAclScript = `
  $ErrorActionPreference = 'Stop'
  $sid = [Security.Principal.WindowsIdentity]::GetCurrent().User
  $acl = [IO.Directory]::GetAccessControl($env:QAP_CAPTURE_ACL_DIRECTORY)
  if ($env:QAP_CAPTURE_ACL_INITIALIZE -eq '1') {
    $acl.SetAccessRuleProtection($true, $false)
    foreach ($existing in $acl.GetAccessRules($true, $false, [Security.Principal.SecurityIdentifier])) {
      $acl.RemoveAccessRuleSpecific($existing)
    }
    $rule = [Security.AccessControl.FileSystemAccessRule]::new(
      $sid, 'FullControl', 'ContainerInherit, ObjectInherit', 'None', 'Allow')
    $acl.AddAccessRule($rule)
    [IO.Directory]::SetAccessControl($env:QAP_CAPTURE_ACL_DIRECTORY, $acl)
    $acl = [IO.Directory]::GetAccessControl($env:QAP_CAPTURE_ACL_DIRECTORY)
  }
  $rules = @($acl.GetAccessRules($true, $true, [Security.Principal.SecurityIdentifier]))
  if (!$acl.AreAccessRulesProtected -or $rules.Count -ne 1 -or
      $rules[0].IdentityReference.Value -ne $sid.Value -or
      $acl.GetOwner([Security.Principal.SecurityIdentifier]).Value -ne $sid.Value -or
      $rules[0].AccessControlType -ne 'Allow' -or
      ($rules[0].FileSystemRights -band [Security.AccessControl.FileSystemRights]::FullControl) -ne
        [Security.AccessControl.FileSystemRights]::FullControl -or
      $rules[0].InheritanceFlags -ne 'ContainerInherit, ObjectInherit') {
    throw 'Capture staging ACL verification failed.'
  }
`;

function verifyNoLinkedAncestors(directory: string): void {
  let current = directory;
  while (true) {
    const stat = lstatSync(current);
    if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error('Capture staging path is unsafe.');
    if (current === parse(current).root) break;
    current = dirname(current);
  }
}

function verifyAcl(directory: string, initialize: boolean): void {
  verifyNoLinkedAncestors(directory);
  if (process.platform === 'win32') {
    execFileSync(join(process.env.SystemRoot ?? 'C:\\Windows', 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe'), [
      '-NoLogo', '-NoProfile', '-NonInteractive', '-EncodedCommand', Buffer.from(windowsAclScript, 'utf16le').toString('base64'),
    ], {
      env: { ...process.env, QAP_CAPTURE_ACL_DIRECTORY: directory, QAP_CAPTURE_ACL_INITIALIZE: initialize ? '1' : '0' },
      windowsHide: true,
      timeout: 12_000,
      stdio: 'pipe',
    });
    return;
  }
  const stat = lstatSync(directory);
  if ((stat.mode & 0o777) !== 0o700 || stat.uid !== process.getuid?.()) {
    throw new Error('Capture staging directory must be owned by the host user with mode 0700.');
  }
}

/** Creates an empty user-only directory before a browser or encoder can write evidence. */
export function createPrivateCaptureStaging(hostOwnedRoot: string): CaptureStaging & { dispose(): void } {
  const root = resolve(hostOwnedRoot);
  verifyNoLinkedAncestors(root);
  const directory = mkdtempSync(join(root, 'qap-capture-'));
  try {
    verifyAcl(directory, true);
  } catch (error) {
    rmSync(directory, { recursive: true, force: true });
    throw error;
  }
  return {
    verifiedDirectory: directory,
    async discard(files) {
      verifyAcl(directory, false);
      for (const file of files) {
        if (dirname(resolve(file)) !== directory) throw new Error('Capture artifact is outside its staging directory.');
        rmSync(file, { force: true });
      }
    },
    dispose() {
      // This only performs logical deletion. No erasure claim is made.
      verifyAcl(directory, false);
      rmSync(directory, { recursive: true, force: true });
    },
  };
}
