import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, {
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
  Rect,
  Path,
  Circle,
  G,
} from 'react-native-svg';

const BANNER_HEIGHT = 180;

export default function IndianCityscapeBanner() {
  return (
    <View style={styles.container}>
      <Svg
        width="100%"
        height={BANNER_HEIGHT}
        viewBox="0 0 400 180"
        preserveAspectRatio="xMidYMid slice"
      >
        <Defs>
          {/* Sky gradient — deep orange to warm amber */}
          <SvgLinearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#FF6B00" />
            <Stop offset="45%" stopColor="#FF8C00" />
            <Stop offset="100%" stopColor="#FFB347" />
          </SvgLinearGradient>
          {/* Sun glow gradient */}
          <SvgLinearGradient id="sunGlow" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#FFD700" stopOpacity="0.9" />
            <Stop offset="100%" stopColor="#FFA500" stopOpacity="0.3" />
          </SvgLinearGradient>
        </Defs>

        {/* Sky background */}
        <Rect x="0" y="0" width="400" height="180" fill="url(#skyGrad)" />

        {/* Sun */}
        <Circle cx="200" cy="60" r="28" fill="url(#sunGlow)" />
        <Circle cx="200" cy="60" r="18" fill="#FFD700" opacity={0.7} />

        {/* Flying Birds */}
        <G fill="none" stroke="#5C2D0A" strokeWidth="1.5" strokeLinecap="round">
          {/* Bird cluster left */}
          <Path d="M80 30 Q85 25, 90 30" />
          <Path d="M90 30 Q95 25, 100 30" />
          <Path d="M70 40 Q74 36, 78 40" />
          <Path d="M78 40 Q82 36, 86 40" />
          {/* Bird cluster right */}
          <Path d="M290 25 Q295 20, 300 25" />
          <Path d="M300 25 Q305 20, 310 25" />
          <Path d="M310 35 Q314 31, 318 35" />
          <Path d="M318 35 Q322 31, 326 35" />
          {/* Single bird center */}
          <Path d="M180 20 Q184 16, 188 20" />
          <Path d="M188 20 Q192 16, 196 20" />
        </G>

        {/* ===== SILHOUETTE LAYER ===== */}
        <G fill="#3D1800">
          {/* ------ FAR LEFT: Palm tree 1 ------ */}
          <Rect x="18" y="90" width="4" height="90" rx="2" />
          {/* Palm fronds */}
          <Path d="M20 90 Q10 70, 0 75 Q12 72, 20 85Z" />
          <Path d="M20 90 Q30 68, 42 72 Q28 70, 20 85Z" />
          <Path d="M20 92 Q8 78, 2 82 Q14 78, 20 88Z" />
          <Path d="M20 92 Q32 76, 40 80 Q28 76, 20 88Z" />

          {/* ------ Elephant (left side) ------ */}
          {/* Body */}
          <Path d="M50 140 Q50 118, 70 115 Q90 112, 95 125 Q98 138, 95 155 L90 180 L85 180 L85 155 L80 180 L75 180 L78 155 L65 180 L60 180 L63 155 L55 180 L50 180 L53 155 Q48 155, 50 140Z" />
          {/* Head */}
          <Path d="M93 115 Q102 108, 108 112 Q112 118, 108 128 Q105 135, 95 130 Q90 125, 93 115Z" />
          {/* Trunk */}
          <Path d="M108 122 Q115 130, 112 140 Q110 148, 106 150 Q108 145, 108 138 Q110 130, 106 125Z" />
          {/* Ear */}
          <Path d="M97 113 Q92 106, 96 100 Q100 105, 97 113Z" />
          {/* Tusk */}
          <Path d="M106 126 Q110 130, 108 134" stroke="#FFD700" strokeWidth="1.5" fill="none" />

          {/* ------ Dome/Mosque 1 (left-center) ------ */}
          <Rect x="125" y="115" width="40" height="65" />
          {/* Main dome */}
          <Path d="M125 115 Q145 80, 165 115Z" />
          {/* Dome finial */}
          <Rect x="143" y="78" width="4" height="10" />
          <Circle cx="145" cy="76" r="3" />
          {/* Minaret left */}
          <Rect x="118" y="95" width="8" height="85" />
          <Path d="M118 95 Q122 85, 126 95Z" />
          <Circle cx="122" cy="84" r="2.5" />
          {/* Minaret right */}
          <Rect x="164" y="95" width="8" height="85" />
          <Path d="M164 95 Q168 85, 172 95Z" />
          <Circle cx="168" cy="84" r="2.5" />
          {/* Arched windows */}
          <Path d="M135 140 Q140 132, 145 140 L145 155 L135 155Z" fill="#5C2D0A" />
          <Path d="M148 140 Q153 132, 158 140 L158 155 L148 155Z" fill="#5C2D0A" />

          {/* ------ Central Taj-like Dome ------ */}
          <Rect x="185" y="100" width="50" height="80" />
          {/* Main onion dome */}
          <Path d="M185 100 Q190 70, 210 55 Q230 70, 235 100Z" />
          {/* Finial */}
          <Rect x="208" y="46" width="4" height="12" />
          <Circle cx="210" cy="44" r="3.5" />
          {/* Left small minaret */}
          <Rect x="178" y="90" width="7" height="90" />
          <Path d="M178 90 Q181.5 82, 185 90Z" />
          <Circle cx="181.5" cy="81" r="2" />
          {/* Right small minaret */}
          <Rect x="235" y="90" width="7" height="90" />
          <Path d="M235 90 Q238.5 82, 242 90Z" />
          <Circle cx="238.5" cy="81" r="2" />
          {/* Arch doorway */}
          <Path d="M200 130 Q210 115, 220 130 L220 180 L200 180Z" fill="#5C2D0A" />

          {/* ------ Small dome (right) ------ */}
          <Rect x="260" y="130" width="30" height="50" />
          <Path d="M260 130 Q275 105, 290 130Z" />
          <Rect x="273" y="102" width="4" height="10" />
          <Circle cx="275" cy="100" r="3" />
          {/* Arch */}
          <Path d="M268 148 Q275 140, 282 148 L282 165 L268 165Z" fill="#5C2D0A" />

          {/* ------ Auto-rickshaw (right side) ------ */}
          {/* Body */}
          <Path d="M310 150 Q308 138, 315 135 L340 135 Q345 135, 345 140 L345 158 L310 158Z" />
          {/* Roof */}
          <Path d="M312 135 Q318 125, 342 125 L345 135Z" />
          {/* Wheels */}
          <Circle cx="318" cy="160" r="6" />
          <Circle cx="340" cy="160" r="6" />
          <Circle cx="318" cy="160" r="2.5" fill="#5C2D0A" />
          <Circle cx="340" cy="160" r="2.5" fill="#5C2D0A" />
          {/* Windshield */}
          <Path d="M312 135 L315 128 L325 128 L322 135Z" fill="#FF8C00" opacity={0.5} />
          {/* Front handle */}
          <Path d="M310 150 Q305 148, 305 155" stroke="#3D1800" strokeWidth="2" fill="none" />

          {/* ------ Palm tree 2 (far right) ------ */}
          <Rect x="365" y="85" width="4" height="95" rx="2" />
          <Path d="M367 85 Q355 65, 348 70 Q358 67, 367 80Z" />
          <Path d="M367 85 Q378 63, 390 68 Q376 65, 367 80Z" />
          <Path d="M367 87 Q353 73, 346 78 Q356 74, 367 83Z" />
          <Path d="M367 87 Q380 72, 392 76 Q378 72, 367 83Z" />

          {/* ------ Ground strip ------ */}
          <Rect x="0" y="168" width="400" height="12" />
        </G>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: BANNER_HEIGHT,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    overflow: 'hidden',
  },
});
