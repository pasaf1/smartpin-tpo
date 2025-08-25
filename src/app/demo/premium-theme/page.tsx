import { Premium3DShowcaseSimple } from '@/components/demo/Premium3DShowcaseSimple'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Premium 3D Theme - SmartPin TPO',
  description: 'Sophisticated premium 3D visual theme for construction quality management platform featuring glass morphism, neumorphism, and professional construction industry design.',
  keywords: 'construction software design, 3D UI theme, glass morphism, neumorphism, premium design system',
}

export default function Premium3DThemePage() {
  return <Premium3DShowcaseSimple />
}