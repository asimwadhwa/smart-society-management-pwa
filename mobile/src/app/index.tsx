import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  StyleSheet,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';

const WEBSITE_URL =
  'https://smart-society-management-i3k11okqu-asim-wadhwa.vercel.app/';

export default function HomeScreen() {
  const webViewRef = useRef<WebView>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const backAction = () => {
      if (canGoBack) {
        webViewRef.current?.goBack();
        return true;
      }

      return false;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, [canGoBack]);

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ uri: WEBSITE_URL }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        onNavigationStateChange={(navState) => {
          setCanGoBack(navState.canGoBack);
        }}
        onLoadStart={() => {
          setLoading(true);
        }}
        onLoadEnd={() => {
          setLoading(false);
        }}
      />

      {loading && (
        <View style={styles.loading}>
          <ActivityIndicator size="large" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },

  webview: {
    flex: 1,
  },

  loading: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
});