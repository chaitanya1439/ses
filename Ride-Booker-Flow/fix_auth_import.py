import re

with open('/media/callidus/callidus2/ses/Ride-Booker-Flow/app/login.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    'import auth from "@react-native-firebase/auth";\nimport type { FirebaseAuthTypes } from "@react-native-firebase/auth";',
    'import { firebase } from "@react-native-firebase/auth";'
)

content = content.replace(
    'const [confirmResult, setConfirmResult] = useState<FirebaseAuthTypes.ConfirmationResult | null>(null);',
    'const [confirmResult, setConfirmResult] = useState<any | null>(null);'
)

content = content.replace(
    'const confirmation = await auth().signInWithPhoneNumber(fullPhone);',
    'const confirmation = await firebase.auth().signInWithPhoneNumber(fullPhone);'
)

with open('/media/callidus/callidus2/ses/Ride-Booker-Flow/app/login.tsx', 'w') as f:
    f.write(content)
