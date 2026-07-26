import { useState } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

const navigation = ["Home", "Learn", "Progress", "Profile"];

function App() {
  const [activeTab, setActiveTab] = useState("Home");

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor={colors.paper} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.screen}>
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.header}>
              <View style={styles.brandMark}>
                <Text style={styles.brandMarkText}>LL</Text>
              </View>
              <View style={styles.brandCopy}>
                <Text style={styles.brandName}>LOW LEVEL LAB</Text>
                <Text style={styles.brandTagline}>Systems learning, designed simply.</Text>
              </View>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>S</Text>
              </View>
            </View>

            <View style={styles.hero}>
              <Text style={styles.eyebrow}>YOUR LEARNING PATH</Text>
              <Text style={styles.title}>
                Learn systems programming by solving problems.
              </Text>
              <Text style={styles.copy}>
                Ordered tracks, short briefs, and feedback that keeps the focus on the work.
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => setActiveTab("Learn")}
                style={styles.primaryButton}
              >
                <Text style={styles.primaryButtonText}>Start learning</Text>
                <Text style={styles.buttonArrow}>→</Text>
              </Pressable>
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Continue learning</Text>
              <Text style={styles.sectionMeta}>19</Text>
            </View>
            <Pressable accessibilityRole="button" style={styles.continueCard}>
              <View style={styles.continueTopRow}>
                <View style={styles.topicIcon}>
                  <Text style={styles.topicIconText}>C</Text>
                </View>
                <View style={styles.continueHeading}>
                  <Text style={styles.cardTitle}>Integer promotion rules</Text>
                  <Text style={styles.cardMeta}>MCQ · C fundamentals</Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={styles.progressFill} />
              </View>
              <Text style={styles.progressLabel}>37 of 272 solved · 5-day streak</Text>
            </Pressable>

            <Text style={styles.eyebrow}>AT A GLANCE</Text>
            <View style={styles.stats}>
              <StatCard value="37" label="Solved" />
              <StatCard value="5" label="Day streak" />
              <StatCard value="43%" label="Track complete" />
            </View>

            <View style={styles.pathCard}>
              <Text style={styles.eyebrowLight}>TODAY</Text>
              <Text style={styles.pathTitle}>One focused problem, then a clear next step.</Text>
              <Text style={styles.pathCopy}>
                Keep the path moving with a short challenge designed around one idea.
              </Text>
              <Pressable accessibilityRole="button" style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>Daily challenge</Text>
              </Pressable>
            </View>
          </ScrollView>

          <View style={styles.tabBar}>
            {navigation.map((item) => {
              const isActive = item === activeTab;
              return (
                <Pressable
                  key={item}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: isActive }}
                  onPress={() => setActiveTab(item)}
                  style={styles.tab}
                >
                  <View style={[styles.tabDot, isActive && styles.tabDotActive]} />
                  <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                    {item}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

function StatCard({ value, label }: { readonly value: string; readonly label: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const colors = {
  paper: "#F7F5F1",
  surface: "#FFFFFF",
  surfaceMuted: "#F0ECE5",
  ink: "#1A1A1A",
  muted: "#716C64",
  line: "#E2DDD4",
  accent: "#A84124",
  accentDark: "#7F2F1B",
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.paper },
  screen: { flex: 1, backgroundColor: colors.paper },
  content: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 104 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 44 },
  brandMark: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: colors.accent,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 4,
  },
  brandMarkText: { color: colors.surface, fontSize: 13, fontWeight: "900", letterSpacing: 2 },
  brandCopy: { flex: 1, marginLeft: 11 },
  brandName: { color: colors.accent, fontSize: 12, fontWeight: "900", letterSpacing: 2 },
  brandTagline: { color: colors.muted, fontSize: 11, marginTop: 3 },
  avatar: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: colors.ink },
  avatarText: { color: colors.surface, fontSize: 14, fontWeight: "700" },
  hero: { marginBottom: 38 },
  eyebrow: { color: colors.accent, fontSize: 11, fontWeight: "800", letterSpacing: 1.6, marginBottom: 12 },
  eyebrowLight: { color: "#E8C5B8", fontSize: 11, fontWeight: "800", letterSpacing: 1.6, marginBottom: 12 },
  title: { color: colors.ink, fontSize: 38, fontWeight: "800", letterSpacing: -1.2, lineHeight: 45 },
  copy: { color: colors.muted, fontSize: 16, lineHeight: 24, marginTop: 16, maxWidth: 410 },
  primaryButton: { alignSelf: "flex-start", alignItems: "center", backgroundColor: colors.accent, borderRadius: 999, flexDirection: "row", gap: 12, marginTop: 24, paddingHorizontal: 20, paddingVertical: 14 },
  primaryButtonText: { color: colors.surface, fontSize: 15, fontWeight: "700" },
  buttonArrow: { color: colors.surface, fontSize: 19, lineHeight: 20 },
  sectionHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  sectionTitle: { color: colors.ink, fontSize: 20, fontWeight: "750", letterSpacing: -0.3 },
  sectionMeta: { color: colors.accent, fontSize: 14, fontWeight: "800" },
  continueCard: { backgroundColor: colors.surface, borderColor: colors.line, borderRadius: 24, borderWidth: 1, marginBottom: 34, padding: 18 },
  continueTopRow: { alignItems: "center", flexDirection: "row" },
  topicIcon: { alignItems: "center", backgroundColor: colors.surfaceMuted, borderRadius: 14, height: 46, justifyContent: "center", width: 46 },
  topicIconText: { color: colors.accent, fontSize: 18, fontWeight: "900" },
  continueHeading: { flex: 1, marginLeft: 13 },
  cardTitle: { color: colors.ink, fontSize: 16, fontWeight: "750" },
  cardMeta: { color: colors.muted, fontSize: 13, marginTop: 4 },
  chevron: { color: colors.muted, fontSize: 28, fontWeight: "300", marginLeft: 8 },
  progressTrack: { backgroundColor: colors.surfaceMuted, borderRadius: 99, height: 7, marginTop: 20, overflow: "hidden" },
  progressFill: { backgroundColor: colors.accent, borderRadius: 99, height: "100%", width: "43%" },
  progressLabel: { color: colors.muted, fontSize: 12, marginTop: 10 },
  stats: { flexDirection: "row", gap: 10, marginBottom: 28 },
  statCard: { backgroundColor: colors.surface, borderColor: colors.line, borderRadius: 18, borderWidth: 1, flex: 1, paddingHorizontal: 13, paddingVertical: 16 },
  statValue: { color: colors.ink, fontSize: 22, fontWeight: "800", letterSpacing: -0.5 },
  statLabel: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 5 },
  pathCard: { backgroundColor: colors.ink, borderRadius: 26, padding: 22 },
  pathTitle: { color: colors.surface, fontSize: 24, fontWeight: "750", letterSpacing: -0.5, lineHeight: 30 },
  pathCopy: { color: "#CBC7C1", fontSize: 14, lineHeight: 21, marginTop: 10 },
  secondaryButton: { alignSelf: "flex-start", backgroundColor: colors.surface, borderRadius: 999, marginTop: 20, paddingHorizontal: 16, paddingVertical: 11 },
  secondaryButtonText: { color: colors.ink, fontSize: 13, fontWeight: "750" },
  tabBar: { alignItems: "center", backgroundColor: colors.surface, borderTopColor: colors.line, borderTopWidth: 1, flexDirection: "row", justifyContent: "space-around", paddingBottom: 12, paddingHorizontal: 8, paddingTop: 10 },
  tab: { alignItems: "center", minWidth: 58 },
  tabDot: { backgroundColor: colors.muted, borderRadius: 4, height: 5, marginBottom: 6, width: 5 },
  tabDotActive: { backgroundColor: colors.accent, width: 18 },
  tabLabel: { color: colors.muted, fontSize: 11, fontWeight: "600" },
  tabLabelActive: { color: colors.accent, fontWeight: "800" },
});

export default App;
