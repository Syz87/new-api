# 更新日志 (CHANGELOG)

本仓库为 [QuantumNous/new-api](https://github.com/QuantumNous/new-api) 的定制 fork，记录相对上游的定制改动。

---

## [v1.0.0-custom.1] — 2026-08-02

基于上游 main 分支（2026-08-02 快照），首个定制版本。

### 新增

#### 1. 充值返佣（Referral Commission）
好友通过 Epay 充值时，按管理员设定比例给邀请人返佣，佣金记录可查。

**后端** (`common/constants.go`, `model/option.go`, `model/referral_log.go`, `model/main.go`, `controller/topup.go`, `controller/referral.go`, `router/api-router.go`)
- `ReferralCommissionRateBps` 配置项（基点 0-10000，0=关闭，通过管理端可调）
- `referral_logs` 表：佣金记录模型 + CRUD + 统计
- Epay 充值成功后：`awardReferralCommission()` 计算返佣 → 增加邀请人 `AffQuota` → 写佣金日志
- 并发安全：MySQL/PG 走事务+行锁，SQLite 走原子表达式
- 返佣失败只记日志，不阻断已成功的充值
- `GET /api/user/referral`（含 `commission_rate_bps`）
- `model/referral_log_test.go` 单元测试（4 个全部通过）

#### 2. 新用户默认分组（Default User Group）
**竣工** ✅

**后端** (`common/constants.go`, `model/option.go`, `model/user.go`)
- `DefaultUserGroup` 配置项（默认 `"default"`）
- `Insert`/`InsertWithTx`：用户注册时 Group 为空则自动赋值

**前端** (`web/src/features/system-settings/`)
- 管理端 Quota Settings 新增「Default User Group」输入框

#### 3. 钱包推荐计划卡片增强
**竣工** ✅

**后端** (`controller/topup.go`)
- `GetTopUpInfo` 响应新增 `quota_for_inviter` / `quota_for_invitee`

**前端** (`web/src/features/wallet/`)
- `affiliate-rewards-card.tsx` 改造：完整描述文案、邀请/被邀请奖励额度展示、优化布局
- `wallet/types.ts` 补类型定义

#### 4. 注册邀请修复
**后端** (`controller/user.go`)
- `Register` handler：`aff_code` 优先读 JSON body，为空时回退到 URL `?aff=` 参数
- 解决 SPA 路由可能丢失 query 参数导致邀请不计入的问题

#### 5. 构建与部署
- `Dockerfile`：bun 镜像改用 tag（非 digest），golang builder 加 `GOPROXY=https://goproxy.cn,direct`
- `docker-compose.custom.yml`：定制版独立部署配置（端口 6579、SQLite、独立数据目录）

### 挂起/暂缓

- **创建 Key 时隐藏分组选项** (`HideTokenGroupSelector`) — 后端配置已就绪，前端 UI 未生效
- **充值解锁分组** (`GroupUnlockRules` + `User.TotalTopupAmount` + `AwardGroupUnlock`) — 后端完整实现，前端 UI 放弃
- ~~`/referrals` 独立页面~~ — 已删除，功能并入钱包推荐计划卡片

### 文件变更统计

| 类型 | 说明 |
|------|------|
| 新建 | `model/referral_log.go`, `model/referral_log_test.go`, `controller/referral.go`, `docker-compose.custom.yml`, `CHANGELOG.md` |
| 修改 | `common/constants.go`, `model/option.go`, `model/main.go`, `model/user.go`, `controller/topup.go`, `controller/user.go`, `controller/token.go`, `controller/misc.go`, `router/api-router.go`, `Dockerfile` |
| 前端新增/修改 | `affiliate-rewards-card.tsx`, `wallet/index.tsx`, `wallet/types.ts`, `quota-settings-section.tsx`, `billing/*`, `types.ts`, `i18n/*.json` |
| 前端删除 | `features/referrals/`（整个目录）, `routes/_authenticated/referrals/`, 侧边栏导航项 |

### 部署

- **地址**：http://192.168.6.108:6579
- **容器**：`new-api-custom`（镜像 `new-api-custom:referral`）
- **数据库**：SQLite（`/home/app/new-api-custom/data/one-api.db`）
- **与原版隔离**：原版 `new-api` 端口 6578，定制版端口 6579，独立数据目录

### 已知问题

1. 首次启动需手动设 root 管理员：`sqlite3 data/one-api.db "UPDATE users SET role=100 WHERE username='你的用户名';"`
2. 容器重建后 sqlite3 不保留（debian:bookworm-slim 精简镜像），需时重装 `apt-get install -y sqlite3`


## 版本约定

- 定制版本号格式：`v<上游版本>-custom.<序号>`
- 每个功能合并后更新本条 CHANGELOG

## 上游同步

本仓库基于 QuantumNous/new-api main 分支（2026-08-02）。合并上游时在此记录。
