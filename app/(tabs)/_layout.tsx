import { useRef, useState } from "react";
import { View } from "react-native";
import PagerView from "react-native-pager-view";
import { BottomNav } from "@/components/BottomNav";
import ProximoJogoScreen from "./index";
import PartidasScreen from "./partida";
import ArtilhariaScreen from "./artilharia";
import PresencaScreen from "./presenca";
import PerfilScreen from "./perfil";

const PAGES = [ProximoJogoScreen, PartidasScreen, ArtilhariaScreen, PresencaScreen, PerfilScreen];

export default function TabsLayout() {
  const pagerRef = useRef<PagerView>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <View className="flex-1 bg-background">
      <PagerView
        ref={pagerRef}
        style={{ flex: 1 }}
        initialPage={0}
        onPageSelected={(e) => setActiveIndex(e.nativeEvent.position)}
      >
        {PAGES.map((Screen, index) => (
          <View key={index} style={{ flex: 1 }} collapsable={false}>
            <Screen />
          </View>
        ))}
      </PagerView>
      <BottomNav activeIndex={activeIndex} onSelect={(index) => pagerRef.current?.setPage(index)} />
    </View>
  );
}
