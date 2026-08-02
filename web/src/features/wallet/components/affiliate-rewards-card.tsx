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
import { Gift, Share2, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { CopyButton } from '@/components/copy-button'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { IconBadge } from '@/components/ui/icon-badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { formatQuota } from '@/lib/format'

import type { UserWalletData } from '../types'

interface AffiliateRewardsCardProps {
  user: UserWalletData | null
  affiliateLink: string
  onTransfer: () => void
  complianceConfirmed?: boolean
  quotaForInviter?: number
  quotaForInvitee?: number
  loading?: boolean
}

export function AffiliateRewardsCard({
  user,
  affiliateLink,
  onTransfer,
  complianceConfirmed = true,
  quotaForInviter,
  quotaForInvitee,
  loading,
}: AffiliateRewardsCardProps) {
  const { t } = useTranslation()
  if (loading) {
    return (
      <Card data-card-hover='false' className='py-0'>
        <CardContent className='p-4 sm:p-5'>
          <Skeleton className='h-5 w-36' />
          <Skeleton className='mt-3 h-4 w-full' />
          <div className='mt-4 grid grid-cols-3 gap-3'>
            <Skeleton className='h-14 rounded-lg' />
            <Skeleton className='h-14 rounded-lg' />
            <Skeleton className='h-14 rounded-lg' />
          </div>
          <Skeleton className='mt-4 h-10 rounded-lg' />
        </CardContent>
      </Card>
    )
  }

  const hasRewards = (user?.aff_quota ?? 0) > 0
  const hasInviterReward = (quotaForInviter ?? 0) > 0
  const hasInviteeReward = (quotaForInvitee ?? 0) > 0

  return (
    <Card data-card-hover='false' className='py-0'>
      <CardContent className='space-y-4 p-4 sm:p-5'>
        {/* Title + full description */}
        <div>
          <div className='flex items-center gap-2.5'>
            <IconBadge tone='chart-3'>
              <Share2 />
            </IconBadge>
            <h3 className='text-sm font-semibold'>
              {t('Referral Program')}
            </h3>
          </div>
          <p className='text-muted-foreground mt-2 text-sm leading-relaxed'>
            {t(
              'Earn rewards when users join through your referral link. Transfer accumulated rewards to your balance anytime.'
            )}
          </p>
        </div>

        {/* Inviter / Invitee reward rules */}
        {(hasInviterReward || hasInviteeReward) ? (
          <div className='bg-accent/40 flex flex-wrap gap-3 rounded-lg p-3 text-xs'>
            {hasInviterReward ? (
              <div className='flex items-center gap-1.5'>
                <Users className='text-primary size-3.5' />
                <span className='text-muted-foreground'>{t('Inviter Reward')}:</span>
                <span className='font-semibold tabular-nums'>
                  {formatQuota(quotaForInviter!)}
                </span>
              </div>
            ) : null}
            {hasInviteeReward ? (
              <div className='flex items-center gap-1.5'>
                <Gift className='text-primary size-3.5' />
                <span className='text-muted-foreground'>{t('Invitee Reward')}:</span>
                <span className='font-semibold tabular-nums'>
                  {formatQuota(quotaForInvitee!)}
                </span>
              </div>
            ) : null}
          </div>
        ) : null}

        {/* Stats row */}
        <div className='grid grid-cols-3 gap-2 text-center'>
          {[
            [t('Available Rewards'), formatQuota(user?.aff_quota ?? 0)],
            [t('Total Earned'), formatQuota(user?.aff_history_quota ?? 0)],
            [t('Invites'), String(user?.aff_count ?? 0)],
          ].map(([label, value]) => (
            <div key={label}>
              <div className='text-muted-foreground text-[10px] font-medium tracking-wider uppercase'>
                {label}
              </div>
              <div className='mt-0.5 text-sm font-semibold tabular-nums'>
                {value}
              </div>
            </div>
          ))}
        </div>

        {/* Link + Actions */}
        <div className='flex items-center gap-2'>
          <Input
            value={affiliateLink}
            readOnly
            className='border-muted bg-background/70 h-9 min-w-0 flex-1 font-mono text-xs'
          />
          <CopyButton
            value={affiliateLink}
            variant='outline'
            className='bg-background size-9 shrink-0'
            iconClassName='size-4'
            tooltip={t('Copy referral link')}
            aria-label={t('Copy referral link')}
          />
          {hasRewards ? (
            <Button
              onClick={onTransfer}
              disabled={!complianceConfirmed}
              className='h-9 shrink-0 px-3'
              size='sm'
            >
              {t('Transfer to Balance')}
            </Button>
          ) : null}
        </div>

        {!complianceConfirmed ? (
          <p className='text-muted-foreground text-xs'>
            {t(
              'Referral reward transfer is disabled until the administrator confirms compliance terms.'
            )}
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}
