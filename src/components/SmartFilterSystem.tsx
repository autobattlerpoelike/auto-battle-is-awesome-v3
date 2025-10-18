import React, { useState, useMemo, useCallback, useEffect } from 'react'
import { DESIGN_TOKENS, getColor, getSpacing } from '../utils/designTokens'

// Filter Types
interface FilterOption {
  id: string
  label: string
  value: any
  color?: string
  icon?: string
  count?: number
}

interface FilterGroup {
  id: string
  label: string
  type: 'single' | 'multiple' | 'range'
  options: FilterOption[]
  defaultValue?: any
}

interface ActiveFilter {
  groupId: string
  optionId: string
  value: any
  label: string
  color?: string
}

interface SmartFilterProps {
  items: any[]
  filterGroups: FilterGroup[]
  onFilterChange: (filteredItems: any[]) => void
  className?: string
  showSearch?: boolean
  showSort?: boolean
  savedFilters?: string[]
  onSaveFilter?: (name: string, filters: ActiveFilter[]) => void
}

// Filter Chip Component
interface FilterChipProps {
  filter: ActiveFilter
  onRemove: () => void
  className?: string
}

const FilterChip: React.FC<FilterChipProps> = ({ filter, onRemove, className = '' }) => {
  return (
    <div 
      className={`
        inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm
        border transition-all duration-200
        hover:shadow-md ${className}
      `}
      style={{
        backgroundColor: filter.color ? `${filter.color}20` : '#374151',
        borderColor: filter.color || '#6B7280',
        color: filter.color || '#E5E7EB'
      }}
    >
      <span>{filter.label}</span>
      <button
        onClick={onRemove}
        className="w-4 h-4 rounded-full bg-black/30 hover:bg-black/50 flex items-center justify-center text-xs"
        title="Remove filter"
      >
        ×
      </button>
    </div>
  )
}

// Filter Group Component
interface FilterGroupProps {
  group: FilterGroup
  activeFilters: ActiveFilter[]
  onFilterToggle: (groupId: string, optionId: string, value: any) => void
  className?: string
}

const FilterGroupComponent: React.FC<FilterGroupProps> = ({
  group,
  activeFilters,
  onFilterToggle,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const activeCount = activeFilters.filter(f => f.groupId === group.id).length

  return (
    <div className={`border border-gray-600 rounded-lg ${className}`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-700/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="font-medium">{group.label}</span>
          {activeCount > 0 && (
            <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
              {activeCount}
            </span>
          )}
        </div>
        <svg 
          className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-2">
          {group.options.map((option) => {
            const isActive = activeFilters.some(f => f.groupId === group.id && f.optionId === option.id)
            
            return (
              <label
                key={option.id}
                className="flex items-center gap-3 cursor-pointer hover:bg-gray-700/30 p-2 rounded"
              >
                <input
                  type={group.type === 'single' ? 'radio' : 'checkbox'}
                  name={group.type === 'single' ? group.id : undefined}
                  checked={isActive}
                  onChange={() => onFilterToggle(group.id, option.id, option.value)}
                  className="w-4 h-4"
                />
                <div className="flex items-center gap-2 flex-1">
                  {option.icon && <span>{option.icon}</span>}
                  <span 
                    className="flex-1"
                    style={{ color: option.color || 'inherit' }}
                  >
                    {option.label}
                  </span>
                  {option.count !== undefined && (
                    <span className="text-gray-400 text-sm">({option.count})</span>
                  )}
                </div>
              </label>
            )
          })}
        </div>
      )}
    </div>
  )
}

// Search Component
interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = "Search items...",
  className = ''
}) => {
  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  )
}

// Sort Component
interface SortOption {
  id: string
  label: string
  field: string
  direction: 'asc' | 'desc'
}

interface SortControlProps {
  options: SortOption[]
  activeSort: string
  onSortChange: (sortId: string) => void
  className?: string
}

const SortControl: React.FC<SortControlProps> = ({
  options,
  activeSort,
  onSortChange,
  className = ''
}) => {
  return (
    <select
      value={activeSort}
      onChange={(e) => onSortChange(e.target.value)}
      className={`px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${className}`}
    >
      {options.map((option) => (
        <option key={option.id} value={option.id}>
          {option.label}
        </option>
      ))}
    </select>
  )
}

// Main Smart Filter Component
export const SmartFilterSystem: React.FC<SmartFilterProps> = ({
  items,
  filterGroups,
  onFilterChange,
  className = '',
  showSearch = true,
  showSort = true,
  savedFilters = [],
  onSaveFilter
}) => {
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [activeSort, setActiveSort] = useState('name-asc')
  const [showFilters, setShowFilters] = useState(false)

  // Sort options
  const sortOptions: SortOption[] = [
    { id: 'name-asc', label: 'Name (A-Z)', field: 'name', direction: 'asc' },
    { id: 'name-desc', label: 'Name (Z-A)', field: 'name', direction: 'desc' },
    { id: 'rarity-desc', label: 'Rarity (High-Low)', field: 'rarity', direction: 'desc' },
    { id: 'rarity-asc', label: 'Rarity (Low-High)', field: 'rarity', direction: 'asc' },
    { id: 'level-desc', label: 'Level (High-Low)', field: 'level', direction: 'desc' },
    { id: 'level-asc', label: 'Level (Low-High)', field: 'level', direction: 'asc' },
    { id: 'type-asc', label: 'Type (A-Z)', field: 'type', direction: 'asc' }
  ]

  // Filter and sort items
  const filteredItems = useMemo(() => {
    let result = [...items]

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      result = result.filter(item => 
        item.name?.toLowerCase().includes(searchLower) ||
        item.type?.toLowerCase().includes(searchLower) ||
        item.description?.toLowerCase().includes(searchLower)
      )
    }

    // Apply active filters
    activeFilters.forEach(filter => {
      const group = filterGroups.find(g => g.id === filter.groupId)
      if (!group) return

      switch (group.id) {
        case 'rarity':
          result = result.filter(item => item.rarity === filter.value)
          break
        case 'type':
          result = result.filter(item => item.type === filter.value)
          break
        case 'level':
          if (typeof filter.value === 'object' && filter.value.min !== undefined) {
            result = result.filter(item => 
              item.level >= filter.value.min && item.level <= filter.value.max
            )
          }
          break
        case 'equipped':
          result = result.filter(item => item.equipped === filter.value)
          break
        case 'sockets':
          result = result.filter(item => {
            if (filter.value === 'any') return item.sockets > 0
            if (filter.value === 'none') return !item.sockets || item.sockets === 0
            return item.sockets === filter.value
          })
          break
        default:
          // Generic filter
          result = result.filter(item => item[group.id] === filter.value)
      }
    })

    // Apply sorting
    const sortOption = sortOptions.find(s => s.id === activeSort)
    if (sortOption) {
      result.sort((a, b) => {
        let aVal = a[sortOption.field]
        let bVal = b[sortOption.field]

        // Handle special cases
        if (sortOption.field === 'rarity') {
          const rarityOrder = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic']
          aVal = rarityOrder.indexOf(aVal) || 0
          bVal = rarityOrder.indexOf(bVal) || 0
        }

        if (typeof aVal === 'string') {
          aVal = aVal.toLowerCase()
          bVal = bVal.toLowerCase()
        }

        if (aVal < bVal) return sortOption.direction === 'asc' ? -1 : 1
        if (aVal > bVal) return sortOption.direction === 'asc' ? 1 : -1
        return 0
      })
    }

    return result
  }, [items, activeFilters, searchTerm, activeSort, filterGroups])

  // Update parent component when filtered items change
  useEffect(() => {
    onFilterChange(filteredItems)
  }, [filteredItems, onFilterChange])

  // Handle filter toggle
  const handleFilterToggle = useCallback((groupId: string, optionId: string, value: any) => {
    const group = filterGroups.find(g => g.id === groupId)
    if (!group) return

    const option = group.options.find(o => o.id === optionId)
    if (!option) return

    setActiveFilters(prev => {
      if (group.type === 'single') {
        // Remove any existing filters for this group and add the new one
        const filtered = prev.filter(f => f.groupId !== groupId)
        const isCurrentlyActive = prev.some(f => f.groupId === groupId && f.optionId === optionId)
        
        if (!isCurrentlyActive) {
          filtered.push({
            groupId,
            optionId,
            value,
            label: option.label,
            color: option.color
          })
        }
        return filtered
      } else {
        // Multiple selection - toggle the specific filter
        const existingIndex = prev.findIndex(f => f.groupId === groupId && f.optionId === optionId)
        
        if (existingIndex >= 0) {
          return prev.filter((_, index) => index !== existingIndex)
        } else {
          return [...prev, {
            groupId,
            optionId,
            value,
            label: option.label,
            color: option.color
          }]
        }
      }
    })
  }, [filterGroups])

  // Remove specific filter
  const removeFilter = useCallback((filterToRemove: ActiveFilter) => {
    setActiveFilters(prev => 
      prev.filter(f => !(f.groupId === filterToRemove.groupId && f.optionId === filterToRemove.optionId))
    )
  }, [])

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setActiveFilters([])
    setSearchTerm('')
  }, [])

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search and Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        {showSearch && (
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            className="flex-1"
          />
        )}
        
        <div className="flex gap-2">
          {showSort && (
            <SortControl
              options={sortOptions}
              activeSort={activeSort}
              onSortChange={setActiveSort}
            />
          )}
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filters
          </button>
        </div>
      </div>

      {/* Active Filters */}
      {(activeFilters.length > 0 || searchTerm) && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-gray-400">Active filters:</span>
          
          {searchTerm && (
            <FilterChip
              filter={{
                groupId: 'search',
                optionId: 'search',
                value: searchTerm,
                label: `Search: "${searchTerm}"`,
                color: '#3B82F6'
              }}
              onRemove={() => setSearchTerm('')}
            />
          )}
          
          {activeFilters.map((filter, index) => (
            <FilterChip
              key={`${filter.groupId}-${filter.optionId}-${index}`}
              filter={filter}
              onRemove={() => removeFilter(filter)}
            />
          ))}
          
          <button
            onClick={clearAllFilters}
            className="text-sm text-red-400 hover:text-red-300 underline"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Filter Groups */}
      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-gray-800/50 rounded-lg">
          {filterGroups.map((group) => (
            <FilterGroupComponent
              key={group.id}
              group={group}
              activeFilters={activeFilters}
              onFilterToggle={handleFilterToggle}
            />
          ))}
        </div>
      )}

      {/* Results Summary */}
      <div className="flex justify-between items-center text-sm text-gray-400">
        <span>
          Showing {filteredItems.length} of {items.length} items
        </span>
        
        {onSaveFilter && activeFilters.length > 0 && (
          <button
            onClick={() => {
              const name = prompt('Enter filter preset name:')
              if (name) {
                onSaveFilter(name, activeFilters)
              }
            }}
            className="text-blue-400 hover:text-blue-300 underline"
          >
            Save filter preset
          </button>
        )}
      </div>
    </div>
  )
}

export default SmartFilterSystem