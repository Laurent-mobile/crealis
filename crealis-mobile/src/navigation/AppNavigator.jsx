//crealis-mobile/src/navigation/AppNavigator.jsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack'; // Changement ici
import { useAuth } from '../context/AuthContext';
import Login from '../screens/Login';
import Register from '../screens/Register';
import Home from '../screens/Home';
import Transactions from '../screens/Transactions';
import Loyalty from '../screens/Loyalty';
import Profile from '../screens/Profile';
import Recharge from '../screens/Recharge';
import MerchantsMap from '../screens/MerchantsMap';
import Purchase from '../screens/Purchase';
import Cart from '../screens/Cart';

const Stack = createStackNavigator();

export default function AppNavigator() {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return null;
    }

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {!isAuthenticated ? (
                    <>
                        <Stack.Screen name="Login" component={Login} />
                        <Stack.Screen name="Register" component={Register} />
                    </>
                ) : (
                    <>
                        <Stack.Screen name="Home" component={Home} />
                        <Stack.Screen
                            name="Transactions"
                            component={Transactions}
                            options={{ headerShown: true, headerTitle: 'Mes Transactions', headerBackTitle: 'Retour' }}
                        />
                        <Stack.Screen
                            name="Loyalty"
                            component={Loyalty}
                            options={{ headerShown: true, headerTitle: 'Ma Fidélité', headerBackTitle: 'Retour' }}
                        />
                        <Stack.Screen
                            name="Profile"
                            component={Profile}
                            options={{ headerShown: true, headerTitle: 'Mon Profil', headerBackTitle: 'Retour' }}
                        />
                        <Stack.Screen
                            name="Recharge"
                            component={Recharge}
                            options={{ headerShown: true, headerTitle: 'Recharger', headerBackTitle: 'Retour' }}
                        />
                        <Stack.Screen
                            name="MerchantsMap"
                            component={MerchantsMap}
                            options={{ headerShown: true, headerTitle: 'Commerçants', headerBackTitle: 'Retour' }}
                        />
                        <Stack.Screen
                            name="Cart"
                            component={Cart}
                            options={{ headerShown: true, headerTitle: 'Mon Panier', headerBackTitle: 'Retour' }}
                        />
                        <Stack.Screen
                            name="Purchase"
                            component={Purchase}
                            options={{ headerShown: false }}
                        />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}
