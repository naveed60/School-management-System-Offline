import { invoke } from '@tauri-apps/api/core'

export interface AppInfo {
  appVersion: string
  schemaVersion: number
  status: 'ok'
}

export function isTauriRuntime(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
}

export async function getAppInfo(): Promise<AppInfo> {
  return invoke<AppInfo>('get_app_info')
}
