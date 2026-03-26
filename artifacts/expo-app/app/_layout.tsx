import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StyleSheet } from "react-native";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.container}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#0a0a0a" },
          headerTintColor: "#fff",
          headerTitleStyle: { fontWeight: "600" },
          contentStyle: { backgroundColor: "#0a0a0a" },
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: "The Brain",
            headerLargeTitle: true,
          }}
        />
        <Stack.Screen
          name="chat"
          options={{
            title: "Agentic Chat",
            presentation: "modal",
          }}
        />
        <Stack.Screen
          name="flywheel"
          options={{
            title: "Flywheel",
            presentation: "modal",
          }}
        />
        <Stack.Screen
          name="tools"
          options={{
            title: "MCP Tools",
          }}
        />
      </Stack>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
  },
});
