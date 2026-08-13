const fs = require('fs');

const file = '/media/callidus/callidus2/ses/Driver-Mobile-Assets/app/index.tsx';
let content = fs.readFileSync(file, 'utf8');

// Import MaskedView
content = content.replace(
  "import { LinearGradient } from 'expo-linear-gradient';",
  "import { LinearGradient } from 'expo-linear-gradient';\nimport MaskedView from '@react-native-masked-view/masked-view';"
);

// Replace the appName text with MaskedView
const oldText = `<Animated.Text style={[styles.appName, { opacity: textOpacity }]}>
          RidePilot
        </Animated.Text>`;

const newText = `<Animated.View style={{ opacity: textOpacity }}>
          <MaskedView
            style={{ height: 60, width: 220 }}
            maskElement={
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={[styles.appName, { color: 'black' }]}>
                  RidePilot
                </Text>
              </View>
            }
          >
            <LinearGradient
              colors={['#FF9933', '#FFFFFF', '#138808']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ flex: 1 }}
            />
          </MaskedView>
        </Animated.View>`;

content = content.replace(oldText, newText);

fs.writeFileSync(file, content);
console.log('Logo updated');
