export function mediaFrame(width: number, height: number, aspect: number, fit: 'contain' | 'cover', anchor: 'left' | 'center' = 'center') {
  if (width <= 0 || height <= 0 || aspect <= 0) return { left: 0, top: 0, width: 0, height: 0 }
  const useWidth = fit === 'contain' ? width / height <= aspect : width / height >= aspect
  const mediaWidth = useWidth ? width : height * aspect
  const mediaHeight = useWidth ? width / aspect : height
  return { left: anchor === 'left' ? 0 : (width - mediaWidth) / 2, top: (height - mediaHeight) / 2, width: mediaWidth, height: mediaHeight }
}
