import * as React from "react"
import { View, Image, ViewStyle, ImageStyle, TextStyle } from "react-native"
import { Text } from "../../../../shared/text"
import { spacing } from "../../../../../theme/spacing"
import { palette } from "../../../../../theme/palette"
import { presets } from "./travel-option.presets"
import { TravelOptionProps } from "./travel-option.props"

const ROOT: ViewStyle = {
  marginTop: spacing.extraLarge,
  flexDirection: "row",
}

const TEXT: TextStyle = {
  marginLeft: spacing.large,
  paddingVertical: spacing.tiny,
}

export class TravelOption extends React.Component<TravelOptionProps, {}> {
  render() {
    const { preset } = this.props
    return (
      <View style={ROOT}>
        <Image source={presets[preset]} />
        <Text
          preset="sectionHeader"
          tx={`venueScreen.gettingToChainReact.${preset}`}
          style={TEXT}
        />
      </View>
    )
  }
}
