import * as React from "react"
import { TextStyle, ViewStyle, Image, View } from "react-native"
import { Text } from "../../shared/text"
import { NavigationScreenProps } from "react-navigation"
import { Screen } from "../../shared/screen"
import { palette } from "../../../theme/palette"
import { spacing } from "../../../theme/spacing"
import { color } from "../../../theme"
import { Contact } from "./contact"

export interface CodeOfConductScreenProps extends NavigationScreenProps<{}> {}

const ROOT: ViewStyle = {
  marginTop: spacing.extraLarge,
  marginHorizontal: spacing.large,
  paddingBottom: spacing.huge,
}
const HEADER_TEXT: TextStyle = {
  fontWeight: "600",
  letterSpacing: 3.0,
  marginLeft: spacing.medium,
  color: color.palette.shamrock,
}
const TITLE: TextStyle = {
  marginTop: spacing.extraLarge,
  letterSpacing: 1.68,
}
const BACK_ARROW: ViewStyle = {
  flexDirection: "row",
  paddingLeft: spacing.medium,
  alignItems: "center",
}
const SECTION: TextStyle = {
  marginVertical: spacing.medium,
}

const SECTION_TITLE: TextStyle = {
  fontWeight: "500",
  letterSpacing: 3.0,
  fontSize: 14,
  color: color.palette.shamrock,
  marginTop: spacing.medium,
}

const backArrow = () => (
  <View style={BACK_ARROW}>
    <Image source={require("../../shared/title-bar/icon.back-arrow.png")} />
    <Text text="INFO" style={HEADER_TEXT} />
  </View>
)

const email = "conf@infinite.red"
const twitter = "chainreactconf"

export class CodeOfConductScreen extends React.Component<CodeOfConductScreenProps, {}> {
  static navigationOptions = {
    headerStyle: { backgroundColor: color.palette.portGore, borderBottomWidth: 0 },
    headerBackImage: backArrow,
    headerTintColor: color.palette.shamrock,
  }

  render() {
    return (
      <Screen style={ROOT} preset="scroll" backgroundColor={palette.portGore}>
        <Text preset="header" tx="codeOfConductScreen.title" style={TITLE} />
        <Text preset="body" tx="codeOfConductScreen.intro" style={SECTION} />
        <Contact email={email} twitter={twitter} />
        <Text preset="body" style={SECTION_TITLE} tx={"codeOfConductScreen.quickVersionTitle"} />
        <Text preset="body" style={SECTION} tx={"codeOfConductScreen.quickVersion"} />
        <Text preset="body" style={SECTION_TITLE} tx={"codeOfConductScreen.lessQuickTitle"} />
        <Text preset="body" style={SECTION} tx={"codeOfConductScreen.lessQuickVersion"} />
      </Screen>
    )
  }
}
