use std::process::Command;
use std::time::{SystemTime, UNIX_EPOCH};

fn main() {
    // Git commit hash (short)
    if let Ok(output) = Command::new("git")
        .args(["rev-parse", "--short", "HEAD"])
        .output()
    {
        if output.status.success() {
            let hash = String::from_utf8_lossy(&output.stdout).trim().to_string();
            println!("cargo:rustc-env=GIT_HASH={}", hash);
        }
    }

    // Build timestamp (unix seconds)
    let secs = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs();
    println!("cargo:rustc-env=BUILD_TS={}", secs);
}
