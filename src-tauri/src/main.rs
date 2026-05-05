// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod beautify;
mod config;
mod crypto;
mod docker;
mod env;
mod enterprise;
mod i18n;
mod installer;
mod license;
mod marketplace;
mod version;
mod files;

use crypto::generate_machine_id;
use tauri::{
    menu::{MenuBuilder, MenuItemBuilder, PredefinedMenuItem},
    tray::TrayIconBuilder,
    Emitter, Manager, WindowEvent,
};

#[tauri::command]
fn get_machine_id() -> Result<String, String> {
    generate_machine_id()
}

#[tauri::command]
fn check_env() -> Result<env::EnvCheckResult, String> {
    env::check_environment()
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .invoke_handler(tauri::generate_handler![
            get_machine_id,
            check_env,
            config::load_config,
            config::save_config,
            docker::docker_ps,
            docker::compose_ps,
            docker::compose_up,
            docker::compose_down,
            docker::docker_restart,
            docker::compose_logs,
            docker::docker_build,
            docker::docker_pull,
            docker::list_local_images,
            docker::tag_image,
            docker::push_image,
            docker::docker_login,
            version::check_updates,
            enterprise::extract_base_command,
            enterprise::inject_enterprise,
            i18n::download_i18n,
            i18n::check_i18n_available,
            files::generate_dockerfile,
            files::generate_compose,
            license::validate_license,
            license::activate_license,
            marketplace::search_npm_packages,
            marketplace::get_npm_package_detail,
            marketplace::search_n8n_workflows,
            marketplace::get_workflow_filters,
            marketplace::install_community_package,
            marketplace::import_workflow_template,
            marketplace::get_installed_packages,
            marketplace::translate_to_chinese,
            beautify::list_themes,
            beautify::get_theme_css,
            beautify::apply_theme,
            beautify::remove_theme,
            beautify::get_active_theme,
            beautify::check_beautify_ready
        ])
        .on_window_event(|window, event| {
            if let WindowEvent::CloseRequested { api, .. } = event {
                api.prevent_close();
                let _ = window.hide();
            }
        })
        .setup(|app| {
            let show_item = MenuItemBuilder::with_id("show", "打开面板").build(app)?;
            let settings_item = MenuItemBuilder::with_id("settings", "设置").build(app)?;
            let open_n8n_item = MenuItemBuilder::with_id("open_n8n", "打开 n8n").build(app)?;
            let beautify_item = MenuItemBuilder::with_id("beautify", "美化 n8n").build(app)?;
            let sep = PredefinedMenuItem::separator(app)?;
            let quit_item = MenuItemBuilder::with_id("quit", "退出").build(app)?;
            let menu = MenuBuilder::new(app)
                .items(&[&show_item, &sep, &settings_item, &open_n8n_item, &beautify_item, &sep, &quit_item])
                .build()?;

            let _tray = TrayIconBuilder::with_id("main-tray")
                .icon(app.default_window_icon().cloned().unwrap())
                .tooltip("n8n Desktop Assistant")
                .menu(&menu)
                .on_menu_event(|app, event| {
                    match event.id.as_ref() {
                        "show" => {
                            if let Some(w) = app.get_webview_window("main") {
                                let _ = w.show();
                                let _ = w.unminimize();
                                let _ = w.set_focus();
                            }
                        }
                        "settings" => {
                            if let Some(w) = app.get_webview_window("main") {
                                let _ = w.show();
                                let _ = w.unminimize();
                                let _ = w.set_focus();
                            }
                            let _ = app.emit("tray://navigate", "settings");
                        }
                        "open_n8n" => {
                            let _ = app.emit("tray://navigate", "open_n8n");
                        }
                        "beautify" => {
                            if let Some(w) = app.get_webview_window("main") {
                                let _ = w.show();
                                let _ = w.unminimize();
                                let _ = w.set_focus();
                            }
                            let _ = app.emit("tray://navigate", "beautify");
                        }
                        "quit" => {
                            app.exit(0);
                        }
                        _ => {}
                    }
                })
                .on_tray_icon_event(|tray, event| {
                    if let tauri::tray::TrayIconEvent::Click { .. } = event {
                        let app = tray.app_handle();
                        if let Some(w) = app.get_webview_window("main") {
                            let _ = w.show();
                            let _ = w.unminimize();
                            let _ = w.set_focus();
                        }
                    }
                })
                .build(app)?;

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
