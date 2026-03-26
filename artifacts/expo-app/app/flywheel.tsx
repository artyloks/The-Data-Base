import { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { runFlywheel, vibeCode, type FlywheelEvent, type FlywheelResult } from "@/lib/api";

const PRESETS = [
  { label: "Lint", command: "npm run lint", icon: "checkmark-circle-outline" },
  { label: "Build", command: "npm run build", icon: "construct-outline" },
  { label: "Typecheck", command: "npm run typecheck", icon: "code-outline" },
  { label: "Test", command: "npm test", icon: "flask-outline" },
] as const;

type FlywheelMode = "standard" | "vibe";

function PhaseIcon({ phase }: { phase: FlywheelEvent["phase"] }) {
  const config = {
    observe: { icon: "eye-outline", color: "#60a5fa" },
    orient: { icon: "compass-outline", color: "#a78bfa" },
    decide: { icon: "bulb-outline", color: "#fbbf24" },
    act: { icon: "hammer-outline", color: "#f472b6" },
    heal: { icon: "medkit-outline", color: "#34d399" },
    complete: { icon: "checkmark-circle", color: "#34d399" },
    failed: { icon: "close-circle", color: "#f87171" },
  } as const;

  const { icon, color } = config[phase];
  return <Ionicons name={icon} size={20} color={color} />;
}

function EventCard({ event }: { event: FlywheelEvent }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Pressable
      style={styles.eventCard}
      onPress={() => {
        setExpanded(!expanded);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }}
    >
      <View style={styles.eventHeader}>
        <PhaseIcon phase={event.phase} />
        <Text style={styles.eventPhase}>{event.phase.toUpperCase()}</Text>
        <Text style={styles.eventIteration}>#{event.iteration}</Text>
        {event.exitCode !== undefined && (
          <View
            style={[
              styles.exitCodeBadge,
              { backgroundColor: event.exitCode === 0 ? "#34d39920" : "#f8717120" },
            ]}
          >
            <Text
              style={[
                styles.exitCodeText,
                { color: event.exitCode === 0 ? "#34d399" : "#f87171" },
              ]}
            >
              exit {event.exitCode}
            </Text>
          </View>
        )}
      </View>

      {expanded && (event.output || event.error || event.fix) && (
        <View style={styles.eventDetails}>
          {event.command && (
            <Text style={styles.commandText}>$ {event.command}</Text>
          )}
          {event.output && (
            <Text style={styles.outputText} numberOfLines={10}>
              {event.output}
            </Text>
          )}
          {event.error && <Text style={styles.errorText}>{event.error}</Text>}
          {event.fix && (
            <Text style={styles.fixText} numberOfLines={5}>
              {event.fix}
            </Text>
          )}
          {event.filesModified && event.filesModified.length > 0 && (
            <View style={styles.filesModified}>
              <Text style={styles.filesModifiedLabel}>Files Modified:</Text>
              {event.filesModified.map((file, i) => (
                <Text key={i} style={styles.fileModifiedPath}>{file}</Text>
              ))}
            </View>
          )}
        </View>
      )}
    </Pressable>
  );
}

export default function FlywheelScreen() {
  const [command, setCommand] = useState("npm run lint");
  const [events, setEvents] = useState<FlywheelEvent[]>([]);
  const [result, setResult] = useState<FlywheelResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState<FlywheelMode>("vibe");

  const handleRun = useCallback(async () => {
    if (!command.trim() || isRunning) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setEvents([]);
    setResult(null);
    setIsRunning(true);

    const runFn = mode === "vibe" ? vibeCode : runFlywheel;

    try {
      await runFn(
        command,
        undefined,
        (event) => {
          setEvents((prev) => [...prev, event]);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        },
        (finalResult) => {
          setResult(finalResult);
          setIsRunning(false);
          Haptics.notificationAsync(
            finalResult.success
              ? Haptics.NotificationFeedbackType.Success
              : Haptics.NotificationFeedbackType.Error
          );
        }
      );
    } catch {
      setIsRunning(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [command, isRunning, mode]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Autonomous Flywheel</Text>
        <Text style={styles.subtitle}>
          OODA loop with self-healing via Aider
        </Text>
        <View style={styles.modeToggle}>
          <Pressable
            style={[styles.modeButton, mode === "standard" && styles.modeButtonActive]}
            onPress={() => { setMode("standard"); Haptics.selectionAsync(); }}
          >
            <Text style={[styles.modeText, mode === "standard" && styles.modeTextActive]}>Standard</Text>
          </Pressable>
          <Pressable
            style={[styles.modeButton, mode === "vibe" && styles.modeButtonActiveVibe]}
            onPress={() => { setMode("vibe"); Haptics.selectionAsync(); }}
          >
            <Text style={[styles.modeText, mode === "vibe" && styles.modeTextActiveVibe]}>Vibe Code</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.presetsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {PRESETS.map((preset) => (
            <Pressable
              key={preset.command}
              style={[
                styles.presetButton,
                command === preset.command && styles.presetButtonActive,
              ]}
              onPress={() => {
                setCommand(preset.command);
                Haptics.selectionAsync();
              }}
            >
              <Ionicons
                name={preset.icon}
                size={16}
                color={command === preset.command ? "#60a5fa" : "#6b7280"}
              />
              <Text
                style={[
                  styles.presetLabel,
                  command === preset.command && styles.presetLabelActive,
                ]}
              >
                {preset.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={command}
          onChangeText={setCommand}
          placeholder="Enter command..."
          placeholderTextColor="#666"
          editable={!isRunning}
        />
        <Pressable
          style={[styles.runButton, isRunning && styles.runButtonDisabled]}
          onPress={handleRun}
          disabled={isRunning}
        >
          {isRunning ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="play" size={20} color="#fff" />
          )}
        </Pressable>
      </View>

      {result && (
        <View
          style={[
            styles.resultBanner,
            { backgroundColor: result.success ? "#34d39920" : "#f8717120" },
          ]}
        >
          <Ionicons
            name={result.success ? "checkmark-circle" : "close-circle"}
            size={24}
            color={result.success ? "#34d399" : "#f87171"}
          />
          <View style={styles.resultText}>
            <Text
              style={[
                styles.resultTitle,
                { color: result.success ? "#34d399" : "#f87171" },
              ]}
            >
              {result.success ? "Success" : "Failed"}
            </Text>
            <Text style={styles.resultStats}>
              {result.iterations} iteration{result.iterations !== 1 ? "s" : ""} |{" "}
              {(result.totalDuration / 1000).toFixed(1)}s
              {result.filesModified && result.filesModified.length > 0 && (
                ` | ${result.filesModified.length} file${result.filesModified.length !== 1 ? "s" : ""} modified`
              )}
            </Text>
          </View>
        </View>
      )}

      <ScrollView style={styles.eventsContainer}>
        {events.length === 0 && !isRunning && (
          <View style={styles.emptyState}>
            <Ionicons name="sync-outline" size={48} color="#333" />
            <Text style={styles.emptyText}>No flywheel runs yet</Text>
            <Text style={styles.emptySubtext}>
              The flywheel will iterate until your command succeeds
            </Text>
          </View>
        )}

        {events.map((event, index) => (
          <EventCard key={`${event.phase}-${event.iteration}-${index}`} event={event} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
  },
  header: {
    padding: 20,
    paddingBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#6b7280",
  },
  modeToggle: {
    flexDirection: "row",
    marginTop: 12,
    backgroundColor: "#111",
    borderRadius: 8,
    padding: 4,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: "center",
  },
  modeButtonActive: {
    backgroundColor: "#2563eb",
  },
  modeButtonActiveVibe: {
    backgroundColor: "#8b5cf6",
  },
  modeText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6b7280",
  },
  modeTextActive: {
    color: "#fff",
  },
  modeTextActiveVibe: {
    color: "#fff",
  },
  presetsContainer: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  presetButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#111",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#222",
  },
  presetButtonActive: {
    borderColor: "#60a5fa40",
    backgroundColor: "#60a5fa10",
  },
  presetLabel: {
    fontSize: 13,
    color: "#6b7280",
  },
  presetLabelActive: {
    color: "#60a5fa",
  },
  inputRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    backgroundColor: "#111",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: "#fff",
    fontSize: 14,
    fontFamily: "monospace",
    borderWidth: 1,
    borderColor: "#222",
  },
  runButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#34d399",
    justifyContent: "center",
    alignItems: "center",
  },
  runButtonDisabled: {
    opacity: 0.6,
  },
  resultBanner: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    gap: 12,
    marginBottom: 16,
  },
  resultText: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  resultStats: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  eventsContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  eventCard: {
    backgroundColor: "#111",
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#222",
  },
  eventHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  eventPhase: {
    fontSize: 12,
    fontWeight: "600",
    color: "#9ca3af",
    flex: 1,
  },
  eventIteration: {
    fontSize: 11,
    color: "#6b7280",
    fontFamily: "monospace",
  },
  exitCodeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  exitCodeText: {
    fontSize: 10,
    fontWeight: "600",
    fontFamily: "monospace",
  },
  eventDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#222",
  },
  commandText: {
    fontSize: 12,
    color: "#60a5fa",
    fontFamily: "monospace",
    marginBottom: 8,
  },
  outputText: {
    fontSize: 11,
    color: "#9ca3af",
    fontFamily: "monospace",
    lineHeight: 16,
  },
  errorText: {
    fontSize: 11,
    color: "#f87171",
    fontFamily: "monospace",
    lineHeight: 16,
  },
  fixText: {
    fontSize: 11,
    color: "#34d399",
    fontFamily: "monospace",
    lineHeight: 16,
    marginTop: 8,
  },
  filesModified: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#222",
  },
  filesModifiedLabel: {
    fontSize: 10,
    color: "#8b5cf6",
    fontWeight: "600",
    marginBottom: 4,
  },
  fileModifiedPath: {
    fontSize: 10,
    color: "#a78bfa",
    fontFamily: "monospace",
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
    textAlign: "center",
    maxWidth: 260,
  },
});
