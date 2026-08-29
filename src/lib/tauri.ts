import { invoke } from '@tauri-apps/api/core'

export interface AppInfo {
  appVersion: string
  schemaVersion: number
  status: 'ok'
}

export interface SetupStatus {
  setupComplete: boolean
  schemaVersion: number
}

export interface SetupInput {
  schoolName: string
  country: string
  timezone: string
  currency: string
  adminName: string
  adminEmail: string
  password: string
}

export interface LoginInput {
  email: string
  password: string
}

export interface Session {
  userId: string
  schoolId: string
  displayName: string
  email: string
  role: string
}

export interface BackupManifest {
  formatVersion: number
  schemaVersion: number
  appVersion: string
  createdAt: number
  databaseSha256: string
  attachments: string[]
}

export interface BackupResult {
  path: string
  bytes: number
  manifest: BackupManifest
}

export function isTauriRuntime(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
}

export async function getAppInfo(): Promise<AppInfo> {
  return invoke<AppInfo>('get_app_info')
}

export async function getSetupStatus(): Promise<SetupStatus> {
  return invoke<SetupStatus>('get_setup_status')
}

export async function completeSetup(input: SetupInput): Promise<Session> {
  return invoke<Session>('complete_setup', { input })
}

export async function login(input: LoginInput): Promise<Session> {
  return invoke<Session>('login', { input })
}

export async function currentSession(): Promise<Session | null> {
  return invoke<Session | null>('current_session')
}

export async function logout(): Promise<void> {
  return invoke<void>('logout')
}

export async function createBackup(input: { path?: string; passphrase: string }): Promise<BackupResult> {
  return invoke<BackupResult>('create_backup', { input })
}

export async function restoreBackup(input: { path: string; passphrase: string }): Promise<BackupManifest> {
  return invoke<BackupManifest>('restore_backup', { input })
}
