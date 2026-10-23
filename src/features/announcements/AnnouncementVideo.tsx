import { StyleSheet, View } from 'react-native'
import { useVideoPlayer, VideoView } from 'expo-video'
import { radius } from '../../lib/theme'

// The announcement's video, with the platform's own play/pause/seek controls.
// It never autoplays or loops: an announcement opens over whatever the user was
// doing, so starting sound has to be their choice. Direction is pinned to ltr
// like the poster pager, so the native controls are not mirrored by rtl languages.
export function AnnouncementVideo({ uri, height }: { uri: string; height: number }) {
  const player = useVideoPlayer(uri, p => { p.loop = false })
  return (
    <View style={[styles.frame, { height }]}>
      <VideoView player={player} style={StyleSheet.absoluteFill} nativeControls contentFit="contain" accessibilityLabel="video" />
    </View>
  )
}

const styles = StyleSheet.create({
  frame: { width: '100%', borderRadius: radius.lg, overflow: 'hidden', backgroundColor: '#000', direction: 'ltr' }
})
