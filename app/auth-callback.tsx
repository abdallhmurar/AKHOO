import { Redirect } from 'expo-router'

// On Android the browser session that finishes Google/Apple sign-in resolves `akhoo://auth-callback` through
// `WebBrowser.openAuthSessionAsync`, but the same link also reaches the router as an ordinary deep link, which showed
// "Unmatched Route". There is nothing to display for it (`consumeAuthLink` already handles the tokens), so it goes to the
// start screen, which routes by session.
export default function AuthCallbackRoute() {
  return <Redirect href="/" />
}
