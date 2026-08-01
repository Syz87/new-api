/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/

// A single recharge-referral commission credited to the inviter.
export interface CommissionLog {
  id: number
  inviter_id: number
  invitee_id: number
  amount: number
  source_amount: number
  trade_no: string
  created_at: number
}

// Non-sensitive projection of a user invited by the current user.
export interface InvitedUser {
  id: number
  username: string
  display_name: string
  created_at: number
}

export interface ReferralStats {
  total_commission: number
  log_count: number
  invited_users: InvitedUser[]
}

export interface ReferralInviter {
  id: number
  username: string
  display_name: string
}

export interface ReferralInfo {
  available_rewards: number
  history_rewards: number
  aff_code: string
  aff_count: number
  inviter: ReferralInviter | null
  commission_logs: CommissionLog[]
  commission_total: number
  stats: ReferralStats
}
