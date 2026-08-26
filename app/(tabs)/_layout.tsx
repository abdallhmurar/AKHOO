import { Tabs } from 'expo-router'
import { House, UsersThree, ClockCounterClockwise, UserCircle } from 'phosphor-react-native'
import { shadow, useSanadTheme } from '../../src/lib/theme'
import { useAppFont } from '../../src/lib/typography'
import { useV2Text } from '../../src/features/v2Copy'

export default function TabsLayout() {
  const theme = useSanadTheme()
  const fontFamily = useAppFont('semibold')
  const t = useV2Text()
  return (
    <Tabs screenOptions={{
      headerShown: false,
      sceneStyle: { backgroundColor: theme.colors.background },
      tabBarActiveTintColor: theme.colors.primary,
      tabBarInactiveTintColor: theme.colors.textMuted,
      tabBarLabelStyle: { fontFamily, fontSize: 11, marginTop: 1 },
      tabBarStyle: { height: 72, paddingTop: 8, paddingBottom: 10, backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border, ...shadow.soft },
      tabBarHideOnKeyboard: true
    }}>
      <Tabs.Screen name="index" options={{ title: t('tabs.home'), tabBarIcon: ({ color, focused }) => <House size={24} color={typeof color === 'string' ? color : theme.colors.textMuted} weight={focused ? 'fill' : 'regular'} /> }} />
      <Tabs.Screen name="community" options={{ title: t('tabs.community'), tabBarIcon: ({ color, focused }) => <UsersThree size={24} color={typeof color === 'string' ? color : theme.colors.textMuted} weight={focused ? 'fill' : 'regular'} /> }} />
      <Tabs.Screen name="activity" options={{ title: t('tabs.activity'), tabBarIcon: ({ color, focused }) => <ClockCounterClockwise size={24} color={typeof color === 'string' ? color : theme.colors.textMuted} weight={focused ? 'fill' : 'regular'} /> }} />
      <Tabs.Screen name="account" options={{ title: t('tabs.account'), tabBarIcon: ({ color, focused }) => <UserCircle size={24} color={typeof color === 'string' ? color : theme.colors.textMuted} weight={focused ? 'fill' : 'regular'} /> }} />
    </Tabs>
  )
}
