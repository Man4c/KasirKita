import React from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity } from 'react-native';
import { Search, X } from 'lucide-react-native';

const FILTER_METHODS = [
  { key: 'ALL', label: 'Semua' },
  { key: 'CASH', label: 'Tunai' },
  { key: 'QRIS', label: 'QRIS' },
  { key: 'TRANSFER', label: 'Transfer' },
];

/**
 * HistorySearchBar: Komponen input pencarian & filter chips metode bayar.
 * Mematuhi The Data Table/Protection Rule & Defensive UI:
 * - height tetap 44px
 * - includeFontPadding: false, textAlignVertical: 'center'
 * - Filter chip height: 32px
 */
export default function HistorySearchBar({
  search,
  onSearchChange,
  isSearchFocused,
  onSearchFocus,
  onSearchBlur,
  filterMethod,
  onFilterChange,
}) {
  return (
    <View style={styles.container}>
      {/* Search Input Bar */}
      <View style={[styles.searchBar, isSearchFocused && styles.searchBarFocused]}>
        <Search
          size={16}
          color={isSearchFocused || search ? '#fb7185' : '#a1a1aa'}
          style={{ marginRight: 10, flexShrink: 0 }}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Cari no. invoice / pelanggan..."
          placeholderTextColor="#71717a"
          value={search}
          onChangeText={onSearchChange}
          onFocus={onSearchFocus}
          onBlur={onSearchBlur}
          returnKeyType="search"
          clearButtonMode="never"
        />
        {Boolean(search && search.length > 0) && (
          <TouchableOpacity
            onPress={() => onSearchChange('')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.searchClearBtn}
            activeOpacity={0.7}
          >
            <X size={12} color="#d4d4d8" />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Chips Bar */}
      <View style={styles.filterChipsRow}>
        {FILTER_METHODS.map((method) => {
          const isSelected = filterMethod === method.key;
          return (
            <TouchableOpacity
              key={method.key}
              style={[styles.filterChip, isSelected && styles.filterChipActive]}
              onPress={() => onFilterChange(method.key)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.filterChipText,
                  isSelected && styles.filterChipTextActive,
                ]}
                numberOfLines={1}
              >
                {method.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 4,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181b',
    borderColor: '#27272a',
    borderWidth: 1,
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchBarFocused: {
    borderColor: '#e11d48',
    backgroundColor: '#1c1917',
  },
  searchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    height: '100%',
    paddingVertical: 0,
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  searchClearBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#27272a',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
    flexShrink: 0,
  },
  filterChipsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  filterChip: {
    flex: 1,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    paddingHorizontal: 4,
  },
  filterChipActive: {
    backgroundColor: '#e11d48',
    borderColor: '#f43f5e',
  },
  filterChipText: {
    color: '#d4d4d8',
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  filterChipTextActive: {
    color: '#ffffff',
    fontFamily: 'Poppins_700Bold',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});
