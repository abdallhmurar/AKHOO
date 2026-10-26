// Only navigation/guide context is replaced in this isolated, offline preview.
// The actual card, font helpers, translations, animation and Three.js scene run unchanged.
import { useEffect } from 'react'
export const useFocusEffect = useEffect
export const useGuide = () => null
