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
import { ChevronLeft, ChevronRight, Coins } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { IconBadge } from '@/components/ui/icon-badge'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { formatQuota, formatTimestamp } from '@/lib/format'

import type { CommissionLog } from '../types'

interface CommissionTableProps {
  logs: CommissionLog[]
  total: number
  page: number
  pageSize: number
  loading?: boolean
  onPageChange: (page: number) => void
}

export function CommissionTable({
  logs,
  total,
  page,
  pageSize,
  loading,
  onPageChange,
}: CommissionTableProps) {
  const { t } = useTranslation()
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <Card data-card-hover='false'>
      <CardContent className='space-y-4 p-4'>
        <div className='flex items-center gap-2.5'>
          <IconBadge tone='chart-4'>
            <Coins />
          </IconBadge>
          <h3 className='text-sm font-semibold'>{t('Commission records')}</h3>
        </div>

        {loading ? (
          <div className='space-y-3'>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className='rounded-lg border p-3'>
                <Skeleton className='h-4 w-40' />
                <Skeleton className='mt-2 h-3 w-24' />
              </div>
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className='text-muted-foreground flex min-h-32 flex-col items-center justify-center py-8 text-center'>
            <p className='text-sm font-medium'>
              {t('No commission records yet')}
            </p>
          </div>
        ) : (
          <div className='space-y-3'>
            {logs.map((log) => (
              <div key={log.id} className='rounded-lg border p-3'>
                <div className='flex items-start justify-between gap-2'>
                  <code className='text-foreground truncate font-mono text-sm'>
                    {log.trade_no}
                  </code>
                  <span className='text-muted-foreground shrink-0 text-xs'>
                    {formatTimestamp(log.created_at)}
                  </span>
                </div>
                <div className='mt-3 grid grid-cols-2 gap-3'>
                  <div className='space-y-1'>
                    <Label className='text-muted-foreground text-xs'>
                      {t('Amount')}
                    </Label>
                    <div className='text-sm font-semibold tabular-nums'>
                      {formatQuota(log.amount)}
                    </div>
                  </div>
                  <div className='space-y-1'>
                    <Label className='text-muted-foreground text-xs'>
                      {t('Source Amount')}
                    </Label>
                    <div className='text-muted-foreground text-sm tabular-nums'>
                      {formatQuota(log.source_amount)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {total > pageSize ? (
          <div className='flex items-center justify-between pt-1'>
            <span className='text-muted-foreground text-xs'>
              {t('Showing')} {Math.min((page - 1) * pageSize + 1, total)}-
              {Math.min(page * pageSize, total)} {t('of')} {total}
            </span>
            <div className='flex items-center gap-1'>
              <Button
                variant='outline'
                size='icon'
                className='size-8'
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1}
                aria-label={t('Previous')}
              >
                <ChevronLeft className='size-4' />
              </Button>
              <span className='px-1 text-sm font-medium'>
                {page} / {totalPages}
              </span>
              <Button
                variant='outline'
                size='icon'
                className='size-8'
                onClick={() => onPageChange(page + 1)}
                disabled={page >= totalPages}
                aria-label={t('Next')}
              >
                <ChevronRight className='size-4' />
              </Button>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
