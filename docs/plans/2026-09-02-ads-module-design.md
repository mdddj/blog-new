# 广告模块设计

## Scope

第一版只做自建图文广告。后台管理广告创意，文章读完后按权重抽出一条展示。不做第三方广告网络、点击统计、排期、分类定向。

## Requirements

### Functional

- 管理员可以创建、编辑、启用/停用、删除广告。
- 广告形态：封面图 + 标题 + 简介 + 跳转按钮。
- 第一版投放位只有文章正文后、上一篇/下一篇之前（`article_end`）。
- 同一位置多条启用广告按权重随机展示一条。
- 没有启用广告时，文章页不留空位。
- 卡片必须带「广告」标识。

### Non-Functional

- 广告接口失败不能影响文章阅读。
- 公开列表可缓存；后台写入后立即失效。
- 标题/简介当纯文本渲染，外链只允许 `http/https`。

### Constraints

- 复用现有分层：migration → model → repository → handler → route。
- 前台视觉走 `animal-island-ui` 与现有 `PublicCard`。
- 封面图第一版填 URL，复用文件管理已有地址，不做独立上传器。

## Out of Scope

- 点击 / 展示统计
- 日期排期
- 按分类或文章定向
- 首页侧栏、信息流穿插、页脚等其它位置的 UI
- MCP 工具
- 数据导入导出
- 第三方广告脚本（AdSense 等）

以后加新位置只增加 `slot` 枚举值和一块组件，不改表结构。统计和排期另开表，不塞进 `ads`。

## High-Level Architecture

```
Admin UI /admin/ads  ──JWT──▶  /api/v1/admin/ads CRUD
                                      │
                                      ▼
                               PostgreSQL ads
                                      │
Article page ──GET /api/v1/ads?slot= ─┘
        │
        ▼
  pickAdByWeight() → ArticleEndAd（客户端抽一条）
```

公开接口返回该 slot 下全部启用广告，不在服务端抽取。客户端按权重抽选，这样列表可以缓存 10 分钟，刷新页面仍能轮播。

## Data Model

```sql
CREATE TABLE ads (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    intro VARCHAR(200),
    image_url VARCHAR(500) NOT NULL,
    target_url VARCHAR(500) NOT NULL,
    cta_text VARCHAR(30) NOT NULL DEFAULT '了解更多',
    slot VARCHAR(50) NOT NULL DEFAULT 'article_end',
    weight INT NOT NULL DEFAULT 1 CHECK (weight >= 1),
    enabled BOOLEAN NOT NULL DEFAULT true,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ads_slot_enabled ON ads (slot, enabled);
```

`sort_order` 只用于后台列表，不参与前台抽选。`slot` 第一版只接受 `article_end`。

## API

### Public

- `GET /api/v1/ads?slot=article_end`
  - 返回 `enabled = true` 且 slot 匹配的广告列表
  - Redis 缓存 10 分钟，key 按 slot 分
  - 缺省或未知 slot 返回 400

### Admin（现有 JWT 中间件）

- `GET /api/v1/admin/ads` 全部广告，按 `sort_order`、`id` 排序
- `POST /api/v1/admin/ads` 创建
- `GET /api/v1/admin/ads/:id`
- `PUT /api/v1/admin/ads/:id`
- `DELETE /api/v1/admin/ads/:id`

写操作成功后删除对应 slot 的公开缓存。

### Validation

- `title` 非空，最长 100
- `intro` 最长 200
- `image_url`、`target_url` 必须是 `http://` 或 `https://`，拒绝 `javascript:` 等
- `cta_text` 最长 30，空则回落「了解更多」
- `weight >= 1`
- `slot` 属于已知枚举

## Frontend

### Public

1. 文章详情服务端请求广告列表，作为 props 传给 `BlogDetailClient`。请求失败则传空数组。
2. 客户端 `pickAdByWeight(ads)` 抽一条；空列表不渲染。
3. `ArticleEndAd` 插在正文卡片之后、上一篇/下一篇之前。
4. 使用 `PublicCard`：封面、标题、简介、主按钮。新标签打开，`rel="noopener noreferrer sponsored"`。
5. 封面加载失败时保留卡片和底色，不裂图。
6. 固定展示「广告」标识。

### Admin

- 路由 `/admin/ads`，侧栏「广告管理」
- 交互对齐友链：表格 + 弹窗新建/编辑
- 表格列：封面缩略图、标题、权重、开关、投放位、操作
- 封面图输入 URL

## Error Handling

- 公开广告接口失败或超时：文章正常渲染，广告位消失
- 图片 404：卡片仍在，封面走站点占位底色
- 后台保存失败：toast 报错，弹窗保持打开
- 删除二次确认；停用后公开列表在缓存失效后立即不再包含该条

## Security

- 标题、简介纯文本，不走 `dangerouslySetInnerHTML`
- 外链协议白名单 `http/https`
- `target="_blank"` + `rel="noopener noreferrer sponsored"`
- 写接口走现有 admin JWT
- 卡片固定「广告」标识，满足广告标识要求

## Key Decisions

| Decision | Choice | Why |
|---|---|---|
| 存储 | 独立 `ads` 表 | 与友链/项目同一套 CRUD；site_config JSON 管不好多条、开关、权重 |
| 抽取位置 | 客户端按权重抽 | 公开列表可缓存；服务端抽取会把轮播冻在缓存里 |
| 投放位 | 字段先做、UI 只做 `article_end` | 加首页侧栏不用改表 |
| 统计 | 第一版不做 | 避免公开上报接口和防刷 |
| 封面 | URL，不做上传器 | 文件管理已能产出 URL |

## Verification

- 后端：非法 URL、`weight = 0`、未知 slot 创建/更新失败；公开列表不含停用项；写操作清缓存
- 前端：`pickAdByWeight`（空列表返回 null，权重越大越容易中，weight 非法的项不参与）
- 手工：无广告时文章页干净；一条广告稳定出现在正文后；多条刷新会换；开关生效；移动端卡片不撑破布局

## Follow-ups

- 首页侧栏、文章侧栏等新 `slot`
- 点击计数表 + 防刷上报
- 后台封面走文件选择器
- 数据导入导出与 MCP 工具
