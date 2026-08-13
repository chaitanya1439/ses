const fs = require('fs');
const file = '/media/callidus/callidus2/ses/Driver-Mobile-Assets/app/onboarding/scan.tsx';
let content = fs.readFileSync(file, 'utf8');

// Add state
content = content.replace(
  'const [editNumber, setEditNumber] = useState(\'\');',
  `const [editNumber, setEditNumber] = useState('');
  const [step, setStep] = useState<'front' | 'back'>('front');
  const [frontPhoto, setFrontPhoto] = useState<string | null>(null);
  const [savedFrontNumber, setSavedFrontNumber] = useState('');`
);

// handleTakePic
content = content.replace(
  'if (photo.base64) {\n          processImageWithAWS(photo.base64);\n        }',
  `if (photo.base64) {
          if (type !== 'aadhaar' || step === 'front') {
            processImageWithAWS(photo.base64);
          } else {
            // No extraction needed for back
          }
        }`
);

// handleConfirm
content = content.replace(
  'const currentDocs = driver.verifiedDocuments || {};',
  `if (type === 'aadhaar' && step === 'front') {
      setFrontPhoto(photoUri);
      setSavedFrontNumber(editNumber);
      setPhotoUri(null);
      setStep('back');
      setExtractedData(null);
      return;
    }

    const finalNumber = type === 'aadhaar' && step === 'back' ? savedFrontNumber : editNumber;

    const currentDocs = driver.verifiedDocuments || {};`
);

// handleConfirm save
content = content.replace(
  'number: editNumber.toUpperCase(),',
  `number: finalNumber.toUpperCase(),`
);
content = content.replace(
  'imageUri: photoUri,',
  `imageUri: type === 'aadhaar' ? (frontPhoto || photoUri) : photoUri,
          backUri: type === 'aadhaar' ? photoUri : undefined,`
);

// Header Title
content = content.replace(
  '<Text style={styles.headerTitle}>Scan {type?.toUpperCase()}</Text>',
  `<Text style={styles.headerTitle}>Scan {type?.toUpperCase()} {type === 'aadhaar' ? (step === 'front' ? '(FRONT)' : '(BACK)') : ''}</Text>`
);

// UI For Back of Aadhaar (when extractedData is null)
content = content.replace(
  '{!processing && extractedData && (',
  `{!processing && !extractedData && type === 'aadhaar' && step === 'back' && (
            <View style={styles.extractionCard}>
              <View style={styles.successBadge}>
                <Ionicons name="checkmark-circle" size={16} color={theme.colors.success} />
                <Text style={styles.successText}>Back Captured Successfully</Text>
              </View>

              <View style={styles.actionRow}>
                <Pressable 
                  style={styles.retakeBtn} 
                  onPress={() => {
                    setPhotoUri(null);
                  }}
                >
                  <Text style={styles.retakeBtnText}>Retake</Text>
                </Pressable>
                
                <Pressable style={styles.confirmBtn} onPress={handleConfirm}>
                  <Text style={styles.confirmBtnText}>Confirm Back</Text>
                </Pressable>
              </View>
            </View>
          )}

          {!processing && extractedData && (`
);

fs.writeFileSync(file, content);
console.log('Done');
