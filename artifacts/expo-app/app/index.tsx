import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

interface FeatureCardProps {
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  href: "/chat" | "/flywheel" | "/tools";
  color: string;
}

function FeatureCard({ title, description, icon, href, color }: FeatureCardProps) {
  return (
    <Link href={href} asChild>
      <Pressable
        style={styles.card}
        onPressIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
      >
        <View style={[styles.iconContainer, { backgroundColor: color + "20" }]}>
          <Ionicons name={icon} size={28} color={color} />
        </View>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardDescription}>{description}</Text>
        <Ionicons
          name="chevron-forward"
          size={20}
          color="#666"
          style={styles.cardArrow}
        />
      </Pressable>
    </Link>
  );
}

export default function HomeScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <View style={styles.logoContainer}>
          <Ionicons name="cube-outline" size={48} color="#60a5fa" />
        </View>
        <Text style={styles.title}>The Brain</Text>
        <Text style={styles.subtitle}>
          Qwen 3.5-35B Agentic Stack with MCP Integration
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Features</Text>

        <FeatureCard
          title="Agentic Chat"
          description="Autonomous AI with native tool-calling. Execute commands, search the web, and edit code."
          icon="chatbubbles-outline"
          href="/chat"
          color="#60a5fa"
        />

        <FeatureCard
          title="Flywheel"
          description="Self-healing OODA loop. Run linters, builds, and tests until exit code 0."
          icon="sync-outline"
          href="/flywheel"
          color="#34d399"
        />

        <FeatureCard
          title="MCP Tools"
          description="Browse connected MCP servers: Local-Bash, Brave Search, Supabase, Aider."
          icon="hardware-chip-outline"
          href="/tools"
          color="#f472b6"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Connected Servers</Text>
        <View style={styles.serverList}>
          {[
            { name: "local-bash", icon: "terminal-outline", status: "active" },
            { name: "brave-search", icon: "search-outline", status: "active" },
            { name: "supabase", icon: "server-outline", status: "active" },
            { name: "aider", icon: "code-slash-outline", status: "active" },
          ].map((server) => (
            <View key={server.name} style={styles.serverItem}>
              <Ionicons
                name={server.icon as keyof typeof Ionicons.glyphMap}
                size={20}
                color="#9ca3af"
              />
              <Text style={styles.serverName}>{server.name}</Text>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: server.status === "active" ? "#34d399" : "#f87171" },
                ]}
              />
            </View>
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Powered by Qwen 3.5-35B</Text>
        <Text style={styles.footerSubtext}>Model Context Protocol</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
  },
  content: {
    padding: 20,
  },
  hero: {
    alignItems: "center",
    paddingVertical: 40,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: "#60a5fa20",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#9ca3af",
    textAlign: "center",
    maxWidth: 280,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 16,
  },
  card: {
    backgroundColor: "#111",
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#222",
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: "#9ca3af",
    lineHeight: 20,
  },
  cardArrow: {
    position: "absolute",
    right: 20,
    top: 20,
  },
  serverList: {
    backgroundColor: "#111",
    borderRadius: 16,
    padding: 8,
    borderWidth: 1,
    borderColor: "#222",
  },
  serverItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 12,
  },
  serverName: {
    flex: 1,
    fontSize: 14,
    color: "#fff",
    fontFamily: "monospace",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  footer: {
    alignItems: "center",
    paddingVertical: 24,
  },
  footerText: {
    fontSize: 12,
    color: "#6b7280",
  },
  footerSubtext: {
    fontSize: 10,
    color: "#4b5563",
    marginTop: 2,
  },
});
