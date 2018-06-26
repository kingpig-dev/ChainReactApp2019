import { ViewStyle } from "react-native"
import { spacing } from "../../../theme/spacing"

/**
 * All text will start off looking like this.
 */
const BASE_VIEW: ViewStyle = {
  width: 32,
  height: 32,
  justifyContent: "center",
  alignItems: "center",
  marginRight: spacing.medium,
}

/**
 * All the variations of text styling within the app.
 *
 * You want to customize these to whatever you need in your app.
 */
export const viewPresets = {
  /**
   * A smaller piece of secondard information.
   */
  default: { ...BASE_VIEW } as ViewStyle,
}

export const imageSource = {
  website: require("./link.png"),
  twitter: require("./twitter.png"),
  github: require("./github.png"),
  medium: require("./medium.png"),
  dribbble: require("./dribbble.png"),
  instagram: require("./instagram.png"),
  facebook: require("./facebook.png"),
  email: require("./email.icon.png"),
  phone: require("./phone.icon.png"),
}

export const imageStyle = {
  default: {},
}

/**
 * A list of preset names.
 */
export type SocialButtonPresetNames = keyof typeof imageSource
