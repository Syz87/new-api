package model

import (
	"time"

	"github.com/QuantumNous/new-api/common"
	"gorm.io/gorm"
)

// ReferralLog records a single recharge-referral commission credited to an inviter.
type ReferralLog struct {
	Id           int    `json:"id" gorm:"primaryKey;autoIncrement"`
	InviterId    int    `json:"inviter_id" gorm:"index;column:inviter_id"`            // 邀请人
	InviteeId    int    `json:"invitee_id" gorm:"index;column:invitee_id"`           // 被邀请人（充值人）
	Amount       int    `json:"amount" gorm:"not null;column:amount"`                // 返佣额度
	SourceAmount int    `json:"source_amount" gorm:"not null;column:source_amount"`  // 充值来源额度
	TradeNo      string `json:"trade_no" gorm:"type:varchar(64);column:trade_no"`    // 充值订单号
	CreatedAt    int64  `json:"created_at" gorm:"bigint;column:created_at"`
}

func (ReferralLog) TableName() string {
	return "referral_logs"
}

// CreateReferralLog inserts a commission record. Failures here are best-effort
// and logged by the caller; they must not roll back an already-succeeded top-up.
func CreateReferralLog(log *ReferralLog) error {
	if log.CreatedAt == 0 {
		log.CreatedAt = time.Now().Unix()
	}
	return DB.Create(log).Error
}

// GetReferralLogsByInviterId returns a page of commission logs for the inviter.
func GetReferralLogsByInviterId(inviterId, page, pageSize int) ([]ReferralLog, int64, error) {
	var logs []ReferralLog
	var total int64
	db := DB.Model(&ReferralLog{}).Where("inviter_id = ?", inviterId)
	if err := db.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	err := db.Order("created_at DESC").
		Offset((page - 1) * pageSize).
		Limit(pageSize).
		Find(&logs).Error
	return logs, total, err
}

// InvitedUser is a non-sensitive projection of a user invited by someone.
type InvitedUser struct {
	Id          int    `json:"id"`
	Username    string `json:"username"`
	DisplayName string `json:"display_name"`
	CreatedAt   int64  `json:"created_at"`
}

// GetReferralStats returns aggregate referral info for the inviter.
func GetReferralStats(inviterId int) (map[string]interface{}, error) {
	var totalCommission int64
	var logCount int64
	if err := DB.Model(&ReferralLog{}).
		Where("inviter_id = ?", inviterId).
		Select("COALESCE(SUM(amount), 0)").
		Scan(&totalCommission).Error; err != nil {
		return nil, err
	}
	if err := DB.Model(&ReferralLog{}).
		Where("inviter_id = ?", inviterId).
		Count(&logCount).Error; err != nil {
		return nil, err
	}

	var invitedUsers []InvitedUser
	if err := DB.Model(&User{}).
		Where("inviter_id = ?", inviterId).
		Select("id, username, display_name, created_at").
		Order("created_at DESC").
		Find(&invitedUsers).Error; err != nil {
		return nil, err
	}

	return map[string]interface{}{
		"total_commission": totalCommission,
		"log_count":        logCount,
		"invited_users":    invitedUsers,
	}, nil
}

// IncreaseInviterAffQuota atomically adds commission to the inviter's affiliate
// quotas. It uses a row lock on MySQL/PostgreSQL and a guarded update on SQLite
// (no nested transactions), mirroring the patterns in checkin.go.
func IncreaseInviterAffQuota(inviterId, amount int) error {
	if amount <= 0 {
		return nil
	}

	if common.UsingMainDatabase(common.DatabaseTypeSQLite) {
		// SQLite does not support row locks; use an atomic expression update so
		// concurrent top-ups do not lose updates via read-modify-write races.
		// Column names follow the User gorm tags (aff_quota, aff_history).
		return DB.Model(&User{}).
			Where("id = ?", inviterId).
			Updates(map[string]interface{}{
				"aff_quota":    gorm.Expr("aff_quota + ?", amount),
				"aff_history":  gorm.Expr("aff_history + ?", amount),
			}).Error
	}

	// MySQL / PostgreSQL: acquire a row lock before mutating.
	return DB.Transaction(func(tx *gorm.DB) error {
		var inviter User
		if err := lockForUpdate(tx).First(&inviter, inviterId).Error; err != nil {
			return err
		}
		inviter.AffQuota += amount
		inviter.AffHistoryQuota += amount
		return tx.Save(&inviter).Error
	})
}
