# 更新日志 (CHANGELOG)

本仓库为 [QuantumNous/new-api](https://github.com/QuantumNous/new-api) 的定制 fork，记录相对上游的定制改动。

格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，版本号遵循定制版本约定。

## [Unreleased]

### 新增

#### 充值返佣（Referral）功能
在标准版邀请基础设施之上，补全「好友充值时按比例给邀请人返佣 + 佣金记录」链路，对标心云 `/referrals` 页面。

**后端**
- 新增配置项 `ReferralCommissionRateBps`（基点，0-10000，0=关闭，1000=10%），可通过管理端运营设置调整
- 新建 `referral_logs` 表与 `model/referral_log.go`：佣金记录模型 + CRUD + 统计（累计返佣、记录数、已邀请用户列表）
- Epay 充值回调（`controller/topup.go` `EpayNotify`）成功后插入返佣逻辑 `awardReferralCommission`：
  - 触发条件：`ReferralCommissionRateBps > 0` 且支付合规已确认（复用现有 `isPaymentComplianceConfirmed()`）且充值用户有邀请人
  - 返佣计算：`commissionQuota = quotaToAdd * bps / 10000`（int64 中间量防溢出）
  - 并发安全：邀请人 `AffQuota`/`AffHistoryQuota` 更新，MySQL/PostgreSQL 走事务+行锁（`lockForUpdate`），SQLite 走原子表达式更新（`gorm.Expr`），避免读-改-写竞态
  - 返佣失败只记日志，不阻断已成功的充值主流程
- 新增 `GET /api/user/referral` 接口（`controller/referral.go`）：返回可用奖励、邀请信息、分页佣金记录、统计
- 新增 `model/referral_log_test.go` 单元测试：覆盖创建、分页排序、统计聚合、邀请人额度原子更新

**前端**
- 新建 `web/src/features/referrals/`：推荐概览卡片（可用奖励/复制链接/转移）、邀请信息卡片、佣金记录表格（分页）
- 复用 wallet feature 的 `useAffiliate`（邀请码/转移）与 `TransferDialog`，未重复实现
- 注册 `/referrals` 路由 + 侧边栏「Referral Program」导航项
- 管理端运营设置（quota-settings）新增「充值返佣比例 (%)」输入框，前端百分比 ↔ 后端基点自动转换
- 补充 en/zh i18n 文案（8 个新 key）

**数据库**
- `referral_logs` 表由 GORM AutoMigrate 自动创建，兼容 SQLite/MySQL/PostgreSQL

### 安全
- 注意：本分支早期曾误将一个 GitHub Personal Access Token 提交至远程，相关 token 需由仓库所有者自行撤销重建。

---

## 版本约定

- 定制版本号格式：`<上游版本>-custom.<序号>`（待上游版本对齐后确定）
- 每个 PR/功能合并应在本文件追加条目

## 上游同步

本仓库基于 QuantumNous/new-api main 分支（2026-08-02 快照）。定期合并上游更新时，在此记录同步点。
