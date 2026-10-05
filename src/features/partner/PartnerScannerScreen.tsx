import { useCallback, useState } from 'react'
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import { CameraView, useCameraPermissions } from 'expo-camera'
import { useTranslation } from 'react-i18next'
import { Camera as CameraIcon, CheckCircle, WarningCircle } from 'phosphor-react-native'
import { AppScreen, ScreenHeader } from '../../components/v2'
import { Button, EmptyState } from '../../components/ui'
import { radius, space, useSanadTheme } from '../../lib/theme'
import { useAppTypography } from '../../lib/typography'
import { translateActionError } from '../../lib/rpcErrors'
import { redemptionRepository } from '../../repositories/redemptionRepository'
import type { OfferRedemption } from '../../types'

type ScanResult = { kind: 'success'; redemption: OfferRedemption } | { kind: 'error'; message: string }

// Scans the same code react-native-qrcode-svg renders on the requester's
// redemption screen (CommunityScreens.tsx - QRCode value={redemption.code},
// a plain hex string, no URL/JSON wrapper) and hands it straight to
// partner_redeem_offer_code (0043_partner_redemption_scan.sql), which scopes
// the partner to only their own business's codes server-side.
export function PartnerScannerScreen() {
  const { t } = useTranslation()
  const theme = useSanadTheme()
  const typography = useAppTypography()
  const [permission, requestPermission] = useCameraPermissions()
  const [locked, setLocked] = useState(false)
  const [result, setResult] = useState<ScanResult | null>(null)

  const handleScan = useCallback(async ({ data }: { data: string }) => {
    setLocked(true)
    try {
      const redemption = await redemptionRepository.redeemByPartner(data)
      setResult({ kind: 'success', redemption })
    } catch (cause: any) {
      setResult({ kind: 'error', message: translateActionError(t, cause) })
    }
  }, [t])

  function scanAgain() {
    setResult(null)
    setLocked(false)
  }

  const header = <ScreenHeader title={t('partnerTools.tools.scanner')} back />

  if (!permission) {
    return <AppScreen header={header}><ActivityIndicator color={theme.colors.primary} /></AppScreen>
  }

  if (!permission.granted) {
    return (
      <AppScreen header={header}>
        <EmptyState
          icon={<CameraIcon size={38} color={theme.colors.primary} weight="duotone" />}
          title={t('partnerTools.scanner.permissionTitle')}
          message={t('partnerTools.scanner.permissionMessage')}
          actionLabel={t('partnerTools.scanner.permissionAction')}
          onAction={() => { void requestPermission() }}
        />
      </AppScreen>
    )
  }

  return (
    <AppScreen header={header} scroll={false} contentStyle={styles.fill}>
      <View style={styles.cameraWrap}>
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={locked ? undefined : handleScan}
        />
        <View pointerEvents="none" style={styles.frameWrap}>
          <View style={[styles.frame, { borderColor: theme.colors.primary }]} />
        </View>
        {!result ? (
          <View style={styles.hintWrap}>
            <Text style={[typography.small, styles.hintText]}>{t('partnerTools.scanner.hint')}</Text>
          </View>
        ) : null}
      </View>

      {result ? (
        <View style={[styles.resultSheet, { backgroundColor: theme.colors.surface }]}>
          {result.kind === 'success' ? (
            <>
              <CheckCircle size={36} color={theme.colors.success} weight="fill" />
              <Text style={[typography.h3, { color: theme.colors.textPrimary, textAlign: 'center' }]}>{t('partnerTools.scanner.successTitle')}</Text>
              <Text style={[typography.small, { color: theme.colors.textSecondary, textAlign: 'center' }]}>
                {result.redemption.points_spent > 0
                  ? t('partnerTools.scanner.successSubtitlePoints', { points: result.redemption.points_spent })
                  : t('partnerTools.scanner.successSubtitle')}
              </Text>
            </>
          ) : (
            <>
              <WarningCircle size={36} color={theme.colors.danger} weight="fill" />
              <Text style={[typography.h3, { color: theme.colors.textPrimary, textAlign: 'center' }]}>{t('partnerTools.scanner.errorTitle')}</Text>
              <Text style={[typography.small, { color: theme.colors.textSecondary, textAlign: 'center' }]}>{result.message}</Text>
            </>
          )}
          <Button label={t('partnerTools.scanner.scanAgain')} onPress={scanAgain} />
        </View>
      ) : null}
    </AppScreen>
  )
}

const styles = StyleSheet.create({
  fill: { flex: 1, padding: 0, paddingTop: 0, gap: 0 },
  cameraWrap: { flex: 1, position: 'relative', overflow: 'hidden' },
  frameWrap: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  frame: { width: 240, height: 240, borderWidth: 3, borderRadius: radius.lg, backgroundColor: 'transparent' },
  hintWrap: { position: 'absolute', bottom: space.xxl, left: space.xl, right: space.xl, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: radius.md, padding: space.md },
  hintText: { color: '#fff', textAlign: 'center' },
  resultSheet: { padding: space.xl, gap: space.md, alignItems: 'center', borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl }
})
