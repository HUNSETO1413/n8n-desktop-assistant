use serde::{Deserialize, Serialize};
use tauri::AppHandle;
use tauri_plugin_shell::ShellExt;
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ThemeInfo {
    pub id: String,
    pub name: String,
    pub description: String,
    pub preview_colors: Vec<String>,
    pub css: String,
}

fn compose_dir(install_path: &str) -> PathBuf {
    #[cfg(windows)]
    {
        PathBuf::from(install_path.replace('/', "\\"))
    }
    #[cfg(not(windows))]
    {
        PathBuf::from(install_path)
    }
}

const THEME_MARKER_START: &str = "<!-- N8N-CUSTOM-THEME-START -->";
const THEME_MARKER_END: &str = "<!-- N8N-CUSTOM-THEME-END -->";
const CACHE_HTML: &str = "/home/node/.cache/n8n/public/index.html";


fn builtin_themes() -> Vec<ThemeInfo> {
    vec![
        ThemeInfo {
            id: "modern-glass".into(),
            name: "现代毛玻璃".into(),
            description: "圆角卡片 + 毛玻璃半透明效果，增强视觉层次".into(),
            preview_colors: vec![
                "#6366f1".into(), "#8b5cf6".into(), "#a78bfa".into(),
            ],
            css: r#".vue-flow__node-default,.vue-flow__node-input,.vue-flow__node-output{border-radius:12px!important;box-shadow:0 4px 16px rgba(0,0,0,0.08)!important;backdrop-filter:blur(12px)!important;background:rgba(255,255,255,0.85)!important;border:1px solid rgba(255,255,255,0.3)!important;transition:box-shadow 0.2s,transform 0.15s!important}.vue-flow__node-default:hover,.vue-flow__node-input:hover,.vue-flow__node-output:hover{box-shadow:0 8px 32px rgba(99,102,241,0.15)!important;transform:translateY(-2px)!important}.vue-flow__node-default.selected,.vue-flow__node-input.selected,.vue-flow__node-output.selected{box-shadow:0 0 0 2px #6366f1,0 8px 32px rgba(99,102,241,0.25)!important}.vue-flow__edge-path{stroke:#6366f1!important;stroke-width:2!important;filter:drop-shadow(0 0 4px rgba(99,102,241,0.2))!important;transition:stroke 0.2s,filter 0.2s!important}.vue-flow__edge.selected .vue-flow__edge-path{stroke:#4f46e5!important;stroke-width:2.5!important;filter:drop-shadow(0 0 8px rgba(99,102,241,0.4))!important}.vue-flow__edge:hover .vue-flow__edge-path{stroke:#4f46e5!important;filter:drop-shadow(0 0 6px rgba(99,102,241,0.35))!important}.vue-flow__connection-path{stroke:#6366f1!important;stroke-width:2!important;filter:drop-shadow(0 0 4px rgba(99,102,241,0.25))!important}:root{--canvas-node--border-radius:12px;--canvas-node--border-width:1px;--canvas-node--border-color:rgba(255,255,255,0.3)}.el-side-bar,[class*="side-bar"],[class*="sidebar"]{border-radius:0 16px 16px 0!important}button[class*="primary"],button[class*="action"]{border-radius:10px!important;transition:all 0.2s!important}"#.into(),
        },
        ThemeInfo {
            id: "neon-glow".into(),
            name: "霓虹流光".into(),
            description: "节点发光效果 + 渐变边框，赛博朋克风格".into(),
            preview_colors: vec![
                "#06b6d4".into(), "#8b5cf6".into(), "#ec4899".into(),
            ],
            css: r#".vue-flow__node-default,.vue-flow__node-input,.vue-flow__node-output{border-radius:14px!important;border:1.5px solid rgba(139,92,246,0.3)!important;box-shadow:0 0 12px rgba(139,92,246,0.12),0 4px 20px rgba(0,0,0,0.06)!important;transition:all 0.25s ease!important;background:linear-gradient(135deg,rgba(255,255,255,0.95),rgba(248,250,252,0.9))!important}.vue-flow__node-default:hover,.vue-flow__node-input:hover,.vue-flow__node-output:hover{border-color:rgba(139,92,246,0.6)!important;box-shadow:0 0 24px rgba(139,92,246,0.2),0 0 48px rgba(6,182,212,0.1),0 8px 32px rgba(0,0,0,0.1)!important}.vue-flow__node-default.selected,.vue-flow__node-input.selected,.vue-flow__node-output.selected{border-color:#8b5cf6!important;box-shadow:0 0 0 2px rgba(139,92,246,0.3),0 0 32px rgba(139,92,246,0.25)!important}.vue-flow__edge-path{stroke:#8b5cf6!important;stroke-width:2!important;filter:drop-shadow(0 0 6px rgba(139,92,246,0.35)) drop-shadow(0 0 12px rgba(6,182,212,0.15))!important;transition:stroke 0.25s,filter 0.25s!important}.vue-flow__edge.selected .vue-flow__edge-path{stroke:#7c3aed!important;stroke-width:2.5!important;filter:drop-shadow(0 0 10px rgba(139,92,246,0.5)) drop-shadow(0 0 20px rgba(6,182,212,0.25))!important}.vue-flow__edge:hover .vue-flow__edge-path{stroke:#7c3aed!important;filter:drop-shadow(0 0 8px rgba(139,92,246,0.45)) drop-shadow(0 0 16px rgba(6,182,212,0.2))!important}.vue-flow__connection-path{stroke:#8b5cf6!important;stroke-width:2!important;filter:drop-shadow(0 0 6px rgba(139,92,246,0.4))!important}:root{--canvas-node--border-width:1.5px;--canvas-node--border-color:rgba(139,92,246,0.3)}"#.into(),
        },
        ThemeInfo {
            id: "warm-soft".into(),
            name: "温暖柔和".into(),
            description: "暖色调圆角设计，柔和阴影，舒适视觉体验".into(),
            preview_colors: vec![
                "#f59e0b".into(), "#ef4444".into(), "#f97316".into(),
            ],
            css: r#".vue-flow__node-default,.vue-flow__node-input,.vue-flow__node-output{border-radius:16px!important;box-shadow:0 2px 12px rgba(245,158,11,0.08)!important;border:1px solid rgba(245,158,11,0.1)!important;background:rgba(255,251,235,0.6)!important;transition:all 0.2s!important}.vue-flow__node-default:hover,.vue-flow__node-input:hover,.vue-flow__node-output:hover{box-shadow:0 6px 24px rgba(245,158,11,0.15)!important;border-color:rgba(245,158,11,0.25)!important}.vue-flow__node-default.selected,.vue-flow__node-input.selected,.vue-flow__node-output.selected{border-color:#f59e0b!important;box-shadow:0 0 0 2px rgba(245,158,11,0.2),0 6px 24px rgba(245,158,11,0.15)!important}.vue-flow__edge-path{stroke:#f59e0b!important;stroke-width:2!important;filter:drop-shadow(0 0 3px rgba(245,158,11,0.2))!important;transition:stroke 0.2s,filter 0.2s!important}.vue-flow__edge.selected .vue-flow__edge-path{stroke:#d97706!important;stroke-width:2.5!important;filter:drop-shadow(0 0 6px rgba(245,158,11,0.35))!important}.vue-flow__edge:hover .vue-flow__edge-path{stroke:#d97706!important;filter:drop-shadow(0 0 5px rgba(245,158,11,0.3))!important}.vue-flow__connection-path{stroke:#f59e0b!important;stroke-width:2!important;filter:drop-shadow(0 0 3px rgba(245,158,11,0.25))!important}:root{--canvas-node--border-color:rgba(245,158,11,0.1)}button{border-radius:10px!important}"#.into(),
        },
        ThemeInfo {
            id: "compact-minimal".into(),
            name: "紧凑极简".into(),
            description: "缩小节点尺寸，增大画布空间，适合复杂工作流".into(),
            preview_colors: vec![
                "#374151".into(), "#6b7280".into(), "#9ca3af".into(),
            ],
            css: r#".vue-flow__node-default,.vue-flow__node-input,.vue-flow__node-output{border-radius:8px!important;font-size:12px!important;box-shadow:0 1px 4px rgba(0,0,0,0.06)!important;border:1px solid #e5e7eb!important}.vue-flow__node-default:hover,.vue-flow__node-input:hover,.vue-flow__node-output:hover{box-shadow:0 2px 8px rgba(0,0,0,0.1)!important}.vue-flow__edge-path{stroke:#9ca3af!important;stroke-width:1.5!important}.vue-flow__edge.selected .vue-flow__edge-path{stroke:#6b7280!important;stroke-width:2!important}.vue-flow__connection-path{stroke:#9ca3af!important;stroke-width:1.5!important}:root{--canvas-node--border-radius:8px}"#.into(),
        },
        ThemeInfo {
            id: "heartbeat-pulse".into(),
            name: "心跳脉搏".into(),
            description: "连线呼吸脉冲动画，红色心跳节奏，活力满满".into(),
            preview_colors: vec![
                "#ef4444".into(), "#f43f5e".into(), "#fb7185".into(),
            ],
            css: r#".vue-flow__node-default,.vue-flow__node-input,.vue-flow__node-output{border-radius:14px!important;box-shadow:0 2px 12px rgba(239,68,68,0.1)!important;border:1.5px solid rgba(239,68,68,0.15)!important;transition:all 0.3s!important}.vue-flow__node-default:hover,.vue-flow__node-input:hover,.vue-flow__node-output:hover{box-shadow:0 0 20px rgba(239,68,68,0.2)!important;border-color:rgba(239,68,68,0.35)!important}.vue-flow__node-default.selected,.vue-flow__node-input.selected,.vue-flow__node-output.selected{border-color:#ef4444!important;box-shadow:0 0 0 2px rgba(239,68,68,0.3),0 0 20px rgba(239,68,68,0.2)!important}.vue-flow__edge-path{stroke:#ef4444!important;stroke-width:2.5!important;stroke-dasharray:0!important;filter:drop-shadow(0 0 3px rgba(239,68,68,0.3))!important;animation:n8n-heartbeat 1.2s ease-in-out infinite!important}.vue-flow__edge.selected .vue-flow__edge-path{stroke:#dc2626!important;stroke-width:3!important;filter:drop-shadow(0 0 8px rgba(239,68,68,0.5))!important}.vue-flow__edge:hover .vue-flow__edge-path{stroke:#dc2626!important;filter:drop-shadow(0 0 6px rgba(239,68,68,0.45))!important}.vue-flow__connection-path{stroke:#ef4444!important;stroke-width:2.5!important;filter:drop-shadow(0 0 3px rgba(239,68,68,0.35))!important}@keyframes n8n-heartbeat{0%,100%{stroke-width:2.5;filter:drop-shadow(0 0 2px rgba(239,68,68,0.2))}15%{stroke-width:3.5;filter:drop-shadow(0 0 10px rgba(239,68,68,0.5))}30%{stroke-width:2;filter:drop-shadow(0 0 3px rgba(239,68,68,0.3))}45%{stroke-width:3;filter:drop-shadow(0 0 8px rgba(239,68,68,0.45))}60%{stroke-width:2.5;filter:drop-shadow(0 0 2px rgba(239,68,68,0.2))}}"#.into(),
        },
        ThemeInfo {
            id: "water-flow".into(),
            name: "流水涌动".into(),
            description: "连线流动动画，蓝色水波纹效果，灵动自然".into(),
            preview_colors: vec![
                "#0ea5e9".into(), "#06b6d4".into(), "#22d3ee".into(),
            ],
            css: r#".vue-flow__node-default,.vue-flow__node-input,.vue-flow__node-output{border-radius:14px!important;box-shadow:0 4px 16px rgba(14,165,233,0.1)!important;border:1.5px solid rgba(14,165,233,0.15)!important;transition:all 0.25s!important}.vue-flow__node-default:hover,.vue-flow__node-input:hover,.vue-flow__node-output:hover{box-shadow:0 8px 28px rgba(14,165,233,0.2)!important;border-color:rgba(14,165,233,0.35)!important}.vue-flow__node-default.selected,.vue-flow__node-input.selected,.vue-flow__node-output.selected{border-color:#0ea5e9!important;box-shadow:0 0 0 2px rgba(14,165,233,0.3),0 8px 28px rgba(14,165,233,0.2)!important}.vue-flow__edge-path{stroke:#0ea5e9!important;stroke-width:2.5!important;stroke-dasharray:10 5!important;stroke-linecap:round!important;filter:drop-shadow(0 0 3px rgba(14,165,233,0.3))!important;animation:n8n-waterflow 0.8s linear infinite!important}.vue-flow__edge.selected .vue-flow__edge-path{stroke:#0284c7!important;stroke-width:3!important;stroke-dasharray:12 4!important;filter:drop-shadow(0 0 8px rgba(14,165,233,0.5))!important}.vue-flow__edge:hover .vue-flow__edge-path{stroke:#0284c7!important;filter:drop-shadow(0 0 6px rgba(14,165,233,0.4))!important}.vue-flow__connection-path{stroke:#0ea5e9!important;stroke-width:2.5!important;stroke-dasharray:10 5!important;filter:drop-shadow(0 0 3px rgba(14,165,233,0.3))!important;animation:n8n-waterflow 0.8s linear infinite!important}@keyframes n8n-waterflow{to{stroke-dashoffset:-15}}"#.into(),
        },
        ThemeInfo {
            id: "electric-spark".into(),
            name: "电流闪烁".into(),
            description: "闪电般的电弧连线效果，黄色能量脉冲".into(),
            preview_colors: vec![
                "#eab308".into(), "#facc15".into(), "#fde047".into(),
            ],
            css: r#".vue-flow__node-default,.vue-flow__node-input,.vue-flow__node-output{border-radius:10px!important;box-shadow:0 0 8px rgba(234,179,8,0.1),0 2px 10px rgba(0,0,0,0.06)!important;border:1.5px solid rgba(234,179,8,0.2)!important;transition:all 0.15s!important}.vue-flow__node-default:hover,.vue-flow__node-input:hover,.vue-flow__node-output:hover{box-shadow:0 0 16px rgba(234,179,8,0.25),0 4px 20px rgba(0,0,0,0.08)!important;border-color:rgba(234,179,8,0.45)!important}.vue-flow__node-default.selected,.vue-flow__node-input.selected,.vue-flow__node-output.selected{border-color:#eab308!important;box-shadow:0 0 0 2px rgba(234,179,8,0.3),0 0 20px rgba(234,179,8,0.2)!important}.vue-flow__edge-path{stroke:#eab308!important;stroke-width:2!important;stroke-dasharray:4 3 1 3!important;stroke-linecap:round!important;filter:drop-shadow(0 0 2px rgba(234,179,8,0.4)) drop-shadow(0 0 6px rgba(250,204,21,0.2))!important;animation:n8n-electric 0.3s linear infinite!important}.vue-flow__edge.selected .vue-flow__edge-path{stroke:#ca8a04!important;stroke-width:2.5!important;filter:drop-shadow(0 0 6px rgba(234,179,8,0.6)) drop-shadow(0 0 12px rgba(250,204,21,0.3))!important}.vue-flow__edge:hover .vue-flow__edge-path{stroke:#ca8a04!important;filter:drop-shadow(0 0 5px rgba(234,179,8,0.5)) drop-shadow(0 0 10px rgba(250,204,21,0.25))!important}.vue-flow__connection-path{stroke:#eab308!important;stroke-width:2!important;stroke-dasharray:4 3 1 3!important;filter:drop-shadow(0 0 2px rgba(234,179,8,0.4))!important;animation:n8n-electric 0.3s linear infinite!important}@keyframes n8n-electric{to{stroke-dashoffset:-11}}"#.into(),
        },
        ThemeInfo {
            id: "aurora-dream".into(),
            name: "极光幻彩".into(),
            description: "连线色彩渐变动画，紫绿极光流转，梦幻绚丽".into(),
            preview_colors: vec![
                "#a855f7".into(), "#10b981".into(), "#06b6d4".into(),
            ],
            css: r#".vue-flow__node-default,.vue-flow__node-input,.vue-flow__node-output{border-radius:14px!important;box-shadow:0 4px 16px rgba(168,85,247,0.1),0 0 8px rgba(16,185,129,0.05)!important;border:1.5px solid rgba(168,85,247,0.15)!important;transition:all 0.25s!important}.vue-flow__node-default:hover,.vue-flow__node-input:hover,.vue-flow__node-output:hover{box-shadow:0 8px 28px rgba(168,85,247,0.2),0 0 16px rgba(16,185,129,0.1)!important;border-color:rgba(168,85,247,0.35)!important}.vue-flow__node-default.selected,.vue-flow__node-input.selected,.vue-flow__node-output.selected{border-color:#a855f7!important;box-shadow:0 0 0 2px rgba(168,85,247,0.3),0 8px 28px rgba(168,85,247,0.2)!important}.vue-flow__edge-path{stroke:#a855f7!important;stroke-width:2.5!important;stroke-dasharray:8 4!important;stroke-linecap:round!important;animation:n8n-aurora-hue 3s linear infinite,n8n-aurora-flow 1s linear infinite!important}.vue-flow__edge.selected .vue-flow__edge-path{stroke:#7c3aed!important;stroke-width:3!important;stroke-dasharray:10 3!important;filter:drop-shadow(0 0 8px rgba(168,85,247,0.5)) hue-rotate(0deg)!important}.vue-flow__edge:hover .vue-flow__edge-path{stroke:#8b5cf6!important;stroke-width:3!important;filter:drop-shadow(0 0 6px rgba(139,92,246,0.4)) hue-rotate(0deg)!important}.vue-flow__connection-path{stroke:#a855f7!important;stroke-width:2.5!important;stroke-dasharray:8 4!important;animation:n8n-aurora-hue 3s linear infinite,n8n-aurora-flow 1s linear infinite!important}@keyframes n8n-aurora-hue{0%{filter:hue-rotate(0deg) drop-shadow(0 0 4px rgba(168,85,247,0.3))}30%{filter:hue-rotate(90deg) drop-shadow(0 0 6px rgba(59,130,246,0.4))}55%{filter:hue-rotate(180deg) drop-shadow(0 0 4px rgba(6,182,212,0.3))}80%{filter:hue-rotate(270deg) drop-shadow(0 0 6px rgba(16,185,129,0.4))}100%{filter:hue-rotate(360deg) drop-shadow(0 0 4px rgba(168,85,247,0.3))}}@keyframes n8n-aurora-flow{to{stroke-dashoffset:-12}}"#.into(),
        },
        ThemeInfo {
            id: "data-stream".into(),
            name: "数据传输".into(),
            description: "绿色数据流传输动画，科技感十足的流动点阵".into(),
            preview_colors: vec![
                "#22c55e".into(), "#4ade80".into(), "#16a34a".into(),
            ],
            css: r#".vue-flow__node-default,.vue-flow__node-input,.vue-flow__node-output{border-radius:12px!important;box-shadow:0 2px 10px rgba(34,197,94,0.1)!important;border:1.5px solid rgba(34,197,94,0.15)!important;transition:all 0.2s!important}.vue-flow__node-default:hover,.vue-flow__node-input:hover,.vue-flow__node-output:hover{box-shadow:0 6px 24px rgba(34,197,94,0.2)!important;border-color:rgba(34,197,94,0.35)!important}.vue-flow__node-default.selected,.vue-flow__node-input.selected,.vue-flow__node-output.selected{border-color:#22c55e!important;box-shadow:0 0 0 2px rgba(34,197,94,0.3),0 6px 24px rgba(34,197,94,0.2)!important}.vue-flow__edge-path{stroke:#22c55e!important;stroke-width:2!important;stroke-dasharray:2 8!important;stroke-linecap:round!important;filter:drop-shadow(0 0 3px rgba(34,197,94,0.3))!important;animation:n8n-datastream 0.6s linear infinite!important}.vue-flow__edge.selected .vue-flow__edge-path{stroke:#16a34a!important;stroke-width:2.5!important;stroke-dasharray:2 6!important;filter:drop-shadow(0 0 6px rgba(34,197,94,0.5))!important}.vue-flow__edge:hover .vue-flow__edge-path{stroke:#16a34a!important;filter:drop-shadow(0 0 5px rgba(34,197,94,0.4))!important}.vue-flow__connection-path{stroke:#22c55e!important;stroke-width:2!important;stroke-dasharray:2 8!important;filter:drop-shadow(0 0 3px rgba(34,197,94,0.3))!important;animation:n8n-datastream 0.6s linear infinite!important}@keyframes n8n-datastream{to{stroke-dashoffset:-10}}"#.into(),
        },
        ThemeInfo {
            id: "flame-trail".into(),
            name: "烈焰轨迹".into(),
            description: "橙红火焰流动效果，连线燃烧般的视觉冲击".into(),
            preview_colors: vec![
                "#f97316".into(), "#ef4444".into(), "#fbbf24".into(),
            ],
            css: r#".vue-flow__node-default,.vue-flow__node-input,.vue-flow__node-output{border-radius:14px!important;box-shadow:0 0 10px rgba(249,115,22,0.12),0 3px 12px rgba(0,0,0,0.06)!important;border:1.5px solid rgba(249,115,22,0.2)!important;transition:all 0.2s!important}.vue-flow__node-default:hover,.vue-flow__node-input:hover,.vue-flow__node-output:hover{box-shadow:0 0 20px rgba(249,115,22,0.25),0 6px 24px rgba(0,0,0,0.08)!important;border-color:rgba(249,115,22,0.4)!important}.vue-flow__node-default.selected,.vue-flow__node-input.selected,.vue-flow__node-output.selected{border-color:#f97316!important;box-shadow:0 0 0 2px rgba(249,115,22,0.3),0 0 24px rgba(249,115,22,0.2)!important}.vue-flow__edge-path{stroke:#f97316!important;stroke-width:2.5!important;stroke-dasharray:14 6!important;stroke-linecap:round!important;animation:n8n-flame-hue 0.7s linear infinite,n8n-flame-flow 0.7s linear infinite!important}.vue-flow__edge.selected .vue-flow__edge-path{stroke:#ea580c!important;stroke-width:3!important;stroke-dasharray:16 4!important;filter:drop-shadow(0 0 8px rgba(249,115,22,0.5)) drop-shadow(0 0 12px rgba(239,68,68,0.3)) hue-rotate(0deg)!important}.vue-flow__edge:hover .vue-flow__edge-path{stroke:#ea580c!important;filter:drop-shadow(0 0 6px rgba(249,115,22,0.45)) drop-shadow(0 0 10px rgba(239,68,68,0.2)) hue-rotate(0deg)!important}.vue-flow__connection-path{stroke:#f97316!important;stroke-width:2.5!important;stroke-dasharray:14 6!important;animation:n8n-flame-hue 0.7s linear infinite,n8n-flame-flow 0.7s linear infinite!important}@keyframes n8n-flame-hue{0%{filter:hue-rotate(0deg) drop-shadow(0 0 3px rgba(249,115,22,0.3)) drop-shadow(0 0 6px rgba(239,68,68,0.15))}33%{filter:hue-rotate(-20deg) drop-shadow(0 0 4px rgba(239,68,68,0.4)) drop-shadow(0 0 8px rgba(249,115,22,0.2))}66%{filter:hue-rotate(25deg) drop-shadow(0 0 3px rgba(251,191,36,0.3)) drop-shadow(0 0 6px rgba(249,115,22,0.15))}100%{filter:hue-rotate(0deg) drop-shadow(0 0 3px rgba(249,115,22,0.3)) drop-shadow(0 0 6px rgba(239,68,68,0.15))}}@keyframes n8n-flame-flow{to{stroke-dashoffset:-20}}"#.into(),
        },
        ThemeInfo {
            id: "starry-night".into(),
            name: "星空漫步".into(),
            description: "深色调主题，连线星光闪烁，静谧深邃的夜空感".into(),
            preview_colors: vec![
                "#1e1b4b".into(), "#6366f1".into(), "#c4b5fd".into(),
            ],
            css: r#".vue-flow__node-default,.vue-flow__node-input,.vue-flow__node-output{border-radius:14px!important;box-shadow:0 4px 20px rgba(30,27,75,0.15),0 0 8px rgba(99,102,241,0.08)!important;border:1.5px solid rgba(99,102,241,0.2)!important;background:rgba(238,238,255,0.7)!important;transition:all 0.25s!important}.vue-flow__node-default:hover,.vue-flow__node-input:hover,.vue-flow__node-output:hover{box-shadow:0 8px 32px rgba(30,27,75,0.2),0 0 16px rgba(99,102,241,0.15)!important;border-color:rgba(99,102,241,0.4)!important}.vue-flow__node-default.selected,.vue-flow__node-input.selected,.vue-flow__node-output.selected{border-color:#6366f1!important;box-shadow:0 0 0 2px rgba(99,102,241,0.3),0 0 20px rgba(99,102,241,0.15)!important}.vue-flow__edge-path{stroke:#6366f1!important;stroke-width:1.5!important;stroke-dasharray:1 6!important;stroke-linecap:round!important;animation:n8n-starry 2s linear infinite!important}.vue-flow__edge.selected .vue-flow__edge-path{stroke:#818cf8!important;stroke-width:2!important;stroke-dasharray:1 4!important;filter:drop-shadow(0 0 4px rgba(129,140,248,0.4))!important}.vue-flow__edge:hover .vue-flow__edge-path{stroke:#818cf8!important;filter:drop-shadow(0 0 3px rgba(129,140,248,0.35))!important}.vue-flow__connection-path{stroke:#6366f1!important;stroke-width:1.5!important;stroke-dasharray:1 6!important;animation:n8n-starry 2s linear infinite!important}@keyframes n8n-starry{0%{stroke-opacity:1;stroke-dashoffset:0}50%{stroke-opacity:0.4}100%{stroke-opacity:1;stroke-dashoffset:-7}}"#.into(),
        },
        ThemeInfo {
            id: "rainbow-candy".into(),
            name: "彩虹糖果".into(),
            description: "马卡龙色系渐变流动，甜美柔和的彩虹连线".into(),
            preview_colors: vec!["#f472b6".into(), "#a78bfa".into(), "#67e8f9".into()],
            css: r#".vue-flow__node-default,.vue-flow__node-input,.vue-flow__node-output{border-radius:16px!important;box-shadow:0 4px 16px rgba(244,114,182,0.1)!important;border:1.5px solid rgba(244,114,182,0.15)!important;transition:all 0.25s!important}.vue-flow__node-default:hover,.vue-flow__node-input:hover,.vue-flow__node-output:hover{box-shadow:0 8px 28px rgba(244,114,182,0.2)!important;border-color:rgba(244,114,182,0.3)!important}.vue-flow__node-default.selected,.vue-flow__node-input.selected,.vue-flow__node-output.selected{border-color:#f472b6!important;box-shadow:0 0 0 2px rgba(244,114,182,0.3),0 8px 28px rgba(244,114,182,0.15)!important}.vue-flow__edge-path{stroke:#f472b6!important;stroke-width:2.5!important;stroke-dasharray:12 4!important;stroke-linecap:round!important;animation:n8n-rainbow-hue 3s linear infinite,n8n-rainbow-flow 0.8s linear infinite!important}.vue-flow__edge.selected .vue-flow__edge-path{stroke:#a78bfa!important;stroke-width:3!important;stroke-dasharray:14 3!important;filter:drop-shadow(0 0 8px rgba(167,139,250,0.5)) hue-rotate(0deg)!important}.vue-flow__edge:hover .vue-flow__edge-path{stroke:#c084fc!important;stroke-width:3!important;filter:drop-shadow(0 0 6px rgba(192,132,252,0.4)) hue-rotate(0deg)!important}.vue-flow__connection-path{stroke:#f472b6!important;stroke-width:2.5!important;stroke-dasharray:12 4!important;animation:n8n-rainbow-hue 3s linear infinite,n8n-rainbow-flow 0.8s linear infinite!important}@keyframes n8n-rainbow-hue{0%{filter:hue-rotate(0deg) drop-shadow(0 0 4px rgba(244,114,182,0.3))}25%{filter:hue-rotate(60deg) drop-shadow(0 0 4px rgba(192,132,252,0.3))}50%{filter:hue-rotate(140deg) drop-shadow(0 0 4px rgba(103,232,249,0.3))}75%{filter:hue-rotate(220deg) drop-shadow(0 0 4px rgba(110,231,183,0.3))}100%{filter:hue-rotate(360deg) drop-shadow(0 0 4px rgba(244,114,182,0.3))}}@keyframes n8n-rainbow-flow{to{stroke-dashoffset:-16}}"#.into(),
        },
        ThemeInfo {
            id: "deep-sea".into(),
            name: "深海水母".into(),
            description: "深蓝色调，连线如深海生物般缓慢发光脉动".into(),
            preview_colors: vec!["#0c4a6e".into(), "#0284c7".into(), "#38bdf8".into()],
            css: r#".vue-flow__node-default,.vue-flow__node-input,.vue-flow__node-output{border-radius:14px!important;box-shadow:0 4px 20px rgba(12,74,110,0.12)!important;border:1.5px solid rgba(56,189,248,0.15)!important;background:rgba(240,249,255,0.6)!important;transition:all 0.3s!important}.vue-flow__node-default:hover,.vue-flow__node-input:hover,.vue-flow__node-output:hover{box-shadow:0 8px 32px rgba(2,132,199,0.2),0 0 12px rgba(56,189,248,0.1)!important;border-color:rgba(56,189,248,0.35)!important}.vue-flow__node-default.selected,.vue-flow__node-input.selected,.vue-flow__node-output.selected{border-color:#0ea5e9!important;box-shadow:0 0 0 2px rgba(14,165,233,0.3),0 0 24px rgba(56,189,248,0.15)!important}.vue-flow__edge-path{stroke:#38bdf8!important;stroke-width:2!important;stroke-dasharray:6 8 2 8!important;stroke-linecap:round!important;animation:n8n-jellyfish 3s ease-in-out infinite!important}.vue-flow__edge.selected .vue-flow__edge-path{stroke:#0ea5e9!important;stroke-width:2.5!important;filter:drop-shadow(0 0 8px rgba(56,189,248,0.5))!important}.vue-flow__edge:hover .vue-flow__edge-path{stroke:#0ea5e9!important;filter:drop-shadow(0 0 6px rgba(56,189,248,0.4))!important}.vue-flow__connection-path{stroke:#38bdf8!important;stroke-width:2!important;stroke-dasharray:6 8 2 8!important;animation:n8n-jellyfish 3s ease-in-out infinite!important}@keyframes n8n-jellyfish{0%,100%{stroke-opacity:0.5;stroke-width:2;filter:drop-shadow(0 0 2px rgba(56,189,248,0.15));stroke-dashoffset:0}50%{stroke-opacity:1;stroke-width:3;filter:drop-shadow(0 0 10px rgba(56,189,248,0.4)) drop-shadow(0 0 20px rgba(14,165,233,0.15));stroke-dashoffset:-24}}"#.into(),
        },
        ThemeInfo {
            id: "cherry-blossom".into(),
            name: "樱花飘落".into(),
            description: "粉嫩樱花色调，连线如花瓣般轻柔飘动".into(),
            preview_colors: vec!["#fda4af".into(), "#fb7185".into(), "#fecdd3".into()],
            css: r#".vue-flow__node-default,.vue-flow__node-input,.vue-flow__node-output{border-radius:20px!important;box-shadow:0 2px 12px rgba(253,164,175,0.12)!important;border:1.5px solid rgba(251,113,133,0.15)!important;background:rgba(255,241,242,0.5)!important;transition:all 0.3s!important}.vue-flow__node-default:hover,.vue-flow__node-input:hover,.vue-flow__node-output:hover{box-shadow:0 6px 24px rgba(251,113,133,0.2)!important;border-color:rgba(251,113,133,0.3)!important}.vue-flow__node-default.selected,.vue-flow__node-input.selected,.vue-flow__node-output.selected{border-color:#fb7185!important;box-shadow:0 0 0 2px rgba(251,113,133,0.25),0 6px 24px rgba(251,113,133,0.15)!important}.vue-flow__edge-path{stroke:#fda4af!important;stroke-width:2!important;stroke-dasharray:8 6 3 6!important;stroke-linecap:round!important;animation:n8n-sakura 2.5s ease-in-out infinite!important}.vue-flow__edge.selected .vue-flow__edge-path{stroke:#fb7185!important;stroke-width:2.5!important;filter:drop-shadow(0 0 6px rgba(251,113,133,0.35))!important}.vue-flow__edge:hover .vue-flow__edge-path{stroke:#fb7185!important;filter:drop-shadow(0 0 5px rgba(251,113,133,0.3))!important}.vue-flow__connection-path{stroke:#fda4af!important;stroke-width:2!important;stroke-dasharray:8 6 3 6!important;animation:n8n-sakura 2.5s ease-in-out infinite!important}@keyframes n8n-sakura{0%{stroke-dashoffset:0;stroke-opacity:0.7;filter:drop-shadow(0 0 2px rgba(253,164,175,0.2))}50%{stroke-dashoffset:-23;stroke-opacity:1;filter:drop-shadow(0 0 6px rgba(251,113,133,0.3))}100%{stroke-dashoffset:-46;stroke-opacity:0.7;filter:drop-shadow(0 0 2px rgba(253,164,175,0.2))}}"#.into(),
        },
        ThemeInfo {
            id: "matrix-code".into(),
            name: "黑客帝国".into(),
            description: "经典绿色数字雨风格，连线如代码流淌".into(),
            preview_colors: vec!["#166534".into(), "#22c55e".into(), "#4ade80".into()],
            css: r#".vue-flow__node-default,.vue-flow__node-input,.vue-flow__node-output{border-radius:6px!important;box-shadow:0 0 8px rgba(34,197,94,0.15),inset 0 0 20px rgba(0,0,0,0.02)!important;border:1px solid rgba(34,197,94,0.25)!important;transition:all 0.15s!important}.vue-flow__node-default:hover,.vue-flow__node-input:hover,.vue-flow__node-output:hover{box-shadow:0 0 16px rgba(34,197,94,0.25),inset 0 0 20px rgba(0,0,0,0.02)!important;border-color:rgba(74,222,128,0.4)!important}.vue-flow__node-default.selected,.vue-flow__node-input.selected,.vue-flow__node-output.selected{border-color:#22c55e!important;box-shadow:0 0 0 1px rgba(34,197,94,0.4),0 0 20px rgba(34,197,94,0.2)!important}.vue-flow__edge-path{stroke:#22c55e!important;stroke-width:2!important;stroke-dasharray:1 3!important;stroke-linecap:round!important;filter:drop-shadow(0 0 2px rgba(34,197,94,0.4))!important;animation:n8n-matrix 0.15s linear infinite!important}.vue-flow__edge.selected .vue-flow__edge-path{stroke:#4ade80!important;stroke-width:2.5!important;filter:drop-shadow(0 0 6px rgba(34,197,94,0.5)) drop-shadow(0 0 12px rgba(74,222,128,0.2))!important}.vue-flow__edge:hover .vue-flow__edge-path{stroke:#4ade80!important;filter:drop-shadow(0 0 5px rgba(34,197,94,0.45))!important}.vue-flow__connection-path{stroke:#22c55e!important;stroke-width:2!important;stroke-dasharray:1 3!important;filter:drop-shadow(0 0 2px rgba(34,197,94,0.4))!important;animation:n8n-matrix 0.15s linear infinite!important}@keyframes n8n-matrix{to{stroke-dashoffset:-4}}"#.into(),
        },
        ThemeInfo {
            id: "ink-wash".into(),
            name: "水墨丹青".into(),
            description: "中国风水墨效果，连线如毛笔勾勒般淡雅飘逸".into(),
            preview_colors: vec!["#44403c".into(), "#78716c".into(), "#a8a29e".into()],
            css: r#".vue-flow__node-default,.vue-flow__node-input,.vue-flow__node-output{border-radius:4px!important;box-shadow:0 1px 4px rgba(68,64,60,0.1)!important;border:1px solid rgba(120,113,108,0.2)!important;transition:all 0.4s!important}.vue-flow__node-default:hover,.vue-flow__node-input:hover,.vue-flow__node-output:hover{box-shadow:0 3px 12px rgba(68,64,60,0.15)!important;border-color:rgba(120,113,108,0.35)!important}.vue-flow__node-default.selected,.vue-flow__node-input.selected,.vue-flow__node-output.selected{border-color:#78716c!important;box-shadow:0 0 0 1px rgba(120,113,108,0.3),0 3px 12px rgba(68,64,60,0.12)!important}.vue-flow__edge-path{stroke:#78716c!important;stroke-width:1.5!important;stroke-dasharray:16 8 4 8!important;stroke-linecap:round!important;animation:n8n-inkwash 4s ease-in-out infinite!important}.vue-flow__edge.selected .vue-flow__edge-path{stroke:#57534e!important;stroke-width:2!important;filter:drop-shadow(0 0 3px rgba(87,83,78,0.2))!important}.vue-flow__edge:hover .vue-flow__edge-path{stroke:#57534e!important;filter:drop-shadow(0 0 2px rgba(87,83,78,0.15))!important}.vue-flow__connection-path{stroke:#78716c!important;stroke-width:1.5!important;stroke-dasharray:16 8 4 8!important;animation:n8n-inkwash 4s ease-in-out infinite!important}@keyframes n8n-inkwash{0%{stroke-dashoffset:0;stroke-opacity:0.6}50%{stroke-dashoffset:-36;stroke-opacity:1}100%{stroke-dashoffset:-72;stroke-opacity:0.6}}"#.into(),
        },
        ThemeInfo {
            id: "laser-beam".into(),
            name: "激光射线".into(),
            description: "锐利明亮的激光线条，青色高能射线效果".into(),
            preview_colors: vec!["#06b6d4".into(), "#22d3ee".into(), "#67e8f9".into()],
            css: r#".vue-flow__node-default,.vue-flow__node-input,.vue-flow__node-output{border-radius:8px!important;box-shadow:0 0 6px rgba(6,182,212,0.15),0 2px 8px rgba(0,0,0,0.05)!important;border:1px solid rgba(6,182,212,0.25)!important;transition:all 0.15s!important}.vue-flow__node-default:hover,.vue-flow__node-input:hover,.vue-flow__node-output:hover{box-shadow:0 0 16px rgba(6,182,212,0.3),0 4px 16px rgba(0,0,0,0.08)!important;border-color:rgba(6,182,212,0.5)!important}.vue-flow__node-default.selected,.vue-flow__node-input.selected,.vue-flow__node-output.selected{border-color:#22d3ee!important;box-shadow:0 0 0 1.5px rgba(34,211,238,0.4),0 0 20px rgba(6,182,212,0.2)!important}.vue-flow__edge-path{stroke:#22d3ee!important;stroke-width:1.5!important;filter:drop-shadow(0 0 3px rgba(34,211,238,0.5)) drop-shadow(0 0 8px rgba(6,182,212,0.3))!important;animation:n8n-laser 1.5s ease-in-out infinite!important}.vue-flow__edge.selected .vue-flow__edge-path{stroke:#67e8f9!important;stroke-width:2!important;filter:drop-shadow(0 0 6px rgba(103,232,249,0.6)) drop-shadow(0 0 16px rgba(6,182,212,0.4))!important}.vue-flow__edge:hover .vue-flow__edge-path{stroke:#67e8f9!important;filter:drop-shadow(0 0 5px rgba(103,232,249,0.5)) drop-shadow(0 0 12px rgba(6,182,212,0.35))!important}.vue-flow__connection-path{stroke:#22d3ee!important;stroke-width:1.5!important;filter:drop-shadow(0 0 3px rgba(34,211,238,0.5))!important;animation:n8n-laser 1.5s ease-in-out infinite!important}@keyframes n8n-laser{0%,100%{stroke-opacity:0.85;stroke-width:1.5;filter:drop-shadow(0 0 3px rgba(34,211,238,0.4)) drop-shadow(0 0 6px rgba(6,182,212,0.2))}50%{stroke-opacity:1;stroke-width:2.5;filter:drop-shadow(0 0 6px rgba(103,232,249,0.6)) drop-shadow(0 0 14px rgba(6,182,212,0.35))}}"#.into(),
        },
        ThemeInfo {
            id: "frost-crystal".into(),
            name: "冰霜结晶".into(),
            description: "冰蓝色结晶光泽，连线如冰棱般闪烁折射".into(),
            preview_colors: vec!["#bae6fd".into(), "#7dd3fc".into(), "#e0f2fe".into()],
            css: r#".vue-flow__node-default,.vue-flow__node-input,.vue-flow__node-output{border-radius:12px!important;box-shadow:0 2px 12px rgba(186,230,253,0.15),0 0 6px rgba(125,211,252,0.08)!important;border:1.5px solid rgba(125,211,252,0.2)!important;background:rgba(240,249,255,0.5)!important;transition:all 0.25s!important}.vue-flow__node-default:hover,.vue-flow__node-input:hover,.vue-flow__node-output:hover{box-shadow:0 6px 24px rgba(125,211,252,0.25),0 0 10px rgba(186,230,253,0.1)!important;border-color:rgba(125,211,252,0.4)!important}.vue-flow__node-default.selected,.vue-flow__node-input.selected,.vue-flow__node-output.selected{border-color:#7dd3fc!important;box-shadow:0 0 0 2px rgba(125,211,252,0.3),0 0 20px rgba(186,230,253,0.15)!important}.vue-flow__edge-path{stroke:#7dd3fc!important;stroke-width:2!important;stroke-dasharray:5 3 1 3 5 3!important;stroke-linecap:round!important;animation:n8n-frost 2s ease-in-out infinite!important}.vue-flow__edge.selected .vue-flow__edge-path{stroke:#38bdf8!important;stroke-width:2.5!important;filter:drop-shadow(0 0 8px rgba(125,211,252,0.4)) drop-shadow(0 0 16px rgba(186,230,253,0.15))!important}.vue-flow__edge:hover .vue-flow__edge-path{stroke:#38bdf8!important;filter:drop-shadow(0 0 6px rgba(125,211,252,0.35)) drop-shadow(0 0 12px rgba(186,230,253,0.1))!important}.vue-flow__connection-path{stroke:#7dd3fc!important;stroke-width:2!important;stroke-dasharray:5 3 1 3 5 3!important;animation:n8n-frost 2s ease-in-out infinite!important}@keyframes n8n-frost{0%,100%{stroke-opacity:0.6;filter:drop-shadow(0 0 2px rgba(125,211,252,0.2));stroke-dashoffset:0}25%{stroke-opacity:1;filter:drop-shadow(0 0 6px rgba(186,230,253,0.4)) drop-shadow(0 0 12px rgba(224,242,254,0.15))}50%{stroke-opacity:0.7;filter:drop-shadow(0 0 3px rgba(125,211,252,0.25));stroke-dashoffset:-20}75%{stroke-opacity:1;filter:drop-shadow(0 0 5px rgba(186,230,253,0.35)) drop-shadow(0 0 10px rgba(224,242,254,0.1))}}"#.into(),
        },
        ThemeInfo {
            id: "neon-traffic".into(),
            name: "霓虹车流".into(),
            description: "城市夜景风格，连线如高速公路上的车流流动".into(),
            preview_colors: vec!["#f97316".into(), "#06b6d4".into(), "#a855f7".into()],
            css: r#".vue-flow__node-default,.vue-flow__node-input,.vue-flow__node-output{border-radius:10px!important;box-shadow:0 0 8px rgba(249,115,22,0.1),0 0 4px rgba(6,182,212,0.05)!important;border:1px solid rgba(168,85,247,0.15)!important;transition:all 0.2s!important}.vue-flow__node-default:hover,.vue-flow__node-input:hover,.vue-flow__node-output:hover{box-shadow:0 0 16px rgba(249,115,22,0.2),0 0 8px rgba(6,182,212,0.1)!important;border-color:rgba(168,85,247,0.3)!important}.vue-flow__node-default.selected,.vue-flow__node-input.selected,.vue-flow__node-output.selected{border-color:#a855f7!important;box-shadow:0 0 0 1.5px rgba(168,85,247,0.3),0 0 20px rgba(168,85,247,0.15)!important}.vue-flow__edge-path{stroke:#f97316!important;stroke-width:2.5!important;stroke-dasharray:16 4!important;stroke-linecap:round!important;animation:n8n-traffic-hue 2.5s linear infinite,n8n-traffic-flow 0.8s linear infinite!important}.vue-flow__edge.selected .vue-flow__edge-path{stroke:#f97316!important;stroke-width:3!important;stroke-dasharray:12 3!important;filter:drop-shadow(0 0 8px rgba(249,115,22,0.5)) hue-rotate(0deg)!important}.vue-flow__edge:hover .vue-flow__edge-path{stroke:#f97316!important;stroke-width:3!important;filter:drop-shadow(0 0 6px rgba(249,115,22,0.4)) hue-rotate(0deg)!important}.vue-flow__connection-path{stroke:#f97316!important;stroke-width:2.5!important;stroke-dasharray:16 4!important;stroke-linecap:round!important;animation:n8n-traffic-hue 2.5s linear infinite,n8n-traffic-flow 0.8s linear infinite!important}@keyframes n8n-traffic-hue{0%{filter:hue-rotate(0deg) drop-shadow(0 0 4px rgba(249,115,22,0.4))}33%{filter:hue-rotate(140deg) drop-shadow(0 0 4px rgba(6,182,212,0.4))}66%{filter:hue-rotate(230deg) drop-shadow(0 0 4px rgba(168,85,247,0.4))}100%{filter:hue-rotate(360deg) drop-shadow(0 0 4px rgba(249,115,22,0.4))}}@keyframes n8n-traffic-flow{to{stroke-dashoffset:-20}}"#.into(),
        },
        ThemeInfo {
            id: "golden-silk".into(),
            name: "金丝织锦".into(),
            description: "华贵金色丝线质感，连线如编织金线般优雅流动".into(),
            preview_colors: vec!["#d97706".into(), "#f59e0b".into(), "#fbbf24".into()],
            css: r#".vue-flow__node-default,.vue-flow__node-input,.vue-flow__node-output{border-radius:12px!important;box-shadow:0 2px 12px rgba(217,119,6,0.1),0 0 4px rgba(251,191,36,0.05)!important;border:1.5px solid rgba(245,158,11,0.2)!important;transition:all 0.3s!important}.vue-flow__node-default:hover,.vue-flow__node-input:hover,.vue-flow__node-output:hover{box-shadow:0 6px 24px rgba(217,119,6,0.18),0 0 10px rgba(251,191,36,0.1)!important;border-color:rgba(245,158,11,0.4)!important}.vue-flow__node-default.selected,.vue-flow__node-input.selected,.vue-flow__node-output.selected{border-color:#f59e0b!important;box-shadow:0 0 0 2px rgba(245,158,11,0.3),0 0 20px rgba(251,191,36,0.12)!important}.vue-flow__edge-path{stroke:#d97706!important;stroke-width:2!important;stroke-dasharray:20 4 4 4!important;stroke-linecap:round!important;animation:n8n-golden-hue 2s linear infinite,n8n-golden-flow 1.5s linear infinite!important}.vue-flow__edge.selected .vue-flow__edge-path{stroke:#b45309!important;stroke-width:2.5!important;filter:drop-shadow(0 0 6px rgba(251,191,36,0.4)) drop-shadow(0 0 12px rgba(217,119,6,0.2)) hue-rotate(0deg)!important}.vue-flow__edge:hover .vue-flow__edge-path{stroke:#b45309!important;filter:drop-shadow(0 0 5px rgba(251,191,36,0.35)) drop-shadow(0 0 10px rgba(217,119,6,0.15)) hue-rotate(0deg)!important}.vue-flow__connection-path{stroke:#d97706!important;stroke-width:2!important;stroke-dasharray:20 4 4 4!important;animation:n8n-golden-hue 2s linear infinite,n8n-golden-flow 1.5s linear infinite!important}@keyframes n8n-golden-hue{0%{filter:hue-rotate(0deg) brightness(1) drop-shadow(0 0 2px rgba(217,119,6,0.2))}50%{filter:hue-rotate(15deg) brightness(1.4) drop-shadow(0 0 5px rgba(251,191,36,0.35)) drop-shadow(0 0 10px rgba(245,158,11,0.15))}100%{filter:hue-rotate(0deg) brightness(1) drop-shadow(0 0 2px rgba(217,119,6,0.2))}}@keyframes n8n-golden-flow{to{stroke-dashoffset:-32}}"#.into(),
        },
    ]
}

#[tauri::command]
pub fn list_themes() -> Vec<ThemeInfo> {
    builtin_themes()
}

#[tauri::command]
pub fn get_theme_css(theme_id: String) -> Result<String, String> {
    builtin_themes()
        .into_iter()
        .find(|t| t.id == theme_id)
        .map(|t| t.css)
        .ok_or_else(|| format!("主题 '{}' 不存在", theme_id))
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ThemeApplyResult {
    pub success: bool,
    pub message: String,
}

/// Find the running n8n container name from the compose project
fn find_n8n_container(app: &AppHandle, install_path: &str) -> Result<String, String> {
    let work_dir = compose_dir(install_path);
    let project_name = work_dir
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("n8n-compose");

    let filter = format!("label=com.docker.compose.project={}", project_name);
    let rt = tokio::runtime::Runtime::new().map_err(|e| format!("Runtime error: {}", e))?;
    let output = rt.block_on(async {
        app.shell()
            .command("docker")
            .args(["ps", "--format", "{{.Names}}", "--filter", &filter])
            .output()
            .await
            .map_err(|e| format!("Failed to run docker ps: {}", e))
    })?;

    if !output.status.success() {
        return Err("无法获取容器列表，请确认 Docker 正在运行".into());
    }

    let names = String::from_utf8_lossy(&output.stdout);
    let container = names
        .lines()
        .filter(|l| !l.trim().is_empty())
        .find(|l| l.contains("main"))
        .or_else(|| names.lines().find(|l| !l.trim().is_empty()))
        .map(|l| l.trim().to_string())
        .ok_or_else(|| "未找到运行中的 n8n 容器，请先启动 n8n".to_string())?;

    Ok(container)
}

/// Execute a docker exec command in the n8n container
fn docker_exec(app: &AppHandle, container: &str, cmd: &[&str]) -> Result<String, String> {
    let mut args = vec!["exec", container];
    args.extend(cmd);

    let rt = tokio::runtime::Runtime::new().map_err(|e| format!("Runtime error: {}", e))?;
    let output = rt.block_on(async {
        app.shell()
            .command("docker")
            .args(&args)
            .output()
            .await
            .map_err(|e| format!("Docker exec 失败: {}", e))
    })?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Docker exec 错误: {}", stderr));
    }

    Ok(String::from_utf8_lossy(&output.stdout).to_string())
}

/// Check if n8n staticCacheDir exists and has index.html
fn check_cache_exists(app: &AppHandle, container: &str) -> Result<(), String> {
    let output = docker_exec(
        app,
        container,
        &["sh", "-c", &format!("test -f {} && echo EXISTS || echo NOT_FOUND", CACHE_HTML)],
    )?;
    if output.trim().ends_with("EXISTS") {
        Ok(())
    } else {
        Err("n8n 缓存目录不存在，请确认 n8n 已正常启动".into())
    }
}

/// Copy index.html from container to local temp file, returns local file path
fn docker_cp_from(app: &AppHandle, container: &str, remote_path: &str, local_path: &PathBuf) -> Result<(), String> {
    let rt = tokio::runtime::Runtime::new().map_err(|e| format!("Runtime error: {}", e))?;
    let output = rt.block_on(async {
        app.shell()
            .command("docker")
            .args(["cp", &format!("{}:{}", container, remote_path)])
            .arg(local_path.to_str().unwrap_or("."))
            .output()
            .await
            .map_err(|e| format!("docker cp 失败: {}", e))
    })?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("docker cp 错误: {}", stderr));
    }

    Ok(())
}

/// Copy local file back into container
fn docker_cp_to(app: &AppHandle, container: &str, local_path: &PathBuf, remote_path: &str) -> Result<(), String> {
    let rt = tokio::runtime::Runtime::new().map_err(|e| format!("Runtime error: {}", e))?;
    let output = rt.block_on(async {
        app.shell()
            .command("docker")
            .args(["cp", local_path.to_str().unwrap_or("."), &format!("{}:{}", container, remote_path)])
            .output()
            .await
            .map_err(|e| format!("docker cp 失败: {}", e))
    })?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("docker cp 错误: {}", stderr));
    }

    Ok(())
}

/// Remove any existing theme injection from HTML content
fn remove_theme_block(html: &str) -> String {
    if let Some(start) = html.find(THEME_MARKER_START) {
        if let Some(end) = html.find(THEME_MARKER_END) {
            let end_offset = end + THEME_MARKER_END.len();
            let before = &html[..start];
            let after = &html[end_offset..];
            return format!("{}{}", before.trim_end_matches('\n').trim_end(), after);
        }
    }
    html.to_string()
}

/// Inject theme CSS as inline <style> into HTML content before </head>
fn inject_theme_block(html: &str, css: &str) -> String {
    let style_block = format!(
        "\n{}\n<style>\n{}\n</style>\n{}\n",
        THEME_MARKER_START, css, THEME_MARKER_END
    );

    if let Some(pos) = html.find("</head>") {
        let mut result = String::with_capacity(html.len() + style_block.len());
        result.push_str(&html[..pos]);
        result.push_str(&style_block);
        result.push_str(&html[pos..]);
        result
    } else if let Some(pos) = html.find("</body>") {
        let mut result = String::with_capacity(html.len() + style_block.len());
        result.push_str(&html[..pos]);
        result.push_str(&style_block);
        result.push_str(&html[pos..]);
        result
    } else {
        format!("{}{}", html, style_block)
    }
}

/// Inject theme CSS as inline <style> into the cached index.html
#[tauri::command]
pub fn apply_theme(
    app: AppHandle,
    install_path: String,
    theme_id: String,
    custom_css: Option<String>,
) -> Result<ThemeApplyResult, String> {
    let container = find_n8n_container(&app, &install_path)?;

    let css = match custom_css {
        Some(ref css_text) if !css_text.trim().is_empty() => css_text.clone(),
        _ => get_theme_css(theme_id.clone())?,
    };

    do_inject_theme(&app, &container, &css)?;

    // Save active theme info locally
    let info = serde_json::json!({
        "theme_id": theme_id,
        "applied_at": chrono::Local::now().to_rfc3339(),
    });
    let local_dir = compose_dir(&install_path);
    let _ = std::fs::create_dir_all(&local_dir);
    let info_file = local_dir.join(".active-theme.json");
    let _ = std::fs::write(&info_file, serde_json::to_string_pretty(&info).unwrap_or_default());

    Ok(ThemeApplyResult {
        success: true,
        message: "主题已注入，刷新 n8n 页面即可生效".into(),
    })
}

/// Remove theme from the cached index.html
#[tauri::command]
pub fn remove_theme(
    app: AppHandle,
    install_path: String,
) -> Result<ThemeApplyResult, String> {
    let container = find_n8n_container(&app, &install_path)?;
    check_cache_exists(&app, &container)?;

    // Copy index.html from container, modify locally, copy back
    let temp_dir = std::env::temp_dir().join("n8n-beautify");
    let _ = std::fs::create_dir_all(&temp_dir);
    let local_file = temp_dir.join("index.html");

    docker_cp_from(&app, &container, CACHE_HTML, &local_file)?;

    let html = std::fs::read_to_string(&local_file)
        .map_err(|e| format!("读取临时文件失败: {}", e))?;

    let cleaned = remove_theme_block(&html);

    std::fs::write(&local_file, &cleaned)
        .map_err(|e| format!("写入临时文件失败: {}", e))?;

    docker_cp_to(&app, &container, &local_file, CACHE_HTML)?;

    // Remove local theme info
    let local_dir = compose_dir(&install_path);
    let info_file = local_dir.join(".active-theme.json");
    if info_file.exists() {
        let _ = std::fs::remove_file(&info_file);
    }

    Ok(ThemeApplyResult {
        success: true,
        message: "主题已移除，刷新 n8n 页面即可恢复".into(),
    })
}

/// Get the currently active theme ID
#[tauri::command]
pub fn get_active_theme(install_path: String) -> Option<String> {
    let info_file = compose_dir(&install_path).join(".active-theme.json");
    if !info_file.exists() {
        return None;
    }
    let content = std::fs::read_to_string(&info_file).ok()?;
    let json: serde_json::Value = serde_json::from_str(&content).ok()?;
    json.get("theme_id").and_then(|v| v.as_str()).map(|s| s.to_string())
}

/// Check if beautify feature is ready (n8n container is running).
/// If a theme was previously active but lost (container restarted), auto-reapplies it.
#[tauri::command]
pub fn check_beautify_ready(app: AppHandle, install_path: String) -> bool {
    let container = match find_n8n_container(&app, &install_path) {
        Ok(c) => c,
        Err(_) => return false,
    };

    if check_cache_exists(&app, &container).is_err() {
        return false;
    }

    // Check if previously active theme needs re-injection
    let info_file = compose_dir(&install_path).join(".active-theme.json");
    if let Ok(content) = std::fs::read_to_string(&info_file) {
        if let Ok(json) = serde_json::from_str::<serde_json::Value>(&content) {
            if let Some(theme_id) = json.get("theme_id").and_then(|v| v.as_str()) {
                let check = docker_exec(
                    &app,
                    &container,
                    &["sh", "-c", &format!("grep -c 'N8N-CUSTOM-THEME' {} 2>/dev/null || echo 0", CACHE_HTML)],
                );
                let count = check.unwrap_or_default().trim().parse::<i32>().unwrap_or(0);
                if count == 0 {
                    if let Ok(css) = get_theme_css(theme_id.to_string()) {
                        let _ = do_inject_theme(&app, &container, &css);
                    }
                }
            }
        }
    }

    true
}

/// Core injection logic: copy html from container, modify in Rust, copy back
fn do_inject_theme(
    app: &AppHandle,
    container: &str,
    css: &str,
) -> Result<(), String> {
    check_cache_exists(app, container)?;

    let temp_dir = std::env::temp_dir().join("n8n-beautify");
    let _ = std::fs::create_dir_all(&temp_dir);
    let local_file = temp_dir.join("index.html");

    // Copy from container
    docker_cp_from(app, container, CACHE_HTML, &local_file)?;

    // Read and modify in Rust (safe - no shell escaping issues)
    let html = std::fs::read_to_string(&local_file)
        .map_err(|e| format!("读取临时文件失败: {}", e))?;

    let cleaned = remove_theme_block(&html);
    let modified = inject_theme_block(&cleaned, css);

    std::fs::write(&local_file, &modified)
        .map_err(|e| format!("写入临时文件失败: {}", e))?;

    // Copy back to container
    docker_cp_to(app, container, &local_file, CACHE_HTML)?;

    // Clean up temp file
    let _ = std::fs::remove_file(&local_file);

    Ok(())
}
