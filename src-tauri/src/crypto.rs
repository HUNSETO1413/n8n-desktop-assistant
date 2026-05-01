use sha2::{Digest, Sha256};
use aes_gcm::{Aes256Gcm, KeyInit, Nonce};
use aes_gcm::aead::{Aead, OsRng};
use aes_gcm::aead::rand_core::RngCore;
use hmac::Mac;
use base64::Engine;

pub const SECRET_KEY: &[u8; 32] = b"n8n-assistant-secret-2024-v1-k-1";

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
    use core_foundation::base::TCFType;
    use core_foundation::string::CFString;
    use core_foundation::boolean::CFBoolean;
    use core_foundation::dictionary::{CFDictionary, CFMutableDictionary};
    use core_foundation::base::{kCFAllocatorDefault, ToVoid};

    use IOKit_sys::*;

    unsafe {
        let mut matching_dict: CFMutableDictionaryRef = std::ptr::null_mut();
        IOServiceMatching(kIOPlatformExpertDeviceClass as *const i8, &mut matching_dict);

        if matching_dict.is_null() {
            return "UNKNOWN".to_string();
        }

        let service = IOServiceGetMatchingService(kIOMasterPortDefault, matching_dict);

        if service == 0 {
            return "UNKNOWN".to_string();
        }

        let io_platform_serial_number_key = CFString::from_static_string("IOPlatformSerialNumber");
        let property = IORegistryEntryCreateCFProperty(
            service,
            io_platform_serial_number_key.as_concrete_TypeRef(),
            kCFAllocatorDefault,
            0,
        );

        IOObjectRelease(service);

        if property.is_null() {
            return "UNKNOWN".to_string();
        }

        let cf_string = CFString::wrap_under_get_rule(property);
        let result = cf_string.to_string().unwrap_or_else(|_| "UNKNOWN".to_string());
        CFRelease(property);
        result
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
    use core_foundation::base::TCFType;
    use core_foundation::string::CFString;
    use core_foundation::dictionary::{CFMutableDictionary};
    use core_foundation::base::{kCFAllocatorDefault};

    use IOKit_sys::*;

    unsafe {
        let mut matching_dict: CFMutableDictionaryRef = std::ptr::null_mut();
        IOServiceMatching(kIOPlatformExpertDeviceClass as *const i8, &mut matching_dict);

        if matching_dict.is_null() {
            return "UNKNOWN".to_string();
        }

        let service = IOServiceGetMatchingService(kIOMasterPortDefault, matching_dict);

        if service == 0 {
            return "UNKNOWN".to_string();
        }

        let io_platform_uuid_key = CFString::from_static_string("IOPlatformUUID");
        let property = IORegistryEntryCreateCFProperty(
            service,
            io_platform_uuid_key.as_concrete_TypeRef(),
            kCFAllocatorDefault,
            0,
        );

        IOObjectRelease(service);

        if property.is_null() {
            return "UNKNOWN".to_string();
        }

        let cf_string = CFString::wrap_under_get_rule(property);
        let result = cf_string.to_string().unwrap_or_else(|_| "UNKNOWN".to_string());
        CFRelease(property);
        result
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
    use core_foundation::base::TCFType;
    use core_foundation::string::CFString;
    use core_foundation::dictionary::{CFMutableDictionary};
    use core_foundation::base::{kCFAllocatorDefault};

    use IOKit_sys::*;

    unsafe {
        let mut matching_dict: CFMutableDictionaryRef = std::ptr::null_mut();
        IOServiceMatching(kIOPlatformExpertDeviceClass as *const i8, &mut matching_dict);

        if matching_dict.is_null() {
            return "UNKNOWN".to_string();
        }

        let service = IOServiceGetMatchingService(kIOMasterPortDefault, matching_dict);

        if service == 0 {
            return "UNKNOWN".to_string();
        }

        let io_platform_uuid_key = CFString::from_static_string("IOPlatformUUID");
        let property = IORegistryEntryCreateCFProperty(
            service,
            io_platform_uuid_key.as_concrete_TypeRef(),
            kCFAllocatorDefault,
            0,
        );

        IOObjectRelease(service);

        if property.is_null() {
            return "UNKNOWN".to_string();
        }

        let cf_string = CFString::wrap_under_get_rule(property);
        let result = cf_string.to_string().unwrap_or_else(|_| "UNKNOWN".to_string());
        CFRelease(property);
        result
    }
}

pub fn generate_machine_id() -> Result<String, String> {
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

    Ok(formatted)
}

pub fn encrypt_data(data: &[u8]) -> Result<String, String> {
    let cipher = Aes256Gcm::new_from_slice(SECRET_KEY)
        .map_err(|e| format!("Failed to create cipher: {}", e))?;

    let mut nonce_bytes = [0u8; 12];
    OsRng.fill_bytes(&mut nonce_bytes);
    let nonce = Nonce::from_slice(&nonce_bytes);

    let ciphertext = cipher
        .encrypt(&nonce, data)
        .map_err(|e| format!("Encryption failed: {}", e))?;

    let mut result = nonce_bytes.to_vec();
    result.extend_from_slice(&ciphertext);

    Ok(base64::prelude::BASE64_STANDARD.encode(&result))
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
