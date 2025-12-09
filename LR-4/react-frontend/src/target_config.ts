const target_tauri = true

export const api_proxy_addr = "http://109.252.222.30:8082"
export const img_proxy_addr = "http://109.252.222.30:9000"
export const dest_api = (target_tauri) ? api_proxy_addr : "/api"
export const dest_img =  (target_tauri) ?  img_proxy_addr : "/img-proxy"
export const dest_root = (target_tauri) ? "" : "/RIP-Part-2"