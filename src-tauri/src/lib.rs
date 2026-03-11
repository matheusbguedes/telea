use tauri::Manager;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn set_window_above_menubar(app: tauri::AppHandle, label: &str) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        use cocoa::appkit::{NSMainMenuWindowLevel, NSWindow};
        use cocoa::base::id;
        
        let window = app.get_webview_window(label)
            .ok_or_else(|| format!("Window with label '{}' not found", label))?;
        
        let ns_window = window.ns_window()
            .map_err(|e| format!("Failed to get NSWindow: {}", e))? as id;
        
        unsafe {
            ns_window.setLevel_((NSMainMenuWindowLevel + 2) as i64);
        }
        
        Ok(())
    }
    
    #[cfg(not(target_os = "macos"))]
    {
        Ok(())
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
    .setup(|_app| {
        #[cfg(target_os = "macos")]
        {
            use tauri::ActivationPolicy;
            _app.set_activation_policy(ActivationPolicy::Regular);
        }
        Ok(())
    })
    .plugin(tauri_plugin_store::Builder::new().build())
    .plugin(tauri_plugin_opener::init())
    .plugin(tauri_plugin_process::init())
    .plugin(tauri_plugin_os::init())
    .plugin(tauri_plugin_http::init())
    .plugin(tauri_plugin_updater::Builder::new().build())
    .invoke_handler(tauri::generate_handler![greet, set_window_above_menubar])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
