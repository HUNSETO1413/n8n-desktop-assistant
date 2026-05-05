use sha2::{Digest, Sha256};
use aes_gcm::{Aes256Gcm, KeyInit, Nonce};
use aes_gcm::aead::Aead;
use base64::Engine;
use std::sync::OnceLock;

pub const SECRET_KEY: &[u8; 32] = b"n8n-assistant-secret-2024-v1-k-1";

static MACHINE_ID_CACHE: OnceLock<String> = OnceLock::new();

#[cfg(windows)]
fn machine_id_cache_path() -> Option<std::path::PathBuf> {
    std::env::var("LOCALAPPDATA").ok().map(|base| {
        let mut p = std::path::PathBuf::from(base);
        p.push("n8n-desktop-assistant");
        p.push("machine_id.cache");
        p
    })
}

#[cfg(target_os = "macos")]
fn machine_id_cache_path() -> Option<std::path::PathBuf> {
    std::env::var("HOME").ok().map(|base| {
        let mut p = std::path::PathBuf::from(base);
        p.push(".cache");
        p.push("n8n-desktop-assistant");
        p.push("machine_id.cache");
        p
    })
}

#[cfg(windows)]
pub fn get_cpu_id() -> String {
    use wmi::{COMLibrary, WMIConnection};
    use serde::Deserialize;

    #[derive(Deserialize, Debug)]
    struct Win32_Processor {
        ProcessorId: Option<String>,
    }

    let com = match COMLibrary::new() {
        Ok(c) => c,
        Err(_) => return "UNKNOWN".to_string(),
    };
    let wmi_con = match WMIConnection::new(com) {
        Ok(c) => c,
        Err(_) => return "UNKNOWN".to_string(),
    };
    let results: Vec<Win32_Processor> = match wmi_con.query() {
        Ok(r) => r,
        Err(_) => return "UNKNOWN".to_string(),
    };

    if let Some(cpu) = results.first() {
        cpu.ProcessorId.clone().unwrap_or_default()
    } else {
        "UNKNOWN".to_string()
    }
}

#[cfg(target_os = "macos")]
pub fn get_cpu_id() -> String {
    unsafe {
        match libc::sysctlbyname(
            b"machdep.cpu.brand_string\0".as_ptr() as *const i8,
            std::ptr::null_mut(),
            std::ptr::null_mut(),
            std::ptr::null(),
            0,
        ) {
            0 => {
                let mut len: usize = 0;
                libc::sysctlbyname(
                    b"machdep.cpu.brand_string\0".as_ptr() as *const i8,
                    std::ptr::null_mut(),
                    &mut len,
                    std::ptr::null(),
                    0,
                );
                let mut buf = vec![0u8; len];
                libc::sysctlbyname(
                    b"machdep.cpu.brand_string\0".as_ptr() as *const i8,
                    buf.as_mut_ptr() as *mut libc::c_void,
                    &mut len,
                    std::ptr::null(),
                    0,
                );
                String::from_utf8_lossy(&buf[..len.saturating_sub(1)]).to_string()
            }
            _ => "UNKNOWN".to_string(),
        }
    }
}

#[cfg(windows)]
pub fn get_disk_serial() -> String {
    use wmi::{COMLibrary, WMIConnection};
    use serde::Deserialize;

    #[derive(Deserialize, Debug)]
    struct Win32_LogicalDisk {
        VolumeSerialNumber: Option<String>,
    }

    let com = match COMLibrary::new() {
        Ok(c) => c,
        Err(_) => return "UNKNOWN".to_string(),
    };
    let wmi_con = match WMIConnection::new(com) {
        Ok(c) => c,
        Err(_) => return "UNKNOWN".to_string(),
    };
    let results: Vec<Win32_LogicalDisk> = match wmi_con.query() {
        Ok(r) => r,
        Err(_) => return "UNKNOWN".to_string(),
    };

    if let Some(disk) = results.first() {
        disk.VolumeSerialNumber.clone().unwrap_or_default()
    } else {
        "UNKNOWN".to_string()
    }
}

#[cfg(target_os = "macos")]
pub fn get_disk_serial() -> String {
    unsafe {
        let mut len: usize = 0;
        libc::sysctlbyname(
            b"kern.uuid\0".as_ptr() as *const i8,
            std::ptr::null_mut(),
            &mut len,
            std::ptr::null(),
            0,
        );
        if len == 0 {
            return "UNKNOWN".to_string();
        }
        let mut buf = vec![0u8; len];
        libc::sysctlbyname(
            b"kern.uuid\0".as_ptr() as *const i8,
            buf.as_mut_ptr() as *mut libc::c_void,
            &mut len,
            std::ptr::null(),
            0,
        );
        String::from_utf8_lossy(&buf[..len.saturating_sub(1)]).to_string()
    }
}

#[cfg(windows)]
pub fn get_mb_uuid() -> String {
    use wmi::{COMLibrary, WMIConnection};
    use serde::Deserialize;

    #[derive(Deserialize, Debug)]
    struct Win32_ComputerSystemProduct {
        UUID: Option<String>,
    }

    let com = match COMLibrary::new() {
        Ok(c) => c,
        Err(_) => return "UNKNOWN".to_string(),
    };
    let wmi_con = match WMIConnection::new(com) {
        Ok(c) => c,
        Err(_) => return "UNKNOWN".to_string(),
    };
    let results: Vec<Win32_ComputerSystemProduct> = match wmi_con.query() {
        Ok(r) => r,
        Err(_) => return "UNKNOWN".to_string(),
    };

    if let Some(mb) = results.first() {
        mb.UUID.clone().unwrap_or_default()
    } else {
        "UNKNOWN".to_string()
    }
}

#[cfg(target_os = "macos")]
pub fn get_mb_uuid() -> String {
    unsafe {
        let mut len: usize = 0;
        libc::sysctlbyname(
            b"hw.uuid\0".as_ptr() as *const i8,
            std::ptr::null_mut(),
            &mut len,
            std::ptr::null(),
            0,
        );
        if len == 0 {
            return "UNKNOWN".to_string();
        }
        let mut buf = vec![0u8; len];
        libc::sysctlbyname(
            b"hw.uuid\0".as_ptr() as *const i8,
            buf.as_mut_ptr() as *mut libc::c_void,
            &mut len,
            std::ptr::null(),
            0,
        );
        String::from_utf8_lossy(&buf[..len.saturating_sub(1)]).to_string()
    }
}

pub fn generate_machine_id() -> Result<String, String> {
    if let Some(cached) = MACHINE_ID_CACHE.get() {
        return Ok(cached.clone());
    }

    // Try file cache first (survives restarts, avoids WMI timing issues)
    if let Some(path) = machine_id_cache_path() {
        if let Ok(cached) = std::fs::read_to_string(&path) {
            let trimmed = cached.trim().to_string();
            if !trimmed.is_empty() {
                let _ = MACHINE_ID_CACHE.set(trimmed.clone());
                return Ok(trimmed);
            }
        }
    }

    let cpu_id = get_cpu_id();
    let disk_serial = get_disk_serial();
    let mb_uuid = get_mb_uuid();

    let combined = format!("{}|{}|{}", cpu_id, disk_serial, mb_uuid);
    let hash = Sha256::digest(combined.as_bytes());

    let hash_hex = format!("{:x}", hash);
    let hash_bytes = hash_hex.as_bytes();

    if hash_bytes.len() < 16 {
        return Err("Hash too short".to_string());
    }

    let formatted = format!(
        "{}-{}-{}-{}",
        String::from_utf8_lossy(&hash_bytes[0..4]),
        String::from_utf8_lossy(&hash_bytes[4..8]),
        String::from_utf8_lossy(&hash_bytes[8..12]),
        String::from_utf8_lossy(&hash_bytes[12..16])
    ).to_uppercase();

    // Only cache when all hardware components are valid
    let all_valid = cpu_id != "UNKNOWN" && disk_serial != "UNKNOWN" && mb_uuid != "UNKNOWN";
    if all_valid {
        let _ = MACHINE_ID_CACHE.set(formatted.clone());
        if let Some(path) = machine_id_cache_path() {
            if let Some(parent) = path.parent() {
                let _ = std::fs::create_dir_all(parent);
            }
            let _ = std::fs::write(&path, &formatted);
        }
    }

    Ok(formatted)
}

pub fn decrypt_data(encrypted: &str) -> Result<Vec<u8>, String> {
    let data = base64::prelude::BASE64_STANDARD.decode(encrypted)
        .map_err(|e| format!("Base64 decode failed: {}", e))?;

    if data.len() < 13 {
        return Err("Data too short".to_string());
    }

    let cipher = Aes256Gcm::new_from_slice(SECRET_KEY)
        .map_err(|e| format!("Failed to create cipher: {}", e))?;

    let (nonce_bytes, ciphertext) = data.split_at(12);
    let nonce = Nonce::from_slice(nonce_bytes);

    let plaintext = cipher
        .decrypt(nonce, ciphertext)
        .map_err(|e| format!("Decryption failed: {}", e))?;

    Ok(plaintext)
}

pub fn generate_signature(data: &str) -> String {
    use hmac::{Hmac, Mac};
    type HmacSha256 = Hmac<sha2::Sha256>;

    let mut mac = <HmacSha256 as Mac>::new_from_slice(SECRET_KEY)
        .expect("HMAC can take key of any size");
    mac.update(data.as_bytes());

    let result = mac.finalize();
    let code_bytes = result.into_bytes();

    format!("{:x}", code_bytes)
}
