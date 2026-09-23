import React, { ReactElement, useCallback, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";

import AddToCart from "./add_recipe_cart";

const screenWidth = Dimensions.get("window").width;

type RecipeListProps = {
  recipes: any[];
  loading: boolean;
  fetchRandomRecipes: () => void;
  header?: ReactElement;
};

export default function RecipeList({
  recipes,
  loading,
  fetchRandomRecipes,
  header,
}: RecipeListProps) {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchRandomRecipes();
    } catch (error) {
      console.error("Error refreshing recipes:", error);
    } finally {
      setRefreshing(false);
    }
  }, [fetchRandomRecipes]);

  if (loading) {
    return (
      <View style={styles.container}>
        {header}
        <ActivityIndicator size="large" color="#2D6A4F" style={styles.loader} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={recipes}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={header}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No recipes are available right now.</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.recipeCard}>
            <TouchableOpacity
              onPress={() => router.push(`/recipeDetail/${item.id}`)}
              style={styles.cardContent}
            >
              <Image source={{ uri: item.image }} style={styles.recipeImage} />
              <Text style={styles.recipeTitle} numberOfLines={2}>
                {item.title}
              </Text>
            </TouchableOpacity>

            <AddToCart recipe={item} />
          </View>
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#2D6A4F"]}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 10,
  },
  loader: {
    marginTop: 20,
  },
  emptyText: {
    color: "#666",
    fontSize: 15,
    padding: 24,
    textAlign: "center",
  },
  recipeCard: {
    width: screenWidth - 20,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 10,
    marginVertical: 10,
    alignItems: "center",
    alignSelf: "center",
    elevation: 3,
  },
  cardContent: {
    width: "100%",
    alignItems: "center",
  },
  recipeImage: {
    width: "100%",
    height: 180,
    borderRadius: 8,
    resizeMode: "cover",
  },
  recipeTitle: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 10,
    color: "#333",
  },
});
