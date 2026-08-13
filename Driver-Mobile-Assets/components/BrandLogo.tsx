import React from 'react';
import { Image } from 'react-native';

interface BrandLogoProps {
  width?: number;
  height?: number;
}

export default function BrandLogo({ width = 120, height = 120 }: BrandLogoProps) {
  return (
    <Image 
      source={require('@/assets/images/mtrip-logo.png')} 
      style={{ width, height, resizeMode: 'contain' }} 
    />
  );
}
