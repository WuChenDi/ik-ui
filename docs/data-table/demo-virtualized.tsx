'use client'

import type { ColumnDef } from '@tanstack/react-table'
import { useTable } from '@tanstack/react-table'
import { DataTable } from '@/registry/ikui/data-table'
import { DataTableCellBadge } from '@/registry/ikui/data-table-cell-badge'
import { DataTableCellBar } from '@/registry/ikui/data-table-cell-bar'
import { DataTableCellNumber } from '@/registry/ikui/data-table-cell-number'
import { DataTableCellText } from '@/registry/ikui/data-table-cell-text'
import { DataTableColumnHeader } from '@/registry/ikui/data-table-column-header'
import type { DataTableFeatures } from '@/registry/ikui/data-table-utils'
import { dataTableFeatures } from '@/registry/ikui/data-table-utils'

interface Service {
  id: string
  name: string
  region: string
  requests: number
  latency: number
}

const regions = ['us-east', 'us-west', 'eu-central', 'ap-south'] as const

const regionColors: Record<string, string> = {
  'us-east': '#3b82f6',
  'us-west': '#22c55e',
  'eu-central': '#f59e0b',
  'ap-south': '#a855f7',
}

// 5,000 rows, generated deterministically so server and client render the same
// values (avoids hydration mismatches). Far past the 20-row threshold, so the
// table virtualizes: only the rows in view are mounted to the DOM.
const data: Service[] = Array.from({ length: 5000 }, (_, i) => ({
  id: `SVC-${(i + 1).toString().padStart(4, '0')}`,
  name: `service-${i + 1}`,
  region: regions[i % regions.length],
  requests: (i * 7919) % 1_000_000,
  latency: 20 + ((i * 37) % 480),
}))

const columns: ColumnDef<DataTableFeatures, Service>[] = [
  {
    accessorKey: 'id',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="ID" />
    ),
    cell: ({ row }) => (
      <span className="font-mono text-xs">{row.getValue('id')}</span>
    ),
  },
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Service" />
    ),
    cell: ({ row }) => <DataTableCellText value={row.getValue('name')} />,
  },
  {
    accessorKey: 'region',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Region" />
    ),
    cell: ({ row }) => {
      const region = row.getValue('region') as string
      return <DataTableCellBadge value={region} color={regionColors[region]} />
    },
  },
  {
    accessorKey: 'requests',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Requests" />
    ),
    cell: ({ row }) => <DataTableCellNumber value={row.getValue('requests')} />,
  },
  {
    accessorKey: 'latency',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Latency" />
    ),
    cell: ({ row }) => (
      <DataTableCellBar
        value={row.getValue('latency')}
        min={0}
        max={500}
        unit="ms"
      />
    ),
  },
]

export function Demo() {
  const table = useTable({
    data,
    columns,
    features: dataTableFeatures,
  })

  return (
    // A bounded height turns the table container into the scroll element the
    // virtualizer measures against. Without it there is nothing to virtualize.
    <div className="flex h-[520px] w-full flex-col">
      <DataTable table={table} estimateRowSize={44} />
    </div>
  )
}
