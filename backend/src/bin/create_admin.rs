//! Create admin user utility
use argon2::{password_hash::PasswordHasher, Argon2};

fn main() {
    let password = "admin123";
    let argon2 = Argon2::default();

    let password_hash = argon2
        .hash_password(password.as_bytes())
        .expect("Failed to hash password")
        .to_string();

    println!("Password hash for '{}': {}", password, password_hash);
    println!("\nSQL to insert admin user:");
    println!("INSERT INTO users (username, password_hash, nickname) VALUES ('admin', '{}', 'Administrator');", password_hash);
}
