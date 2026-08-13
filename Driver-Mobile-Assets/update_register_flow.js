const fs = require('fs');

// 1. Remove register.tsx
const registerFile = '/media/callidus/callidus2/ses/Driver-Mobile-Assets/app/register.tsx';
if (fs.existsSync(registerFile)) {
  fs.unlinkSync(registerFile);
}

// 2. Remove from layout
let layoutFile = '/media/callidus/callidus2/ses/Driver-Mobile-Assets/app/_layout.tsx';
let layoutContent = fs.readFileSync(layoutFile, 'utf8');
layoutContent = layoutContent.replace('<Stack.Screen name="register" />\n', '');
fs.writeFileSync(layoutFile, layoutContent);

// 3. Remove "Register here" button from login.tsx
let loginFile = '/media/callidus/callidus2/ses/Driver-Mobile-Assets/app/login.tsx';
let loginContent = fs.readFileSync(loginFile, 'utf8');
// The multi_replace earlier replaced 'New driver?' with 'New pilot?'
// Let's just remove the block:
const registerBlock = `          <Pressable
            style={({ pressed }) => [styles.registerBtn, { opacity: pressed ? 0.7 : 1 }]}
            onPress={() => router.push('/register')}
          >
            <Text style={styles.registerText}>New pilot? </Text>
            <Text style={styles.registerLink}>Register here</Text>
          </Pressable>`;
loginContent = loginContent.replace(registerBlock, '');
fs.writeFileSync(loginFile, loginContent);

// 4. Update details.tsx
let detailsFile = '/media/callidus/callidus2/ses/Driver-Mobile-Assets/app/onboarding/details.tsx';
let detailsContent = fs.readFileSync(detailsFile, 'utf8');

// Replace imports if needed to get VEHICLE_TYPES
detailsContent = detailsContent.replace(
  "import { Ionicons } from '@expo/vector-icons';",
  "import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';"
);

// Add vehicle state
detailsContent = detailsContent.replace(
  "const [gender, setGender] = useState(driver?.gender || '');",
  `const [gender, setGender] = useState(driver?.gender || '');
  const [vehicleType, setVehicleType] = useState(driver?.vehicleType || 'Bike');
  const [vehicleNumber, setVehicleNumber] = useState(driver?.vehicleNumber || '');
  const [loading, setLoading] = useState(false);`
);

// Update handleSave to include google form
detailsContent = detailsContent.replace(
  "const handleSave = () => {",
  `const handleSave = async () => {`
);

detailsContent = detailsContent.replace(
  "if (!name || !email || !phone || !gender) {",
  "if (!name || !email || !phone || !gender || !vehicleType || !vehicleNumber) {"
);

detailsContent = detailsContent.replace(
  "updateDriver({",
  `setLoading(true);
    // Silently submit to Google Form Database
    try {
      const body = \`entry.2005620554=\${encodeURIComponent(name)}&entry.1045781291=\${encodeURIComponent(email)}&entry.1065046570=\${encodeURIComponent(phone)}&entry.1166974658=\${encodeURIComponent(alternatePhone)}\`;
      await fetch('https://docs.google.com/forms/d/e/1FAIpQLScnTQCQcf85Rd2L9-LBgr9P4qBYhyuE6plE2Ev-S4AJOcwB9A/formResponse', {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body,
      });
    } catch (e) {
      console.warn('Google Form submission failed', e);
    }
    
    updateDriver({`
);

detailsContent = detailsContent.replace(
  "gender,",
  `gender,
      vehicleType,
      vehicleNumber: vehicleNumber.toUpperCase(),`
);

detailsContent = detailsContent.replace(
  "Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);",
  `setLoading(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);`
);

// Add VEHICLE_TYPES const at top
detailsContent = detailsContent.replace(
  "export default function AdditionalDetails() {",
  `const VEHICLE_TYPES = [
  { type: 'Bike', icon: 'motorbike' },
  { type: 'Scooty', icon: 'scooter' },
  { type: 'Auto', icon: 'car' },
];

export default function AdditionalDetails() {`
);

// Add UI for Vehicle details
const vehicleUI = `
        <Text style={styles.label}>Vehicle Number *</Text>
        <TextInput 
          style={styles.input}
          value={vehicleNumber}
          onChangeText={setVehicleNumber}
          placeholder="TS09AB1234"
          autoCapitalize="characters"
          placeholderTextColor={theme.colors.textMuted}
        />

        <Text style={styles.label}>Vehicle Type *</Text>
        <View style={styles.vehicleRow}>
          {VEHICLE_TYPES.map(({ type, icon }) => (
            <Pressable
              key={type}
              style={[styles.vehicleChip, vehicleType === type && styles.vehicleChipActive]}
              onPress={() => {
                setVehicleType(type);
                Haptics.selectionAsync();
              }}
            >
              <MaterialCommunityIcons
                name={icon as any}
                size={22}
                color={vehicleType === type ? theme.colors.dark : theme.colors.textLight}
              />
              <Text style={[styles.vehicleText, vehicleType === type && styles.vehicleTextActive]}>{type}</Text>
            </Pressable>
          ))}
        </View>
`;

detailsContent = detailsContent.replace(
  "<Pressable style={styles.saveBtn} onPress={handleSave}>",
  vehicleUI + "\n        <Pressable style={styles.saveBtn} onPress={handleSave}>"
);

detailsContent = detailsContent.replace(
  "<Text style={styles.saveBtnText}>Save Details</Text>",
  "<Text style={styles.saveBtnText}>{loading ? 'Saving...' : 'Save Details'}</Text>"
);

// Add styles
detailsContent = detailsContent.replace(
  "genderTextActive: {",
  `genderTextActive: {
    color: theme.colors.primary,
    fontFamily: 'Poppins_600SemiBold',
  },
  vehicleRow: { flexDirection: 'row', gap: 10, marginBottom: 32 },
  vehicleChip: {
    flex: 1, flexDirection: 'column', alignItems: 'center', gap: 4,
    paddingVertical: 14, borderRadius: 12,
    borderWidth: 2, borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceAlt,
  },
  vehicleChipActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '18',
  },
  vehicleText: {
    fontSize: 12, fontWeight: '600', color: theme.colors.textLight,
    fontFamily: 'Poppins_600SemiBold',
  },
  vehicleTextActive: {
    color: theme.colors.dark,
  },
  // avoid duplicated genderTextActive:`
);
detailsContent = detailsContent.replace(
  "genderTextActive: {\n    color: theme.colors.primary,\n    fontFamily: 'Poppins_600SemiBold',\n  },\n  // avoid duplicated genderTextActive:\n    color: theme.colors.primary,",
  "genderTextActive: {\n    color: theme.colors.primary,"
); // clean up the mess if any

fs.writeFileSync(detailsFile, detailsContent);
console.log('Register flow merged');
