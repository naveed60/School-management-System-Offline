use serde::Serialize;
use tauri::{AppHandle, Manager};

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AppInfo {
    app_version: String,
    schema_version: u32,
    status: &'static str,
}

#[tauri::command]
fn get_app_info(app: AppHandle) -> Result<AppInfo, String> {
    let app_version = app.package_info().version.to_string();

    Ok(AppInfo {
        app_version,
        schema_version: 0,
        status: "ok",
    })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let mut builder = tauri::Builder::default();

    #[cfg(desktop)]
    {
        builder = builder.plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
            }
        }));
    }

    builder
        .invoke_handler(tauri::generate_handler![get_app_info])
        .run(tauri::generate_context!())
        .expect("error while running school management system");
}
