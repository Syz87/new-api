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
import { UserPlus } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Card, CardContent } from '@/components/ui/card'
import { IconBadge } from '@/components/ui/icon-badge'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { formatQuota, formatTimestamp } from '@/lib/format'

import type { InvitedUser, ReferralInviter } from '../types'

interface InviteInfoCardProps {
  affCode: string
  affCount: number
  historyRewards: number
  inviter: ReferralInviter | null
  invitedUsers: InvitedUser[]
  loading?: boolean
}

export function InviteInfoCard({
  affCode,
  affCount,
  historyRewards,
  inviter,
  invitedUsers,
  loading,
}: InviteInfoCardProps) {
  const { t } = useTranslation()

  if (loading) {
    return (
      <Card data-card-hover='false'>
        <CardContent className='space-y-4 p-4'>
          <Skeleton className='h-5 w-24' />
          <div className='grid grid-cols-2 gap-3 sm:grid-cols-3'>
            <Skeleton className='h-12' />
            <Skeleton className='h-12' />
            <Skeleton className='h-12' />
          </div>
          <Skeleton className='h-20' />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card data-card-hover='false'>
      <CardContent className='space-y-4 p-4'>
        <div className='flex items-center gap-2.5'>
          <IconBadge tone='chart-2'>
            <UserPlus />
          </IconBadge>
          <h3 className='text-sm font-semibold'>{t('Invite Info')}</h3>
        </div>

        <div className='grid grid-cols-2 gap-3 sm:grid-cols-3'>
          <div className='space-y-1'>
            <Label className='text-muted-foreground text-xs'>
              {t('Invitation Code')}
            </Label>
            <div className='truncate font-mono text-sm font-semibold'>
              {affCode || '-'}
            </div>
          </div>
          <div className='space-y-1'>
            <Label className='text-muted-foreground text-xs'>
              {t('Invited Users')}
            </Label>
            <div className='text-sm font-semibold tabular-nums'>{affCount}</div>
          </div>
          <div className='space-y-1'>
            <Label className='text-muted-foreground text-xs'>
              {t('Invitation Quota')}
            </Label>
            <div className='text-sm font-semibold tabular-nums'>
              {formatQuota(historyRewards)}
            </div>
          </div>
        </div>

        <div className='space-y-1'>
          <Label className='text-muted-foreground text-xs'>
            {t('Inviter')}
          </Label>
          <div className='text-sm font-medium'>
            {inviter ? inviter.display_name || inviter.username : t('No Inviter')}
          </div>
        </div>

        <div className='space-y-2'>
          <Label className='text-muted-foreground text-xs'>
            {t('Invited Users')}
          </Label>
          {invitedUsers.length === 0 ? (
            <p className='text-muted-foreground text-xs'>
              {t('No invited users yet')}
            </p>
          ) : (
            <div className='divide-y'>
              {invitedUsers.map((u) => (
                <div
                  key={u.id}
                  className='flex items-center justify-between py-2 text-sm'
                >
                  <span className='truncate font-medium'>
                    {u.display_name || u.username}
                  </span>
                  <span className='text-muted-foreground ml-2 shrink-0 text-xs'>
                    {formatTimestamp(u.created_at)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
