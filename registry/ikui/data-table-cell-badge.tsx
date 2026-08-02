import { Badge } from '@/components/ui/badge'

export function DataTableCellBadge({
  value,
  color,
}: {
  value: string | number
  color?: string
}) {
  return (
    <Badge
      variant="outline"
      className="rounded-sm font-mono font-normal"
      style={
        color
          ? {
              color,
              backgroundColor: `${color}1a`,
              borderColor: `${color}33`,
            }
          : undefined
      }
    >
      {value}
    </Badge>
  )
}
