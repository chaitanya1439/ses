import React from 'react';
import Svg, { G, Rect, Path, Defs, Filter, FeDropShadow } from 'react-native-svg';

export const BikeIcon = ({ width = 40, height = 40 }) => (
  <Svg width={width} height={height} viewBox="0 0 40 40" fill="none">
    <G filter="url(#shadow)">
      {/* Rear wheel */}
      <Rect x="18" y="28" width="4" height="8" rx="2" fill="#333333" />
      {/* Front wheel */}
      <Rect x="18" y="4" width="4" height="8" rx="2" fill="#333333" />
      {/* Body */}
      <Rect x="16" y="8" width="8" height="24" rx="3" fill="#F59E0B" />
      {/* Seat */}
      <Rect x="17" y="18" width="6" height="10" rx="2" fill="#111827" />
      {/* Handlebars */}
      <Path d="M14 12 L26 12" stroke="#111827" strokeWidth="2" strokeLinecap="round" />
    </G>
    <Defs>
      <Filter id="shadow" x="0" y="0" width="40" height="40" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
        <FeDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.3" />
      </Filter>
    </Defs>
  </Svg>
);

export const AutoIcon = ({ width = 40, height = 40 }) => (
  <Svg width={width} height={height} viewBox="0 0 40 40" fill="none">
    <G filter="url(#shadow)">
      {/* Rear left wheel */}
      <Rect x="8" y="24" width="4" height="10" rx="2" fill="#333333" />
      {/* Rear right wheel */}
      <Rect x="28" y="24" width="4" height="10" rx="2" fill="#333333" />
      {/* Front wheel */}
      <Rect x="18" y="4" width="4" height="8" rx="2" fill="#333333" />
      {/* Body Main */}
      <Rect x="12" y="10" width="16" height="24" rx="4" fill="#10B981" />
      {/* Windshield / Front Cab */}
      <Path d="M14 10 Q20 6 26 10 L26 16 L14 16 Z" fill="#FCD34D" />
      <Path d="M15 11 Q20 8 25 11 L25 15 L15 15 Z" fill="#111827" />
      {/* Roof details */}
      <Rect x="14" y="20" width="12" height="12" rx="2" fill="#064E3B" />
    </G>
    <Defs>
      <Filter id="shadow" x="0" y="0" width="40" height="40" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
        <FeDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.3" />
      </Filter>
    </Defs>
  </Svg>
);
