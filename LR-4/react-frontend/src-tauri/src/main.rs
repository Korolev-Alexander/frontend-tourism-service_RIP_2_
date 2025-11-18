#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;
use serde::{Deserialize, Serialize};
use reqwest;

#[derive(Debug, Serialize, Deserialize, Clone)]
struct SmartDevice {
    id: u32,
    name: String,
    model: String,
    avg_data_rate: f64,
    data_per_hour: f64,
    namespace_url: String,
    description: String,
    protocol: String,
}

#[tauri::command]
async fn get_devices() -> Result<Vec<SmartDevice>, String> {
    let server_ip = "192.168.1.12"; 
    let api_url = format!("http://{}:3000/api/smart-devices", server_ip); // ← ИЗМЕНИЛИ НА 3000
    
    println!("🔄 Tauri запрос к прокси 3000: {}", api_url);
    
    let client = reqwest::Client::new();
    match client.get(&api_url).send().await {
        Ok(response) => {
            if response.status().is_success() {
                match response.json::<Vec<SmartDevice>>().await {
                    Ok(devices) => {
                        println!("✅ Tauri получил устройств через прокси: {}", devices.len());
                        Ok(devices)
                    }
                    Err(e) => Err(format!("Ошибка парсинга: {}", e))
                }
            } else {
                Err(format!("HTTP ошибка: {}", response.status()))
            }
        }
        Err(e) => Err(format!("Ошибка сети: {}", e))
    }
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![get_devices])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}