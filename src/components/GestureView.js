import React, { Component } from "react";
import { View, StyleSheet, PanResponder} from "react-native";

class App extends Component {
    
  panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {},
    onPanResponderMove: this.props.onPanResponderMove,
    onPanResponderRelease: this.props.onPanResponderRelease
  });

  render() {
    return (
      <View style={styles.container}
      {...this.panResponder.panHandlers}
      >
        {this.props.children}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default App;