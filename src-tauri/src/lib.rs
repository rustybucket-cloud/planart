use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::Manager;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CanvasElement {
    pub id: String,
    #[serde(rename = "type")]
    pub element_type: String,
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
    pub content: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub rotation: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(rename = "fontScale")]
    pub font_scale: Option<f64>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ViewportState {
    pub x: f64,
    pub y: f64,
    pub zoom: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct CanvasData {
    pub id: String,
    pub name: String,
    pub created_at: String,
    pub updated_at: String,
    pub viewport: ViewportState,
    pub elements: Vec<CanvasElement>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct CanvasSummary {
    pub id: String,
    pub name: String,
    pub updated_at: String,
    pub element_count: usize,
}

fn get_canvases_dir(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let app_data = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))?;
    let canvases_dir = app_data.join("canvases");

    if !canvases_dir.exists() {
        fs::create_dir_all(&canvases_dir)
            .map_err(|e| format!("Failed to create canvases dir: {}", e))?;
    }

    Ok(canvases_dir)
}

#[tauri::command]
fn create_canvas(app: tauri::AppHandle, name: String) -> Result<CanvasData, String> {
    let canvases_dir = get_canvases_dir(&app)?;
    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();

    let canvas = CanvasData {
        id: id.clone(),
        name,
        created_at: now.clone(),
        updated_at: now,
        viewport: ViewportState {
            x: 0.0,
            y: 0.0,
            zoom: 1.0,
        },
        elements: vec![],
    };

    let file_path = canvases_dir.join(format!("{}.json", id));
    let json = serde_json::to_string_pretty(&canvas)
        .map_err(|e| format!("Failed to serialize canvas: {}", e))?;
    fs::write(&file_path, json)
        .map_err(|e| format!("Failed to write canvas file: {}", e))?;

    Ok(canvas)
}

#[tauri::command]
fn save_canvas(app: tauri::AppHandle, canvas: CanvasData) -> Result<(), String> {
    let canvases_dir = get_canvases_dir(&app)?;
    let file_path = canvases_dir.join(format!("{}.json", canvas.id));

    let json = serde_json::to_string_pretty(&canvas)
        .map_err(|e| format!("Failed to serialize canvas: {}", e))?;
    fs::write(&file_path, json)
        .map_err(|e| format!("Failed to write canvas file: {}", e))?;

    Ok(())
}

#[tauri::command]
fn load_canvas(app: tauri::AppHandle, id: String) -> Result<CanvasData, String> {
    let canvases_dir = get_canvases_dir(&app)?;
    let file_path = canvases_dir.join(format!("{}.json", id));

    let json = fs::read_to_string(&file_path)
        .map_err(|e| format!("Failed to read canvas file: {}", e))?;
    let canvas: CanvasData = serde_json::from_str(&json)
        .map_err(|e| format!("Failed to parse canvas: {}", e))?;

    Ok(canvas)
}

#[tauri::command]
fn list_canvases(app: tauri::AppHandle) -> Result<Vec<CanvasSummary>, String> {
    let canvases_dir = get_canvases_dir(&app)?;
    let mut summaries = Vec::new();

    let entries = fs::read_dir(&canvases_dir)
        .map_err(|e| format!("Failed to read canvases dir: {}", e))?;

    for entry in entries {
        let entry = entry.map_err(|e| format!("Failed to read entry: {}", e))?;
        let path = entry.path();

        if path.extension().map_or(false, |ext| ext == "json") {
            let json = fs::read_to_string(&path)
                .map_err(|e| format!("Failed to read canvas file: {}", e))?;
            let canvas: CanvasData = serde_json::from_str(&json)
                .map_err(|e| format!("Failed to parse canvas: {}", e))?;

            summaries.push(CanvasSummary {
                id: canvas.id,
                name: canvas.name,
                updated_at: canvas.updated_at,
                element_count: canvas.elements.len(),
            });
        }
    }

    // Sort by updated_at descending (most recent first)
    summaries.sort_by(|a, b| b.updated_at.cmp(&a.updated_at));

    Ok(summaries)
}

#[tauri::command]
fn delete_canvas(app: tauri::AppHandle, id: String) -> Result<(), String> {
    let canvases_dir = get_canvases_dir(&app)?;
    let file_path = canvases_dir.join(format!("{}.json", id));

    fs::remove_file(&file_path)
        .map_err(|e| format!("Failed to delete canvas file: {}", e))?;

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            create_canvas,
            save_canvas,
            load_canvas,
            list_canvases,
            delete_canvas
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
