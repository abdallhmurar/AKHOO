import { useState } from 'react'
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native'
import { supabase } from '../lib/supabase'
import { colors } from '../lib/theme'
import { PrimaryButton } from '../components/PrimaryButton'
import { Screen } from '../components/Screen'

export function AuthScreen() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit() {
    if (!email.trim() || password.length < 6 || (mode === 'signup' && !name.trim())) {
      Alert.alert('ناقص معلومات', 'أدخل البيانات المطلوبة، وكلمة مرور من 6 أحرف على الأقل.')
      return
    }

    setLoading(true)
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
        if (error) throw error
      } else {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { full_name: name.trim(), phone: phone.trim() || null } }
        })
        if (error) throw error
        Alert.alert('تم إنشاء الحساب', 'إذا كان تأكيد البريد مفعّلاً في Supabase، افتح رسالة التأكيد ثم سجّل دخولك.')
        setMode('login')
      }
    } catch (error: any) {
      Alert.alert('ما زبطت العملية', error.message ?? 'حدث خطأ غير متوقع')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.logo}><Text style={styles.logoText}>س</Text></View>
      <Text style={styles.brand}>سَنَد</Text>
      <Text style={styles.tagline}>ما بتضل لحالك عالطريق.</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{mode === 'login' ? 'تسجيل الدخول' : 'إنشاء حساب'}</Text>
        {mode === 'signup' ? (
          <>
            <TextInput value={name} onChangeText={setName} placeholder="الاسم الكامل" placeholderTextColor={colors.muted} style={styles.input} textAlign="right" />
            <TextInput value={phone} onChangeText={setPhone} placeholder="رقم الهاتف" placeholderTextColor={colors.muted} style={styles.input} keyboardType="phone-pad" textAlign="right" />
          </>
        ) : null}
        <TextInput value={email} onChangeText={setEmail} placeholder="البريد الإلكتروني" placeholderTextColor={colors.muted} style={styles.input} keyboardType="email-address" autoCapitalize="none" textAlign="right" />
        <TextInput value={password} onChangeText={setPassword} placeholder="كلمة المرور" placeholderTextColor={colors.muted} style={styles.input} secureTextEntry textAlign="right" />
        <PrimaryButton title={mode === 'login' ? 'دخول' : 'إنشاء الحساب'} onPress={submit} loading={loading} />
        <Text onPress={() => setMode(mode === 'login' ? 'signup' : 'login')} style={styles.switchText}>
          {mode === 'login' ? 'ما عندك حساب؟ أنشئ حساب جديد' : 'عندك حساب؟ ارجع لتسجيل الدخول'}
        </Text>
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, justifyContent: 'center' },
  logo: { width: 84, height: 84, borderRadius: 26, backgroundColor: colors.blue, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', shadowColor: colors.blue, shadowOpacity: 0.25, shadowRadius: 18, elevation: 8 },
  logoText: { color: '#fff', fontSize: 40, fontWeight: '900' },
  brand: { marginTop: 16, fontSize: 34, fontWeight: '900', color: colors.text, textAlign: 'center' },
  tagline: { color: colors.muted, textAlign: 'center', marginTop: 6, fontSize: 15 },
  card: { marginTop: 30, backgroundColor: colors.card, borderRadius: 24, padding: 18, borderWidth: 1, borderColor: colors.border, gap: 12 },
  cardTitle: { fontSize: 21, fontWeight: '900', color: colors.text, textAlign: 'right', marginBottom: 2 },
  input: { minHeight: 52, borderRadius: 15, backgroundColor: '#F9FCFF', borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, color: colors.text, fontSize: 15 },
  switchText: { color: colors.blueDark, fontWeight: '700', textAlign: 'center', paddingTop: 4 }
})
