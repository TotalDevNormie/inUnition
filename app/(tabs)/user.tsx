import { useEffect, useState } from 'react';
import { Text, View, TextInput, Pressable, ScrollView, Alert, Platform } from 'react-native';
import { useAuthStore } from '../../utils/useAuthStore';
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import DraggableFlatList, { ScaleDecorator } from 'react-native-draggable-flatlist';
import DraggableList from 'react-draggable-list';
import { GestureHandlerRootView, TouchableOpacity } from 'react-native-gesture-handler';
import { router } from 'expo-router';
import Modal from '~/components/Modal';

interface UserSettingsState {
  defaultStatusTypes: string[];
  setDefaultStatusTypes: (statusTypes: string[]) => void;
}

export const useUserSettingsStore = create<UserSettingsState>()(
  persist(
    (set) => ({
      defaultStatusTypes: ['Todo', 'Doing', 'Done'],
      setDefaultStatusTypes: (statusTypes) => set({ defaultStatusTypes: statusTypes }),
    }),
    {
      name: 'user-settings-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

type ListItemProps = {
  dragHandleProps?: any;
  item: string;
  editing: string | false;
  editingStatus: string;
  handleEditingStatusChange: (status: string) => void;
  handleEditing: (status: string) => void;
  deleteStatus: (status: string) => void;
};

const ListItem = ({
  dragHandleProps = {},
  item,
  editing,
  editingStatus,
  handleEditingStatusChange,
  handleEditing,
  deleteStatus,
}: ListItemProps) => {
  return (
    <View className="mb-2 flex flex-row gap-2 rounded-xl bg-secondary-850 p-2">
      <Text className="text-text" {...dragHandleProps}>
        <MaterialIcons name="drag-indicator" size={24} />
      </Text>
      {editing === item ? (
        <TextInput
          className="grow rounded-lg border border-secondary px-2 text-center text-text"
          value={editingStatus}
          autoFocus
          onSubmitEditing={() => handleEditing(item)}
          onChangeText={(text) => handleEditingStatusChange(text)}
        />
      ) : (
        <Text className="grow py-1 text-center text-text">{item}</Text>
      )}
      <Pressable onPress={() => handleEditing(item)} className="p-1">
        <Feather name={editing === item ? 'check' : 'edit-2'} size={20} className="text-primary" />
      </Pressable>
      <Pressable onPress={() => deleteStatus(item)} className="p-1">
        <Feather name="trash-2" size={20} className="text-red-500" />
      </Pressable>
    </View>
  );
};

// Tab component for settings sections
const Tab = ({
  title,
  active,
  onPress,
}: {
  title: string;
  active: boolean;
  onPress: () => void;
}) => (
  <Pressable
    onPress={onPress}
    className={`rounded-t-lg px-4 py-2 ${active ? 'bg-secondary-850' : 'bg-secondary/30'}`}>
    <Text className={`${active ? 'text-primary' : 'text-text'} font-medium`}>{title}</Text>
  </Pressable>
);

export default function User() {
  const { user, isLoading, updateProfile, error, clearError, deleteAccount } = useAuthStore();
  const { defaultStatusTypes, setDefaultStatusTypes } = useUserSettingsStore();

  // Form state
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  // Status management
  const [newStatus, setNewStatus] = useState('');
  const [statusTypes, setStatusTypes] = useState<string[]>([]);
  const [editing, setEditing] = useState<string | false>(false);
  const [editingStatus, setEditingStatus] = useState('');

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalContent, setModalContent] = useState<React.ReactNode>(null);
  const [modalActions, setModalActions] = useState<React.ReactNode>(null);

  // Load user data
  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setEmail(user.email || '');
      setStatusTypes([...defaultStatusTypes]);
    }
  }, [user, defaultStatusTypes]);

  // Show custom alert modal
  const showAlert = (title: string, message: string, actions?: React.ReactNode) => {
    setModalTitle(title);
    setModalContent(<Text className="p-4 text-text">{message}</Text>);
    setModalActions(
      actions || (
        <Pressable
          onPress={() => setModalOpen(false)}
          className="border-t border-secondary-850 p-4">
          <Text className="text-center font-medium text-primary">OK</Text>
        </Pressable>
      )
    );
    setModalOpen(true);
  };

  // Handle profile update
  const handleUpdateProfile = async () => {
    if (!displayName.trim()) {
      if (Platform.OS === 'web') {
        showAlert('Error', 'Display name cannot be empty');
      } else {
        Alert.alert('Error', 'Display name cannot be empty');
      }
      return;
    }

    try {
      await updateProfile({
        displayName,
        email,
      });
      setIsEditing(false);
      if (Platform.OS === 'web') {
        showAlert('Success', 'Profile updated successfully');
      } else {
        Alert.alert('Success', 'Profile updated successfully');
      }
    } catch (err) {
      console.error('Failed to update profile:', err);
    }
  };

  // Handle account deletion with confirmation
  const handleDeleteAccount = () => {
    if (Platform.OS === 'web') {
      showAlert(
        'Delete Account',
        'Are you sure you want to delete your account? This action cannot be undone.',
        <View className="flex-row border-t border-secondary-850">
          <Pressable
            onPress={() => setModalOpen(false)}
            className="flex-1 border-r border-secondary-850 p-4">
            <Text className="text-center font-medium text-text">Cancel</Text>
          </Pressable>
          <Pressable
            onPress={async () => {
              setModalOpen(false);
              try {
                await deleteAccount();
                router.replace('/');
              } catch (err) {
                console.error('Failed to delete account:', err);
              }
            }}
            className="flex-1 p-4">
            <Text className="text-center font-medium text-red-500">Delete</Text>
          </Pressable>
        </View>
      );
    } else {
      Alert.alert(
        'Delete Account',
        'Are you sure you want to delete your account? This action cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                await deleteAccount();
                router.replace('/');
              } catch (err) {
                console.error('Failed to delete account:', err);
              }
            },
          },
        ]
      );
    }
  };

  // Status management functions
  const handleNewStatus = () => {
    if (newStatus === '') return;
    setStatusTypes([...new Set([...statusTypes, newStatus])]);
    setNewStatus('');
  };

  const deleteStatus = (status: string) => {
    if (statusTypes.length <= 2) {
      if (Platform.OS === 'web') {
        showAlert('Error', 'You need at least 2 status types');
      } else {
        Alert.alert('Error', 'You need at least 2 status types');
      }
      return;
    }
    setStatusTypes(statusTypes.filter((s) => s !== status));
  };

  const handleEditing = (status: string) => {
    if (editing) {
      if (editingStatus.trim() === '') {
        if (Platform.OS === 'web') {
          showAlert('Error', 'Status name cannot be empty');
        } else {
          Alert.alert('Error', 'Status name cannot be empty');
        }
        return;
      }

      setStatusTypes(
        statusTypes.map((s: string): string => (s === editing && editingStatus ? editingStatus : s))
      );

      if (editing === status) {
        setEditing(false);
        setEditingStatus('');
        return;
      }
    }
    setEditing(status);
    setEditingStatus(status);
  };

  const handleEditingStatusChange = (text: string) => {
    setEditingStatus(text);
  };

  // Save default status types
  const saveDefaultStatusTypes = () => {
    setDefaultStatusTypes(statusTypes);
    if (Platform.OS === 'web') {
      showAlert('Success', 'Default status types saved successfully');
    } else {
      Alert.alert('Success', 'Default status types saved successfully');
    }
  };

  if (isLoading) {
    return (
      <View className="flex flex-1 items-center justify-center">
        <Text className="text-lg text-text">Loading...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View className="flex flex-1 items-center justify-center p-4">
        <Text className="mb-4 text-xl text-text">Please log in to view your profile</Text>
        <Pressable
          onPress={() => router.push('/login')}
          className="rounded-lg bg-primary px-6 py-3">
          <Text className="font-medium text-white">Log In</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ScrollView className="flex-1">
        <View className="mx-auto w-full max-w-3xl p-4">
          {/* Profile Header */}
          <View className="mb-8 flex flex-row items-center">
            <View className="mr-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/20">
              <Text className="text-3xl font-bold text-primary">
                {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-2xl font-bold text-text">{user.displayName}</Text>
              <Text className="text-text/70">{user.email}</Text>
            </View>
          </View>

          {/* Tabs */}
          <View className="flex flex-row">
            <Tab
              title="Profile"
              active={activeTab === 'profile'}
              onPress={() => setActiveTab('profile')}
            />
            <Tab
              title="Preferences"
              active={activeTab === 'preferences'}
              onPress={() => setActiveTab('preferences')}
            />
          </View>

          {/* Tab Content */}
          <View className="rounded-lg rounded-tl-none bg-secondary-850 p-6">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <View className="flex flex-col gap-6">
                <View className="mb-4 flex flex-row items-center justify-between">
                  <Text className="text-xl font-medium text-text">Profile Information</Text>
                  <Pressable
                    onPress={() => setIsEditing(!isEditing)}
                    className="flex flex-row items-center">
                    <Feather
                      name={isEditing ? 'x' : 'edit-2'}
                      size={18}
                      className={isEditing ? 'text-red-500' : 'text-primary'}
                    />
                    <Text className={`ml-2 ${isEditing ? 'text-red-500' : 'text-primary'}`}>
                      {isEditing ? 'Cancel' : 'Edit'}
                    </Text>
                  </Pressable>
                </View>

                {error && (
                  <View className="mb-4 rounded-lg bg-red-500/10 p-3">
                    <Text className="text-red-500">{error}</Text>
                    <Pressable onPress={clearError} className="mt-1">
                      <Text className="text-red-500 underline">Dismiss</Text>
                    </Pressable>
                  </View>
                )}

                <View className="flex flex-col gap-2">
                  <Text className="font-medium text-text">Display Name</Text>
                  <TextInput
                    className={`rounded-lg border p-3 text-text ${
                      isEditing ? 'border-primary/50 bg-secondary/30' : 'border-secondary'
                    }`}
                    value={displayName}
                    onChangeText={setDisplayName}
                    editable={isEditing}
                  />
                </View>

                <View className="flex flex-col gap-2">
                  <Text className="font-medium text-text">Email</Text>
                  <TextInput
                    className={`rounded-lg border p-3 text-text ${
                      isEditing ? 'border-primary/50 bg-secondary/30' : 'border-secondary'
                    }`}
                    value={email}
                    onChangeText={setEmail}
                    editable={isEditing}
                    keyboardType="email-address"
                  />
                </View>

                {isEditing && (
                  <Pressable
                    onPress={handleUpdateProfile}
                    className="mt-4 rounded-lg bg-primary py-3">
                    <Text className="text-center font-medium text-white">Save Changes</Text>
                  </Pressable>
                )}

                <View className="mt-6 border-t border-secondary pt-6">
                  <Text className="mb-4 text-xl font-medium text-text">Account Actions</Text>

                  <Pressable
                    onPress={() => router.push('/logout')}
                    className="mb-3 flex flex-row items-center rounded-lg bg-secondary/30 px-4 py-3">
                    <Ionicons name="log-out-outline" size={20} className="mr-3 text-text" />
                    <Text className="text-text">Log Out</Text>
                  </Pressable>

                  <Pressable
                    onPress={handleDeleteAccount}
                    className="flex flex-row items-center rounded-lg bg-red-500/10 px-4 py-3">
                    <Feather name="trash-2" size={20} className="mr-3 text-red-500" />
                    <Text className="text-red-500">Delete Account</Text>
                  </Pressable>
                </View>
              </View>
            )}

            {/* Preferences Tab */}
            {activeTab === 'preferences' && (
              <View className="flex flex-col gap-6">
                <Text className="mb-2 text-xl font-medium text-text">Application Preferences</Text>

                {/* Default Completion Statuses */}
                <View className="mt-2 flex flex-col gap-4">
                  <Text className="font-medium text-text">Default Completion Statuses</Text>
                  <Text className="mb-2 text-text/70">
                    These statuses will be used as defaults when creating new task boards.
                  </Text>

                  <View className="mb-4 flex flex-row gap-2">
                    <TextInput
                      className="grow rounded-lg border-2 border-secondary p-2 text-text"
                      value={newStatus}
                      onChangeText={setNewStatus}
                      placeholder="Add new status..."
                      placeholderTextColor="#666"
                    />
                    <Pressable
                      className="flex items-center justify-center rounded-lg bg-primary px-4 py-2"
                      onPress={handleNewStatus}>
                      <Text className="text-white">Add</Text>
                    </Pressable>
                  </View>

                  <View className="mb-6">
                    {Platform.OS === 'web' ? (
                      <DraggableList
                        itemKey={(item: string) => item}
                        list={statusTypes}
                        onMoveEnd={(list: string[]) => setStatusTypes(list)}
                        template={({ item, dragHandleProps }) => (
                          <ListItem
                            {...{
                              item,
                              dragHandleProps,
                              editing,
                              editingStatus,
                              handleEditingStatusChange,
                              handleEditing,
                              deleteStatus,
                            }}
                          />
                        )}
                      />
                    ) : (
                      <DraggableFlatList
                        data={statusTypes}
                        renderItem={({ item, drag, isActive }) => (
                          <ScaleDecorator activeScale={1.05}>
                            <TouchableOpacity onLongPress={drag} disabled={isActive}>
                              <ListItem
                                {...{
                                  item,
                                  dragHandleProps: {},
                                  editing,
                                  editingStatus,
                                  handleEditingStatusChange,
                                  handleEditing,
                                  deleteStatus,
                                }}
                              />
                            </TouchableOpacity>
                          </ScaleDecorator>
                        )}
                        onDragEnd={({ data }) => setStatusTypes(data)}
                        keyExtractor={(item) => item}
                      />
                    )}
                  </View>

                  <Pressable
                    onPress={saveDefaultStatusTypes}
                    className="rounded-lg bg-primary py-3">
                    <Text className="text-center font-medium text-white">
                      Save Default Statuses
                    </Text>
                  </Pressable>
                </View>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Custom Alert Modal */}
      <Modal open={modalOpen} setOpen={setModalOpen} title={modalTitle}>
        <View>
          {modalContent}
          {modalActions}
        </View>
      </Modal>
    </GestureHandlerRootView>
  );
}
