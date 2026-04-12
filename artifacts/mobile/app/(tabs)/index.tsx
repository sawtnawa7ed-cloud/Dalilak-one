import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PostCard } from "@/components/PostCard";
import { useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { posts, profile, isLoading } = useApp();

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : 0;

  if (isLoading) {
    return (
      <View
        style={[styles.loadingContainer, { backgroundColor: colors.background }]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const headerComponent = (
    <View>
      <View
        style={[
          styles.hero,
          {
            backgroundColor: colors.background,
            paddingTop: topInset + 16,
            borderBottomColor: colors.gold,
          },
        ]}
      >
        <View style={styles.heroInner}>
          <View style={styles.logoRow}>
            <View style={styles.logoText}>
              <Text style={[styles.platformName, { color: colors.primary }]}>
                صوتنا واحد
              </Text>
              <Text style={[styles.platformSub, { color: colors.gold }]}>
                منصة إعلامية مستقلة · لبنان
              </Text>
            </View>
            {profile.logoBase64 ? (
              <Image
                source={{ uri: profile.logoBase64 }}
                style={[
                  styles.logo,
                  {
                    borderRadius: colors.radius,
                    borderColor: colors.primary,
                  },
                ]}
              />
            ) : (
              <View
                style={[
                  styles.logoPlaceholder,
                  {
                    backgroundColor: colors.card,
                    borderRadius: colors.radius,
                    borderColor: colors.primary,
                  },
                ]}
              >
                <Feather name="radio" size={28} color={colors.primary} />
              </View>
            )}
          </View>

          {profile.about ? (
            <Text style={[styles.about, { color: colors.mutedForeground }]}>
              {profile.about}
            </Text>
          ) : null}
        </View>
      </View>

      {posts.length > 0 ? (
        <>
          <View
            style={[styles.sectionHeader, { borderBottomColor: colors.border }]}
          >
            <View
              style={[
                styles.sectionDot,
                { backgroundColor: colors.primary },
              ]}
            />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              آخر التقارير
            </Text>
          </View>

          {posts[0] && (
            <PostCard
              post={posts[0]}
              featured={true}
              onPress={() => router.push(`/post/${posts[0].id}`)}
            />
          )}

          {posts.length > 1 && (
            <View
              style={[
                styles.sectionHeader,
                { borderBottomColor: colors.border },
              ]}
            >
              <View
                style={[
                  styles.sectionDot,
                  { backgroundColor: colors.gold },
                ]}
              />
              <Text
                style={[styles.sectionTitle, { color: colors.foreground }]}
              >
                تقارير سابقة
              </Text>
            </View>
          )}
        </>
      ) : null}
    </View>
  );

  const emptyComponent = (
    <View style={styles.empty}>
      <Feather name="file-text" size={48} color={colors.muted} />
      <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
        لا توجد تقارير بعد
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
        انتقل إلى لوحة الإدارة لنشر أول تقرير
      </Text>
    </View>
  );

  return (
    <View
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <FlatList
        data={posts.length > 1 ? posts.slice(1) : []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            onPress={() => router.push(`/post/${item.id}`)}
          />
        )}
        ListHeaderComponent={headerComponent}
        ListEmptyComponent={posts.length === 0 ? emptyComponent : null}
        contentContainerStyle={{ paddingBottom: bottomInset + 100 }}
        showsVerticalScrollIndicator={false}
        scrollEnabled={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  hero: {
    borderBottomWidth: 1,
    marginBottom: 8,
  },
  heroInner: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    gap: 12,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 12,
  },
  logo: {
    width: 56,
    height: 56,
    borderWidth: 2,
  },
  logoPlaceholder: {
    width: 56,
    height: 56,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  logoText: {
    flex: 1,
    alignItems: "flex-end",
    gap: 2,
  },
  platformName: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.5,
  },
  platformSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  about: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: "right",
    fontFamily: "Inter_400Regular",
    paddingHorizontal: 4,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    marginBottom: 16,
    gap: 8,
  },
  sectionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  empty: {
    alignItems: "center",
    paddingTop: 60,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: "center",
    fontFamily: "Inter_400Regular",
    paddingHorizontal: 40,
  },
});
