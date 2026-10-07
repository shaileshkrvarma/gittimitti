import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator, type NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useNavigation } from '@react-navigation/native'
import { StatusBar } from 'expo-status-bar'
import { ActivityIndicator, Pressable, Text, View } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AuthProvider, useAuth } from './src/auth'
import type { RootStackParamList } from './src/navigation'
import LoginScreen from './src/screens/LoginScreen'
import OrderScreen from './src/screens/OrderScreen'
import OrdersScreen from './src/screens/OrdersScreen'
import ProductsScreen from './src/screens/ProductsScreen'
import QuoteScreen from './src/screens/QuoteScreen'
import RegisterScreen from './src/screens/RegisterScreen'
import { colors } from './src/ui'

const Stack = createNativeStackNavigator<RootStackParamList>()

function HeaderLinks() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  return (
    <View style={{ flexDirection: 'row', gap: 16 }}>
      <Pressable onPress={() => navigation.navigate('Dashboard')}>
        <Text style={{ color: colors.primary }}>Account</Text>
      </Pressable>
    </View>
  )
}

function Root() {
  const { user, loading } = useAuth()
  if (loading) return <ActivityIndicator style={{ flex: 1 }} />
  return (
    <Stack.Navigator>
      {user ? (
        <>
          <Stack.Screen name="Products" component={ProductsScreen} options={{ title: 'Marketplace', headerRight: () => <HeaderLinks /> }} />
          <Stack.Screen name="Quote" component={QuoteScreen} options={{ title: 'Request quote' }} />
          <Stack.Screen name="Dashboard" component={OrdersScreen} options={{ title: 'My account' }} />
          <Stack.Screen name="Order" component={OrderScreen} options={({ route }) => ({ title: `Order #${route.params.id}` })} />
        </>
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'GittiMitti Marketplace' }} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      )}
    </Stack.Navigator>
  )
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer>
          <Root />
        </NavigationContainer>
      </AuthProvider>
      <StatusBar style="auto" />
    </SafeAreaProvider>
  )
}
