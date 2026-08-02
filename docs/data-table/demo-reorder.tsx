'use client'

import type { DragEndEvent } from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import type { ColumnDef } from '@tanstack/react-table'
import { getCoreRowModel, useReactTable } from '@tanstack/react-table'
import * as React from 'react'
import { DataTable } from '@/registry/ikui/data-table'
import { DataTableCellBadge } from '@/registry/ikui/data-table-cell-badge'
import { DataTableDragHandle } from '@/registry/ikui/data-table-drag-handle'

interface Track {
  id: string
  title: string
  artist: string
  status: string
}

const initialData: Track[] = [
  { id: '1', title: 'Intro', artist: 'Nova', status: 'ready' },
  { id: '2', title: 'Signal', artist: 'Kite', status: 'draft' },
  { id: '3', title: 'Drift', artist: 'Halo', status: 'ready' },
  { id: '4', title: 'Echoes', artist: 'Vega', status: 'review' },
  { id: '5', title: 'Outro', artist: 'Nova', status: 'draft' },
]

const statusColors: Record<string, string> = {
  ready: '#22c55e',
  draft: '#64748b',
  review: '#f59e0b',
}

const columns: ColumnDef<Track>[] = [
  {
    id: 'drag',
    header: () => null,
    cell: () => <DataTableDragHandle />,
    size: 40,
  },
  {
    accessorKey: 'title',
    header: 'Title',
    cell: ({ row }) => (
      <span className="font-medium">{row.getValue('title')}</span>
    ),
  },
  { accessorKey: 'artist', header: 'Artist' },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as string
      return <DataTableCellBadge value={status} color={statusColors[status]} />
    },
  },
]

export function Demo() {
  const [data, setData] = React.useState(initialData)

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
  })

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setData((prev) => {
      const oldIndex = prev.findIndex((row) => row.id === active.id)
      const newIndex = prev.findIndex((row) => row.id === over.id)
      return arrayMove(prev, oldIndex, newIndex)
    })
  }

  return (
    <div className="w-full">
      <DataTable
        table={table}
        enableDragAndDrop
        onDragEnd={onDragEnd}
        getRowId={(row) => row.id}
        showPagination={false}
      />
    </div>
  )
}
