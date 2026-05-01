use aes_gcm::{Aes256Gcm, KeyInit, Nonce};
use aes_gcm::aead::{Aead, OsRng};
use aes_gcm::aead::rand_core::RngCore;
use base64::Engine;
use hmac::{Hmac, Mac};
use sha2::Sha256;

type HmacSha256 = Hmac<Sha256>;

const SECRET_KEY: &[u8; 32] = b"n8n-assistant-secret-2024-v1-k-1";

fn generate_signature(data: &str) -> String {
    let mut mac = <HmacSha256 as Mac>::new_from_slice(SECRET_KEY).expect("HMAC key length");
    mac.update(data.as_bytes());
    let result = mac.finalize();
    hex::encode(result.into_bytes())
}

fn encrypt_data(data: &[u8]) -> Result<String, String> {
    let cipher = Aes256Gcm::new_from_slice(SECRET_KEY).map_err(|e| e.to_string())?;
    let mut nonce_bytes = [0u8; 12];
    OsRng.fill_bytes(&mut nonce_bytes);
    let nonce = Nonce::from_slice(&nonce_bytes);
    let ciphertext = cipher.encrypt(nonce, data).map_err(|e| e.to_string())?;
    let mut combined = Vec::with_capacity(12 + ciphertext.len());
    combined.extend_from_slice(&nonce_bytes);
    combined.extend_from_slice(&ciphertext);
    Ok(base64::engine::general_purpose::STANDARD.encode(&combined))
}

fn main() {
    let args: Vec<String> = std::env::args().collect();

    if args.len() < 3 || args[1] == "--help" || args[1] == "-h" {
        eprintln!("n8n Desktop Assistant — 授权码生成器");
        eprintln!();
        eprintln!("用法: license-gen <machine_id> <license_type> [expire_days]");
        eprintln!();
        eprintln!("参数:");
        eprintln!("  machine_id    机器码（XXXX-XXXX-XXXX-XXXX 格式）");
        eprintln!("  license_type  授权类型: professional | enterprise");
        eprintln!("  expire_days   有效天数（默认 0 = 永久）");
        eprintln!();
        eprintln!("示例:");
        eprintln!("  license-gen ABCD-1234-EFGH-5678 enterprise");
        eprintln!("  license-gen ABCD-1234-EFGH-5678 professional 365");
        std::process::exit(1);
    }

    let machine_id = &args[1];
    let license_type = &args[2];
    let expire_days: i32 = args.get(3).and_then(|s| s.parse().ok()).unwrap_or(0);

    if license_type != "professional" && license_type != "enterprise" {
        eprintln!("错误: license_type 必须是 professional 或 enterprise");
        std::process::exit(1);
    }

    let issue_time = chrono::Utc::now().to_rfc3339();

    let sign_data = format!("{}{}{}", machine_id, license_type, expire_days);
    let sign = generate_signature(&sign_data);

    let license_json = serde_json::json!({
        "machine_id": machine_id,
        "license_type": license_type,
        "expire_days": expire_days,
        "issue_time": issue_time,
        "sign": sign,
    });

    let json_str = serde_json::to_string_pretty(&license_json).unwrap();
    let encrypted = encrypt_data(json_str.as_bytes()).expect("Encryption failed");

    println!("========================================");
    println!("  授权码生成成功");
    println!("========================================");
    println!("  机器码: {}", machine_id);
    println!("  类型:   {} ({})", license_type, if license_type == "enterprise" { "企业版" } else { "专业版" });
    println!("  有效期: {}", if expire_days == 0 { "永久".to_string() } else { format!("{} 天", expire_days) });
    println!("  签发:   {}", issue_time);
    println!("========================================");
    println!();
    println!("{}", encrypted);
}
