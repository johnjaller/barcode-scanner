import React, { useState, useEffect } from "react";
import jsQR from "jsqr";
import * as Clipboard from "expo-clipboard";
import {StatusBar} from 'expo-status-bar'
import {
  Text,
  Section,
  Image,
  View,
  StyleSheet,
  Linking,
  Alert,
  TouchableOpacity,
  Button,
  Platform,
  Modal,
  FlatList,
  TouchableHighlight,
  useColorScheme
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import validator from "validator";
import { Camera } from "expo-camera";
import { AdMobBanner, setTestDeviceIDAsync } from "expo-ads-admob";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useTrackingPermissions,requestTrackingPermissionsAsync } from "expo-tracking-transparency";

export default function App() {
  const colorTheme=useColorScheme()
  console.log(colorTheme)
  const [hasPermission, setHasPermission] = useState(null);
  const [hasTrackingPermission, setHasTrackingPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [modal, setModal] = useState(false);
  const [flash, setFlash] = useState(Camera.Constants.FlashMode.off);
  const [history, setHistory] = useState([]);

  console.log(history);
  const readItemFromStorage = async () => {
    try {
      let item = await AsyncStorage.getItem("history");
      if (item) {
        return setHistory(JSON.parse(item));
      } else {
        return;
      }
    } catch (error) {
      console.log("no item");
    }
  };
  useEffect(() => {
    readItemFromStorage();
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
     
        const track = await requestTrackingPermissionsAsync()
        console.log(track)
        setHasTrackingPermission(track.status === 'granted');
      
    })();
  
}, []);
  const handleFlash = () => {
    console.log(flash == Camera.Constants.FlashMode.off);
    if (flash === Camera.Constants.FlashMode.off) {
      setFlash(Camera.Constants.FlashMode.torch);

      console.log(flash);
    } else {
      console.log(flash);
      setFlash(Camera.Constants.FlashMode.off);
    }
  };
  const LogHistory = (data) => {
    history.push(data);
    console.log(history);
    setHistory(history);
    AsyncStorage.setItem("history", JSON.stringify(history));
  };

  const handleDelete = (index) => {
    if (history.length > 1) {
      console.log(index);
      let newHistory = history.filter((item, i) => i !== index);
      setHistory(newHistory);
      AsyncStorage.setItem("history", JSON.stringify(newHistory));
    } else {
      let newHistory = [];
      console.log(newHistory);
      setHistory(newHistory);
      AsyncStorage.setItem("history", JSON.stringify(newHistory));
    }
  };
  const enableBarcode = () => {
    if (!modal) {
      setTimeout(() => {
        setScanned(false);
      }, 1000);
    }
  };

  const handleBarCodeScanned = ({ type, data }) => {
    setScanned(true);
    LogHistory(data);
    if (validator.isURL(data)) {
      Alert.alert("URL founded", `Are you sure to open ${data}`, [
        {
          text: "Cancel",
          onPress: () => {
            console.log("Cancel Pressed");
            enableBarcode();
          },
          style: "cancel",
        },
        {
          text: "OK",
          onPress: () => {
            Linking.openURL(data);
            enableBarcode();
          },
        },
      ]);
    } else {
      Alert.prompt(
        "Content Found",'',
        [
          {
            text: "Copy",

            onPress: (text) => {
              Clipboard.setString(text)
            },
          },
          {
            text: "ok",

            onPress: () => {
              enableBarcode();
            },
          },
        ],
        "plain-text",
        data
      );
    }
  };

  if (hasPermission === null || hasPermission === false) {
    return (
      <View style={styles.view}>
       
          
        <Text>Please give camera permission</Text>
        
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style='auto'/>
      <Camera
        onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
        flashMode={flash}
        style={StyleSheet.absoluteFillObject}
      >
        <View style={colorTheme==='light'? styles.buttonContainer:styles.buttonDarkContainer}>
       
              <Ionicons
                      name="flashlight-outline"
                      color={colorTheme==='light'?'black':'white'}
                      size={40}
                      onPress={() => handleFlash()}
                    />
        
              <Ionicons
                      name="time-outline"
                      color={colorTheme==='light'?'black':'white'}
                      size={40}
                      onPress={() => {
                        setModal(!modal);
                       setScanned(true)
                      }}
                    />
          {/* </TouchableOpacity> */}
        </View>
        <View style={colorTheme==='light'? styles.bottomView:styles.bottomDarkView}>
          <AdMobBanner
            bannerSize="largeBanner"
            style={styles.ad}
            adUnitID={Platform.OS==='ios'?'ca-app-pub-2278062901935043/8454118240':'ca-app-pub-3940256099942544/6300978111'}
            servePersonalizedAds={(hasTrackingPermission&&Platform.OS==='ios')||Platform.OS==='android'?true:false}
            onDidFailToReceiveAdWithError={(e) => console.log(e)}
          />
        </View>
        <Modal
          visible={modal}
          animationType="slide"
          onRequestClose={() => {
            setModal(!modal);
            enableBarcode();
          }}
          transparent
        >
          <View style={colorTheme==='light'? styles.modalView:styles.modalDarkView}>
            <Ionicons
              name="close-outline"
              size={30}
              backgroundColor="grey"
              color={colorTheme==='light'?'black':'white'}
              style={{ position: "absolute", right: "10%", top: "12%" }}
              onPress={() => {
                setModal(!modal);
                setTimeout(() => {
                  setScanned(false);
                }, 1000);
              }}
            />
            <Text style={colorTheme==='light'? styles.title:styles.darkTitle}>History</Text>

            {history && history.length > 0 ? (
              <View style={styles.historyView}> 

              <FlatList
                data={history}
                keyExtractor={(item, index) => index}
                renderItem={({ item, index }) => (
                  <View key={index} style={styles.itemView} >
                    <Text
                      style={colorTheme==='light'? styles.item:styles.darkItem}
                      onPress={() => {
                        if (validator.isURL(item)) {
                          Linking.openURL(item);
                        } else {
                          Clipboard.setString(item);
                          Alert.alert("Content Copied");
                        }
                      }}
                      >
                      {item}
                    </Text>

                    <Ionicons
                      name="copy-outline"
                      color={colorTheme==='light'? 'grey':'white'}
                      size={30}
                      onPress={() => {
                        Clipboard.setString(item);
                        Alert.alert("Content Copied");
                      }}
                      style={styles.historyButton}
                      />
                    <Ionicons
                      name="close-outline"
                      color="red"
                      style={styles.deleteButton}
                      size={40}
                      onPress={() => handleDelete(index)}
                      />
                      </View>
                )}
                />
                </View>
            ) : (
              <View style={styles.historyView}> 

              <View style={styles.itemView} >

              <Text style={colorTheme==='light'? styles.item:styles.darkItem}>No history</Text>
              </View>
              </View>
            )}
          </View>
        </Modal>
      </Camera>
    </View>
  );
}
const styles = StyleSheet.create({
 
  historyButton:{
    marginLeft:90,
    alignSelf:'center'
  },
  deleteButton:{
    marginLeft:10,
    alignSelf:'center'
  },
  view: {
    position: "relative",
    top: "50%",
    left: "25%",
  },
  historyView:{
    alignItems: 'center',
    flexWrap: 'wrap', 
    paddingTop:20
  },
  itemView:{
    flexDirection:'row',
    alignItems: 'center',
    flexWrap: 'wrap', 
    paddingTop:10
  },
  title: {
    fontSize: 40,
    alignSelf: "flex-start",
  },
  darkTitle: {
    fontSize: 40,
    alignSelf: "flex-start",
    color:'white'
  },
  item: {
    fontSize: 18,
    textAlign:'center',
  },
  darkItem: {
    fontSize: 18,
    textAlign:'center',
    color:'white'
  },
  modalView: {
    position: "relative",
    top: "50%",
    backgroundColor: "white",
    height: "50%",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalDarkView: {
    position: "relative",
    top: "50%",
    backgroundColor: "black",
    height: "50%",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  container: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "center",
  },
  camera: {
    // flex: 1,
  },
  ad: {
    flex: 1,
    alignSelf: "center",
    marginTop: "1%",
    marginBottom: "10%",
  },
  pic: {
    height: 50,
    width: 50,
    tintColor: "#57A0D2",
  },
  bottomView: {
    width: "100%",
    height: "15%",
    backgroundColor: 'white',
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    bottom: 0,
  },
  bottomDarkView: {
    width: "100%",
    height: "15%",
    backgroundColor: 'black',
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    bottom: 0,
  },
  AdContainer: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "space-between",
    
  },
  buttonContainer: {
    flex: 0.08,
    backgroundColor: 'white',
    flexDirection: "row",
    height:'20%',
    justifyContent: "space-between",
    alignItems:'center',
    paddingTop:40,
    paddingHorizontal:40
  },
  buttonDarkContainer: {
    flex: 0.08,
    backgroundColor: 'black',
    flexDirection: "row",
    height:'20%',
    justifyContent: "space-between",
    alignItems:'center',
    paddingTop:40,
    paddingHorizontal:40
  },
  button: {
    flex: 0.1,
  },
  text: {
    fontSize: 18,
    color: "white",
  },
})
