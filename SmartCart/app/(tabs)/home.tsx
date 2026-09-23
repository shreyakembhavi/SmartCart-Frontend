import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";

import RecipeList from "../components/recipeList";

const API_URL = Constants.expoConfig?.extra?.API_URL;

interface Recipe {
  id: number;
  title: string;
  image: string;
  score?: number;
}

export default function HomeScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [smartRecipes, setSmartRecipes] = useState<Recipe[]>([]);
  const [isPersonalized, setIsPersonalized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [smartLoading, setSmartLoading] = useState(false);
  const [token, setToken] = useState("");

  useEffect(() => {
    const loadRecipes = async () => {
      try {
        const storedToken = await AsyncStorage.getItem("authToken");
        if (!storedToken) {
          Alert.alert("Error", "Authentication required. Please log in.");
          router.replace("/");
          return;
        }

        setToken(storedToken);
        await Promise.all([
          fetchRandomRecipes(storedToken),
          fetchSmartRecommendations(storedToken),
        ]);
      } catch (error) {
        console.error("Error loading recipes:", error);
      }
    };

    loadRecipes();
  }, []);

  const fetchRandomRecipes = async (authToken: string) => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/randomrecipe?page=1&limit=10`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch recipes");
      }

      const seenIds = new Set<number>();
      const uniqueRecipes = (data.results || []).filter((recipe: Recipe) => {
        if (seenIds.has(recipe.id)) {
          return false;
        }
        seenIds.add(recipe.id);
        return true;
      });

      setRecipes(uniqueRecipes);
    } catch (error) {
      console.error("Error fetching random recipes:", error);
      Alert.alert("Error", "Failed to load recipes. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchSmartRecommendations = async (authToken: string) => {
    setSmartLoading(true);
    try {
      const response = await fetch(`${API_URL}/smart-recommendations`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch recommendations");
      }

      setSmartRecipes(Array.isArray(data.results) ? data.results : []);
      setIsPersonalized(Boolean(data.meta?.personalized));
    } catch (error) {
      console.error("Error fetching smart recommendations:", error);
      setSmartRecipes([]);
      setIsPersonalized(false);
    } finally {
      setSmartLoading(false);
    }
  };

  const refreshRecipes = async () => {
    if (!token) return;
    await Promise.all([
      fetchRandomRecipes(token),
      fetchSmartRecommendations(token),
    ]);
  };

  const openSearch = () => {
    const query = searchQuery.trim();
    if (!query) return;

    router.push({
      pathname: "/recipeSearch",
      params: { query },
    });
  };

  const recommendationsHeader = (
    <View>
      <Text style={styles.sectionTitle}>
        {isPersonalized
          ? "✨ Smart Recommendations"
          : "✨ Preference-Based Picks"}
      </Text>

      {smartLoading ? (
        <ActivityIndicator color="#2D6A4F" style={styles.recommendationLoader} />
      ) : smartRecipes.length > 0 ? (
        <FlatList
          horizontal
          data={smartRecipes}
          keyExtractor={(item) => `recommended-${item.id}`}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.recommendationList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.recommendationCard}
              onPress={() => router.push(`/recipeDetail/${item.id}`)}
            >
              <Image
                source={{ uri: item.image }}
                style={styles.recommendationImage}
              />
              <Text style={styles.recommendationTitle} numberOfLines={2}>
                {item.title}
              </Text>
              {isPersonalized && typeof item.score === "number" && (
                <Text style={styles.matchText}>
                  {Math.round(Math.max(0, Math.min(1, item.score)) * 100)}% match
                </Text>
              )}
            </TouchableOpacity>
          )}
        />
      ) : (
        <Text style={styles.recommendationEmpty}>
          Save a few recipes to build your personalized recommendations.
        </Text>
      )}

      <Text style={styles.sectionTitle}>🍽️ Recipe Feed</Text>
    </View>
  );

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.topBar}>
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search recipes..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={openSearch}
                returnKeyType="search"
              />
              <TouchableOpacity
                style={styles.searchButton}
                onPress={openSearch}
                accessibilityLabel="Search recipes"
              >
                <Ionicons name="search" size={24} color="#2D6A4F" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={() => router.push("/preferencesScreen")}
              style={styles.iconButton}
              accessibilityLabel="Edit recipe preferences"
            >
              <Ionicons name="filter" size={30} color="#222" />
            </TouchableOpacity>
          </View>

          <RecipeList
            recipes={recipes}
            loading={loading}
            fetchRandomRecipes={refreshRecipes}
            header={recommendationsHeader}
          />

          <TouchableOpacity
            style={styles.cartButton}
            onPress={() => router.push("/(tabs)/cart")}
            accessibilityLabel="Open shopping cart"
          >
            <Ionicons name="cart" size={30} color="white" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8F3E6",
  },
  container: {
    flex: 1,
    backgroundColor: "#F8F3E6",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    marginBottom: 10,
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  searchInput: {
    flex: 1,
    height: 42,
    borderWidth: 2,
    borderColor: "#222",
    borderRadius: 21,
    paddingHorizontal: 15,
    backgroundColor: "#FFFFFF",
  },
  searchButton: {
    marginLeft: 6,
    padding: 8,
  },
  iconButton: {
    width: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginHorizontal: 5,
    marginTop: 12,
    marginBottom: 8,
    color: "#333",
  },
  recommendationLoader: {
    marginVertical: 24,
  },
  recommendationList: {
    gap: 12,
    paddingBottom: 8,
  },
  recommendationCard: {
    width: 170,
    padding: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    elevation: 2,
  },
  recommendationImage: {
    width: "100%",
    height: 105,
    borderRadius: 8,
    resizeMode: "cover",
  },
  recommendationTitle: {
    minHeight: 40,
    marginTop: 8,
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
  },
  matchText: {
    marginTop: 4,
    color: "#2D6A4F",
    fontSize: 13,
    fontWeight: "600",
  },
  recommendationEmpty: {
    marginHorizontal: 5,
    padding: 16,
    color: "#666",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
  },
  cartButton: {
    position: "absolute",
    bottom: 30,
    right: 30,
    backgroundColor: "#2D6A4F",
    padding: 16,
    borderRadius: 30,
    elevation: 4,
  },
});
