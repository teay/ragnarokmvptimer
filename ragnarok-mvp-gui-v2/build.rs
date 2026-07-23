use std::path::PathBuf;
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

    // Embed .exe icon (Windows only)
    let target_os = std::env::var("CARGO_CFG_TARGET_OS").unwrap_or_default();
    if target_os == "windows" {
        let windres = "x86_64-w64-mingw32-windres";
        let rc = PathBuf::from(std::env::var("CARGO_MANIFEST_DIR").unwrap_or_default()).join("icon.rc");
        if rc.exists() {
            let out_dir = PathBuf::from(std::env::var("OUT_DIR").unwrap_or_default());
            let res_o = out_dir.join("icon.o");
            if Command::new(windres)
                .args([
                    rc.to_string_lossy().as_ref(),
                    "-O",
                    "coff",
                    "-o",
                    res_o.to_string_lossy().as_ref(),
                ])
                .status()
                .map(|s| s.success())
                .unwrap_or(false)
            {
                println!(
                    "cargo:rustc-link-arg-bin=ragnarok_mvp_gui_v2={}",
                    res_o.to_string_lossy()
                );
            }
        }
    }
}
