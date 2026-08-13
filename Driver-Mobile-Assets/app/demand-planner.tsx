import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { PROVIDER_GOOGLE, Marker, Heatmap } from 'react-native-maps';
import { useSocket } from '@/context/SocketContext';

const TIME_SLOTS = ['6 PM', '7 PM', '8 PM', '9 PM'];

export default function DemandPlannerScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? insets.top + 67 : insets.top;
  const [selectedTime, setSelectedTime] = useState(0);
  const [heatmapPoints, setHeatmapPoints] = useState<{ latitude: number; longitude: number; weight: number }[]>([]);
  const { subscribe, sendMessage, isConnected } = useSocket();

  React.useEffect(() => {
    if (isConnected) {
      sendMessage('get_demand_heatmap', { time: selectedTime });
    }
  }, [isConnected, selectedTime, sendMessage]);

  React.useEffect(() => {
    const unsub = subscribe('demand_heatmap', (data) => {
      if (data && Array.isArray(data)) {
        setHeatmapPoints(data.map((p: any) => ({
          latitude: p.lat,
          longitude: p.lng,
          weight: p.intensity || p.surge || 1
        })));
      }
    });
    return unsub;
  }, [subscribe]);

  return (
    <View style={[styles.root, { paddingTop: topPad }]}>
      {/* ─── TOP BAR ─── */}
      <View style={styles.topBar}>
        <Pressable
          hitSlop={12}
          onPress={() => {
            try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
            router.back();
          }}
        >
          <Ionicons name="arrow-back" size={24} color="#1A1A2E" />
        </Pressable>
        <Text style={styles.topBarTitle}>Demand Planner</Text>
      </View>

      {/* ─── INFO BANNER ─── */}
      <View style={styles.infoBanner}>
        <Ionicons name="information-circle-outline" size={20} color="#6B7280" />
        <Text style={styles.infoText}>
          Use demand planner to plan today&apos;s ride based on high demand areas
          from the last 4 Tuesdays
        </Text>
      </View>

      {/* ─── REAL MAP VIEW ─── */}
      <View style={[styles.mapContainer, { borderRadius: 16, overflow: 'hidden', marginHorizontal: 16, marginBottom: 12 }]}>
        <MapView userInterfaceStyle="light"
          provider={PROVIDER_GOOGLE}
          style={StyleSheet.absoluteFillObject}
          initialRegion={{
            latitude: 17.3850, // Hyderabad
            longitude: 78.4867,
            latitudeDelta: 0.1,
            longitudeDelta: 0.1,
          }}
          showsUserLocation={true}
          showsMyLocationButton={false}
          showsCompass={false}
          customMapStyle={[]} // Can add aubergine/retro styling here later if needed
        >
          {/* Example blue dot marker for where the driver is if showsUserLocation isn't sufficient in emulator */}
          <Marker coordinate={{ latitude: 17.3850, longitude: 78.4867 }}>
            <View style={styles.blueDot}>
              <View style={styles.blueDotInner} />
            </View>
          </Marker>

          {heatmapPoints.length > 0 && Platform.OS !== 'web' && (
            <Heatmap
              points={heatmapPoints}
              radius={40}
              opacity={0.7}
              gradient={{
                colors: ["#00000000", "#00e400", "#ffff00", "#ff7e00", "#ff0000"],
                startPoints: [0, 0.25, 0.5, 0.75, 1],
                colorMapSize: 256
              }}
            />
          )}
        </MapView>
        {/* My Location button */}
        <Pressable
          style={styles.myLocationBtn}
          onPress={() => {
            try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
          }}
        >
          <View style={styles.locationDot} />
          <Text style={styles.myLocationText}>My Location</Text>
        </Pressable>
      </View>

      {/* ─── BOTTOM SHEET ─── */}
      <View style={[styles.bottomSheet, { paddingBottom: insets.bottom + 16 }]}>
        {/* Time Selector */}
        <View style={styles.timeRow}>
          <Pressable
            style={styles.arrowBtn}
            onPress={() => {
              if (selectedTime > 0) setSelectedTime(selectedTime - 1);
              try { Haptics.selectionAsync(); } catch {}
            }}
          >
            <Ionicons name="chevron-back" size={20} color="#6B7280" />
          </Pressable>

          {TIME_SLOTS.map((time, idx) => (
            <Pressable
              key={time}
              style={[
                styles.timePill,
                selectedTime === idx && styles.timePillActive,
              ]}
              onPress={() => {
                setSelectedTime(idx);
                try { Haptics.selectionAsync(); } catch {}
              }}
            >
              <Text
                style={[
                  styles.timeText,
                  selectedTime === idx && styles.timeTextActive,
                ]}
              >
                {time}
              </Text>
            </Pressable>
          ))}

          <Pressable
            style={styles.arrowBtn}
            onPress={() => {
              if (selectedTime < TIME_SLOTS.length - 1)
                setSelectedTime(selectedTime + 1);
              try { Haptics.selectionAsync(); } catch {}
            }}
          >
            <Ionicons name="chevron-forward" size={20} color="#6B7280" />
          </Pressable>
        </View>

        {/* Section Header */}
        <View style={styles.demandHeader}>
          <View style={styles.demandIconWrap}>
            <Ionicons name="flash" size={16} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.demandTitle}>
              High Demand Areas - In Last 4 Tuesdays
            </Text>
            <Pressable>
              <Text style={styles.howItWorks}>ℹ️ How it works?</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  topBarTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A2E',
    fontFamily: 'Poppins_700Bold',
  },

  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    borderRadius: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'Poppins_400Regular',
    lineHeight: 18,
  },

  mapContainer: {
    flex: 1,
    marginTop: 12,
    position: 'relative',
    backgroundColor: '#E8ECF0',
  },
  blueDot: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(66,133,244,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  blueDotInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4285F4',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  myLocationBtn: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  locationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4285F4',
  },
  myLocationText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A1A2E',
    fontFamily: 'Poppins_600SemiBold',
  },

  bottomSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginBottom: 20,
  },
  arrowBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timePill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  timePillActive: {
    backgroundColor: '#5C35D4',
  },
  timeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    fontFamily: 'Poppins_600SemiBold',
  },
  timeTextActive: {
    color: '#FFFFFF',
  },

  demandHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  demandIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FF8C00',
    justifyContent: 'center',
    alignItems: 'center',
  },
  demandTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A2E',
    fontFamily: 'Poppins_700Bold',
    lineHeight: 20,
  },
  howItWorks: {
    fontSize: 13,
    color: '#2563EB',
    fontFamily: 'Poppins_400Regular',
    marginTop: 4,
  },
});
