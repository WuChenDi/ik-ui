import type {
  CellData,
  Column,
  RowData,
  TableFeatures,
} from '@tanstack/react-table'
import {
  columnFacetingFeature,
  columnFilteringFeature,
  columnPinningFeature,
  columnSizingFeature,
  columnVisibilityFeature,
  createCoreRowModel,
  createFacetedMinMaxValues,
  createFacetedRowModel,
  createFacetedUniqueValues,
  createFilteredRowModel,
  createSortedRowModel,
  filterFn_arrHas,
  filterFn_includesString,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_datetime,
  sortFn_text,
  tableFeatures,
} from '@tanstack/react-table'

/**
 * The table features the data-table components rely on, registered once and
 * shared across every table. TanStack Table v9 is feature-composed: a method
 * only exists on the instance when its feature is registered, so the presentation
 * components (pinning, sizing, visibility, selection, sorting, filtering,
 * faceting) all depend on this baseline being present.
 *
 * Row-model factories are memoized per table, so sharing these instances across
 * tables is safe. `paginatedRowModel` is intentionally left out — it slices the
 * row model and would break non-paginated tables (e.g. the virtualized demo).
 * Tables that want pagination add `paginatedRowModel: createPaginatedRowModel()`
 * on top; `DataTable` keys its pagination footer off that registration, so a
 * table that skips it simply renders no footer.
 */
export const dataTableFeatures = tableFeatures({
  columnFacetingFeature,
  columnFilteringFeature,
  columnPinningFeature,
  columnSizingFeature,
  columnVisibilityFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  coreRowModel: createCoreRowModel(),
  filteredRowModel: createFilteredRowModel(),
  sortedRowModel: createSortedRowModel(),
  facetedRowModel: createFacetedRowModel(),
  facetedUniqueValues: createFacetedUniqueValues(),
  facetedMinMaxValues: createFacetedMinMaxValues(),
  // Register only the built-in filter/sort fns the demos reference (by name or
  // via `'auto'` resolution) — the aggregate `filterFns`/`sortFns` objects are
  // deprecated because they opt every built-in into the bundle. `sortFn: 'auto'`
  // falls back to `sortFn_basic` directly for numbers/booleans, so only the
  // string/date fns need registering here.
  filterFns: {
    includesString: filterFn_includesString,
    // `arrHas` is the select/multiSelect filter: a scalar cell value matched
    // against the array of selected options. `arrIncludesSome` is its mirror —
    // it requires the *cell* to be the array — and silently drops every row
    // when pointed at a scalar column.
    arrHas: filterFn_arrHas,
  },
  sortFns: {
    alphanumeric: sortFn_alphanumeric,
    text: sortFn_text,
    datetime: sortFn_datetime,
  },
})

/**
 * The concrete feature set every data-table instance shares. Thread this through
 * `Table`/`ReactTable`/`Column`/`Row`/`ColumnDef` generics instead of `any` to
 * keep full type inference (state slices, cell values) across the components.
 */
export type DataTableFeatures = typeof dataTableFeatures

/**
 * The filter variants a column can declare through `columnDef.meta.variant`.
 * The toolbar renders a matching control for each one.
 */
export type FilterVariant =
  | 'text'
  | 'number'
  | 'range'
  | 'date'
  | 'dateRange'
  | 'select'
  | 'multiSelect'

/** An option for the faceted (select / multiSelect) filter. */
export interface Option {
  label: string
  value: string
  count?: number
  icon?: React.FC<React.SVGProps<SVGSVGElement>>
}

// Teach TanStack Table about the extra per-column metadata the toolbar and
// filters read. Importing this file anywhere in the program applies the
// augmentation, so the `column.columnDef.meta` fields below are typed.
declare module '@tanstack/react-table' {
  interface ColumnMeta<
    in out TFeatures extends TableFeatures,
    in out TData extends RowData,
    TValue extends CellData = CellData,
  > {
    label?: string
    placeholder?: string
    variant?: FilterVariant
    options?: Option[]
    range?: [number, number]
    unit?: string
    icon?: React.FC<React.SVGProps<SVGSVGElement>>
  }
}

/**
 * Sticky-column styles for a pinned TanStack Table column. Returns the inline
 * styles that keep a start/end pinned column fixed while the rest scrolls,
 * with an optional inset shadow on the last pinned column of each side.
 */
export function getCommonPinningStyles<TData extends RowData>({
  column,
  withBorder = false,
  isHeader = false,
}: {
  column: Column<DataTableFeatures, TData>
  /** Draw an inset shadow on the outermost pinned column of each side. */
  withBorder?: boolean
  /** Header cells keep their own background, so skip the card fill. */
  isHeader?: boolean
}): React.CSSProperties {
  // TanStack Table v9 renamed the pinning positions from the physical
  // `left`/`right` to the logical `start`/`end`. `column.getIsLastColumn` /
  // `getIsFirstColumn` moved to `columnOrderingFeature`, which this feature set
  // does not register, so the outermost pinned column of each side is derived
  // from the pinned visible leaf columns instead.
  const isPinned = column.getIsPinned()
  const isLastStartPinnedColumn =
    isPinned === 'start' &&
    column.table.getStartVisibleLeafColumns().at(-1)?.id === column.id
  const isFirstEndPinnedColumn =
    isPinned === 'end' &&
    column.table.getEndVisibleLeafColumns()[0]?.id === column.id

  return {
    boxShadow: withBorder
      ? isLastStartPinnedColumn
        ? '-4px 0 4px -4px var(--border) inset'
        : isFirstEndPinnedColumn
          ? '4px 0 4px -4px var(--border) inset'
          : undefined
      : undefined,
    // Logical inset properties, so `start`/`end` follow the writing direction.
    insetInlineStart:
      isPinned === 'start' ? `${column.getStart('start')}px` : undefined,
    insetInlineEnd:
      isPinned === 'end' ? `${column.getAfter('end')}px` : undefined,
    opacity: 1,
    position: isPinned ? 'sticky' : 'relative',
    background: isPinned && !isHeader ? 'var(--card)' : '',
    width: column.getSize(),
    minWidth: column.getSize(),
    maxWidth: column.getSize(),
    zIndex: isPinned ? 1 : 0,
  }
}
