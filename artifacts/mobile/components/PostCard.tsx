import { Feather } from "@expo/vector-icons";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import type { Post } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";

interface Props {
  post: Post;
  onPress: () => void;
  featured?: boolean;
}

export function PostCard({ post, onPress, featured = false }: Props) {
  const colors = useColors();

  const previewText =
    post.content.length > 120
      ? post.content.substring(0, 120) + "..."
      : post.content;

  if (featured && post.imageBase64) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.85}
        style={[
          styles.featuredCard,
          {
            borderRadius: colors.radius,
            borderColor: colors.gold,
            backgroundColor: colors.card,
          },
        ]}
      >
        <Image
          source={{ uri: post.imageBase64 }}
          style={[styles.featuredImage, { borderRadius: colors.radius }]}
          resizeMode="cover"
        />
        <View style={styles.featuredOverlay}>
          <View
            style={[
              styles.categoryBadge,
              { backgroundColor: colors.primary + "cc" },
            ]}
          >
            <Text
              style={[styles.categoryText, { color: colors.primaryForeground }]}
            >
              {post.category || "تقرير"}
            </Text>
          </View>
          <Text
            style={[styles.featuredTitle, { color: "#fff" }]}
            numberOfLines={2}
          >
            {post.title}
          </Text>
          <Text style={[styles.featuredDate, { color: colors.gold }]}>
            {post.date}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderRadius: colors.radius,
          borderRightWidth: 4,
          borderRightColor: featured ? colors.gold : colors.primary,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={styles.cardContent}>
        {post.imageBase64 && (
          <Image
            source={{ uri: post.imageBase64 }}
            style={[styles.thumbnail, { borderRadius: colors.radius - 4 }]}
            resizeMode="cover"
          />
        )}
        <View style={styles.textContent}>
          <View style={styles.cardHeader}>
            <View
              style={[
                styles.smallBadge,
                { backgroundColor: colors.primary + "22" },
              ]}
            >
              <Text
                style={[styles.smallBadgeText, { color: colors.primary }]}
              >
                {post.category || "تقرير"}
              </Text>
            </View>
            <Text style={[styles.date, { color: colors.gold }]}>
              {post.date}
            </Text>
          </View>
          <Text
            style={[styles.title, { color: colors.foreground }]}
            numberOfLines={2}
          >
            {post.title}
          </Text>
          {!post.imageBase64 && (
            <Text
              style={[styles.preview, { color: colors.mutedForeground }]}
              numberOfLines={2}
            >
              {previewText}
            </Text>
          )}
          <View style={styles.readMore}>
            <Feather name="arrow-left" size={14} color={colors.primary} />
            <Text style={[styles.readMoreText, { color: colors.primary }]}>
              اقرأ المزيد
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
  },
  cardContent: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  thumbnail: {
    width: 90,
    height: 80,
  },
  textContent: {
    flex: 1,
    gap: 6,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  smallBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  smallBadgeText: {
    fontSize: 10,
    fontWeight: "600",
  },
  date: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  title: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    textAlign: "right",
    lineHeight: 22,
  },
  preview: {
    fontSize: 13,
    textAlign: "right",
    lineHeight: 19,
    fontFamily: "Inter_400Regular",
  },
  readMore: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-end",
  },
  readMoreText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  featuredCard: {
    marginHorizontal: 16,
    marginBottom: 20,
    height: 220,
    overflow: "hidden",
    borderWidth: 1,
    shadowColor: "#d4af37",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  featuredImage: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },
  featuredOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: "rgba(0,0,0,0.72)",
    gap: 6,
  },
  categoryBadge: {
    alignSelf: "flex-end",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: "700",
  },
  featuredTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    textAlign: "right",
    lineHeight: 26,
  },
  featuredDate: {
    fontSize: 12,
    textAlign: "right",
    fontFamily: "Inter_400Regular",
  },
});
