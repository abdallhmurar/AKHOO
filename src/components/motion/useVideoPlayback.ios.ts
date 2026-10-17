import { useEffect } from 'react'
import type { VideoPlayer } from 'expo-video'

export function useVideoPlayback(player: Pick<VideoPlayer, 'play' | 'pause'>, playing: boolean) {
  useEffect(() => {
    if (playing) player.play()
    else player.pause()
    // useVideoPlayer owns teardown and releases (and stops) the native player
    // before later passive cleanups run. Calling pause in a cleanup would use
    // an already released SharedObject when a loading gate/screen unmounts.
  }, [player, playing])
}
