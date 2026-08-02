package model

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// setupReferralTest ensures the referral_logs table exists on the shared in-memory
// SQLite DB initialized by TestMain (which predates this table). The User table is
// already migrated by TestMain, so it is intentionally not re-migrated here.
func setupReferralTest(t *testing.T) {
	t.Helper()
	require.NoError(t, DB.AutoMigrate(&ReferralLog{}))
	require.NoError(t, DB.Where("1 = 1").Unscoped().Delete(&ReferralLog{}).Error)
	t.Cleanup(func() {
		require.NoError(t, DB.Where("1 = 1").Unscoped().Delete(&ReferralLog{}).Error)
	})
}

func TestCreateReferralLog(t *testing.T) {
	setupReferralTest(t)

	log := &ReferralLog{
		InviterId:    100,
		InviteeId:    200,
		Amount:       50,
		SourceAmount: 500,
		TradeNo:      "TUC500",
	}
	require.NoError(t, CreateReferralLog(log))
	assert.NotZero(t, log.Id, "CreateReferralLog should assign a primary key")
	assert.NotZero(t, log.CreatedAt, "CreateReferralLog should stamp CreatedAt when unset")

	// Re-fetch and verify the persisted row.
	var got ReferralLog
	require.NoError(t, DB.First(&got, log.Id).Error)
	assert.Equal(t, 100, got.InviterId)
	assert.Equal(t, 200, got.InviteeId)
	assert.Equal(t, 50, got.Amount)
	assert.Equal(t, 500, got.SourceAmount)
	assert.Equal(t, "TUC500", got.TradeNo)
}

func TestGetReferralLogsByInviterIdPaginatesAndOrders(t *testing.T) {
	setupReferralTest(t)

	// 3 logs for inviter 1, 1 log for inviter 2 (must be excluded).
	// Explicit ascending CreatedAt so ORDER BY created_at DESC is deterministic
	// (time.Now().Unix() would collide within the same second).
	baseTs := int64(1700000000)
	for i, amt := range []int{10, 20, 30} {
		require.NoError(t, CreateReferralLog(&ReferralLog{
			InviterId:    1,
			InviteeId:    100 + i,
			Amount:       amt,
			SourceAmount: amt * 10,
			TradeNo:      "trade-" + string(rune('a'+i)),
			CreatedAt:    baseTs + int64(i),
		}))
	}
	require.NoError(t, CreateReferralLog(&ReferralLog{InviterId: 2, InviteeId: 200, Amount: 99, SourceAmount: 999, TradeNo: "other", CreatedAt: baseTs}))

	// Page 1 (size 2): newest two of inviter 1 -> amounts 30, 20.
	logs, total, err := GetReferralLogsByInviterId(1, 1, 2)
	require.NoError(t, err)
	assert.Equal(t, int64(3), total)
	require.Len(t, logs, 2)
	assert.Equal(t, 30, logs[0].Amount)
	assert.Equal(t, 20, logs[1].Amount)

	// Page 2 (size 2): oldest of inviter 1 -> amount 10.
	logs, total, err = GetReferralLogsByInviterId(1, 2, 2)
	require.NoError(t, err)
	assert.Equal(t, int64(3), total)
	require.Len(t, logs, 1)
	assert.Equal(t, 10, logs[0].Amount)
}

func TestGetReferralStatsAggregates(t *testing.T) {
	setupReferralTest(t)

	require.NoError(t, CreateReferralLog(&ReferralLog{InviterId: 7, InviteeId: 701, Amount: 40, SourceAmount: 400, TradeNo: "t1"}))
	require.NoError(t, CreateReferralLog(&ReferralLog{InviterId: 7, InviteeId: 702, Amount: 60, SourceAmount: 600, TradeNo: "t2"}))
	require.NoError(t, CreateReferralLog(&ReferralLog{InviterId: 8, InviteeId: 800, Amount: 999, SourceAmount: 9999, TradeNo: "t3"}))

	stats, err := GetReferralStats(7)
	require.NoError(t, err)

	// total_commission and log_count only reflect inviter 7 (40 + 60).
	assert.Equal(t, int64(100), stats["total_commission"])
	assert.Equal(t, int64(2), stats["log_count"])

	invited, ok := stats["invited_users"].([]InvitedUser)
	assert.True(t, ok, "invited_users should be []InvitedUser")
	assert.Empty(t, invited, "invited_users should be empty when no users have inviter_id=7")
}

func TestIncreaseInviterAffQuotaUpdatesInviter(t *testing.T) {
	setupReferralTest(t)

	// Seed an inviter user directly. High Id + unique Username/AffCode avoid
	// collisions with other tests sharing the in-memory DB.
	inviter := &User{Id: 99042, Username: "inviter-99042", Password: "password123", AffCode: "code99042", AffQuota: 10, AffHistoryQuota: 10}
	require.NoError(t, DB.Create(inviter).Error)
	t.Cleanup(func() {
		require.NoError(t, DB.Unscoped().Delete(&User{}, 99042).Error)
	})

	require.NoError(t, IncreaseInviterAffQuota(42, 5))

	var got User
	require.NoError(t, DB.First(&got, 42).Error)
	assert.Equal(t, 15, got.AffQuota, "AffQuota should increase by the commission")
	assert.Equal(t, 15, got.AffHistoryQuota, "AffHistoryQuota should track the same commission")

	// Non-positive amount is a no-op (defends against no-op commission writes).
	require.NoError(t, IncreaseInviterAffQuota(42, 0))
	require.NoError(t, DB.First(&got, 42).Error)
	assert.Equal(t, 15, got.AffQuota, "zero commission must not mutate quotas")
}
