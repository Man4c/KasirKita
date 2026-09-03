import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Platform } from 'react-native';
import { Calendar, TrendingUp } from 'lucide-react-native';

export default function SalesTrendChart({ trends = [], formatRp }) {
  const [selectedIdx, setSelectedIdx] = useState(
    trends.length > 0 ? trends.length - 1 : null
  );

  // Keep selected index valid if trends update
  const activeIdx =
    selectedIdx !== null && selectedIdx < trends.length
      ? selectedIdx
      : trends.length > 0
      ? trends.length - 1
      : null;

  const total7Days = trends.reduce((acc, t) => acc + (Number(t.revenue) || 0), 0);
  const maxRevenue = Math.max(...trends.map((t) => Number(t.revenue) || 0), 10000);

  const selectedItem = activeIdx !== null ? trends[activeIdx] : null;

  // Format date string (e.g., '2026-09-03' -> '03/09')
  const formatDateLabel = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}`;
    return dateStr.slice(5);
  };

  return (
    <View style={styles.chartCard}>
      {/* Header */}
      <View style={styles.chartHeader}>
        <View style={styles.chartHeaderLeft}>
          <View style={styles.iconBox}>
            <Calendar size={15} color="#fb7185" />
          </View>
          <Text style={styles.chartTitle} numberOfLines={1}>
            Tren Omzet 7 Hari
          </Text>
        </View>

        <View style={styles.chartHeaderRight}>
          <Text style={styles.totalLabel}>Total 7 Hari:</Text>
          <Text style={styles.totalValue} numberOfLines={1}>
            {formatRp(total7Days)}
          </Text>
        </View>
      </View>

      {/* Selected Day Inspector Row */}
      {selectedItem && (
        <View style={styles.inspectorRow}>
          <View style={styles.inspectorLeft}>
            <View style={styles.statusDot} />
            <Text style={styles.inspectorDate}>
              {selectedItem.date}
            </Text>
            <Text style={styles.inspectorCount}>
              • {selectedItem.count || 0} transaksi
            </Text>
          </View>
          <Text style={styles.inspectorAmount}>
            {formatRp(selectedItem.revenue)}
          </Text>
        </View>
      )}

      {/* Bar Chart Presentation */}
      {trends.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>Belum ada data grafik omzet 7 hari terakhir.</Text>
        </View>
      ) : (
        <View style={styles.barsContainer}>
          {trends.map((item, idx) => {
            const rawRev = Number(item.revenue) || 0;
            const isSelected = activeIdx === idx;
            // Height calculation between 6% (zero day) and 100%
            const heightPercent =
              rawRev > 0
                ? Math.max(16, Math.round((rawRev / maxRevenue) * 100))
                : 6;

            return (
              <TouchableOpacity
                key={idx}
                style={styles.barColumn}
                activeOpacity={0.7}
                onPress={() => setSelectedIdx(idx)}
              >
                {/* Value Pill Above Bar (when selected) */}
                <View style={styles.barTopLabelBox}>
                  {isSelected && (
                    <Text style={styles.barTopLabel} numberOfLines={1} adjustsFontSizeToFit>
                      {rawRev > 0 ? (rawRev >= 1000000 ? `${(rawRev / 1000000).toFixed(1)}jt` : `${Math.round(rawRev / 1000)}k`) : '0'}
                    </Text>
                  )}
                </View>

                {/* Track and Bar */}
                <View style={styles.track}>
                  <View
                    style={[
                      styles.bar,
                      { height: `${heightPercent}%` },
                      rawRev > 0
                        ? isSelected
                          ? styles.barActive
                          : styles.barNormal
                        : isSelected
                        ? styles.barZeroActive
                        : styles.barZero,
                    ]}
                  />
                </View>

                {/* Date Label */}
                <View style={[styles.dateBadge, isSelected && styles.dateBadgeActive]}>
                  <Text
                    style={[styles.dateLabel, isSelected && styles.dateLabelActive]}
                    numberOfLines={1}
                  >
                    {formatDateLabel(item.date)}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  chartCard: {
    backgroundColor: '#18181b',
    borderColor: '#27272a',
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
      },
      android: {
        elevation: 1,
      },
      web: {
        boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
      },
    }),
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
    gap: 8,
  },
  chartHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 0,
  },
  iconBox: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: 'rgba(244, 63, 94, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  chartTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    flex: 1,
  },
  chartHeaderRight: {
    alignItems: 'flex-end',
    flexShrink: 0,
  },
  totalLabel: {
    color: '#a1a1aa',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
  },
  totalValue: {
    color: '#f4f4f5',
    fontSize: 12,
    fontFamily: 'Poppins_700Bold',
  },
  inspectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 8,
  },
  inspectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    minWidth: 0,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fb7185',
  },
  inspectorDate: {
    color: '#e4e4e7',
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
  },
  inspectorCount: {
    color: '#a1a1aa',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
  },
  inspectorAmount: {
    color: '#fb7185',
    fontSize: 13,
    fontFamily: 'Poppins_700Bold',
    flexShrink: 0,
  },
  emptyBox: {
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#a1a1aa',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 140,
    gap: 6,
    paddingTop: 8,
  },
  barColumn: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  barTopLabelBox: {
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  barTopLabel: {
    fontSize: 10,
    fontFamily: 'Poppins_600SemiBold',
    color: '#fb7185',
    textAlign: 'center',
  },
  track: {
    width: '100%',
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bar: {
    width: '80%',
    maxWidth: 28,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  barNormal: {
    backgroundColor: '#e11d48',
    opacity: 0.8,
  },
  barActive: {
    backgroundColor: '#fb7185',
    borderWidth: 1,
    borderColor: '#ffffff',
  },
  barZero: {
    backgroundColor: '#27272a',
  },
  barZeroActive: {
    backgroundColor: '#3f3f46',
    borderWidth: 1,
    borderColor: '#71717a',
  },
  dateBadge: {
    marginTop: 6,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  dateBadgeActive: {
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
  },
  dateLabel: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#a1a1aa',
  },
  dateLabelActive: {
    color: '#fb7185',
    fontFamily: 'Poppins_600SemiBold',
  },
});
