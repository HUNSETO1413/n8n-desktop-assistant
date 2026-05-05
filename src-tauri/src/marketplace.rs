use serde::{Deserialize, Serialize};
use std::sync::{LazyLock, Mutex};
use std::time::Instant;
use tauri_plugin_shell::ShellExt;

// ── npm Search API types ──

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NpmSearchResponse {
    pub objects: Vec<NpmSearchObject>,
    pub total: u64,
    pub time: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NpmSearchObject {
    pub package: NpmPackage,
    pub score: NpmScore,
    pub search_score: f64,
    #[serde(default)]
    pub downloads: Option<NpmDownloads>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NpmPackage {
    pub name: String,
    #[serde(default)]
    pub scope: Option<String>,
    pub version: String,
    #[serde(default)]
    pub description: Option<String>,
    #[serde(default)]
    pub keywords: Option<Vec<String>>,
    #[serde(default)]
    pub date: Option<String>,
    #[serde(default)]
    pub links: Option<NpmLinks>,
    #[serde(default)]
    pub publisher: Option<NpmPublisher>,
    #[serde(default)]
    pub maintainers: Option<Vec<NpmPublisher>>,
    #[serde(default)]
    pub license: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NpmLinks {
    #[serde(default)]
    pub npm: Option<String>,
    #[serde(default)]
    pub repository: Option<String>,
    #[serde(default)]
    pub homepage: Option<String>,
    #[serde(default)]
    pub bugs: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NpmPublisher {
    #[serde(default)]
    pub username: Option<String>,
    #[serde(default)]
    pub email: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NpmScore {
    pub final_score: f64,
    pub detail: NpmScoreDetail,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NpmScoreDetail {
    #[serde(default)]
    pub quality: f64,
    #[serde(default)]
    pub popularity: f64,
    #[serde(default)]
    pub maintenance: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NpmDownloads {
    #[serde(default)]
    pub monthly: Option<u64>,
    #[serde(default)]
    pub weekly: Option<u64>,
}

// ── npm package detail (full metadata) ──

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NpmPackageDetail {
    pub name: String,
    #[serde(default)]
    pub description: Option<String>,
    #[serde(default)]
    pub version: Option<String>,
    #[serde(default)]
    pub license: Option<String>,
    #[serde(default)]
    pub homepage: Option<String>,
    #[serde(default)]
    pub repository: Option<serde_json::Value>,
    #[serde(default)]
    pub keywords: Option<Vec<String>>,
    #[serde(default)]
    pub author: Option<serde_json::Value>,
    #[serde(default)]
    pub maintainers: Option<Vec<NpmPublisher>>,
    #[serde(default)]
    pub time: Option<serde_json::Value>,
    #[serde(default)]
    pub versions: Option<serde_json::Value>,
    #[serde(default)]
    pub readme: Option<String>,
}

// ── n8nhackers.com workflow types ──

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkflowSearchResponse {
    pub items: Vec<WorkflowItem>,
    pub total: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkflowItem {
    pub id: String,
    pub name: String,
    #[serde(default)]
    pub description: Option<String>,
    #[serde(default)]
    pub categories: Option<Vec<String>>,
    #[serde(default)]
    pub author: Option<String>,
    #[serde(default)]
    pub url: Option<String>,
    #[serde(default)]
    pub created_at: Option<String>,
    #[serde(default)]
    pub updated_at: Option<String>,
    #[serde(default)]
    pub views: Option<u64>,
    #[serde(default)]
    pub views_recent: Option<u64>,
    #[serde(default)]
    pub image: Option<String>,
    #[serde(default)]
    pub price: Option<u32>,
    #[serde(default)]
    pub setup_cost: Option<u32>,
    #[serde(default)]
    pub maintenance_cost: Option<u32>,
    #[serde(default)]
    pub node_count: Option<u32>,
    #[serde(default)]
    pub zh_title: Option<String>,
    #[serde(default)]
    pub zh_excerpt: Option<String>,
}

// ── Template cache for client-side filtering ──

struct CachedTemplate {
    item: WorkflowItem,
    raw: serde_json::Value,
}

struct TemplateCache {
    templates: Vec<CachedTemplate>,
    total_from_api: u64,
    fetched_at: Instant,
}

static TEMPLATE_CACHE: LazyLock<Mutex<Option<TemplateCache>>> =
    LazyLock::new(|| Mutex::new(None));

const CACHE_TTL_SECS: u64 = 1800; // 30 minutes

fn parse_single_workflow_item(item: &serde_json::Value) -> Option<WorkflowItem> {
    let workflow_id = item
        .get("workflow_id")
        .and_then(|v| v.as_u64())
        .unwrap_or(0);

    let zh_title = item
        .get("generated")
        .and_then(|g| g.get("zh"))
        .and_then(|zh| zh.get("title"))
        .and_then(|v| v.as_str())
        .map(|s| s.to_string());

    let zh_excerpt = item
        .get("generated")
        .and_then(|g| g.get("zh"))
        .and_then(|zh| zh.get("excerpt"))
        .and_then(|v| v.as_str())
        .map(|s| s.to_string());

    let name = zh_title
        .clone()
        .unwrap_or_else(|| {
            item.get("name")
                .and_then(|v| v.as_str())
                .unwrap_or("未命名")
                .to_string()
        });

    let description = zh_excerpt.clone().or_else(|| {
        item.get("description")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string())
    });

    let views = item
        .get("views")
        .and_then(|v| v.get("total").and_then(|t| t.as_u64()));

    let views_recent = item
        .get("views")
        .and_then(|v| v.get("recent").and_then(|r| r.as_u64()));

    let author = item
        .get("author")
        .and_then(|a| a.get("name"))
        .and_then(|n| n.as_str())
        .map(|s| s.to_string());

    let url = item
        .get("url")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string())
        .unwrap_or_else(|| format!("https://n8n.io/workflows/{}/", workflow_id));

    Some(WorkflowItem {
        id: workflow_id.to_string(),
        name,
        description,
        categories: item
            .get("categories")
            .and_then(|v| v.as_array())
            .map(|arr| {
                arr.iter()
                    .filter_map(|v| v.as_str().map(|s| s.to_string()))
                    .collect()
            }),
        author,
        url: Some(url),
        created_at: item
            .get("created_at")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string()),
        updated_at: item
            .get("updated_at")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string()),
        views,
        views_recent,
        image: item
            .get("image")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string()),
        price: item
            .get("price")
            .and_then(|v| v.as_u64())
            .map(|n| n as u32),
        setup_cost: item
            .get("setup_cost")
            .and_then(|v| v.as_u64())
            .map(|n| n as u32),
        maintenance_cost: item
            .get("maintenance_cost")
            .and_then(|v| v.as_u64())
            .map(|n| n as u32),
        node_count: item
            .get("statistics")
            .and_then(|s| s.get("node_count"))
            .and_then(|v| v.as_u64())
            .map(|n| n as u32),
        zh_title,
        zh_excerpt,
    })
}

async fn ensure_template_cache() -> Result<(), String> {
    {
        let cache = TEMPLATE_CACHE.lock().map_err(|e| format!("缓存锁失败: {}", e))?;
        if let Some(ref c) = *cache {
            if c.fetched_at.elapsed().as_secs() < CACHE_TTL_SECS {
                return Ok(());
            }
        }
    }

    // API max limit is ~300; offset param is ignored, so we fetch once with limit=300
    let url = "https://api.n8nhackers.com/api/v1/templates?limit=300";
    let client = build_client()?;
    let response = client
        .get(url)
        .timeout(std::time::Duration::from_secs(30))
        .send()
        .await
        .map_err(|e| format!("获取模板数据失败: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("API 返回错误状态: {}", response.status()));
    }

    let raw: serde_json::Value = response
        .json()
        .await
        .map_err(|e| format!("解析响应失败: {}", e))?;

    let items_array = raw
        .get("data")
        .and_then(|v| v.as_array())
        .cloned()
        .unwrap_or_default();

    let templates: Vec<CachedTemplate> = items_array
        .iter()
        .filter_map(|item| {
            let parsed = parse_single_workflow_item(item)?;
            Some(CachedTemplate {
                item: parsed,
                raw: item.clone(),
            })
        })
        .collect();

    let total_from_api = raw
        .get("stats")
        .and_then(|s| s.get("total"))
        .and_then(|v| v.as_u64())
        .unwrap_or(templates.len() as u64);

    let mut cache = TEMPLATE_CACHE.lock().map_err(|e| format!("缓存锁失败: {}", e))?;
    *cache = Some(TemplateCache {
        templates,
        total_from_api,
        fetched_at: Instant::now(),
    });

    Ok(())
}

// ── Filter matching helpers ──

fn text_matches(query: &str, item: &WorkflowItem) -> bool {
    if query.is_empty() {
        return true;
    }
    let q = query.to_lowercase();
    item.name.to_lowercase().contains(&q)
        || item.description.as_ref().map_or(false, |d| d.to_lowercase().contains(&q))
        || item.author.as_ref().map_or(false, |a| a.to_lowercase().contains(&q))
        || item.categories.as_ref().map_or(false, |cats| {
            cats.iter().any(|c| c.to_lowercase().contains(&q))
        })
}

fn category_matches(filter_val: &str, item: &WorkflowItem) -> bool {
    if filter_val.is_empty() {
        return true;
    }
    // Normalize: "ai_chatbot" → "ai chatbot"
    let normalized = filter_val.replace('_', " ").to_lowercase();
    item.categories.as_ref().map_or(false, |cats| {
        cats.iter().any(|c| c.replace('_', " ").to_lowercase() == normalized
            || c.to_lowercase().contains(&normalized))
    })
}

fn price_matches(filter_val: &str, item: &WorkflowItem) -> bool {
    match filter_val {
        "free" => item.price.unwrap_or(0) == 0,
        "paid" => item.price.unwrap_or(0) > 0,
        _ => true,
    }
}

fn time_period_matches(filter_val: &str, item: &WorkflowItem) -> bool {
    let date_str = match item.created_at.as_ref() {
        Some(d) if !d.is_empty() => d.clone(),
        _ => return true,
    };

    let created = match chrono::NaiveDateTime::parse_from_str(&date_str, "%Y-%m-%dT%H:%M:%S%.f")
        .or_else(|_| chrono::NaiveDateTime::parse_from_str(&date_str, "%Y-%m-%dT%H:%M:%S"))
        .or_else(|_| chrono::NaiveDateTime::parse_from_str(&date_str, "%Y-%m-%d %H:%M:%S"))
        .or_else(|_| {
            chrono::NaiveDate::parse_from_str(&date_str, "%Y-%m-%d")
                .map(|d| d.and_hms_opt(0, 0, 0).unwrap())
        }) {
        Ok(dt) => dt,
        Err(_) => return true,
    };

    let now = chrono::Local::now().naive_utc();
    let cutoff = match filter_val {
        "last_7_days" => now - chrono::Duration::days(7),
        "last_month" => now - chrono::Duration::days(30),
        "last_6_months" => now - chrono::Duration::days(180),
        "last_year" => now - chrono::Duration::days(365),
        "last_2_years" => now - chrono::Duration::days(730),
        "last_3_years" => now - chrono::Duration::days(1095),
        _ => return true,
    };

    created >= cutoff
}

fn complexity_matches(filter_val: &str, item: &WorkflowItem) -> bool {
    let node_count = item.node_count.unwrap_or(0);
    match filter_val {
        "beginner" => node_count <= 5,
        "intermediate" => node_count > 5 && node_count <= 15,
        "advanced" => node_count > 15,
        _ => true,
    }
}

/// Generic JSON field matching for filters not covered by specialized functions
fn generic_field_matches(filter_key: &str, filter_val: &str, raw: &serde_json::Value) -> bool {
    if filter_val.is_empty() {
        return true;
    }

    // Try direct field match
    if let Some(val) = raw.get(filter_key) {
        if let Some(s) = val.as_str() {
            return s == filter_val;
        }
        if let Some(arr) = val.as_array() {
            return arr.iter().any(|v| {
                v.as_str().map_or(false, |s| s == filter_val)
                    || v.as_str().map_or(false, |s| s.replace('_', " ").to_lowercase() == filter_val.replace('_', " ").to_lowercase())
            });
        }
    }

    // Try as nested boolean-like check (ai, agent, mcp, rag → "yes"/"no")
    if filter_val == "yes" || filter_val == "no" {
        if let Some(val) = raw.get(filter_key) {
            if let Some(b) = val.as_bool() {
                let is_yes = filter_val == "yes";
                return b == is_yes;
            }
            if let Some(s) = val.as_str() {
                return (filter_val == "yes" && (s == "true" || s == "1" || s == "yes"))
                    || (filter_val == "no" && (s == "false" || s == "0" || s == "no" || s.is_empty()));
            }
            if let Some(n) = val.as_u64() {
                return (filter_val == "yes" && n > 0) || (filter_val == "no" && n == 0);
            }
        }
    }

    true
}

// ── Tauri Commands ──

fn build_client() -> Result<reqwest::Client, String> {
    reqwest::Client::builder()
        .no_proxy()
        .timeout(std::time::Duration::from_secs(15))
        .build()
        .map_err(|e| format!("创建 HTTP 客户端失败: {}", e))
}

#[tauri::command]
pub async fn search_npm_packages(
    text: String,
    from: u32,
    size: u32,
) -> Result<NpmSearchResponse, String> {
    let url = format!(
        "https://registry.npmjs.org/-/v1/search?text={}&size={}&from={}",
        urlencoding(&text),
        size,
        from
    );

    let client = build_client()?;
    let response = client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("请求失败: {} (URL: {})", e, url))?;

    if !response.status().is_success() {
        return Err(format!("API 返回错误状态: {}", response.status()));
    }

    let data: serde_json::Value = response
        .json()
        .await
        .map_err(|e| format!("解析响应失败: {}", e))?;

    let objects = data
        .get("objects")
        .and_then(|v| v.as_array())
        .cloned()
        .unwrap_or_default();

    let parsed_objects: Vec<NpmSearchObject> = objects
        .iter()
        .filter_map(|obj| {
            let package = obj.get("package")?;
            let score_obj = obj.get("score")?;
            let detail = score_obj.get("detail")?;

            Some(NpmSearchObject {
                package: serde_json::from_value(package.clone()).ok()?,
                score: NpmScore {
                    final_score: score_obj.get("final").and_then(|v| v.as_f64()).unwrap_or(0.0),
                    detail: NpmScoreDetail {
                        quality: detail.get("quality").and_then(|v| v.as_f64()).unwrap_or(0.0),
                        popularity: detail.get("popularity").and_then(|v| v.as_f64()).unwrap_or(0.0),
                        maintenance: detail.get("maintenance").and_then(|v| v.as_f64()).unwrap_or(0.0),
                    },
                },
                search_score: obj.get("searchScore").and_then(|v| v.as_f64()).unwrap_or(0.0),
                downloads: obj.get("downloads").and_then(|d| {
                    Some(NpmDownloads {
                        monthly: d.get("monthly").and_then(|v| v.as_u64()),
                        weekly: d.get("weekly").and_then(|v| v.as_u64()),
                    })
                }),
            })
        })
        .collect();

    let total = data.get("total").and_then(|v| v.as_u64()).unwrap_or(0);
    let time = data
        .get("time")
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_string();

    Ok(NpmSearchResponse {
        objects: parsed_objects,
        total,
        time,
    })
}

#[tauri::command]
pub async fn get_npm_package_detail(
    package_name: String,
) -> Result<NpmPackageDetail, String> {
    let url = format!("https://registry.npmjs.org/{}", urlencoding(&package_name));

    let client = build_client()?;
    let response = client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("请求失败: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("API 返回错误状态: {}", response.status()));
    }

    let raw: serde_json::Value = response
        .json()
        .await
        .map_err(|e| format!("解析响应失败: {}", e))?;

    let latest_version = raw
        .get("dist-tags")
        .and_then(|v| v.get("latest"))
        .and_then(|v| v.as_str())
        .map(|s| s.to_string());

    let latest_data = latest_version
        .as_ref()
        .and_then(|v| raw.get("versions").and_then(|vers| vers.get(v)));

    let readme = raw
        .get("readme")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string());

    Ok(NpmPackageDetail {
        name: raw
            .get("name")
            .and_then(|v| v.as_str())
            .unwrap_or(&package_name)
            .to_string(),
        description: latest_data
            .and_then(|v| v.get("description").and_then(|d| d.as_str()).map(|s| s.to_string()))
            .or_else(|| raw.get("description").and_then(|v| v.as_str()).map(|s| s.to_string())),
        version: latest_version.clone(),
        license: _extract_license(&raw, &latest_version),
        homepage: raw
            .get("homepage")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string()),
        repository: raw.get("repository").cloned(),
        keywords: raw
            .get("keywords")
            .and_then(|v| v.as_array())
            .map(|arr| {
                arr.iter()
                    .filter_map(|v| v.as_str().map(|s| s.to_string()))
                    .collect()
            }),
        author: raw.get("author").cloned(),
        maintainers: raw
            .get("maintainers")
            .and_then(|v| v.as_array())
            .map(|arr| serde_json::from_value(serde_json::Value::Array(arr.clone())).unwrap_or_default()),
        time: raw.get("time").cloned(),
        versions: raw.get("versions").cloned(),
        readme,
    })
}

#[tauri::command]
pub async fn search_n8n_workflows(
    query: Option<String>,
    page: Option<u32>,
    category: Option<String>,
    time_period: Option<String>,
    popularity: Option<String>,
    price: Option<String>,
    complexity: Option<String>,
    business_layer: Option<String>,
    business_type: Option<String>,
    business_category: Option<String>,
    department: Option<String>,
    industry: Option<String>,
    model: Option<String>,
    start_type: Option<String>,
    ai: Option<String>,
    agent: Option<String>,
    mcp: Option<String>,
    rag: Option<String>,
    ai_cost: Option<String>,
    setup_time: Option<String>,
    setup_cost: Option<String>,
    security: Option<String>,
    subworkflow: Option<String>,
    scalable: Option<String>,
    human_in_the_loop: Option<String>,
    maintenance: Option<String>,
    score: Option<String>,
) -> Result<WorkflowSearchResponse, String> {
    ensure_template_cache().await?;

    let page_num = page.unwrap_or(0);
    let per_page: usize = 20;

    let query_text = query.unwrap_or_default();
    let category_val = category.unwrap_or_default();
    let price_val = price.unwrap_or_default();
    let time_period_val = time_period.unwrap_or_default();
    let complexity_val = complexity.unwrap_or_default();

    // Collect generic filter params
    let generic_filters: Vec<(&str, String)> = vec![
        ("business_layer", business_layer.unwrap_or_default()),
        ("business_type", business_type.unwrap_or_default()),
        ("business_category", business_category.unwrap_or_default()),
        ("department", department.unwrap_or_default()),
        ("industry", industry.unwrap_or_default()),
        ("model", model.unwrap_or_default()),
        ("start_type", start_type.unwrap_or_default()),
        ("ai", ai.unwrap_or_default()),
        ("agent", agent.unwrap_or_default()),
        ("mcp", mcp.unwrap_or_default()),
        ("rag", rag.unwrap_or_default()),
        ("ai_cost", ai_cost.unwrap_or_default()),
        ("setup_time", setup_time.unwrap_or_default()),
        ("setup_cost", setup_cost.unwrap_or_default()),
        ("security", security.unwrap_or_default()),
        ("subworkflow", subworkflow.unwrap_or_default()),
        ("scalable", scalable.unwrap_or_default()),
        ("human_in_the_loop", human_in_the_loop.unwrap_or_default()),
        ("maintenance", maintenance.unwrap_or_default()),
        ("score", score.unwrap_or_default()),
    ];
    let has_generic = generic_filters.iter().any(|(_, v)| !v.is_empty());

    let cache = TEMPLATE_CACHE.lock().map_err(|e| format!("缓存锁失败: {}", e))?;
    let cache_data = cache.as_ref().ok_or("模板缓存未初始化")?;

    // Filter
    let filtered: Vec<&CachedTemplate> = cache_data
        .templates
        .iter()
        .filter(|ct| {
            let item = &ct.item;
            if !text_matches(&query_text, item) { return false; }
            if !category_matches(&category_val, item) { return false; }
            if !price_matches(&price_val, item) { return false; }
            if !time_period_matches(&time_period_val, item) { return false; }
            if !complexity_matches(&complexity_val, item) { return false; }
            if has_generic {
                for (key, val) in &generic_filters {
                    if !val.is_empty() && !generic_field_matches(key, val, &ct.raw) {
                        return false;
                    }
                }
            }
            true
        })
        .collect();

    let total = if query_text.is_empty()
        && category_val.is_empty()
        && price_val.is_empty()
        && time_period_val.is_empty()
        && complexity_val.is_empty()
        && !has_generic
    {
        cache_data.total_from_api
    } else {
        filtered.len() as u64
    };

    // Sort
    let popularity_val = popularity.unwrap_or_default();
    let mut sorted: Vec<&CachedTemplate> = if popularity_val == "recently_added" {
        let mut v = filtered;
        v.sort_by(|a, b| {
            let da = a.item.created_at.as_ref().map(|s| s.as_str()).unwrap_or("");
            let db = b.item.created_at.as_ref().map(|s| s.as_str()).unwrap_or("");
            db.cmp(da)
        });
        v
    } else {
        // Default: most popular (by views)
        let mut v = filtered;
        v.sort_by(|a, b| {
            let va = a.item.views.unwrap_or(0);
            let vb = b.item.views.unwrap_or(0);
            vb.cmp(&va)
        });
        v
    };

    // Paginate
    let offset = page_num as usize * per_page;
    if offset < sorted.len() {
        sorted = sorted[offset..].to_vec();
    } else {
        sorted.clear();
    }
    sorted.truncate(per_page);

    let items: Vec<WorkflowItem> = sorted.into_iter().map(|ct| ct.item.clone()).collect();

    Ok(WorkflowSearchResponse { items, total })
}

#[tauri::command]
pub async fn get_workflow_filters() -> Result<serde_json::Value, String> {
    let url = "https://api.n8nhackers.com/api/v1/templates_filters";

    let client = build_client()?;
    let response = client
        .get(url)
        .send()
        .await
        .map_err(|e| format!("请求失败: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("API 返回错误状态: {}", response.status()));
    }

    let raw: serde_json::Value = response
        .json()
        .await
        .map_err(|e| format!("解析响应失败: {}", e))?;

    // API returns: { "success": true, "data": { "time_period": [{ "key": "...", "value": count }], ... } }
    // Transform to: { "time_period": [{ "value": "key", "label": "key", "label_zh": "中文" }], ... }
    let data = raw.get("data").cloned().unwrap_or(serde_json::json!({}));
    let data_map = match data.as_object() {
        Some(m) => m,
        None => return Ok(serde_json::json!({})),
    };

    let mut result = serde_json::Map::new();
    for (filter_key, items) in data_map {
        let arr = match items.as_array() {
            Some(a) => a,
            None => continue,
        };
        let options: Vec<serde_json::Value> = arr
            .iter()
            .filter(|item| {
                item.get("key").and_then(|v| v.as_str()).unwrap_or("") != "all"
            })
            .filter_map(|item| {
                let key = item.get("key")?.as_str()?;
                let label_zh = translate_filter_label(filter_key, key);
                Some(serde_json::json!({
                    "value": key,
                    "label": key,
                    "label_zh": label_zh,
                }))
            })
            .collect();
        result.insert(filter_key.clone(), serde_json::Value::Array(options));
    }

    Ok(serde_json::Value::Object(result))
}

fn translate_filter_label(filter: &str, key: &str) -> String {
    use std::sync::LazyLock;
    use std::collections::HashMap;

    static LABELS: LazyLock<HashMap<&str, &str>> = LazyLock::new(|| {
        let mut m = HashMap::new();
        // time_period
        m.insert("last_7_days", "最近7天");
        m.insert("last_month", "最近1个月");
        m.insert("last_6_months", "最近6个月");
        m.insert("last_year", "最近1年");
        m.insert("last_2_years", "最近2年");
        m.insert("last_3_years", "最近3年");
        // popularity
        m.insert("most_popular", "最热门");
        m.insert("recently_added", "最近添加");
        // price
        m.insert("free", "免费");
        m.insert("paid", "付费");
        // complexity
        m.insert("beginner", "入门");
        m.insert("intermediate", "中级");
        m.insert("advanced", "高级");
        // business_layer
        m.insert("acquisition", "获客");
        m.insert("production", "生产");
        m.insert("distribution", "分销");
        m.insert("after_sales", "售后");
        m.insert("support", "支持");
        // business_type
        m.insert("b2b", "B2B");
        m.insert("b2c", "B2C");
        m.insert("c2c", "C2C");
        m.insert("c2b", "C2B");
        // department
        m.insert("marketing", "市场");
        m.insert("sales", "销售");
        m.insert("human_resources", "人力资源");
        m.insert("it", "IT");
        m.insert("finance", "财务");
        m.insert("operations", "运营");
        m.insert("legal", "法务");
        m.insert("engineering", "工程");
        m.insert("customer_success", "客户成功");
        m.insert("product", "产品");
        m.insert("management", "管理");
        m.insert("design", "设计");
        m.insert("data", "数据");
        // industry
        m.insert("technology", "科技");
        m.insert("healthcare", "医疗");
        m.insert("finance_industry", "金融");
        m.insert("finance", "金融");
        m.insert("retail", "零售");
        m.insert("education", "教育");
        m.insert("manufacturing", "制造业");
        m.insert("real_estate", "房地产");
        m.insert("agriculture", "农业");
        m.insert("energy", "能源");
        m.insert("logistics", "物流");
        m.insert("hospitality", "酒店业");
        // ai / agent / mcp / rag
        m.insert("yes", "是");
        m.insert("no", "否");
        m.insert("none", "无");
        m.insert("one_agent", "单个 Agent");
        m.insert("multiple_agents", "多个 Agent");
        // start_type
        m.insert("manual", "手动触发");
        m.insert("scheduled", "定时触发");
        m.insert("webhook", "Webhook");
        m.insert("chat", "聊天触发");
        m.insert("email", "邮件触发");
        m.insert("form", "表单触发");
        m.insert("polling", "轮询");
        // category
        m.insert("ai", "AI");
        m.insert("ai_chatbot", "AI 聊天机器人");
        m.insert("ai_rag", "AI RAG");
        m.insert("ai_summarization", "AI 摘要");
        m.insert("building_blocks", "构建模块");
        m.insert("content_creation", "内容创作");
        m.insert("crm", "CRM");
        m.insert("crypto_trading", "加密货币交易");
        m.insert("design_cat", "设计");
        m.insert("devops", "DevOps");
        m.insert("document_extraction", "文档提取");
        m.insert("document_ops", "文档操作");
        m.insert("engineering_cat", "工程");
        m.insert("file_management", "文件管理");
        m.insert("hr_cat", "人力资源");
        m.insert("internal_wiki", "内部知识库");
        m.insert("invoice_processing", "发票处理");
        m.insert("it_ops", "IT 运维");
        m.insert("lead_generation", "线索生成");
        m.insert("lead_nurturing", "线索培育");
        m.insert("market_research", "市场研究");
        m.insert("marketing_cat", "市场营销");
        m.insert("sales_cat", "销售");
        m.insert("social_media", "社交媒体");
        m.insert("data_transformation", "数据转换");
        m.insert("email_automation", "邮件自动化");
        m.insert("notification", "通知");
        m.insert("reporting", "报告");
        m.insert("scheduling", "排程");
        m.insert("security", "安全");
        m.insert("testing", "测试");
        m.insert("utility", "工具");
        m
    });

    // Try exact match first
    if let Some(label) = LABELS.get(key) {
        return label.to_string();
    }

    // For category/business_category, try a broader match
    if filter == "category" || filter == "business_category" {
        let key_lower = key.to_lowercase();
        for (k, v) in LABELS.iter() {
            if key_lower == *k {
                return v.to_string();
            }
        }
    }

    // Fallback: humanize the key (replace underscores with spaces, title case first letter)
    let humanized: String = key
        .replace('_', " ")
        .chars()
        .enumerate()
        .map(|(i, c)| if i == 0 { c.to_uppercase().to_string() } else { c.to_string() })
        .collect();
    humanized
}

/// Minimal URL encoding for query parameters
fn urlencoding(s: &str) -> String {
    s.replace(' ', "+")
        .replace('%', "%25")
        .replace('+', "%2B")
        .replace('&', "%26")
        .replace('=', "%3D")
        .replace('#', "%23")
        .replace('/', "%2F")
}

fn _extract_license(raw: &serde_json::Value, latest_version: &Option<String>) -> Option<String> {
    if let Some(ver) = latest_version {
        if let Some(vers) = raw.get("versions") {
            if let Some(vdata) = vers.get(ver) {
                if let Some(lic) = vdata.get("license").and_then(|v| v.as_str()) {
                    return Some(lic.to_string());
                }
            }
        }
    }
    raw.get("license")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string())
}

// ── Install / Import commands ──

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OperationResult {
    pub success: bool,
    pub message: String,
}

fn get_compose_file_path(install_path: &str) -> std::path::PathBuf {
    #[cfg(windows)]
    {
        std::path::PathBuf::from(install_path.replace('/', "\\")).join("docker-compose.yml")
    }
    #[cfg(not(windows))]
    {
        std::path::PathBuf::from(install_path).join("docker-compose.yml")
    }
}

/// Get n8n API key from database via docker exec
async fn get_n8n_api_key(
    app: &tauri::AppHandle,
    compose_str: &str,
) -> Result<String, String> {
    let output = app
        .shell()
        .command("docker")
        .args([
            "compose",
            "-f",
            compose_str,
            "exec",
            "-T",
            "n8n-db",
            "psql",
            "-U", "n8n",
            "-d", "n8n",
            "-t",
            "-A",
            "-c",
            "SELECT \"apiKey\" FROM public.user_api_keys WHERE audience='public-api' LIMIT 1;",
        ])
        .output()
        .await
        .map_err(|e| format!("查询数据库失败: {}", e))?;

    let stdout = String::from_utf8_lossy(&output.stdout).trim().to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();

    if !output.status.success() {
        if stderr.contains("not found") || stderr.contains("No such container") {
            return Err("数据库容器未运行，请先启动 n8n 服务".to_string());
        }
        return Err(format!("获取 API Key 失败: {}", stderr));
    }

    if stdout.is_empty() {
        return Err("未找到 n8n API Key，请在 n8n 设置中创建 API Key".to_string());
    }

    Ok(stdout)
}

#[tauri::command]
pub async fn install_community_package(
    app: tauri::AppHandle,
    package_name: String,
    version: Option<String>,
) -> Result<OperationResult, String> {
    let config = crate::config::load_config(app.clone())
        .map_err(|e| format!("读取配置失败: {}", e))?;

    let compose_file = get_compose_file_path(&config.install_path);
    let compose_str = compose_file
        .to_str()
        .ok_or("无效安装路径")?
        .replace('\\', "/");

    if !compose_file.exists() {
        return Err("未找到 docker-compose.yml，请先完成初始配置".to_string());
    }

    // Get API key from database
    let api_key = get_n8n_api_key(&app, &compose_str).await?;

    // Try n8n API first
    let pkg_version = version.unwrap_or_else(|| "latest".to_string());
    let url = format!("http://localhost:{}/api/v1/community-packages", config.port);

    let client = build_client_long_timeout()?;
    let response = client
        .post(&url)
        .header("X-N8N-API-KEY", &api_key)
        .header("Content-Type", "application/json")
        .json(&serde_json::json!({
            "name": package_name,
            "version": pkg_version,
        }))
        .timeout(std::time::Duration::from_secs(120))
        .send()
        .await
        .map_err(|e| format!("请求 n8n API 失败: {}", e))?;

    let status = response.status();
    let body: serde_json::Value = response
        .json()
        .await
        .unwrap_or(serde_json::json!({}));

    if status.is_success() {
        return Ok(OperationResult {
            success: true,
            message: format!("{} 安装成功！", package_name),
        });
    }

    let msg = body
        .get("message")
        .and_then(|v| v.as_str())
        .unwrap_or("未知错误");

    // If "not vetted" or other API error, fall back to npm install via docker exec
    if msg.contains("not vetted") || msg.contains("vetted") {
        return install_via_npm(&app, &compose_str, &package_name).await;
    }

    Ok(OperationResult {
        success: false,
        message: format!("安装失败: {}", msg),
    })
}

/// Fallback: install community package via npm in the container
async fn install_via_npm(
    app: &tauri::AppHandle,
    compose_str: &str,
    package_name: &str,
) -> Result<OperationResult, String> {
    // Run npm install in n8n's data directory
    let pkg_spec = package_name.to_string();
    let output = app
        .shell()
        .command("docker")
        .args([
            "compose",
            "-f",
            compose_str,
            "exec",
            "-T",
            "n8n-main",
            "sh",
            "-c",
            &format!("cd /home/node/.n8n && npm install {} 2>&1", pkg_spec),
        ])
        .output()
        .await
        .map_err(|e| format!("执行 npm install 失败: {}", e))?;

    let stdout = String::from_utf8_lossy(&output.stdout).to_string();

    if !output.status.success() {
        // Filter docker warnings
        let real_errors: Vec<&str> = stdout
            .lines()
            .filter(|line| !line.contains("level=warning") && !line.trim().is_empty())
            .collect();
        return Ok(OperationResult {
            success: false,
            message: format!("npm 安装失败: {}", real_errors.join("\n")),
        });
    }

    // Restart n8n to pick up the new package
    let restart_output = app
        .shell()
        .command("docker")
        .args([
            "compose",
            "-f",
            compose_str,
            "restart",
            "n8n-main",
        ])
        .output()
        .await
        .map_err(|e| format!("重启 n8n 失败: {}", e))?;

    if !restart_output.status.success() {
        let stderr = String::from_utf8_lossy(&restart_output.stderr);
        return Ok(OperationResult {
            success: true,
            message: format!(
                "{} 已安装，但重启 n8n 失败，请手动重启。错误: {}",
                package_name,
                stderr.lines()
                    .filter(|l| !l.contains("level=warning"))
                    .collect::<Vec<_>>()
                    .join("\n")
            ),
        });
    }

    Ok(OperationResult {
        success: true,
        message: format!("{} 安装成功！n8n 正在重启以加载新节点...", package_name),
    })
}

fn build_client_long_timeout() -> Result<reqwest::Client, String> {
    reqwest::Client::builder()
        .no_proxy()
        .timeout(std::time::Duration::from_secs(120))
        .build()
        .map_err(|e| format!("创建 HTTP 客户端失败: {}", e))
}

#[tauri::command]
pub async fn get_installed_packages(
    app: tauri::AppHandle,
) -> Result<serde_json::Value, String> {
    let config = crate::config::load_config(app.clone())
        .map_err(|e| format!("读取配置失败: {}", e))?;

    let compose_file = get_compose_file_path(&config.install_path);
    let compose_str = compose_file
        .to_str()
        .ok_or("无效安装路径")?
        .replace('\\', "/");

    if !compose_file.exists() {
        return Ok(serde_json::json!([]));
    }

    let api_key = get_n8n_api_key(&app, &compose_str).await?;
    let url = format!("http://localhost:{}/api/v1/community-packages", config.port);

    let client = build_client_long_timeout()?;
    let response = client
        .get(&url)
        .header("X-N8N-API-KEY", &api_key)
        .timeout(std::time::Duration::from_secs(30))
        .send()
        .await
        .map_err(|e| format!("请求失败: {}", e))?;

    if !response.status().is_success() {
        return Ok(serde_json::json!([]));
    }

    let packages: serde_json::Value = response
        .json()
        .await
        .unwrap_or(serde_json::json!([]));

    Ok(packages)
}

#[tauri::command]
pub async fn import_workflow_template(
    app: tauri::AppHandle,
    workflow_id: String,
) -> Result<OperationResult, String> {
    let config = crate::config::load_config(app.clone())
        .map_err(|e| format!("读取配置失败: {}", e))?;

    // Open the template setup page in browser — n8n handles the full import flow
    let setup_url = format!("http://localhost:{}/templates/{}/setup", config.port, workflow_id);

    app.shell()
        .open(setup_url.clone(), None)
        .map_err(|e| format!("打开浏览器失败: {}", e))?;

    Ok(OperationResult {
        success: true,
        message: format!("已在浏览器中打开模板导入页面，请在 n8n 中完成导入"),
    })
}

// ── Translation ──

#[tauri::command]
pub async fn translate_to_chinese(text: String) -> Result<String, String> {
    if text.trim().is_empty() {
        return Ok(String::new());
    }

    // Limit text to avoid API issues
    let limited = if text.len() > 3000 {
        &text[..text.floor_char_boundary(3000)]
    } else {
        &text
    };

    let encoded = encode_query_param(limited);
    let url = format!(
        "https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=zh-CN&dt=t&q={}",
        encoded
    );

    let client = build_client()?;
    let response = client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("翻译请求失败: {}", e))?;

    if !response.status().is_success() {
        return Ok(text);
    }

    let data: serde_json::Value = response
        .json()
        .await
        .map_err(|e| format!("解析翻译响应失败: {}", e))?;

    // Google Translate response: [[["translated","original",...],...],...]
    let translated = data
        .as_array()
        .and_then(|arr| arr.first())
        .and_then(|first| first.as_array())
        .map(|segments| {
            segments
                .iter()
                .filter_map(|seg| {
                    seg.as_array()
                        .and_then(|s| s.first())
                        .and_then(|t| t.as_str())
                        .map(|s| s.to_string())
                })
                .collect::<Vec<String>>()
                .join("")
        })
        .unwrap_or(text);

    Ok(translated)
}

fn encode_query_param(s: &str) -> String {
    let mut result = String::with_capacity(s.len() * 3);
    for c in s.chars() {
        match c {
            'A'..='Z' | 'a'..='z' | '0'..='9' | '-' | '_' | '.' | '~' => result.push(c),
            ' ' => result.push('+'),
            _ => {
                let mut buf = [0u8; 4];
                let encoded = c.encode_utf8(&mut buf);
                for &b in encoded.as_bytes() {
                    result.push_str(&format!("%{:02X}", b));
                }
            }
        }
    }
    result
}
