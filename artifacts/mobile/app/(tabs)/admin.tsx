import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import {
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AdminLoginScreen } from "@/components/AdminLoginScreen";
import { useApp } from "@/contexts/AppContext";
import type { Profile } from "@/contexts/AppContext";
import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";

const CATEGORIES = ["تقرير", "خبر عاجل", "تحقيق", "مقال رأي", "حوار"];

export default function AdminScreen() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <AdminLoginScreen />;
  }

  return <AdminPanel />;
}

function AdminPanel() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { posts, profile, addPost, deletePost, updateProfile } = useApp();
  const { logout, changePassword } = useAuth();

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : 0;

  const [section, setSection] = useState<"newpost" | "profile" | "manage" | "security">("newpost");

  const [postTitle, setPostTitle] = useState("");
  const [postContent, setPostContent] = useState("");
  const [postCategory, setPostCategory] = useState("تقرير");
  const [postImage, setPostImage] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);

  const [profileData, setProfileData] = useState<Profile>(profile);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [passError, setPassError] = useState("");
  const [isSavingPass, setIsSavingPass] = useState(false);
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);

  async function handlePickImage(forPost: boolean) {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("صلاحية مطلوبة", "يرجى السماح بالوصول إلى مكتبة الصور");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      base64: true,
      quality: 0.65,
      allowsEditing: true,
    });
    if (!result.canceled && result.assets[0].base64) {
      const base64 = `data:image/jpeg;base64,${result.assets[0].base64}`;
      if (forPost) setPostImage(base64);
      else setProfileData((p) => ({ ...p, logoBase64: base64 }));
    }
  }

  async function handlePublish() {
    if (!postTitle.trim() && !postContent.trim()) return;
    setIsPublishing(true);
    try {
      await addPost({
        title: postTitle.trim(),
        content: postContent.trim(),
        imageBase64: postImage,
        category: postCategory,
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setPostTitle("");
      setPostContent("");
      setPostImage(null);
      setPostCategory("تقرير");
      Alert.alert("تم النشر", "تم نشر التقرير بنجاح");
    } finally {
      setIsPublishing(false);
    }
  }

  async function handleSaveProfile() {
    setIsSavingProfile(true);
    try {
      await updateProfile(profileData);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("تم الحفظ", "تم حفظ بيانات المنصة بنجاح");
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function handleChangePassword() {
    setPassError("");
    if (!oldPass || !newPass || !confirmPass) {
      setPassError("يرجى ملء جميع الحقول");
      return;
    }
    if (newPass !== confirmPass) {
      setPassError("كلمة المرور الجديدة غير متطابقة");
      return;
    }
    setIsSavingPass(true);
    const result = await changePassword(oldPass, newPass);
    setIsSavingPass(false);
    if (result.success) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setOldPass("");
      setNewPass("");
      setConfirmPass("");
      Alert.alert("تم التغيير", "تم تغيير كلمة المرور بنجاح");
    } else {
      setPassError(result.error ?? "حدث خطأ");
    }
  }

  async function handleDeletePost(id: string, title: string) {
    Alert.alert("حذف التقرير", `هل تريد حذف "${title}"؟`, [
      { text: "إلغاء", style: "cancel" },
      {
        text: "حذف",
        style: "destructive",
        onPress: async () => {
          await deletePost(id);
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        },
      },
    ]);
  }

  function handleLogout() {
    Alert.alert("تسجيل الخروج", "هل تريد الخروج من لوحة الإدارة؟", [
      { text: "إلغاء", style: "cancel" },
      { text: "خروج", style: "destructive", onPress: () => logout() },
    ]);
  }

  const tabItems = [
    { key: "newpost" as const, label: "نشر", icon: "plus-circle" as const },
    { key: "profile" as const, label: "المنصة", icon: "settings" as const },
    { key: "manage" as const, label: "إدارة", icon: "list" as const },
    { key: "security" as const, label: "الأمان", icon: "lock" as const },
  ];

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
            styles.logoutBtn,
            { backgroundColor: colors.destructive + "22", borderColor: colors.destructive + "55" },
          ]}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <Feather name="log-out" size={14} color={colors.destructive} />
          <Text style={[styles.logoutText, { color: colors.destructive }]}>خروج</Text>
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: colors.gold }]}>لوحة الإدارة</Text>
      </View>

      <View style={[styles.tabs, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        {tabItems.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              section === tab.key && {
                borderBottomColor: section === tab.key && tab.key === "security" ? colors.gold : colors.primary,
                borderBottomWidth: 2,
              },
            ]}
            onPress={() => setSection(tab.key)}
            activeOpacity={0.7}
          >
            <Feather
              name={tab.icon}
              size={16}
              color={section === tab.key ? (tab.key === "security" ? colors.gold : colors.primary) : colors.mutedForeground}
            />
            <Text
              style={[
                styles.tabLabel,
                {
                  color: section === tab.key
                    ? tab.key === "security" ? colors.gold : colors.primary
                    : colors.mutedForeground,
                },
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: bottomInset + 100 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {section === "newpost" && (
          <View style={styles.section}>
            <SectionBox colors={colors} title="نوع المحتوى">
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categories}
              >
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryChip,
                      {
                        backgroundColor: postCategory === cat ? colors.primary : colors.muted,
                        borderRadius: colors.radius,
                      },
                    ]}
                    onPress={() => setPostCategory(cat)}
                  >
                    <Text
                      style={{
                        color: postCategory === cat ? colors.primaryForeground : colors.mutedForeground,
                        fontSize: 13,
                        fontWeight: "600",
                      }}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </SectionBox>

            <SectionBox colors={colors} title="العنوان">
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.input,
                    color: colors.foreground,
                    borderColor: colors.border,
                    borderRadius: colors.radius - 4,
                  },
                ]}
                placeholder="عنوان التقرير..."
                placeholderTextColor={colors.mutedForeground}
                value={postTitle}
                onChangeText={setPostTitle}
                textAlign="right"
              />
            </SectionBox>

            <SectionBox colors={colors} title="المحتوى">
              <TextInput
                style={[
                  styles.textArea,
                  {
                    backgroundColor: colors.input,
                    color: colors.foreground,
                    borderColor: colors.border,
                    borderRadius: colors.radius - 4,
                  },
                ]}
                placeholder="اكتب التفاصيل الكاملة هنا..."
                placeholderTextColor={colors.mutedForeground}
                value={postContent}
                onChangeText={setPostContent}
                multiline
                numberOfLines={8}
                textAlignVertical="top"
                textAlign="right"
              />
            </SectionBox>

            <SectionBox colors={colors} title="صورة مرفقة (اختياري)">
              <TouchableOpacity
                style={[
                  styles.imagePicker,
                  {
                    borderColor: colors.border,
                    borderRadius: colors.radius - 4,
                    backgroundColor: colors.card,
                  },
                ]}
                onPress={() => handlePickImage(true)}
                activeOpacity={0.7}
              >
                {postImage ? (
                  <View style={styles.imagePreviewWrapper}>
                    <Image
                      source={{ uri: postImage }}
                      style={[styles.imagePreview, { borderRadius: colors.radius - 4 }]}
                      resizeMode="cover"
                    />
                    <TouchableOpacity
                      style={[styles.removeImage, { backgroundColor: colors.destructive }]}
                      onPress={() => setPostImage(null)}
                    >
                      <Feather name="x" size={14} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.imagePickerInner}>
                    <Feather name="image" size={32} color={colors.mutedForeground} />
                    <Text style={[styles.imagePickerText, { color: colors.mutedForeground }]}>
                      اضغط لاختيار صورة
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </SectionBox>

            <TouchableOpacity
              style={[
                styles.publishBtn,
                {
                  backgroundColor:
                    !postTitle.trim() && !postContent.trim() ? colors.muted : colors.primary,
                  borderRadius: colors.radius,
                  opacity: isPublishing ? 0.7 : 1,
                },
              ]}
              onPress={handlePublish}
              disabled={isPublishing || (!postTitle.trim() && !postContent.trim())}
              activeOpacity={0.8}
            >
              <Feather
                name="send"
                size={18}
                color={!postTitle.trim() && !postContent.trim() ? colors.mutedForeground : "#000"}
              />
              <Text
                style={[
                  styles.publishBtnText,
                  {
                    color:
                      !postTitle.trim() && !postContent.trim() ? colors.mutedForeground : "#000",
                  },
                ]}
              >
                {isPublishing ? "جاري النشر..." : "نشر الآن"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {section === "profile" && (
          <View style={styles.section}>
            <SectionBox colors={colors} title="شعار المنصة">
              <TouchableOpacity
                style={[
                  styles.logoPickerArea,
                  { borderColor: colors.border, borderRadius: colors.radius - 4, backgroundColor: colors.card },
                ]}
                onPress={() => handlePickImage(false)}
                activeOpacity={0.7}
              >
                {profileData.logoBase64 ? (
                  <Image
                    source={{ uri: profileData.logoBase64 }}
                    style={[styles.logoPreview, { borderRadius: colors.radius - 4 }]}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.logoPickerInner}>
                    <Feather name="camera" size={28} color={colors.mutedForeground} />
                    <Text style={[{ color: colors.mutedForeground, marginTop: 8, fontSize: 13 }]}>
                      رفع الشعار
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </SectionBox>

            <SectionBox colors={colors} title="رسالة المنصة">
              <TextInput
                style={[
                  styles.textArea,
                  {
                    backgroundColor: colors.input,
                    color: colors.foreground,
                    borderColor: colors.border,
                    borderRadius: colors.radius - 4,
                  },
                ]}
                placeholder="نبذة عن المنصة وأهدافها..."
                placeholderTextColor={colors.mutedForeground}
                value={profileData.about}
                onChangeText={(t) => setProfileData((p) => ({ ...p, about: t }))}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
                textAlign="right"
              />
            </SectionBox>

            <SectionBox colors={colors} title="معلومات التواصل">
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.input,
                    color: colors.foreground,
                    borderColor: colors.border,
                    borderRadius: colors.radius - 4,
                    marginBottom: 10,
                  },
                ]}
                placeholder="رقم الهاتف"
                placeholderTextColor={colors.mutedForeground}
                value={profileData.phone}
                onChangeText={(t) => setProfileData((p) => ({ ...p, phone: t }))}
                keyboardType="phone-pad"
                textAlign="right"
              />
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.input,
                    color: colors.foreground,
                    borderColor: colors.border,
                    borderRadius: colors.radius - 4,
                  },
                ]}
                placeholder="البريد الإلكتروني"
                placeholderTextColor={colors.mutedForeground}
                value={profileData.email}
                onChangeText={(t) => setProfileData((p) => ({ ...p, email: t }))}
                keyboardType="email-address"
                textAlign="right"
              />
            </SectionBox>

            <TouchableOpacity
              style={[
                styles.publishBtn,
                {
                  backgroundColor: colors.gold,
                  borderRadius: colors.radius,
                  opacity: isSavingProfile ? 0.7 : 1,
                },
              ]}
              onPress={handleSaveProfile}
              disabled={isSavingProfile}
              activeOpacity={0.8}
            >
              <Feather name="save" size={18} color="#000" />
              <Text style={[styles.publishBtnText, { color: "#000" }]}>
                {isSavingProfile ? "جاري الحفظ..." : "حفظ البيانات"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {section === "manage" && (
          <View style={styles.section}>
            <View style={styles.manageHeader}>
              <Text style={[styles.manageCount, { color: colors.mutedForeground }]}>
                {posts.length} تقرير منشور
              </Text>
            </View>

            {posts.length === 0 && (
              <View style={styles.empty}>
                <Feather name="inbox" size={40} color={colors.muted} />
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                  لا توجد تقارير منشورة
                </Text>
              </View>
            )}

            {posts.map((post) => (
              <View
                key={post.id}
                style={[
                  styles.manageItem,
                  {
                    backgroundColor: colors.card,
                    borderRadius: colors.radius,
                    borderColor: colors.border,
                  },
                ]}
              >
                {post.imageBase64 && (
                  <Image
                    source={{ uri: post.imageBase64 }}
                    style={[styles.manageThumb, { borderRadius: colors.radius - 4 }]}
                  />
                )}
                <View style={styles.manageItemInfo}>
                  <Text
                    style={[styles.manageItemTitle, { color: colors.foreground }]}
                    numberOfLines={2}
                  >
                    {post.title || "بدون عنوان"}
                  </Text>
                  <View style={styles.manageItemMeta}>
                    <View style={[styles.smallBadge, { backgroundColor: colors.primary + "22" }]}>
                      <Text style={[{ color: colors.primary, fontSize: 10, fontWeight: "600" }]}>
                        {post.category}
                      </Text>
                    </View>
                    <Text style={[styles.manageItemDate, { color: colors.mutedForeground }]}>
                      {post.date}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={[styles.deleteBtn, { backgroundColor: colors.destructive + "22" }]}
                  onPress={() => handleDeletePost(post.id, post.title || "هذا التقرير")}
                  activeOpacity={0.7}
                >
                  <Feather name="trash-2" size={16} color={colors.destructive} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {section === "security" && (
          <View style={styles.section}>
            <View
              style={[
                styles.securityInfo,
                {
                  backgroundColor: colors.gold + "11",
                  borderColor: colors.gold + "33",
                  borderRadius: colors.radius,
                },
              ]}
            >
              <Feather name="shield" size={18} color={colors.gold} />
              <Text style={[styles.securityInfoText, { color: colors.gold }]}>
                تغيير كلمة مرور لوحة الإدارة
              </Text>
            </View>

            <SectionBox colors={colors} title="كلمة المرور الحالية">
              <View
                style={[
                  styles.passInputRow,
                  {
                    backgroundColor: colors.input,
                    borderColor: colors.border,
                    borderRadius: colors.radius - 4,
                  },
                ]}
              >
                <TouchableOpacity onPress={() => setShowOld(!showOld)} style={styles.eyeBtn}>
                  <Feather
                    name={showOld ? "eye-off" : "eye"}
                    size={16}
                    color={colors.mutedForeground}
                  />
                </TouchableOpacity>
                <TextInput
                  style={[styles.passInput, { color: colors.foreground }]}
                  placeholder="كلمة المرور الحالية"
                  placeholderTextColor={colors.mutedForeground}
                  value={oldPass}
                  onChangeText={(t) => { setOldPass(t); setPassError(""); }}
                  secureTextEntry={!showOld}
                  textAlign="right"
                  autoCapitalize="none"
                />
              </View>
            </SectionBox>

            <SectionBox colors={colors} title="كلمة المرور الجديدة">
              <View
                style={[
                  styles.passInputRow,
                  {
                    backgroundColor: colors.input,
                    borderColor: colors.border,
                    borderRadius: colors.radius - 4,
                    marginBottom: 10,
                  },
                ]}
              >
                <TouchableOpacity onPress={() => setShowNew(!showNew)} style={styles.eyeBtn}>
                  <Feather
                    name={showNew ? "eye-off" : "eye"}
                    size={16}
                    color={colors.mutedForeground}
                  />
                </TouchableOpacity>
                <TextInput
                  style={[styles.passInput, { color: colors.foreground }]}
                  placeholder="كلمة المرور الجديدة (6 أحرف على الأقل)"
                  placeholderTextColor={colors.mutedForeground}
                  value={newPass}
                  onChangeText={(t) => { setNewPass(t); setPassError(""); }}
                  secureTextEntry={!showNew}
                  textAlign="right"
                  autoCapitalize="none"
                />
              </View>
              <View
                style={[
                  styles.passInputRow,
                  {
                    backgroundColor: colors.input,
                    borderColor: colors.border,
                    borderRadius: colors.radius - 4,
                  },
                ]}
              >
                <Feather name="check-circle" size={16} color={colors.mutedForeground} style={{ margin: 10 }} />
                <TextInput
                  style={[styles.passInput, { color: colors.foreground }]}
                  placeholder="تأكيد كلمة المرور الجديدة"
                  placeholderTextColor={colors.mutedForeground}
                  value={confirmPass}
                  onChangeText={(t) => { setConfirmPass(t); setPassError(""); }}
                  secureTextEntry={!showNew}
                  textAlign="right"
                  autoCapitalize="none"
                />
              </View>
            </SectionBox>

            {passError ? (
              <View
                style={[
                  styles.errorBox,
                  {
                    backgroundColor: colors.destructive + "18",
                    borderColor: colors.destructive + "44",
                    borderRadius: colors.radius,
                  },
                ]}
              >
                <Feather name="alert-circle" size={14} color={colors.destructive} />
                <Text style={[styles.errorText, { color: colors.destructive }]}>{passError}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[
                styles.publishBtn,
                {
                  backgroundColor: colors.gold,
                  borderRadius: colors.radius,
                  opacity: isSavingPass ? 0.7 : 1,
                },
              ]}
              onPress={handleChangePassword}
              disabled={isSavingPass}
              activeOpacity={0.8}
            >
              <Feather name="key" size={18} color="#000" />
              <Text style={[styles.publishBtnText, { color: "#000" }]}>
                {isSavingPass ? "جاري الحفظ..." : "تغيير كلمة المرور"}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function SectionBox({
  colors,
  title,
  children,
}: {
  colors: ReturnType<typeof useColors>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View
      style={[
        styles.sectionBox,
        {
          backgroundColor: colors.card,
          borderRadius: colors.radius,
          borderColor: colors.border,
        },
      ]}
    >
      <Text style={[styles.sectionBoxTitle, { color: colors.gold }]}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: { fontSize: 22, fontFamily: "Inter_700Bold" },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  logoutText: { fontSize: 12, fontWeight: "600" },
  tabs: {
    flexDirection: "row",
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    gap: 4,
  },
  tabLabel: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  section: { padding: 16, gap: 12 },
  sectionBox: { padding: 16, borderWidth: 1, gap: 10 },
  sectionBoxTitle: { fontSize: 13, fontFamily: "Inter_700Bold", textAlign: "right" },
  categories: { flexDirection: "row", gap: 8, paddingVertical: 4 },
  categoryChip: { paddingHorizontal: 14, paddingVertical: 7 },
  input: {
    padding: 12,
    borderWidth: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  textArea: {
    padding: 12,
    borderWidth: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    minHeight: 130,
  },
  imagePicker: {
    borderWidth: 1,
    borderStyle: "dashed",
    minHeight: 120,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  imagePickerInner: { alignItems: "center", gap: 8, paddingVertical: 20 },
  imagePickerText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  imagePreviewWrapper: { width: "100%", position: "relative" },
  imagePreview: { width: "100%", height: 180 },
  removeImage: {
    position: "absolute",
    top: 8,
    left: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  publishBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: 16,
    marginTop: 4,
  },
  publishBtnText: { fontSize: 16, fontFamily: "Inter_700Bold" },
  logoPickerArea: {
    height: 120,
    borderWidth: 1,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  logoPickerInner: { alignItems: "center" },
  logoPreview: { width: "100%", height: 120 },
  manageHeader: { paddingBottom: 8, alignItems: "flex-end" },
  manageCount: { fontSize: 13, fontFamily: "Inter_400Regular" },
  manageItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  manageThumb: { width: 60, height: 50 },
  manageItemInfo: { flex: 1, gap: 6 },
  manageItemTitle: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    textAlign: "right",
  },
  manageItemMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 8,
  },
  smallBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  manageItemDate: { fontSize: 11, fontFamily: "Inter_400Regular" },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  empty: { alignItems: "center", paddingVertical: 40, gap: 10 },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  securityInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderWidth: 1,
  },
  securityInfoText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    textAlign: "right",
  },
  passInputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    paddingHorizontal: 4,
  },
  eyeBtn: { padding: 10 },
  passInput: {
    flex: 1,
    paddingVertical: 13,
    paddingHorizontal: 8,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderWidth: 1,
  },
  errorText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "right" },
});
