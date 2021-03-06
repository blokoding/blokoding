import React, {Fragment, useEffect, Component} from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text, SafeAreaView, StyleSheet, ScrollView, Platform, AppRegistry, TouchableOpacity, Linking} from 'react-native';
import SplashScreen from 'react-native-splash-screen';
import CustomHeader from './src/components/CustomHeader';
import {Home, Camera, Help, Options, Discover, Game, LevelScreen} from './src/screens/Screens';
import Colors from "./src/constants/Colors"
import EnigmaScreen from './src/screens/EnigmaScreen';


const Stack = createStackNavigator();


function App() {
  useEffect(() => {
    SplashScreen.hide();
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home" headerMode="screen" screenOptions={{headerShown: true, headerTitleAlign:'center'}}>
        <Stack.Screen name="Home" component={Home} options={{headerTitle: () => <CustomHeader title="Blokoding"/>}}/>
        <Stack.Screen name="Take Picture" component={Camera} options={{headerShown: false}}/>
        <Stack.Screen name="Help" component={Help} options={{headerTitle: () => <CustomHeader title="Aide" backgroundColor={Colors.dark_purple}/>}}/>
        <Stack.Screen name="Options" component={Options} options={{headerTitle: () => <CustomHeader title="Options" backgroundColor={Colors.dark_purple}/>}}/>
        <Stack.Screen name="Découverte" component={Discover} options={{headerTitle: () => <CustomHeader title="Découverte"/>}}/>
        <Stack.Screen name="Game" component={Game} options={{headerShown:false}}/>
        <Stack.Screen name="LevelScreen" component={LevelScreen} options={{headerShown:false}}/>
        <Stack.Screen name="EnigmaScreen" component={EnigmaScreen} options={{headerShown:false}}/>
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;