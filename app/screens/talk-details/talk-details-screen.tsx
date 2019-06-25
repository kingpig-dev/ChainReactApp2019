import * as React from "react"
import {
  TextInput,
  ScrollView,
  TouchableOpacity,
  View,
  AppState,
  Image,
  ViewStyle,
  TextStyle,
  ImageStyle,
  Platform,
  AsyncStorage,
  KeyboardAvoidingView,
} from "react-native"
import { inject, observer } from "mobx-react"
import { NavigationScreenProps, NavigationEventSubscription } from "react-navigation"
import Amplify, { API, graphqlOperation } from "aws-amplify"
import { formatToTimeZone } from "date-fns-timezone"
import uuid from "uuid/v4"
import { Screen } from "../../components/screen"
import { palette, spacing, getScreenWidth, color } from "../../theme"
import { Text } from "../../components/text"
import { SpeakerImage } from "../../components/speaker-image"
import { TalkTitle } from "../../components/talk-title"
import { SpeakerBio } from "../../components/speaker-bio"
import { Talk } from "../../models/talk"
import { listCommentsForTalk } from "../../graphql/queries"
import { createComment as CreateComment, createReport } from "../../graphql/mutations"
import { onCreateComment as OnCreateComment } from "../../graphql/subscriptions"
import config from "../../aws-exports"
import { calculateImageDimensions } from "./image-dimension-helpers"
import { TalkStore } from "../../models/talk-store"
import { NavigationStore } from "../../models/navigation-store"
import Hyperlink from "react-native-hyperlink"
import { TIMEZONE } from "../../utils/info"
import { CodeOfConductLink } from "../../components/code-of-conduct-link"

Amplify.configure(config)

const CLIENTID = uuid()

const ROOT: ViewStyle = {
  paddingVertical: spacing.medium,
  paddingHorizontal: spacing.large,
}

const FULL_SIZE: ViewStyle = {
  width: "100%",
  height: "100%",
}

const FULL_WIDTH_IMAGE: ImageStyle = {
  resizeMode: "contain",
}

const TITLE: TextStyle = {
  fontSize: 20,
  color: palette.white,
  marginTop: spacing.large,
}

const SPONSOR_CONTAINER: ViewStyle = {
  flexDirection: "row",
  marginTop: spacing.small,
}

const SPONSORED_BY: TextStyle = { color: palette.offWhite }

const SPONSOR_NAME: TextStyle = { fontWeight: "500" }

const LABEL: TextStyle = {
  marginTop: spacing.extraLarge + spacing.large,
  color: palette.shamrock,
  marginBottom: spacing.large,
}

const DESCRIPTION: TextStyle = { marginTop: spacing.large + spacing.tiny + spacing.tiny }

const BULLET: ViewStyle = {
  width: 6,
  height: 6,
  borderRadius: 3,
  backgroundColor: palette.shamrock,
  marginRight: spacing.small,
  marginTop: spacing.small,
}

const PANEL_BIO: ViewStyle = { flex: 1, marginTop: spacing.extraLarge + spacing.large }

const AFTER_PARTY_DESCRIPTION: TextStyle = { marginTop: spacing.large }

const MENU_ITEM: ViewStyle = {
  flexDirection: "row",
  marginBottom: spacing.large,
  width: "100%",
}

const BACK_BUTTON: ViewStyle = {
  paddingHorizontal: spacing.small,
}

const MENU_ITEM_TEXT: TextStyle = { color: palette.white }

const TAB_HOLDER: ViewStyle = { flex: 1 }
const TAB_STYLE: ViewStyle = { paddingVertical: 7, alignItems: "center", justifyContent: "center" }
const TAB_CONTAINER = { flexDirection: "row" }
const WHITE_TEXT = { color: "white" }
const COMMENT_TEXT = { ...WHITE_TEXT, fontSize: 16, marginTop: 4 }
const FLEX_ONE = { flex: 1 }
const FLEX_ROW = { flexDirection: "row" }
const COMMENT_CONTAINER = { paddingVertical: 15, marginBottom: 50 }
const COMMENT_STYLE = {
  paddingBottom: 15,
  paddingTop: 20,
  paddingHorizontal: 20,
  borderTopWidth: 1,
  borderColor: "rgba(255, 255, 255, .1)",
}
const CREATED_BY = { color: "white", fontWeight: "600" }
const CREATED_AT = { color: "rgba(255, 255, 255, .5)", fontSize: 11, marginLeft: 8, marginTop: 3 }
const INPUT_CONTAINER = {
  bottom: 0,
  position: "absolute",
  left: 0,
  backgroundColor: color.background,
}
const MESSAGE_INPUT = { backgroundColor: "white", height: 50, paddingHorizontal: 8 }
const REPORT = { marginTop: 5, color: palette.angry, fontSize: 11 }
const CODE_OF_CONDUCT_LINK = {
  paddingHorizontal: spacing.large,
  paddingVertical: spacing.medium,
  borderTopWidth: 1,
  borderColor: "rgba(255, 255, 255, .1)",
}

const HIT_SLOP = {
  top: 30,
  left: 30,
  right: 30,
  bottom: 30,
}

const MAIN_CONTAINER = { flex: 1, backgroundColor: palette.portGore }

export interface NavigationStateParams {
  talk: Talk
}

export interface TalkDetailsScreenProps extends NavigationScreenProps<NavigationStateParams> {
  navigationStore: NavigationStore
  talkStore: TalkStore
}

const backImage = () => (
  <View style={BACK_BUTTON} hitSlop={HIT_SLOP}>
    <Image source={require("../../components/title-bar/icon.back-arrow.png")} />
  </View>
)

@inject("navigationStore", "talkStore")
@observer
export class TalkDetailsScreen extends React.Component<TalkDetailsScreenProps, {}> {
  static navigationOptions = ({ navigation }) => {
    const { talk } = navigation.state.params
    const titleMargin = Platform.OS === "ios" ? -50 : 0
    return {
      headerStyle: {
        backgroundColor: palette.portGore,
        borderBottomWidth: 0,
      },
      headerBackTitle: null,
      headerBackImage: backImage,
      headerTintColor: palette.shamrock,
      title: `${formatToTimeZone(talk.startTime, "h:mm", {
        timeZone: TIMEZONE,
      })} - ${formatToTimeZone(talk.endTime, "h:mm", { timeZone: TIMEZONE })}`,
      headerTitleStyle: {
        textAlign: "left",
        fontWeight: "500",
        width: "100%",
        marginLeft: titleMargin,
      },
    }
  }

  scroller = React.createRef()
  commentSubscription = {}
  navListener: NavigationEventSubscription

  state = {
    currentView: "details",
    inputValue: "",
    name: "",
    comments: [],
  }

  async componentDidMount() {
    const { id } = this.props.navigation.state.params.talk
    const { addListener, currentRoute } = this.props.navigationStore
    this.fetchComments()
    this.subscribeToComments(id)
    AppState.addEventListener("change", this.handleAppStateChange)
    this.fetchUserName()
    this.navListener = addListener("action", () => {
      // check if talkDetails is focused
      if (currentRoute.routeName === "talkDetails") {
        this.fetchUserName()
      }
    })
  }

  componentWillUnmount() {
    this.commentSubscription.unsubscribe()
    this.navListener.remove()
    AppState.removeEventListener("change", this.handleAppStateChange)
  }

  fetchUserName = async () => {
    try {
      const name = await AsyncStorage.getItem("name")
      this.setState({ name })
    } catch (err) {
      console.log("error fetching user name...: ", err)
    }
  }

  subscribeToComments = id => {
    this.commentSubscription = API.graphql(
      graphqlOperation(OnCreateComment, { talkId: id }),
    ).subscribe({
      next: eventData => {
        if (this.state.currentView === "details") return
        const { onCreateComment } = eventData.value.data
        if (onCreateComment.clientId === CLIENTID) return
        const comments = [onCreateComment, ...this.state.comments]
        this.setState({ comments })
        this.scroller.current.scrollToEnd()
      },
    })
  }

  handleAppStateChange = nextAppState => {
    if (nextAppState === "inactive" || nextAppState === "background") {
      this.commentSubscription.unsubscribe()
    }
    if (nextAppState === "active") {
      const { id } = this.props.navigation.state.params.talk
      this.subscribeToComments(id)
      this.fetchComments()
    }
  }

  fetchComments = async () => {
    try {
      const commentData = await API.graphql(
        graphqlOperation(listCommentsForTalk, {
          talkId: this.props.navigation.state.params.talk.id,
        }),
      )
      this.setState({ comments: commentData.data.listCommentsForTalk.items })
    } catch (err) {
      console.log("error fetching comments...: ", err)
    }
  }

  createComment = async () => {
    const { id } = this.props.navigation.state.params.talk
    const comment = {
      text: this.state.inputValue,
      clientId: CLIENTID,
      createdBy: this.state.name,
      talkId: id,
      id: uuid(),
      createdAt: Date.now(),
    }
    const comments = [...this.state.comments, comment]
    this.setState({ inputValue: "", comments })
    setTimeout(() => {
      this.scroller.current.scrollToEnd()
    }, 50)
    try {
      await API.graphql(graphqlOperation(CreateComment, comment))
    } catch (err) {
      console.log("error creating comment..", err)
    }
  }

  reportComment = async ({ text, id }) => {
    const { title } = this.props.navigation.state.params.talk
    const report = { comment: text, commentId: id, talkTitle: title }
    const comments = this.state.comments.filter(c => c.id !== id)
    this.setState({ comments })
    try {
      await API.graphql(graphqlOperation(createReport, report))
    } catch (err) {
      console.log("error reporting comment: ", err)
    }
  }

  toggleView = currentView => {
    this.setState({ currentView })
    if (currentView === "discussion") {
      this.scroller = React.createRef()
      setTimeout(() => {
        this.scroller.current.scrollToEnd({ animated: false })
      })
    }
  }

  render() {
    const talk = this.props.navigation.state.params.talk
    const { talkType = "" } = talk
    let { comments } = this.state
    const { talkStore } = this.props
    const imageDimensions = calculateImageDimensions(getScreenWidth())
    const widthStyles = {
      width: getScreenWidth(),
    }
    const displayTabs =
      (talkType === "TALK" || talkType === "WORKSHOP") &&
      talkStore.discussionsEnabled &&
      talk.discussionEnabled

    comments = comments
      .sort(function(a, b) {
        return new Date(b.createdAt) - new Date(a.createdAt)
      })
      .reverse()

    return (
      <KeyboardAvoidingView
        style={MAIN_CONTAINER}
        behavior={Platform.OS === "ios" ? "padding" : null}
        keyboardVerticalOffset={88}
      >
        {displayTabs && (
          <View style={TAB_CONTAINER}>
            <View style={{ ...TAB_HOLDER, ...chosen(this.state.currentView, "details") }}>
              <TouchableOpacity style={TAB_STYLE} onPress={() => this.toggleView("details")}>
                <Text style={WHITE_TEXT}>Details</Text>
              </TouchableOpacity>
            </View>
            <View style={{ ...TAB_HOLDER, ...chosen(this.state.currentView, "discussion") }}>
              <TouchableOpacity style={TAB_STYLE} onPress={() => this.toggleView("discussion")}>
                <Text style={WHITE_TEXT}>Discussion</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        {this.state.currentView === "discussion" && (
          <View style={FLEX_ONE}>
            <ScrollView ref={this.scroller}>
              <View style={COMMENT_CONTAINER}>
                {comments.map((c, i) => (
                  <View style={COMMENT_STYLE} key={i}>
                    <View style={FLEX_ROW}>
                      <Text style={CREATED_BY}>{c.createdBy}</Text>
                      <Text style={CREATED_AT}>
                        {formatToTimeZone(c.createdAt, "MMM DD h:mm A", { timeZone: TIMEZONE })}
                      </Text>
                    </View>
                    <Text style={COMMENT_TEXT}>{c.text}</Text>
                    <Text style={REPORT} onPress={() => this.reportComment(c)}>
                      Report
                    </Text>
                  </View>
                ))}
              </View>
            </ScrollView>
            <View style={{ ...INPUT_CONTAINER, ...widthStyles }}>
              <CodeOfConductLink onPress={this.linkToCodeOfConduct} style={CODE_OF_CONDUCT_LINK} />
              <TextInput
                onChangeText={v => this.setState({ inputValue: v })}
                style={MESSAGE_INPUT}
                placeholder="Type a message..."
                onSubmitEditing={this.createComment}
                value={this.state.inputValue}
                returnKeyType={"send"}
              />
            </View>
          </View>
        )}
        {this.state.currentView !== "discussion" && (
          <Screen preset="scroll" backgroundColor={palette.portGore} style={ROOT}>
            {this.renderContent(imageDimensions)}
          </Screen>
        )}
      </KeyboardAvoidingView>
    )
  }

  renderContent = imageDimensions => {
    const { talkType = "" } = this.props.navigation.state.params.talk
    switch (talkType.toLowerCase()) {
      case "talk":
        return this.renderTalk()
      case "workshop":
        return this.renderWorkshop()
      case "break":
        return this.renderBreak(imageDimensions)
      case "lunch":
      case "breakfast":
        return this.renderLunch(imageDimensions)
      case "panel":
        return this.renderPanel(imageDimensions)
      case "welcome":
      case "goodbye":
        return this.renderWelcome()
      case "afterparty":
        return this.renderAfterParty(imageDimensions)
      default:
        return null
    }
  }

  renderTalk = () => {
    const { talk } = this.props.navigation.state.params
    return (
      <View style={FULL_SIZE}>
        {talk.speakers && <SpeakerImage speaker={talk.speakers[0]} />}
        <TalkTitle talk={talk} />
        {talk.description && (
          <Hyperlink
            linkDefault={true}
            linkStyle={{ color: palette.shamrock, textDecorationLine: "underline" }}
          >
            <Text preset="body" style={{ fontSize: 16, marginTop: spacing.large }}>
              {talk.description}
            </Text>
          </Hyperlink>
        )}
        {talk.speakers && <SpeakerBio speaker={talk.speakers[0]} />}
      </View>
    )
  }

  renderWelcome = () => {
    const {
      talk: { title, description, speakers },
    } = this.props.navigation.state.params
    return (
      <View style={FULL_SIZE}>
        <Text text={title} preset="body" style={TITLE} />
        <Text text={description} preset="body" style={DESCRIPTION} />
        {speakers &&
          speakers.length &&
          speakers.map((speaker, index) => {
            const isLast = index === speakers.length - 1
            return (
              <View key={index} style={PANEL_BIO}>
                <SpeakerImage speaker={speaker} />
                <SpeakerBio speaker={speaker} last={isLast} />
              </View>
            )
          })}
      </View>
    )
  }

  renderWorkshop = () => {
    const { talk } = this.props.navigation.state.params
    return (
      <View style={FULL_SIZE}>
        <SpeakerImage speaker={talk.speakers[0]} />
        <TalkTitle talk={talk} />
        <SpeakerBio speaker={talk.speakers[0]} />
      </View>
    )
  }

  renderBreak = imageDimensions => {
    const { sponsor, description, title, menuItems } = this.props.navigation.state.params.talk
    return (
      <View style={FULL_SIZE}>
        <Image
          source={require("./images/img.break.png")}
          style={{ ...FULL_WIDTH_IMAGE, ...imageDimensions }}
        />
        <Text text={title} preset="body" style={TITLE} />
        {sponsor && (
          <View style={SPONSOR_CONTAINER}>
            <Text tx="talkDetailsScreen.sponsoredBy" preset="input" style={SPONSORED_BY} />
            <Text text={sponsor} preset="input" style={SPONSOR_NAME} />
          </View>
        )}
        <Text text={description} preset="body" style={DESCRIPTION} />
        {menuItems && (
          <Text preset="sectionHeader" tx="talkDetailsScreen.menuTitle" style={LABEL} />
        )}
        {menuItems && menuItems.map((item, index) => this.renderMenuItem(item, index))}
      </View>
    )
  }

  renderLunch = imageDimensions => {
    const {
      sponsor,
      description,
      menuItems,
      title,
      image,
    } = this.props.navigation.state.params.talk
    return (
      <View style={FULL_SIZE}>
        <Image source={{ uri: image }} style={{ ...FULL_WIDTH_IMAGE, ...imageDimensions }} />
        <Text text={title} preset="body" style={TITLE} />
        {sponsor && this.renderSponsored(sponsor)}
        <Text text={description} preset="body" style={DESCRIPTION} />
        <Text preset="sectionHeader" tx="talkDetailsScreen.menuTitle" style={LABEL} />
        {menuItems.map((item, index) => this.renderMenuItem(item, index))}
      </View>
    )
  }

  renderSponsored = sponsor => {
    return (
      <View style={SPONSOR_CONTAINER}>
        <Text tx="talkDetailsScreen.sponsoredBy" preset="input" style={SPONSORED_BY} />
        <Text text={sponsor} preset="input" style={SPONSOR_NAME} />
      </View>
    )
  }

  renderPanel = imageDimensions => {
    const {
      talk: { image, title, description, speakers },
    } = this.props.navigation.state.params
    return (
      <View style={FULL_SIZE}>
        {<Image source={{ uri: image }} style={{ ...FULL_WIDTH_IMAGE, ...imageDimensions }} />}
        <Text text={title} preset="body" style={TITLE} />
        <Text text={description} preset="body" style={DESCRIPTION} />
        {speakers &&
          speakers.length &&
          speakers.map((speaker, index) => {
            const isLast = index === speakers.length - 1
            return (
              <View key={index} style={PANEL_BIO}>
                <SpeakerImage speaker={speaker} />
                <SpeakerBio speaker={speaker} last={isLast} />
              </View>
            )
          })}
      </View>
    )
  }

  renderAfterParty = imageDimensions => {
    const { title, description, sponsor } = this.props.navigation.state.params.talk

    let image = null
    switch (sponsor) {
      case "Squarespace":
        image = require("./images/img.afterparty-squarespace.png")
        break
      case "Bumped":
        image = require("./images/bumped.png")
        break
      case "G2i":
        image = require("./images/img.afterparty-g2i.png")
        break
      default:
        image = require("./images/img.afterparty-g2i.png")
        break
    }
    return (
      <View style={FULL_SIZE}>
        <View>
          <Image source={image} style={{ ...FULL_WIDTH_IMAGE, ...imageDimensions }} />
        </View>
        <Text text={title} preset="body" style={TITLE} />
        <Text text={description} preset="body" style={AFTER_PARTY_DESCRIPTION} />
      </View>
    )
  }

  renderMenuItem = (item, index) => {
    return (
      <View key={index} style={MENU_ITEM}>
        <View style={BULLET} />
        <Text preset="subheader" text={item} style={MENU_ITEM_TEXT} />
      </View>
    )
  }

  linkToCodeOfConduct = () => {
    this.props.navigation.navigate({
      routeName: "talkCodeOfConduct",
      params: { backTitle: "TALK" },
    })
  }
}

function chosen(type, comp) {
  if (type === comp) {
    return {
      borderBottomWidth: 2,
      borderBottomColor: "white",
    }
  }
}
