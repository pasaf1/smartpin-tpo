'use client'

import { useMemo, useState } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
} from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useAllPinItems, useUpdatePinItemStatus } from '@/lib/hooks/usePinItems'
import { usePins } from '@/lib/hooks/usePins'
import { StatusBadge } from '@/components/ui/status-badge'
import { SeverityBadge } from '@/components/ui/severity-badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { SmartSearchInput } from '@/components/search/SmartSearchInput'
import { performSemanticSearch, type SearchWeights } from '@/lib/utils/nlp-search'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { Database } from '@/lib/database.types'

type PinItem = Database['public']['Tables']['pin_items']['Row']

interface PinItemsTableProps {
  roofId?: string
  pinId?: string
  className?: string
  maxHeight?: string
  showPagination?: boolean
  enableVirtualization?: boolean
  onlyOpenItems?: boolean
  showClosureButtons?: boolean
  onClosurePhotoClick?: (pinItemId: string) => void
  onEditClick?: (pinItemId: string) => void
  defaultStatusFilter?: 'all' | 'Open' | 'ReadyForInspection' | 'Closed'
}

export function PinItemsTable({
  roofId,
  pinId,
  className,
  maxHeight = '600px',
  showPagination = true,
  enableVirtualization = true,
  onlyOpenItems = false,
  showClosureButtons = false,
  onClosurePhotoClick,
  onEditClick,
  defaultStatusFilter = 'all',
}: PinItemsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([
  { id: 'opened_at', desc: true }
  ])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [globalFilter, setGlobalFilter] = useState('')
  const [semanticResults, setSemanticResults] = useState<any[]>([])
  const [useSemanticSearch, setUseSemanticSearch] = useState(false)

  const { data: pinItems = [], isLoading, error } = useAllPinItems(roofId)
  const { data: pins = [] } = usePins(roofId || '') as { data: any[] }
  const updateStatusMutation = useUpdatePinItemStatus()

  // Helper function to determine zone based on pin coordinates
  const getZoneFromCoordinates = (x: number, y: number): string => {
    if (x < 33 && y < 33) return 'North-West'
    if (x >= 33 && x < 67 && y < 33) return 'North'
    if (x >= 67 && y < 33) return 'North-East'
    if (x < 33 && y >= 33 && y < 67) return 'West'
    if (x >= 33 && x < 67 && y >= 33 && y < 67) return 'Center'
    if (x >= 67 && y >= 33 && y < 67) return 'East'
    if (x < 33 && y >= 67) return 'South-West'
    if (x >= 33 && x < 67 && y >= 67) return 'South'
    return 'South-East'
  }

  // Enhance pin items with zone information
  const enhancedPinItems = useMemo(() => {
    return pinItems.map(item => {
      const pin = pins.find(p => p.id === item.pin_id)
      const zone = pin ? getZoneFromCoordinates(pin.x, pin.y) : 'Unknown'
      return { ...item, zone } as PinItem & { zone: string }
    })
  }, [pinItems, pins])

  // Filter by specific pin if provided and apply open items filter
  const baseFilteredData = useMemo(() => {
    let filteredItems = enhancedPinItems
    
    if (pinId) {
      filteredItems = filteredItems.filter(item => item.pin_id === pinId)
    }
    
    if (onlyOpenItems) {
      filteredItems = filteredItems.filter(item => 
        item.status === 'Open' || item.status === 'ReadyForInspection'
      )
    }
    
    return filteredItems
  }, [enhancedPinItems, pinId, onlyOpenItems])

  // Semantic search field mapping
  // Map required keys for semantic search; unused fields map to existing ones
  const searchFieldMap = {
    title: 'description' as keyof PinItem,
    description: 'description' as keyof PinItem,
    status: 'status' as keyof PinItem,
    severity: 'severity' as keyof PinItem,
    created_by: 'opened_by' as keyof PinItem,
  }

  // Available search terms for suggestions
  const availableTerms = useMemo(() => {
    const terms = new Set<string>()
    baseFilteredData.forEach(item => {
      if (item.description) terms.add(item.description)
      terms.add(item.status)
      terms.add(item.severity)
    })
    return Array.from(terms)
  }, [baseFilteredData])

  // Final filtered data (semantic or regular)
  const filteredData = useMemo(() => {
    if (useSemanticSearch && globalFilter.trim()) {
      return semanticResults
    }
    return baseFilteredData
  }, [useSemanticSearch, globalFilter, semanticResults, baseFilteredData])

  // Handle semantic search
  const handleSemanticSearch = (query: string, expandedTerms: string[]) => {
    if (!query.trim()) {
      setUseSemanticSearch(false)
      setSemanticResults([])
      return
    }

    const results = performSemanticSearch(
      baseFilteredData,
      query,
      searchFieldMap,
      {
        title: 2.5,
        description: 3.0,
        status: 1.5,
        severity: 1.5,
        created_by: 0.5,
      },
      0.1 // threshold
    )

    setSemanticResults(results)
    setUseSemanticSearch(true)
  }

  const handleStatusChange = async (itemId: string, newStatus: 'Open' | 'ReadyForInspection' | 'Closed') => {
    await updateStatusMutation.mutateAsync({ id: itemId, status: newStatus as any })
  }

  type RowType = PinItem & { zone: string }

  const columns = useMemo<ColumnDef<RowType>[]>(
    () => [
      {
        accessorKey: 'seq_suffix',
        header: '#',
        cell: ({ row }) => (
          <div className="w-12 text-center font-mono text-sm">
            {row.original.seq_suffix}
          </div>
        ),
        size: 60,
      },
      {
        accessorKey: 'description',
        header: 'Description',
        cell: ({ row }) => (
          <div className="min-w-0">
            {row.original.description && (
              <div className="text-xs text-muted-foreground line-clamp-2 mt-1">
                {row.original.description}
              </div>
            )}
            {useSemanticSearch && 'relevanceScore' in (row.original as any) && (
              <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                Relevance: {((row.original as any).relevanceScore as number).toFixed(2)}
              </div>
            )}
          </div>
        ),
        size: 300,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <StatusBadge status={row.original.status} />
            <Select
              value={row.original.status}
              onValueChange={(value) =>
                handleStatusChange(row.original.id, value as 'Open' | 'ReadyForInspection' | 'Closed')
              }
              disabled={updateStatusMutation.isPending}
            >
              <SelectTrigger className="w-8 h-8 p-0 border-0 bg-transparent hover:bg-muted">
                <div className="w-2 h-2 bg-muted-foreground/40 rounded-full" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Open">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full" />
                    Open
                  </div>
                </SelectItem>
                <SelectItem value="ReadyForInspection">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-amber-500 rounded-full" />
                    Ready
                  </div>
                </SelectItem>
                <SelectItem value="Closed">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    Closed
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        ),
        size: 150,
        filterFn: 'equals',
      },
      {
        accessorKey: 'severity',
        header: 'Severity',
        cell: ({ row }) => <SeverityBadge severity={row.original.severity} />,
        size: 100,
        filterFn: 'equals',
      },
      {
        accessorKey: 'zone',
        header: 'Zone',
        cell: ({ row }) => (
          <Badge variant="outline" className="text-xs">
            {(row.original as any).zone}
          </Badge>
        ),
        size: 120,
        filterFn: 'equals',
      },
      {
        accessorKey: 'opened_at',
        header: 'Opened',
        cell: ({ row }) => (
          <div className="text-xs text-muted-foreground font-mono">
            {new Date(row.original.opened_at).toLocaleDateString()}
            <br />
            {new Date(row.original.opened_at).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        ),
        size: 110,
      },
      // Actions column can be re-added when wired
    ],
    [updateStatusMutation.isPending, useSemanticSearch]
  )

  const table = useReactTable({
    data: filteredData,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: showPagination ? getPaginationRowModel() : undefined,
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: 'includesString',
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter,
    },
    initialState: {
      pagination: {
        pageSize: enableVirtualization ? 50 : 10,
      },
    },
  })

  // Apply initial status filter from props
  useMemo(() => {
    const col = table.getColumn('status')
    if (!col) return
    const current = (col.getFilterValue() as string) ?? ''
    const desired = defaultStatusFilter === 'all' ? '' : defaultStatusFilter
    if (current !== desired) {
      col.setFilterValue(desired)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, defaultStatusFilter])

  if (isLoading) {
    return (
      <div className={cn('border rounded-lg', className)}>
        <div className="p-8 text-center">
          <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Loading pin items...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn('border rounded-lg border-destructive/20', className)}>
        <div className="p-8 text-center">
          <div className="w-6 h-6 text-destructive mx-auto mb-2">⚠️</div>
          <p className="text-sm text-destructive">Failed to load pin items</p>
        </div>
      </div>
    )
  }

  const rows = table.getRowModel().rows

  return (
    <div className={cn('border rounded-lg bg-card', className)}>
      {/* Header with search and filters */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 max-w-md">
            <SmartSearchInput
              value={globalFilter ?? ''}
              onChange={(value) => {
                setGlobalFilter(value)
                if (!value.trim()) {
                  setUseSemanticSearch(false)
                  setSemanticResults([])
                }
              }}
              onSearch={handleSemanticSearch}
              placeholder="Smart search: try 'membrane repair' or 'critical issues'..."
              availableTerms={availableTerms}
              className="w-full"
              showSuggestions={true}
              showIntent={true}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Select
              value={
                (table.getColumn('status')?.getFilterValue() as string) ?? 'all'
              }
              onValueChange={(value) =>
                table.getColumn('status')?.setFilterValue(value === 'all' ? '' : value)
              }
            >
              <SelectTrigger className="w-32 h-9">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Open">Open</SelectItem>
                <SelectItem value="ReadyForInspection">Ready</SelectItem>
                <SelectItem value="Closed">Closed</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={
                (table.getColumn('severity')?.getFilterValue() as string) ?? 'all'
              }
              onValueChange={(value) =>
                table.getColumn('severity')?.setFilterValue(value === 'all' ? '' : value)
              }
            >
              <SelectTrigger className="w-32 h-9">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severity</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Critical">Critical</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={
                (table.getColumn('zone')?.getFilterValue() as string) ?? 'all'
              }
              onValueChange={(value) =>
                table.getColumn('zone')?.setFilterValue(value === 'all' ? '' : value)
              }
            >
              <SelectTrigger className="w-36 h-9">
                <SelectValue placeholder="Zone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Zones</SelectItem>
                <SelectItem value="North-West">North-West</SelectItem>
                <SelectItem value="North">North</SelectItem>
                <SelectItem value="North-East">North-East</SelectItem>
                <SelectItem value="West">West</SelectItem>
                <SelectItem value="Center">Center</SelectItem>
                <SelectItem value="East">East</SelectItem>
                <SelectItem value="South-West">South-West</SelectItem>
                <SelectItem value="South">South</SelectItem>
                <SelectItem value="South-East">South-East</SelectItem>
              </SelectContent>
            </Select>

            <Badge variant="secondary" className="ml-2">
              {filteredData.length} items
              {useSemanticSearch && (
                <span className="ml-1 text-blue-600">• Smart Search</span>
              )}
            </Badge>
          </div>
        </div>
      </div>

      {/* Table */}
      <div 
        className="relative overflow-auto custom-scrollbar"
        style={{ maxHeight }}
      >
        <Table>
          <TableHeader className="sticky top-0 bg-card z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="select-none"
                    style={{ width: header.getSize() }}
                  >
                    {header.isPlaceholder ? null : (
                      <div
                        className={cn(
                          'flex items-center gap-2',
                          header.column.getCanSort() &&
                            'cursor-pointer hover:text-foreground transition-colors'
                        )}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {header.column.getCanSort() && (
                          <div className="w-4 text-xs text-muted-foreground">
                            {{
                              asc: '↑',
                              desc: '↓',
                            }[header.column.getIsSorted() as string] ?? '↕'}
                          </div>
                        )}
                      </div>
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell 
                  colSpan={columns.length} 
                  className="h-24 text-center text-muted-foreground"
                >
                  {globalFilter || table.getState().columnFilters.length > 0
                    ? 'No items match your search criteria'
                    : 'No pin items found'
                  }
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  className="hover:bg-muted/50 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      style={{ width: cell.column.getSize() }}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {showPagination && table.getPageCount() > 1 && (
        <div className="p-4 border-t">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{' '}
              {Math.min(
                (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                table.getFilteredRowModel().rows.length
              )}{' '}
              of {table.getFilteredRowModel().rows.length} entries
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                Previous
              </Button>
              
              <div className="flex items-center gap-1">
                <span className="text-sm">Page</span>
                <span className="text-sm font-medium">
                  {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                </span>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}