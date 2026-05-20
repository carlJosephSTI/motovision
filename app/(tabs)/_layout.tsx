import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { Text, View } from "react-native";

function NeonTabIcon({
  focused,
  name,
  color,
}: {
  focused: boolean;
  name: keyof typeof Ionicons.glyphMap;
  color: string;
}) {
  return (
    <View
      style={{
        width: 48,
        height: 38,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: focused ? `${color}22` : "transparent",
        shadowColor: color,
        shadowOpacity: focused ? 0.9 : 0,
        shadowRadius: focused ? 12 : 0,
        shadowOffset: { width: 0, height: 0 },
        elevation: focused ? 8 : 0,
      }}
    >
      <Ionicons
        name={name}
        size={focused ? 27 : 24}
        color={focused ? color : "#7B8494"}
      />
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#07090D",
          borderTopWidth: 1,
          borderTopColor: "#1F2937",
          height: 74,
          paddingTop: 8,
          paddingBottom: 10,
          elevation: 12,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "800",
        },
        tabBarButton: undefined,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarActiveTintColor: "#FFFFFF",
          tabBarInactiveTintColor: "#7B8494",
          tabBarIcon: ({ focused }) => (
            <NeonTabIcon
              focused={focused}
              name={focused ? "home" : "home-outline"}
              color="#FFFFFF"
            />
          ),
          tabBarLabel: ({ focused }) => (
            <Text
              style={{
                color: focused ? "#FFFFFF" : "#7B8494",
                fontSize: 11,
                fontWeight: "800",
              }}
            >
              Home
            </Text>
          ),
        }}
      />

      <Tabs.Screen
        name="catalog"
        options={{
          title: "Catalog",
          tabBarActiveTintColor: "#FF3B30",
          tabBarInactiveTintColor: "#7B8494",
          tabBarIcon: ({ focused }) => (
            <NeonTabIcon
              focused={focused}
              name={focused ? "bicycle" : "bicycle-outline"}
              color="#FF3B30"
            />
          ),
          tabBarLabel: ({ focused }) => (
            <Text
              style={{
                color: focused ? "#FF3B30" : "#7B8494",
                fontSize: 11,
                fontWeight: "800",
              }}
            >
              Catalog
            </Text>
          ),
        }}
      />

      <Tabs.Screen
        name="cart"
        options={{
          title: "Cart",
          tabBarActiveTintColor: "#FF9500",
          tabBarInactiveTintColor: "#7B8494",
          tabBarIcon: ({ focused }) => (
            <NeonTabIcon
              focused={focused}
              name={focused ? "cart" : "cart-outline"}
              color="#FF9500"
            />
          ),
          tabBarLabel: ({ focused }) => (
            <Text
              style={{
                color: focused ? "#FF9500" : "#7B8494",
                fontSize: 11,
                fontWeight: "800",
              }}
            >
              Cart
            </Text>
          ),
        }}
      />
    </Tabs>
  );
}