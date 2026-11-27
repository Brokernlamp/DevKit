export interface CliContext {
  cwd: string;
  write: (text: string) => void;
  writeError: (text: string) => void;
  exitCode: number;
}
