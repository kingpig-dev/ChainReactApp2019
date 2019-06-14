import React from "react"
import { View, TextInput, AsyncStorage, TouchableOpacity, ViewStyle, Keyboard } from "react-native"
import { Screen } from "../../components/screen"
import { Text } from "../../components/text"
import { palette, spacing, color, typography } from "../../theme"
import { TextStyle } from "react-native"
import name from "./profile-info"
import { Button } from "../../components/button"
import { TextField } from "../../components/text-field/text-field"

const ROOT: ViewStyle = {
  padding: spacing.medium,
}

const TITLE: TextStyle = {
  marginVertical: spacing.extraLarge,
}

const BUTTON: ViewStyle = {
  paddingHorizontal: spacing.medium,
}

const MARGIN_BUTTON: ViewStyle = {
  ...BUTTON,
  marginLeft: spacing.small,
}

const ROW: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
}

const USERNAME: ViewStyle = {
  flex: 1,
  marginRight: spacing.small,
}

const BUTTONS_ROW: ViewStyle = {
  ...ROW,
  justifyContent: "flex-start",
  marginTop: spacing.medium,
}

export class ProfileScreen extends React.Component {
  state = {
    username: null,
    editInput: false,
  }
  updateName = () => {
    this.setState(() => ({
      editInput: true,
    }))
  }

  render() {
    const { username } = this.state
    return (
      <Screen preset="scrollStack" backgroundColor={palette.portGore} style={ROOT}>
        <Text preset="title" tx="profileScreen.title" style={TITLE} />
        {!this.state.editInput && (
          <View>
            <View style={ROW}>
              <View style={USERNAME}>
                <Text tx="profileScreen.usernameField.label" preset="label" />
                <Text preset="body" text={username} numberOfLines={1} />
              </View>
              <Button preset="dark" onPress={this.updateName} tx="common.edit" style={BUTTON} />
            </View>
          </View>
        )}
        {this.state.editInput && (
          <View>
            <Text tx="profileScreen.usernameField.label" preset="label" />
            <TextField
              placeholderTx="profileScreen.usernameField.placeholder"
              value={username}
              onChangeText={v => this.setState({ username: v })}
            />
            <View style={BUTTONS_ROW}>
              <Button preset="dark" tx="common.cancel" onPress={this.onCancel} style={BUTTON} />
              <Button preset="dark" tx="common.save" onPress={this.onSave} style={MARGIN_BUTTON} />
            </View>
          </View>
        )}
      </Screen>
    )
  }
  onSave = async () => {
    try {
      await AsyncStorage.setItem("name", this.state.username)
      console.log("username updated...")
      this.setState({ editInput: false })
    } catch (err) {
      console.log("err...: ", err)
    }
  }

  onCancel = () => {
    this.setState({ editInput: false })
  }

  async componentDidMount() {
    try {
      const username = await AsyncStorage.getItem("name")
      console.log("username: ", username)
      if (!username) {
        await AsyncStorage.setItem("name", name)
        this.setState({ username: name })
      } else {
        this.setState({ username })
      }
    } catch (err) {
      console.log("error: ", err)
    }
  }
}
