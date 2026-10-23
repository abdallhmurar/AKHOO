import { StyleSheet, View } from 'react-native'
import { useVideoPlayer, VideoView } from 'expo-video'
import { radius } from '../../lib/theme'

// The announcement's video, with the platform's own play/pause/seek controls.
// It never autoplays or loops: an announcement opens over whatever the user was
// doing, so starting sound has to be their choice. Direction is pinned to ltr
// like the poster pager, so the native controls are not mirrored by rtl languages.
// The box is 16:9 (what the announcement videos are made in) and the video is
// letterboxed inside it, so any other shape still shows whole instead of cropped.
export function AnnouncementVideo({ uri, aspectRatio = 16 / 9 }: { uri: string; aspectRatio?: number }) {
  const player = useVideoPlayer(uri, p => { p.loop = false })
  return (
    <View style={[styles.frame, { aspectRatio, direction: 'ltr' }]}>
      <VideoView player={player} style={styles.video} nativeControls contentFit="contain" accessibilityLabel="video" />
    </View>
  )
}

const styles = StyleSheet.create({
  frame: { width: '100%', borderRadius: radius.lg, overflow: 'hidden', backgroundColor: '#000' },
  // width/height 100%, not absoluteFill: on the web the <video> is a replaced element, so top/left/right/bottom do
  // not stretch it and it showed at its natural size, cropped to the top-left corner of the box.
  video: { width: '100%', height: '100%' }
})
