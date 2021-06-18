import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  Animated,
  Easing,
  SafeAreaView,
  StyleSheet,
  Image,
  PanResponder,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Slider from './Slide';
import { useDimensions } from '@react-native-community/hooks';
import { formatTime, getBitrateLabel } from '../lib/utils';
import useTimeout from '../lib/useTimeout';
import PressView from './PressView';
import ControlIcon from './ControlIcon';
import StateView from './StateView';
import Progress from './Progress';
import ConfigView from './ConfigView';
import QualityView from './QualityView';

const GradientWhite = 'rgba(0,0,0,0)';
const GradientBlack = 'rgba(0,0,0,0.3)';
const controlerHeight = 40;
const controlerDismissTime = 5000;
const AnimateView = Animated.View;

const styles = StyleSheet.create({
  controler: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'transparent',
  },
  stateview: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textTitle: {
    color: 'white',
    flex: 1,
    fontSize: 16,
  },
  textQuality: {
    color: 'white',
    fontSize: 16,
  },
  textTime: {
    color: 'white',
    fontSize: 16,
  },
  iconLeft: {
    marginLeft: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    height: controlerHeight,
    width: '100%',
    paddingHorizontal: 10,
  },
  bottom: {
    flexDirection: 'row',
    alignItems: 'center',
    height: controlerHeight,
    width: '100%',
    paddingHorizontal: 10,
    justifyContent: 'space-between',
  },
  bottomSlide: {
    flex: 0.8,
    marginHorizontal: 5,
  },
  panResponder: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  seekText: {
    color: 'white',
    fontSize: 18,
  },
});

function ControlerView({
  title,
  isFull,
  current,
  buffer,
  total,
  isPlaying,
  enableFullScreen,
  enableCast,
  playSource,
  bitrateList,
  bitrateIndex,
  themeColor,
  poster,
  isStart,
  // config
  setSpeed,
  setScaleMode,
  setLoop,
  setMute,
  // ******
  isError,
  isLoading,
  errorObj,
  loadingObj,
  onPressPlay,
  onPressPause,
  onPressReload,
  onPressFullIn,
  onPressFullOut,
  onChangeConfig,
  onChangeBitrate,
  onSlide,
  onCastClick,
}) {
  const { screen, window } = useDimensions();
  const [visible, setVisible] = useState(false);
  const [configVisible, setConfigVisible] = useState(false);
  const [qualityVisible, setQualityVisible] = useState(false);
  const [currentPositon, setCurrentPositon] = useState(current);
  const [showSeek, setShowSeek] = useState(false);
  const currentPositonFormat = formatTime(currentPositon);
  const currentFormat = formatTime(current);
  const totalFormat = formatTime(total);
  const hasBitrate = Array.isArray(bitrateList) && bitrateList.length;
  const bitrate = bitrateList && bitrateList.find((o) => o.index === bitrateIndex);
  const [configObj, setConfigObj] = useState({
    setSpeed,
    setScaleMode,
    setLoop,
    setMute,
  });

  const gestureMoveRef = useRef(false);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderStart: (e, gestureState) => {},
        onPanResponderMove: (e, gestureState) => {
          const { dx, dy } = gestureState;
          if (!gestureMoveRef.current && Math.abs(dx) > 5) {
            gestureMoveRef.current = true;
          }
          if (gestureMoveRef.current) {
            const dt = 60 * (dx / window.width);
            setCurrentPositon((pre) => {
              let next = pre + dt;
              if (next < 0) {
                next = 0;
              }
              if (next > total) {
                next = total;
              }
              return next;
            });
            setShowSeek(true);
          }
        },
        onPanResponderRelease: (e, gestureState) => {
          const { dx, dy } = gestureState;
          if (gestureMoveRef.current) {
            onSlide(parseInt(currentPositon));
          }
          gestureMoveRef.current = false;
          setShowSeek(false);
          if (dx === 0 && dy === 0) {
            handlePressPlayer(visible);
          }
        },
      }),
    [visible, currentPositon, showSeek, total]
  );

  useEffect(() => {
    if (!gestureMoveRef.current) {
      setCurrentPositon(current);
    }
  }, [current]);

  const bitrateLabel = getBitrateLabel(bitrate) || '画质';

  const { animateValue, bottomAnimate, headerAnimate, opacityAnimate } = useMemo(() => {
    const animateValue = new Animated.Value(0);
    const bottomAnimate = animateValue.interpolate({
      inputRange: [0, 1],
      outputRange: [controlerHeight, 0],
    });
    const headerAnimate = animateValue.interpolate({
      inputRange: [0, 1],
      outputRange: [-controlerHeight, 0],
    });
    const opacityAnimate = animateValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    });
    return {
      animateValue,
      bottomAnimate,
      headerAnimate,
      opacityAnimate,
    };
  }, []);

  const [_, clear, set] = useTimeout(() => {
    setVisible(false);
  }, controlerDismissTime);

  useEffect(() => {
    Animated.timing(animateValue, {
      toValue: visible ? 1 : 0,
      duration: 200,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start();
  }, [visible, animateValue]);

  const handlePressPlayer = (visible) => {
    if (visible) {
      setVisible(false);
      clear();
    } else {
      setVisible(true);
      set();
    }
  };

  return (
    <SafeAreaView style={styles.controler}>
      {!isStart && <Image source={poster} resizeMode="cover" style={StyleSheet.absoluteFill} />}
      <AnimateView
        style={[
          styles.header,
          { opacity: opacityAnimate, transform: [{ translateY: headerAnimate }] },
        ]}
      >
        <LinearGradient style={StyleSheet.absoluteFill} colors={[GradientBlack, GradientWhite]} />
        {isFull && <ControlIcon onPress={onPressFullOut} name="left" />}
        <Text style={styles.textTitle}>{title}</Text>
        {Boolean(hasBitrate && isFull) && (
          <Text
            style={[styles.textQuality, styles.iconLeft]}
            onPress={() => setQualityVisible(true)}
          >
            {bitrateLabel}
          </Text>
        )}
        {enableCast && (
          <ControlIcon
            iconStyle={styles.iconLeft}
            name="iconfontdesktop"
            onPress={() => onCastClick({ current, playSource })}
          />
        )}
        {isFull && (
          <ControlIcon
            iconStyle={styles.iconLeft}
            name="setting"
            onPress={() => setConfigVisible(true)}
          />
        )}
      </AnimateView>

      {/* <PressView style={styles.stateview} onPress={()=>handlePressPlayer(visible)} activeOpacity={1}>
        <StateView
            isError={isError}
            isLoading={isLoading}
            errorObj={errorObj}
            isPlaying={isPlaying}
            loadingObj={loadingObj}
            themeColor={themeColor}
            onPressPlay={onPressPlay}
            onPressReload={onPressReload}
          />
      </PressView> */}

      <View style={styles.stateview} activeOpacity={1}>
        <View style={styles.panResponder} {...panResponder.panHandlers}>
          {showSeek && (
            <Text
              style={styles.seekText}
            >{`${currentPositonFormat.M}:${currentPositonFormat.S}`}</Text>
          )}
        </View>
        <StateView
          isError={isError}
          isLoading={isLoading}
          errorObj={errorObj}
          isPlaying={isPlaying}
          loadingObj={loadingObj}
          themeColor={themeColor}
          onPressPlay={onPressPlay}
          onPressReload={onPressReload}
        />
      </View>

      <AnimateView
        style={[
          styles.bottom,
          { opacity: opacityAnimate, transform: [{ translateY: bottomAnimate }] },
        ]}
      >
        <LinearGradient style={StyleSheet.absoluteFill} colors={[GradientWhite, GradientBlack]} />
        <ControlIcon
          onPress={isPlaying ? onPressPause : onPressPlay}
          name={isPlaying ? 'pausecircleo' : 'playcircleo'}
        />
        <Text style={styles.textTime}>{`${currentPositonFormat.M}:${currentPositonFormat.S}`}</Text>
        <Slider
          progress={currentPositon}
          min={0}
          max={total}
          cache={buffer}
          style={styles.bottomSlide}
          onSlidingComplete={(value) => {
            onSlide(parseInt(value));
          }}
          themeColor={themeColor}
        />
        <Text style={styles.textTime}>{`${totalFormat.M}:${totalFormat.S}`}</Text>
        {enableFullScreen && (
          <ControlIcon
            onPress={isFull ? onPressFullOut : onPressFullIn}
            name={isFull ? 'shrink' : 'arrowsalt'}
          />
        )}
      </AnimateView>
      <Progress disable={visible} value={currentPositon} maxValue={total} themeColor={themeColor} />
      <ConfigView
        config={configObj}
        visible={configVisible}
        themeColor={themeColor}
        onClose={() => setConfigVisible(false)}
        onChange={(res) => {
          const newConfig = Object.assign({}, configObj, res);
          setConfigObj(newConfig);
          onChangeConfig(newConfig);
        }}
      />
      <QualityView
        themeColor={themeColor}
        playSource={playSource}
        visible={qualityVisible}
        bitrateList={bitrateList}
        bitrateIndex={bitrateIndex}
        onChange={(res) => {
          onChangeBitrate(res.value);
          setQualityVisible(false);
        }}
        onClose={() => setQualityVisible(false)}
      />
    </SafeAreaView>
  );
}
export default ControlerView;
