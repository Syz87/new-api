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
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { SectionPageLayout } from '@/components/layout'
import { TransferDialog } from '@/features/wallet/components/dialogs/transfer-dialog'
import { useAffiliate, useTopupInfo } from '@/features/wallet/hooks'
import { getSelf } from '@/lib/api'

import { CommissionTable } from './components/commission-table'
import { InviteInfoCard } from './components/invite-info-card'
import { OverviewCard } from './components/overview-card'
import { useReferral } from './hooks/use-referral'

export function Referrals() {
  const { t } = useTranslation()
  const [transferDialogOpen, setTransferDialogOpen] = useState(false)
  const [availableQuota, setAvailableQuota] = useState(0)

  const { data, loading, page, pageSize, setPage, refetch } = useReferral()
  const {
    affiliateLink,
    loading: affiliateLoading,
    transferQuota,
    transferring,
  } = useAffiliate()
  const { topupInfo } = useTopupInfo()

  const complianceConfirmed = topupInfo?.payment_compliance_confirmed !== false
  const availableRewards = data?.available_rewards ?? 0

  // Transfer dialog needs the freshest available quota; refresh from the server
  // when opening so a stale overview value can't over-transfer.
  const handleOpenTransfer = async () => {
    try {
      const res = await getSelf()
      if (res.success && res.data) {
        setAvailableQuota((res.data as { aff_quota?: number }).aff_quota ?? 0)
      } else {
        setAvailableQuota(availableRewards)
      }
    } catch {
      setAvailableQuota(availableRewards)
    }
    setTransferDialogOpen(true)
  }

  const handleTransfer = async (amount: number) => {
    const success = await transferQuota(amount)
    if (success) {
      refetch()
    }
    return success
  }

  return (
    <>
      <SectionPageLayout>
        <SectionPageLayout.Title>
          {t('Referral rewards and commission records')}
        </SectionPageLayout.Title>
        <SectionPageLayout.Content>
          <div className='mx-auto flex w-full max-w-7xl flex-col gap-4 sm:gap-5'>
            <OverviewCard
              availableRewards={availableRewards}
              historyRewards={data?.history_rewards ?? 0}
              affCount={data?.aff_count ?? 0}
              affiliateLink={affiliateLink}
              onTransfer={handleOpenTransfer}
              complianceConfirmed={complianceConfirmed}
              loading={loading || affiliateLoading}
            />

            <div className='grid gap-4 lg:grid-cols-2 lg:items-start'>
              <InviteInfoCard
                affCode={data?.aff_code ?? ''}
                affCount={data?.aff_count ?? 0}
                historyRewards={data?.history_rewards ?? 0}
                inviter={data?.inviter ?? null}
                invitedUsers={data?.stats?.invited_users ?? []}
                loading={loading}
              />

              <CommissionTable
                logs={data?.commission_logs ?? []}
                total={data?.commission_total ?? 0}
                page={page}
                pageSize={pageSize}
                loading={loading}
                onPageChange={setPage}
              />
            </div>
          </div>
        </SectionPageLayout.Content>
      </SectionPageLayout>

      <TransferDialog
        open={transferDialogOpen}
        onOpenChange={setTransferDialogOpen}
        onConfirm={handleTransfer}
        availableQuota={availableQuota}
        transferring={transferring}
      />
    </>
  )
}
