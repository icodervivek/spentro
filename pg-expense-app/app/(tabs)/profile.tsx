import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../../stores/authStore';
import { useLogout, useUpdateProfile, useChangePassword } from '../../hooks/useAuth';
import { useGroups } from '../../hooks/useGroups';
import { Colors, Shadows } from '../../constants/Colors';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { ScreenFX } from '../../components/ui/ScreenFX';
import { useAppDialog } from '../../components/ui/AppDialogProvider';

interface MenuItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  danger?: boolean;
  value?: string;
}

const MenuItem: React.FC<MenuItemProps> = ({ icon, label, onPress, danger, value }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
    <View style={[styles.menuIcon, danger && styles.menuIconDanger]}>
      <Ionicons name={icon} size={18} color={danger ? Colors.danger : Colors.primary} />
    </View>
    <Text style={[styles.menuLabel, danger && styles.menuLabelDanger]}>{label}</Text>
    {value ? (
      <Text style={styles.menuValue}>{value}</Text>
    ) : (
      <Ionicons name="chevron-forward" size={16} color={Colors.textTertiary} />
    )}
  </TouchableOpacity>
);

export default function ProfileScreen() {
  const dialog = useAppDialog();
  const user = useAuthStore((s) => s.user);
  const { data: groups } = useGroups();
  const logout = useLogout();
  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();

  const [editMode, setEditMode] = useState(false);
  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [avatarUri, setAvatarUri] = useState<string | null>(user?.avatarUrl ?? null);
  const [avatarFile, setAvatarFile] = useState<{
    uri: string;
    name: string;
    type: string;
  } | null>(null);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');

  const pickAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      dialog.alert('Permission needed', 'Please allow photo access to upload a profile image.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    const extension = asset.uri.split('.').pop() || 'jpg';
    const mimeType = asset.mimeType || `image/${extension === 'jpg' ? 'jpeg' : extension}`;

    setAvatarUri(asset.uri);
    setAvatarFile({
      uri: asset.uri,
      name: `avatar-${Date.now()}.${extension}`,
      type: mimeType,
    });
  };

  const handleSaveProfile = async () => {
    try {
      if (avatarFile) {
        // Upload as multipart/form-data so the backend can store via Cloudinary
        const formData = new FormData();
        if (name) formData.append('name', name);
        if (phone) formData.append('phone', phone);
        formData.append('avatar', avatarFile as any);
        await updateProfile.mutateAsync(formData);
      } else {
        await updateProfile.mutateAsync({ name, phone });
      }
      setEditMode(false);
      setAvatarFile(null);
    } catch (err: any) {
      dialog.alert('Error', err?.response?.data?.message ?? 'Update failed');
    }
  };

  const handleChangePassword = async () => {
    try {
      await changePassword.mutateAsync({ currentPassword: currentPw, newPassword: newPw });
      dialog.alert('Success', 'Password changed successfully');
      setShowPasswordForm(false);
      setCurrentPw('');
      setNewPw('');
    } catch (err: any) {
      dialog.alert('Error', err?.response?.data?.message ?? 'Password change failed');
    }
  };

  const handleLogout = () => {
    dialog.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout.mutateAsync();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const initials = (user?.name ?? 'U')
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenFX variant="indigo" />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile header */}
        <LinearGradient
          colors={[Colors.primaryDark, Colors.primaryLight]}
          style={styles.profileHeader}
        >
          <View style={styles.avatar}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>{initials}</Text>
            )}
          </View>
          {!editMode ? (
            <>
              <Text style={styles.userName}>{user?.name}</Text>
              <Text style={styles.userEmail}>{user?.email}</Text>
              <TouchableOpacity
                style={styles.editBtn}
                onPress={() => setEditMode(true)}
              >
                <Ionicons name="pencil-outline" size={14} color="#fff" />
                <Text style={styles.editBtnText}>Edit profile</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.editForm}>
              <View style={styles.editPanel}>
                <Text style={styles.editPanelTitle}>Edit Profile</Text>
                <View style={styles.avatarEditorRow}>
                  <View style={styles.avatarEditorPreview}>
                    {avatarUri ? (
                      <Image source={{ uri: avatarUri }} style={styles.avatarEditorImage} />
                    ) : (
                      <Text style={styles.avatarEditorInitials}>{initials}</Text>
                    )}
                  </View>
                  <View style={styles.avatarEditorActions}>
                    <Button
                      label="Choose Photo"
                      onPress={pickAvatar}
                      variant="secondary"
                      size="sm"
                    />
                    <TouchableOpacity
                      style={styles.removePhotoBtn}
                      onPress={() => {
                        dialog.alert('Remove Photo', 'Are you sure you want to remove your profile photo?', [
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: 'Remove',
                            style: 'destructive',
                            onPress: () => {
                              setAvatarUri(null);
                              setAvatarFile(null);
                            },
                          },
                        ]);
                      }}
                    >
                      <Ionicons name="trash-outline" size={13} color={Colors.danger} />
                      <Text style={styles.removePhotoText}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <Input
                  label="Full Name"
                  placeholder="Alex Kumar"
                  leftIcon="person-outline"
                  value={name}
                  onChangeText={setName}
                  containerStyle={styles.editInputWrap}
                />
                <Input
                  label="Phone Number (optional)"
                  placeholder="+91 98xxxxxx12"
                  leftIcon="call-outline"
                  value={phone ?? ''}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  containerStyle={styles.editInputWrap}
                />
              </View>
              <View style={styles.editActions}>
                <Button
                  label="Cancel"
                  onPress={() => {
                    setName(user?.name ?? '');
                    setPhone(user?.phone ?? '');
                    setAvatarUri(user?.avatarUrl ?? null);
                    setAvatarFile(null);
                    setEditMode(false);
                  }}
                  variant="secondary"
                  size="sm"
                  style={styles.editActionBtn}
                />
                <Button
                  label="Save Changes"
                  onPress={handleSaveProfile}
                  loading={updateProfile.isPending}
                  size="sm"
                  style={styles.editActionBtn}
                />
              </View>
            </View>
          )}
        </LinearGradient>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{groups?.length ?? 0}</Text>
            <Text style={styles.statLabel}>Groups</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {groups?.reduce((acc, g) => acc + g.members.length, 0) ?? 0}
            </Text>
            <Text style={styles.statLabel}>Roommates</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: Colors.success }]}>✓</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
        </View>

        {/* Menu */}
        <View style={styles.menuCard}>
          <MenuItem
            icon="lock-closed-outline"
            label="Change Password"
            onPress={() => setShowPasswordForm((p) => !p)}
          />

          {showPasswordForm && (
            <View style={styles.passwordForm}>
              <Input
                label="Current password"
                isPassword
                value={currentPw}
                onChangeText={setCurrentPw}
              />
              <Input
                label="New password"
                isPassword
                value={newPw}
                onChangeText={setNewPw}
                hint="Minimum 8 characters"
              />
              <Button
                label="Update Password"
                onPress={handleChangePassword}
                loading={changePassword.isPending}
                fullWidth
              />
            </View>
          )}

          <View style={styles.menuDivider} />

          <MenuItem
            icon="log-out-outline"
            label="Sign Out"
            onPress={handleLogout}
            danger
          />
        </View>

        <Text style={styles.version}>Spentro v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  content: { paddingBottom: 40 },
  profileHeader: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 28,
    paddingHorizontal: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  avatarText: { fontSize: 28, fontWeight: '800', color: '#fff' },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
  },
  userName: { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 4 },
  userEmail: { fontSize: 13, color: 'rgba(255,255,255,0.75)' },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 12,
    gap: 6,
  },
  editBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  editForm: { width: '100%', marginTop: 12, gap: 10 },
  editPanel: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.45)',
    padding: 12,
  },
  editPanelTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.primaryDark,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: 8,
  },
  avatarEditorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  avatarEditorPreview: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: Colors.bgSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarEditorImage: {
    width: '100%',
    height: '100%',
  },
  avatarEditorInitials: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  avatarEditorActions: { flex: 1, gap: 8 },
  removePhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.danger,
    backgroundColor: Colors.dangerBg,
    alignSelf: 'stretch',
  },
  removePhotoText: {
    color: Colors.danger,
    fontSize: 12,
    fontWeight: '700',
  },
  editInputWrap: { marginBottom: 10 },
  editActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  editActionBtn: { minWidth: 118 },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    marginTop: -16,
    ...Shadows.md,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '800', color: Colors.text },
  statLabel: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: Colors.border },
  menuCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    margin: 16,
    ...Shadows.sm,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  menuIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: Colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuIconDanger: { backgroundColor: Colors.dangerBg },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: Colors.text },
  menuLabelDanger: { color: Colors.danger },
  menuValue: { fontSize: 13, color: Colors.textSecondary },
  menuDivider: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.border, marginHorizontal: 16 },
  passwordForm: { paddingHorizontal: 16, paddingBottom: 16 },
  version: {
    textAlign: 'center',
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 8,
  },
});
