import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { posts } = useApp();

  const post = posts.find((p) => p.id === id);

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : 0;

  if (!post) {
    return (
      <View
        style={[styles.notFound, { backgroundColor: colors.background }]}
      >
        <Feather name="alert-circle" size={48} color={colors.mutedForeground} />
        <Text style={[styles.notFoundText, { color: colors.foreground }]}>
          التقرير غير موجود
        </Text>
        <TouchableOpacity
          style={[styles.backBtn, { borderColor: colors.border }]}
          onPress={() => router.back()}
        >
          <Feather name="arrow-right" size={18} color={colors.primary} />
          <Text style={[styles.backBtnText, { color: colors.primary }]}>
            العودة
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: topInset + 12,
            backgroundColor: "#000",
            borderBottomColor: colors.gold,
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.headerBack,
            {
              backgroundColor: colors.card,
              borderRadius: colors.radius - 4,
              borderColor: colors.border,
            },
          ]}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Feather name="arrow-right" size={20} color={colors.primary} />
        </TouchableOpacity>

        <View
          style={[
            styles.categoryBadge,
            { backgroundColor: colors.primary + "22", borderColor: colors.primary },
          ]}
        >
          <Text style={[styles.categoryText, { color: colors.primary }]}>
            {post.category || "تقرير"}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: bottomInset + 40 }}
        showsVerticalScrollIndicator={false}
      >
        {post.imageBase64 && (
          <Image
            source={{ uri: post.imageBase64 }}
            style={styles.heroImage}
            resizeMode="cover"
          />
        )}

        <View style={styles.content}>
          <Text style={[styles.date, { color: colors.gold }]}>{post.date}</Text>

          {post.title ? (
            <Text style={[styles.title, { color: colors.primary }]}>
              {post.title}
            </Text>
          ) : null}

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <Text style={[styles.body, { color: colors.foreground }]}>
            {post.content}
          </Text>
        </View>

        <View
          style={[
            styles.footer,
            { borderTopColor: colors.border, backgroundColor: colors.card },
          ]}
        >
          <Feather name="radio" size={16} color={colors.gold} />
          <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
            صوتنا واحد · منصة إعلامية مستقلة
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerBack: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  categoryBadge: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryText: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
  },
  heroImage: {
    width: "100%",
    height: 240,
  },
  content: {
    padding: 20,
    gap: 12,
  },
  date: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    textAlign: "right",
  },
  title: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    textAlign: "right",
    lineHeight: 34,
  },
  divider: {
    height: 1,
    marginVertical: 4,
  },
  body: {
    fontSize: 16,
    lineHeight: 30,
    textAlign: "right",
    fontFamily: "Inter_400Regular",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 20,
    marginTop: 24,
    borderTopWidth: 1,
  },
  footerText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  notFound: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 14,
  },
  notFoundText: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 8,
  },
  backBtnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
});
