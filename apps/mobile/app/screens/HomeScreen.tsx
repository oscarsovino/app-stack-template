import { StyleSheet, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useTranslation } from "react-i18next"
import { colors, spacing, fontSizes, fontWeights } from "@app-stack/shared-tokens"

export function HomeScreen() {
  const { t } = useTranslation()
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.heading}>app-stack-template · mobile</Text>
        <Text style={styles.body}>{t("common.loading")}</Text>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  heading: {
    fontSize: fontSizes.xxl,
    fontWeight: fontWeights.bold,
    color: colors.foreground,
  },
  body: {
    fontSize: fontSizes.md,
    color: colors.mutedForeground,
  },
})
