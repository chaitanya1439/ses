import re

with open('/media/callidus/callidus2/ses/Ride-Booker-Flow/app/home.tsx', 'r') as f:
    content = f.read()

# 1. Update react-native imports
content = content.replace(
    'import { View, Text, StyleSheet, ScrollView, Pressable, StatusBar, Platform, Animated, Easing, Dimensions, Image } from "react-native";',
    'import { View, Text, StyleSheet, ScrollView, Pressable, StatusBar, Platform, Animated, Easing, Dimensions, Image, Modal } from "react-native";'
)

# 2. Add useAuth import
if 'useAuth' not in content:
    content = content.replace(
        'import { useBooking } from "@/contexts/BookingContext";',
        'import { useBooking } from "@/contexts/BookingContext";\nimport { useAuth } from "@/contexts/AuthContext";'
    )

# 3. Add states
state_insertion = """  const { user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isServicesExpanded, setIsServicesExpanded] = useState(true);
"""
content = re.sub(
    r'(const \[recentSearches, setRecentSearches\] = useState<RecentSearch\[\]>\(\[\]\);)',
    r'\1\n' + state_insertion,
    content
)

# 4. Remove BottomTab related logic
content = re.sub(r'type BottomTab = "home" \| "services" \| "activity" \| "account";\n', '', content)
content = re.sub(r'const \[activeTab, setActiveTab\] = useState<BottomTab>\("home"\);\n', '', content)
handle_tab_regex = re.compile(r'  const handleTabPress = \(tab: BottomTab\) => \{[\s\S]*?  \};\n')
content = handle_tab_regex.sub('', content)

# 5. Update menuBtn press
content = content.replace(
    '<Pressable style={styles.menuBtn}>',
    '<Pressable style={styles.menuBtn} onPress={() => setIsMenuOpen(true)}>'
)

# 6. Add Modal JSX and remove BottomNav JSX
modal_jsx = """
      {/* Side Menu Modal */}
      <Modal visible={isMenuOpen} transparent={true} animationType="fade">
        <View style={styles.menuOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setIsMenuOpen(false)} />
          <View style={styles.menuContent}>
            {/* Profile Header */}
            <View style={styles.menuProfileHeader}>
              <View style={styles.menuAvatar}>
                <Ionicons name="person" size={40} color={Colors.white} />
              </View>
              <View>
                <Text style={styles.menuUserName}>{user?.name ?? "Rider"}</Text>
                <Text style={styles.menuUserPhone}>{user?.phone ?? ""}</Text>
              </View>
            </View>
            
            <ScrollView style={styles.menuScroll} showsVerticalScrollIndicator={false}>
              
              {/* Activity */}
              <Pressable style={styles.menuItemRow} onPress={() => { setIsMenuOpen(false); router.push("/my-rides" as any); }}>
                <Ionicons name="receipt-outline" size={24} color={Colors.dark} />
                <Text style={styles.menuItemText}>My Rides</Text>
              </Pressable>

              {/* Profile */}
              <Pressable style={styles.menuItemRow} onPress={() => { setIsMenuOpen(false); router.push("/profile" as any); }}>
                <Ionicons name="person-outline" size={24} color={Colors.dark} />
                <Text style={styles.menuItemText}>Profile</Text>
              </Pressable>

              {/* Services Folder */}
              <Pressable style={styles.menuItemRow} onPress={() => setIsServicesExpanded(!isServicesExpanded)}>
                <Ionicons name="grid-outline" size={24} color={Colors.dark} />
                <Text style={styles.menuItemText}>Services</Text>
                <View style={{ flex: 1, alignItems: "flex-end" }}>
                  <Ionicons name={isServicesExpanded ? "chevron-up" : "chevron-down"} size={20} color={Colors.grey} />
                </View>
              </Pressable>
              
              {isServicesExpanded && (
                <View style={styles.servicesFolder}>
                  {SERVICES_ROW_1.map(srv => (
                    <Pressable key={srv.id} style={styles.folderServiceItem} onPress={() => {
                      setIsMenuOpen(false);
                      router.push(srv.route as any);
                    }}>
                      <ServiceIcon item={srv} size={20} />
                      <Text style={styles.folderServiceText}>{srv.label}</Text>
                    </Pressable>
                  ))}
                  <Pressable style={styles.folderServiceItem} onPress={() => { setIsMenuOpen(false); router.push("/all-services" as any); }}>
                    <Ionicons name="apps-outline" size={20} color={Colors.dark} />
                    <Text style={styles.folderServiceText}>All Services</Text>
                  </Pressable>
                </View>
              )}
            </ScrollView>
            
            {/* Footer */}
            <View style={[styles.menuFooter, { paddingBottom: insets.bottom + 20 }]}>
               <Text style={styles.menuAppVersion}>RideGo v1.0.0</Text>
            </View>
          </View>
        </View>
      </Modal>
"""

bottom_nav_regex = re.compile(r'      \{\/\* Floating Bottom Nav \*\/\}[\s\S]*?      \<\/View\>', re.MULTILINE)
content = bottom_nav_regex.sub(modal_jsx, content)

# 7. Add styles for modal
styles_to_add = """
  menuOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', flexDirection: 'row' },
  menuContent: { width: width * 0.75, backgroundColor: Colors.white, height: '100%', shadowColor: Colors.black, shadowOffset: { width: 4, height: 0 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 10 },
  menuProfileHeader: { backgroundColor: Colors.dark, paddingTop: 60, paddingBottom: 30, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 16 },
  menuAvatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.white },
  menuUserName: { fontSize: 20, fontFamily: "Poppins_700Bold", color: Colors.white },
  menuUserPhone: { fontSize: 14, fontFamily: "Poppins_400Regular", color: Colors.lightGrey },
  menuScroll: { flex: 1, paddingTop: 10 },
  menuItemRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 18, gap: 16 },
  menuItemText: { fontSize: 16, fontFamily: "Poppins_600SemiBold", color: Colors.dark },
  servicesFolder: { backgroundColor: Colors.lightGrey, paddingVertical: 8, marginHorizontal: 16, borderRadius: 16, marginBottom: 10 },
  folderServiceItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 12, gap: 16 },
  folderServiceText: { fontSize: 14, fontFamily: "Poppins_500Medium", color: Colors.darkSecondary },
  menuFooter: { paddingHorizontal: 24, paddingTop: 20, borderTopWidth: 1, borderTopColor: Colors.border },
  menuAppVersion: { fontSize: 12, fontFamily: "Poppins_400Regular", color: Colors.grey },
"""

content = content.replace('const styles = StyleSheet.create({', 'const { width } = Dimensions.get("window");\n\nconst styles = StyleSheet.create({\n' + styles_to_add)

with open('/media/callidus/callidus2/ses/Ride-Booker-Flow/app/home.tsx', 'w') as f:
    f.write(content)

