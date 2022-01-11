import React, { useState, useEffect } from "react";
import jsQR from "jsqr";
import * as Clipboard from "expo-clipboard";
import {
  Text,
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
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import validator from "validator";
import { Camera } from "expo-camera";
import { AdMobBanner, setTestDeviceIDAsync } from "expo-ads-admob";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

export default function App() {
  const [hasPermission, setHasPermission] = useState(null);
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
      setHasPermission(status === "granted");
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

  // const handleImagePicking = async () => {
  //   // No permissions request is necessary for launching the image library
  //   try {
  //     let result = await ImagePicker.launchImageLibraryAsync({
  //       mediaTypes: ImagePicker.MediaTypeOptions.Images,
  //       allowsEditing: true,
  //       aspect: [4, 3],
  //       quality: 1,
  //       base64: true,
  //     });

  //     console.log(result);

  //     if (!result.cancelled) {
  //       setImage(result.uri);
  //     }
  //   } catch (error) {
  //     console.log(error);
  //   }
  // };

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
      <Camera
        onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
        flashMode={flash}
        style={StyleSheet.absoluteFillObject}
      >
        <View style={styles.buttonContainer}>
          {/* <TouchableOpacity
            style={styles.button}
            onPress={() => {
              handleFlash();
            }}
          > */}
              <Ionicons
                      name="flashlight-outline"
                      color="white"
                      size={40}
                      onPress={() => handleFlash()}
                    />
          {/* </TouchableOpacity> */}

          {/* <TouchableOpacity
            style={styles.button}
            onPress={() => {
              setModal(!modal);
              setScanned(false);
            }}
          > */}
              <Ionicons
                      name="time-outline"
                      color="white"
                      size={40}
                      onPress={() => {
                        setModal(!modal);
                        setScanned(false);
                      }}
                    />
          {/* </TouchableOpacity> */}
        </View>
        <View style={styles.bottomView}>
          <AdMobBanner
            bannerSize="largeBanner"
            style={styles.ad}
            adUnitID="ca-app-pub-3940256099942544/6300978111"
            servePersonalizedAds={true}
            onDidFailToReceiveAdWithError={(e) => console.log(e)}
          />
        </View>
        <Modal
          visible={modal}
          animationType="slide"
          style={styles.modal}
          onRequestClose={() => {
            setModal(!modal);
            enableBarcode();
          }}
          transparent
        >
          <View style={styles.modalView}>
            <Ionicons
              name="close-outline"
              size={30}
              backgroundColor="grey"
              style={{ position: "absolute", right: "10%", top: "12%" }}
              onPress={() => {
                setModal(!modal);
                setScanned(false);
              }}
            />
            <Text style={styles.title}>History</Text>

            {history && history.length > 0 ? (
              <FlatList
                data={history}
                keyExtractor={(item, index) => index}
                renderItem={({ item, index }) => (
                  <Text key={index}>
                    <Text
                      style={styles.item}
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
                      color="grey"
                      size={25}
                      onPress={() => {
                        Clipboard.setString(item);
                        Alert.alert("Content Copied");
                      }}
                    />
                    <Ionicons
                      name="close-outline"
                      color="red"
                      size={25}
                      onPress={() => handleDelete(index)}
                    />
                  </Text>
                )}
              />
            ) : (
              <Text style={styles.item}>No history</Text>
            )}
          </View>
        </Modal>
      </Camera>
    </View>
  );
}

const styles = StyleSheet.create({
  view: {
    position: "relative",
    top: "50%",
    left: "25%",
  },
  title: {
    fontSize: 40,
    alignSelf: "flex-start",
  },
  modal: {},
  item: {
    textAlign: "center",
    marginTop: 50,
    padding: 10,
    fontSize: 18,
    height: 44,
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
  historyView: {
    margin: 40,
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
    backgroundColor: "#FFFFFF",
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
    flex: 1,
    backgroundColor: "transparent",
    flexDirection: "row",
    justifyContent: "space-between",
    margin: 40,
  },
  button: {
    flex: 0.1,
  },
  text: {
    fontSize: 18,
    color: "white",
  },
});
