package controller

import (
	"net/http"
	"strconv"

	"github.com/QuantumNous/new-api/model"
	"github.com/gin-gonic/gin"
)

// GetReferralInfo returns the referral overview for the authenticated user:
// available rewards, invitation info, commission logs (paginated) and stats.
// GET /api/user/referral?page=&page_size=
func GetReferralInfo(c *gin.Context) {
	userId := c.GetInt("id")
	user, err := model.GetUserById(userId, false)
	if err != nil || user == nil {
		c.JSON(http.StatusOK, gin.H{"success": false, "message": "用户不存在"})
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 10
	}

	logs, total, err := model.GetReferralLogsByInviterId(userId, page, pageSize)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"success": false, "message": err.Error()})
		return
	}

	stats, err := model.GetReferralStats(userId)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"success": false, "message": err.Error()})
		return
	}

	// 邀请人信息：只回必要字段，避免泄漏敏感信息
	inviterInfo := gin.H(nil)
	if user.InviterId > 0 {
		if inviter, e := model.GetUserById(user.InviterId, false); e == nil && inviter != nil {
			inviterInfo = gin.H{
				"id":           inviter.Id,
				"username":     inviter.Username,
				"display_name": inviter.DisplayName,
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"available_rewards": user.AffQuota,       // 可用奖励（可转移到余额）
			"history_rewards":  user.AffHistoryQuota, // 历史累计奖励
			"aff_code":         user.AffCode,         // 邀请码
			"aff_count":        user.AffCount,        // 邀请人数
			"inviter":          inviterInfo,          // 邀请人（无则为 null）
			"commission_logs":  logs,                 // 佣金记录
			"commission_total": total,                // 记录总数（用于分页）
			"stats":            stats,                // 统计：累计返佣/记录数/已邀请用户列表
		},
	})
}
