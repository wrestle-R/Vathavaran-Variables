import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '@/context/AuthContext';
import { DashboardScreen } from '@/screens/DashboardScreen';
import { LoginScreen } from '@/screens/LoginScreen';
import { ProfileScreen } from '@/screens/ProfileScreen';
import { RepositoriesScreen } from '@/screens/RepositoriesScreen';
import { RepositoryDetailsScreen } from '@/screens/RepositoryDetailsScreen';
import { navigationDarkTheme, navigationLightTheme, useAppTheme } from '@/theme';

export type RepositoriesStackParamList = {
  Repositories: undefined;
  RepositoryDetails: { repoFullName: string };
};

const AuthStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const RepositoriesStack = createNativeStackNavigator<RepositoriesStackParamList>();

function RepositoriesStackScreen() {
  const { colors } = useAppTheme();

  return (
    <RepositoriesStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.card },
        headerTitleStyle: { color: colors.foreground },
        headerTintColor: colors.foreground,
        contentStyle: { backgroundColor: colors.background },
      }}>
      <RepositoriesStack.Screen name="Repositories" component={RepositoriesScreen} />
      <RepositoriesStack.Screen
        name="RepositoryDetails"
        component={RepositoryDetailsScreen}
        options={{ title: 'Env Files' }}
      />
    </RepositoriesStack.Navigator>
  );
}

function AppTabs() {
  const { colors } = useAppTheme();

  return (
    <Tab.Navigator
      sceneContainerStyle={{ backgroundColor: colors.background }}
      screenOptions={{
        headerStyle: { backgroundColor: colors.card },
        headerTitleStyle: { color: colors.foreground },
        headerTintColor: colors.foreground,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
        },
        tabBarActiveTintColor: colors.foreground,
        tabBarInactiveTintColor: colors.mutedForeground,
      }}>
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen
        name="Repos"
        component={RepositoriesStackScreen}
        options={{ headerShown: false }}
      />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  const { token, bootstrapping } = useAuth();
  const { colors, isDark } = useAppTheme();

  if (bootstrapping) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.background,
        }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={isDark ? navigationDarkTheme : navigationLightTheme}>
      {token ? (
        <AppTabs />
      ) : (
        <AuthStack.Navigator>
          <AuthStack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        </AuthStack.Navigator>
      )}
    </NavigationContainer>
  );
}
