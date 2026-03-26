import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { getAvailableTools, type MCPTool } from "@/lib/api";

const SERVER_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  "local-bash": "terminal-outline",
  "brave-search": "search-outline",
  supabase: "server-outline",
  aider: "code-slash-outline",
  filesystem: "folder-outline",
  github: "logo-github",
};

const SERVER_COLORS: Record<string, string> = {
  "local-bash": "#f59e0b",
  "brave-search": "#f472b6",
  supabase: "#34d399",
  aider: "#60a5fa",
  filesystem: "#a78bfa",
  github: "#9ca3af",
};

function ToolCard({ tool }: { tool: MCPTool }) {
  const [expanded, setExpanded] = useState(false);
  const color = SERVER_COLORS[tool.server] || "#6b7280";
  const icon = SERVER_ICONS[tool.server] || "cube-outline";

  return (
    <Pressable
      style={styles.toolCard}
      onPress={() => {
        setExpanded(!expanded);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }}
    >
      <View style={styles.toolHeader}>
        <View style={[styles.toolIconContainer, { backgroundColor: color + "20" }]}>
          <Ionicons name={icon} size={18} color={color} />
        </View>
        <View style={styles.toolInfo}>
          <Text style={styles.toolName}>{tool.name}</Text>
          <Text style={styles.toolServer}>{tool.server}</Text>
        </View>
        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={20}
          color="#666"
        />
      </View>

      {expanded && (
        <View style={styles.toolDetails}>
          <Text style={styles.toolDescription}>{tool.description}</Text>

          {tool.inputSchema && Object.keys(tool.inputSchema).length > 0 && (
            <View style={styles.schemaContainer}>
              <Text style={styles.schemaTitle}>Input Schema</Text>
              <Text style={styles.schemaText}>
                {JSON.stringify(tool.inputSchema, null, 2)}
              </Text>
            </View>
          )}
        </View>
      )}
    </Pressable>
  );
}

export default function ToolsScreen() {
  const [tools, setTools] = useState<MCPTool[]>([]);
  const [servers, setServers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<string | null>(null);

  const loadTools = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await getAvailableTools();
      setTools(data.tools);
      setServers(data.servers);
    } catch {
      // Handle error
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadTools();
  }, []);

  const filteredTools = filter
    ? tools.filter((t) => t.server === filter)
    : tools;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#60a5fa" />
        <Text style={styles.loadingText}>Loading MCP tools...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.filterContainer}>
        <Pressable
          style={[styles.filterChip, !filter && styles.filterChipActive]}
          onPress={() => {
            setFilter(null);
            Haptics.selectionAsync();
          }}
        >
          <Text style={[styles.filterText, !filter && styles.filterTextActive]}>
            All ({tools.length})
          </Text>
        </Pressable>
        {servers.map((server) => {
          const count = tools.filter((t) => t.server === server).length;
          const color = SERVER_COLORS[server] || "#6b7280";
          return (
            <Pressable
              key={server}
              style={[
                styles.filterChip,
                filter === server && styles.filterChipActive,
                filter === server && { borderColor: color + "60" },
              ]}
              onPress={() => {
                setFilter(server);
                Haptics.selectionAsync();
              }}
            >
              <Ionicons
                name={SERVER_ICONS[server] || "cube-outline"}
                size={14}
                color={filter === server ? color : "#6b7280"}
              />
              <Text
                style={[
                  styles.filterText,
                  filter === server && { color },
                ]}
              >
                {server} ({count})
              </Text>
            </Pressable>
          );
        })}
      </View>

      <FlatList
        data={filteredTools}
        keyExtractor={(item) => `${item.server}-${item.name}`}
        renderItem={({ item }) => <ToolCard tool={item} />}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadTools(true)}
            tintColor="#60a5fa"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="cube-outline" size={48} color="#333" />
            <Text style={styles.emptyText}>No tools available</Text>
            <Text style={styles.emptySubtext}>
              Make sure MCP servers are connected
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0a0a0a",
  },
  loadingText: {
    marginTop: 16,
    color: "#6b7280",
    fontSize: 14,
  },
  filterContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 16,
    gap: 8,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#111",
    borderWidth: 1,
    borderColor: "#222",
  },
  filterChipActive: {
    borderColor: "#60a5fa40",
    backgroundColor: "#60a5fa10",
  },
  filterText: {
    fontSize: 12,
    color: "#6b7280",
  },
  filterTextActive: {
    color: "#60a5fa",
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  toolCard: {
    backgroundColor: "#111",
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#222",
  },
  toolHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  toolIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  toolInfo: {
    flex: 1,
  },
  toolName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  toolServer: {
    fontSize: 11,
    color: "#6b7280",
    marginTop: 1,
  },
  toolDetails: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#222",
  },
  toolDescription: {
    fontSize: 13,
    color: "#9ca3af",
    lineHeight: 20,
  },
  schemaContainer: {
    marginTop: 12,
    backgroundColor: "#0a0a0a",
    borderRadius: 8,
    padding: 12,
  },
  schemaTitle: {
    fontSize: 11,
    fontWeight: "600",
    color: "#6b7280",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  schemaText: {
    fontSize: 11,
    color: "#60a5fa",
    fontFamily: "monospace",
    lineHeight: 16,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 13,
    color: "#444",
    marginTop: 4,
  },
});
