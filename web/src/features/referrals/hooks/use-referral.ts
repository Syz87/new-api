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
import { useCallback, useEffect, useState } from 'react'

import { getReferralInfo } from '../api'
import type { ReferralInfo } from '../types'

// useReferral fetches the referral overview (rewards, invitation info, paginated
// commission logs and stats) for the current user. Page changes refetch.
export function useReferral() {
  const [data, setData] = useState<ReferralInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)

  const fetchReferral = useCallback(
    async (targetPage: number) => {
      try {
        setLoading(true)
        setError(null)
        const response = await getReferralInfo(targetPage, pageSize)
        if (response.success && response.data) {
          setData(response.data)
        } else {
          setError(response.message || 'Failed to load referral info')
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load referral info')
      } finally {
        setLoading(false)
      }
    },
    [pageSize]
  )

  useEffect(() => {
    fetchReferral(page)
  }, [page, fetchReferral])

  return {
    data,
    loading,
    error,
    page,
    pageSize,
    setPage,
    refetch: () => fetchReferral(page),
  }
}
