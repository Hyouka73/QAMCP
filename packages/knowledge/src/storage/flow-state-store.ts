import {
  existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, renameSync, unlinkSync,
} from 'node:fs';
import { dirname, join } from 'node:path';

export interface FlowState {
  flow_name: string;
  started_at: string;
  completed_modules: string[];
  shared_variables: Record<string, string>;
}

export class FlowContextStore {
  private cacheDir: string;
  private sessionsDir: string;

  constructor(rootDir: string = process.cwd()) {
    this.cacheDir = join(rootDir, '.qa', 'cache', 'flow_states');
    this.sessionsDir = join(rootDir, '.qa', 'cache', 'sessions');
  }

  private getStateFilePath(flowName: string): string {
    return join(this.cacheDir, `${flowName}.state.json`);
  }

  private getSessionBackupPath(flowName: string): string {
    return join(this.cacheDir, `${flowName}.sessions.bak.json`);
  }

     saveState(state: FlowState): void {
    const filePath = this.getStateFilePath(state.flow_name);
    if (!existsSync(dirname(filePath))) {
      mkdirSync(dirname(filePath), { recursive: true });
    }
    // Escritura atómica: archivo temporal + rename
    const tmpPath = `${filePath}.${process.pid}.tmp`;
    writeFileSync(tmpPath, JSON.stringify(state, null, 2), 'utf-8');
    renameSync(tmpPath, filePath);
  }

  loadState(flowName: string): FlowState | null {
    const filePath = this.getStateFilePath(flowName);
    if (!existsSync(filePath)) {
      return null;
    }
    try {
      const content = readFileSync(filePath, 'utf-8');
      return JSON.parse(content) as FlowState;
    } catch {
      return null;
    }
  }
  hasSessionBackup(flowName: string): boolean {
    return existsSync(this.getSessionBackupPath(flowName));
  }
  backupSessions(flowName: string): void {
    if (!existsSync(this.cacheDir)) {
      mkdirSync(this.cacheDir, { recursive: true });
    }
    const sessionsBackup: Record<string, string> = {};
    if (existsSync(this.sessionsDir)) {
      const files = readdirSync(this.sessionsDir);
      for (const file of files) {
        if (file.endsWith('.json')) {
          const fullPath = join(this.sessionsDir, file);
          sessionsBackup[file] = readFileSync(fullPath, 'utf-8');
        }
      }
    }
    writeFileSync(this.getSessionBackupPath(flowName), JSON.stringify(sessionsBackup, null, 2), 'utf-8');
  }

  restoreSessions(flowName: string): boolean {
    const backupPath = this.getSessionBackupPath(flowName);
    if (!existsSync(backupPath)) {
      return false;
    }
    try {
      const content = readFileSync(backupPath, 'utf-8');
      const sessionsBackup = JSON.parse(content) as Record<string, string>;
      if (!existsSync(this.sessionsDir)) {
        mkdirSync(this.sessionsDir, { recursive: true });
      }
           
            for (const file of readdirSync(this.sessionsDir)) {
        if (file.endsWith('.json') && !(file in sessionsBackup)) {
          unlinkSync(join(this.sessionsDir, file));
        }
      }

      for (const [filename, fileContent] of Object.entries(sessionsBackup)) {
        writeFileSync(join(this.sessionsDir, filename), fileContent, 'utf-8');
      }
      return true;
    } catch {
      return false;
    }
  }
}