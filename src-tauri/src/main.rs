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
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
